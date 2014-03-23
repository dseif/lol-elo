var db,
    fs = require('fs'),
    async = require('async'),
    mongo = require('mongodb'),
    mongoose = require('mongoose'),
    match = require('./match'),
    result = require('./result'),
    team = require('./team');

// Setup db connection and all that gay shit
exports.setup = function (callback) {
    mongoose.connect('mongodb://localhost/asdf');
    db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        match.setup();
        team.setup();
        result.setup();
        if (callback && typeof callback === 'function') {
            callback();
        }
    });
};

exports.match = {
    find: match.find,
    findbydate : match.findbydate
};

exports.team = {
    find: team.find,
    findbyelo: team.findbyelo,
    findvalidteams: team.findvalidteams
};

exports.result = {
    find: result.find,
    findbydate: result.findbydate
};

exports.migrate = function () {
    var aliases = {},
        teams = {};

    function createTeam(teamName, callback) {
        var teamData = {};
        if (teams[teamName]) {
            return;
        }
        teams[teamName] = aliases[teamName] || [];
        teamData.name = teamName;
        teamData.elo = 1200;
        teamData.aliases = [];
        teams[teamName].forEach(function (name) {
        teamData.aliases.push({
            name: name,
            date: new Date(Date.now())
            });
        });
        team.insert(teamData, callback);
    }

    fs.readFile('migrations/alias.csv', 'utf8', function (err, data) {
        data.split('\n').forEach(function (line) {
            var arr = line.split(',');
            arr.forEach(function (alias, index) {
                if (index === 0) {
                    aliases[alias] = [];
                } else {
                    aliases[arr[0]].push(alias);
                }
            });
            for (alias in aliases) {
                createTeam(alias);
            }
        });
        fs.readFile('migrations/testdata.csv', 'utf8', function (err, data) {
            var matchesSaved = 0,
                numMatches = 0,
                numTeams = 0,
                teamsSaved = 0;

            function done (err, product) {
                if (product.elo) {
                    teamsSaved++;
                } else {
                    matchesSaved++;
                }
                if (matchesSaved === numMatches && teamsSaved === numTeams) {
                    process.exit();
                }
            }

            team.find(function (err, teamArr) {
                teamArr.forEach(function (t) {
                    teams[t.name] = aliases[t.name] || [];
                });
                data.split('\n').forEach(function (line) {
                    var arr = line.split(','),
                        matchData = {};

                    if (arr.length > 1) {
                        matchData.teams = [arr[0], arr[1]];
                        matchData.teamsLower = [arr[0].toLowerCase(), arr[1].toLowerCase()];
                        matchData.date = new Date(arr[2]);
                        matchData.result = arr[3].split('#');
                        matchData.eventName = arr[4];
                        matchData.region = arr[5];
                        match.insert(matchData, done);

                        matchData.teams.forEach(function (teamName) {
                            var t,
                                teamExists = false;

                            if (teams[teamName]) {
                                teamExists = true;
                            } else {
                                for (t in teams) {
                                    if (!teamExists) {
                                        teamExists = teams[t].indexOf(teamName) > -1;
                                    }
                                }
                            }

                            if (!teamExists && teamName) {
                                createTeam(teamName, done);
                                numTeams++; 
                            }
                        });
                        numMatches++;
                    }
                });
            });
        });
    });
};

exports.loadaliases = function () {
    fs.readFile('migrations/alias.csv', 'utf8', function(err, data) {
        data.split('\n').forEach(function (line) {

        });
    });
}

exports.calcresults = function (callback) {

    match.findbydate({}, function (err, data) {

        async.forEachSeries(data, function (m, callback2) {

            function runmatch (callback3) {
                var t1k = 32,
                t2k = 32;
                    
                if (team1Games < 10) {
                        t1k = t1k*Math.pow(60/(team1Games+3), 1/2)
                }
                if (m.region[0] === "I") {
                     t1k = t1k*2;
                }

                if (team2Games < 10) {
                        t2k = t2k*Math.pow(60/(team2Games+3), 1/2)
                }
                if (m.region[0] === "I") {
                    t2k = t2k*2;
                }

                var r1 = Math.pow(10, (team1Elo/400))
                    r2 = Math.pow(10, (team2Elo/400)),
                    e1 = r1 / (r1 + r2),
                    e2 = r2 / (r1 + r2);

                if (team1Wins>0 && (team1Wins < team2Wins || team2Wins === 0)) {
                    team1Elo = team1Elo +t1k * (1 - e1)
                    team2Elo = team2Elo + t2k *(0 - e2);
                    team1Wins--;
                    team1Games++;
                    team2Games++;
                    runmatch(callback3)
                }

                else if (team2Wins>0) {
                    team1Elo = team1Elo + t1k * (0 - e1)
                    team2Elo = team2Elo + t2k *(1 - e2);
                    team2Wins--;
                    team1Games++;
                    team2Games++;
                    runmatch(callback3)
                }
                else {
                    callback3([team1Elo, team2Elo]);
                }
            }

            var team1Elo,
            team2Elo,
            team1Wins = m.result[0],
            team2Wins = m.result[1];

            function done () {

                if (team1Elo && team2Elo) {
                    
                    resultData = {};
                    resultData.teams = m.teams;
                    resultData.teamsLower = m.teamsLower;
                    resultData.date = m.date;
                    resultData.result = m.result;
                    resultData.games = m.games;
                    resultData.eventName = m.eventName;
                    resultData.region = m.region;
                    resultData.eloBefore = [team1Elo, team2Elo];

                    console.log (team1Wins + "\t" + team2Wins + "\t" + team1Games + "\t" + team2Games +"\t" + m.region[0]);
                    console.log(m.teams[0] + "\t" + team1Elo    + "\t" + m.teams[1] + "\t" +team2Elo)
                    runmatch(function (newElos) {

                    resultData.eloAfter = [newElos[0], newElos[1]];
                    result.insert(resultData);

                    console.log(m.teams[0] + "\t" + newElos[0]  + "\t" + m.teams[1] + "\t" +newElos[1])
                    console.log(" ")

                    team.updateelo(m.teams[0], newElos[0], (m.result[0] + m.result[1]), 
                        function() {team.updateelo(m.teams[1], newElos[1], (m.result[0] + m.result[1]), callback2)})
                    });
                            
                }
            };
            
            ;
            team.find({$or: [{name : m.teams[0]}, { aliases: { $elemMatch: { name: m.teams[0] } } }]}, function (err, team1){
                team1Elo = (team1[0].elo);
                team1Games = (team1[0].games);
                done(team1Wins, team2Wins);
            });

            team.find({$or: [{name : m.teams[1]}, { aliases: { $elemMatch: { name: m.teams[1] } } }]}, function (err, team2){
                team2Elo = (team2[0].elo);
                team2Games = (team2[0].games);
                done(team1Wins, team2Wins);
            });
        });
    });
};

exports.destroy = function () {
    ['matches', 'teams', 'results'].forEach(function (collection) {
        mongoose.connection.collections[collection].drop();
    });
    process.exit();
};
var db,
    fs = require('fs'),
    async = require('async'),
    mongo = require('mongodb'),
    mongoose = require('mongoose'),
    match = require('./match'),
    team = require('./team');

// Setup db connection and all that gay shit
exports.setup = function (callback) {
    mongoose.connect('mongodb://localhost/asdf');
    db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        match.setup();
        team.setup();
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
    findbyelo: team.findbyelo
};

exports.migrate = function () {
    fs.readFile('migrations/alias.csv', 'utf8', function (err, data) {
        var aliases = {};
        data.split('\n').forEach(function (line) {
            var arr = line.split(',');
            arr.forEach(function (alias, index) {
                if (index === 0) {
                    aliases[alias] = [];
                } else {
                    aliases[arr[0]].push(alias);
                }
            });
        });
        fs.readFile('migrations/testdata.csv', 'utf8', function (err, data) {
            var matchesSaved = 0,
                numMatches = 0,
                numTeams = 0,
                teams = {};
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
                        matchData.date = new Date(arr[2]);
                        matchData.result = arr[3].split('#');
                        matchData.eventName = arr[4];
                        matchData.region = arr[5];
                        match.insert(matchData, done);

                        matchData.teams.forEach(function (teamName) {
                            var t,
                                teamData = {},
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
                                team.insert(teamData, done);
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

    function runmatch (team1Elo, team2Elo, k, team1Wins, team2Wins, callback3) {
        
        var r1 = 10^(team1Elo/400),
            r2 = 10^(team2Elo/400),
            e1 = r1 / (r1 + r2),
            e2 = r2 / (r1 + r2);

        if (team1Wins>0) {
            team1Elo = team1Elo + k * (1 - e1)
            team2Elo  = team2Elo + k *(0 - e2);
            runmatch(team1Elo, team2Elo, k, team1Wins-1, team2Wins, callback3)
        }

        else if (team2Wins>0) {
            team1Elo = team1Elo + k * (0 - e1)
            team2Elo = team2Elo + k *(1 - e2);
            runmatch(team1Elo, team2Elo, k, team1Wins, team2Wins-1, callback3)
        }
        else {
            callback3([team1Elo, team2Elo]);
        }
    }
    
    match.findbydate({}, function (err, data) {

        async.forEachSeries(data, function (m, callback2) {

            var team1Elo,
            team2Elo,
            k = 32,
            team1Wins = m.result[0],
            team2Wins = m.result[1];

            function done () {

                if (team1Elo && team2Elo) {
                    //console.log (team1Wins + "\t" + team2Wins);

                    runmatch(team1Elo, team2Elo, k, team1Wins, team2Wins,  function (newElos) {
                    //console.log(m.teams[0] + "\t" + team1Elo    + "\t" + m.teams[1] + "\t" +team2Elo)
                    //console.log(m.teams[0] + "\t" + newElos[0]  + "\t" + m.teams[1] + "\t" +newElos[1])
                    team.updateelo(m.teams[0], newElos[0], function() {team.updateelo(m.teams[1], newElos[1], callback2)})
                    });
                            
                }
            };
            
            team.find({name: m.teams[0]}, function (err, team1){
                team1Elo = (team1[0].elo)
                done(team1Wins, team2Wins);
            });

            team.find({name: m.teams[1]}, function (err, team2){
                team2Elo = (team2[0].elo)
                done(team1Wins, team2Wins);
            });
        });
    });
};

exports.destroy = function () {
    ['matches', 'teams'].forEach(function (collection) {
        mongoose.connection.collections[collection].drop();
    });
    process.exit();
};
var db,
    fs = require('fs'),
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
    find: match.find
};

exports.team = {
    find: team.find
};

exports.migrate = function () {
    fs.readFile('migrations/testdata.csv', 'utf8', function(err, data) {
        var matchesSaved = 0,
            numMatches = 0,
            numTeams = 0,
            teams = [];
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
                teams.push(t.name);
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
                        var teamData = {};
                        if (teams.indexOf(teamName) === -1) {
                            teams.push(teamName);
                            teamData.name = teamName;
                            teamData.elo = 1200;
                            teamData.aliases = [];
                            team.insert(teamData, done);
                            numTeams++;
                        }
                    });
                    numMatches++;
                }
            });
        });
    });
};

exports.destroy = function () {
    ['matches', 'teams'].forEach(function (collection) {
        mongoose.connection.collections[collection].drop();
        process.exit();
    });
};
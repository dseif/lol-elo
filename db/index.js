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
        var numRecords = 0;
        data.split('\n').forEach(function (line) {
            var arr = line.split(','),
                matchData = {},
                teamData = {};

            if (arr.length > 1) {
                matchData.teams = [arr[0], arr[1]];
                matchData.date = new Date(arr[2]);
                matchData.result = arr[3].split('#');
                matchData.eventName = arr[4];
                matchData.region = arr[5];
                match.insert(matchData);

                matchData.teams.forEach(function (teamName) {

                    team.count({name : teamName}, function (data2)
                {
                    if (data2 === 0)
                    {
                    teamData.name = teamName;
                    teamData.elo = 1200;
                    teamData.aliases = [];
                    team.insert(teamData);
                    }   
                });

                });
            }
            numRecords++;
        });
    });
};
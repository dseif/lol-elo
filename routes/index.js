exports.index = function(db) {
    return function(req, res) {
       db.result.findbydate({result: {$not: {$gt:0}}}, function (err, matches) { 
            db.result.findbydate({result: {$gt:0}}, function (err, results) {
                db.team.findvalidteams(function (err, teams){
                    res.render('index', {
                        'teams': teams.slice(0,12),
                        'results' : results.slice(0,6),
                        'matches' : matches.reverse().slice(0,6)
                    });
                });
            });
        });
    };
};

exports.matches = function(db) {
    return function (req, res) {
        db.result.findbydate({result: {$not: {$gt:0}}}, function (err, results) {
            res.render('matches', {
                'results': results.reverse()
            });
        });
    };
};

exports.results = function(db) {
    return function (req, res) {
        db.result.findbydate({result: {$gt:0}}, function (err, results) {
            res.render('results', {
                'results': results
            });
        });
    };
};


exports.teams = function(db) {
    return function(req, res) {
        db.team.findvalidteams(function (err, teams){
            res.render('teams', {
                'teams': teams 
            });
        });
    };
};

exports.teamresults = function(db) {
    return function (req, res) {
        var teamName = req.params.id;
        db.team.find({
            $or: [
                {
                    name: teamName
                },
                {
                    aliases: {
                        $elemMatch: {
                            name: teamName
                        }
                    }
                }
            ]
        }, function (err, teams) {
            var names = [];
            var namesRender = []; 
            teams[0].aliases.forEach(function (team) {
                names.push(team.name.toLowerCase());
                namesRender.push(team.name);
            });
            names.push(teams[0].name.toLowerCase());
            namesRender.push(teams[0].name);
            console.log('wat', names, teams);
            db.result.findbydate({
                teamsLower: {
                    $in: names
                }
            }, function (err, results) {
                        var graphx = []; 
                        var graphy = [];

                for (var i = 0; i < results.length; i++) {
                    if (!results[i-1] || results[i].date.setHours(0,0,0,0) !== results[i-1].date.setHours(0,0,0,0)) {
                        graphx.push (results[i].date.toDateString().slice(4));
                        if (names.indexOf(results[i].teamsLower[0]) === -1) {
                            graphy.push (Math.round(results[i].eloAfter[1]));
                        }
                        else {
                            graphy.push (Math.round(results[i].eloAfter[0]));
                            console.log(Math.round(results[i].eloAfter[0]))  
                        }
                    }
                }
                graphx.push(results[results.length-1].date.toDateString().slice(4));
                graphy.push(1200);

                res.render('teampage', {
                    'results': results.slice(0),
                    'teamNames' : namesRender,
                    'graphx' : graphx.reverse(),
                    'graphy' : graphy.reverse()
                });
            });
        });
    };
};

exports.eventresults = function(db) {
    return function (req, res) {
        var eventId = req.params.id;
        db.result.findbydate(
            {$and: [ {eventName : eventId}, {result: {$gt:0}} ]},
            function (err, results) {
            res.render('eventpage', {
                'results': results,
                'eventId' : eventId
            });
        });
    };
};
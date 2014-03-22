exports.index = function(db) {
    return function(req, res) {
        db.result.findbydate(function (err, results) {
            db.team.findvalidteams(function (err, teams){
                res.render('index', {
                    'teams': teams.slice(0,15),
                    'results' : results.slice(results.length-10,results.length).reverse()
                });
            });
        });
    };
};

exports.matches = function(db) {
    return function (req, res) {
        db.match.findbydate(function (err, matches) {
            res.render('matches', {
                'matches': matches
            });
        });
    };
};

exports.results = function(db) {
    return function (req, res) {
        db.result.findbydate(function (err, results) {
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

exports.teammatches = function(db) {
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
            db.match.findbydate({
                teamsLower: {
                    $in: names
                }
            }, function (err, matches) {
                res.render('matches', {
                    'matches': matches,
                    'teamNames' : namesRender
                });
            });
        });
    };
};

exports.eventmatches = function(db) {
    return function (req, res) {
        var eventId = req.params.id;
        db.match.findbydate({eventName : eventId}, function (err, matches) {
            res.render('matches', {
                'matches': matches,
                'eventId' : eventId
            });
        });
    };
};

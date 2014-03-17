
exports.index = function (req, res) {
    res.render('index', {
        title: 'Express'
    });
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

exports.teams = function(db) {
    return function(req, res) {
        db.team.findvalidteams(function (err, teams){
            res.render('teams', {
                'teams': teams 
            });
        });
    };
};

exports.team = function(db) {
    return function (req, res) {
        var teamName = req.params.id.toUpperCase();
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
            teams.forEach(function (team) {
                names.push(team.name);
            });
            if (names.length === 1 && names.indexOf(teamName) > -1) {
                teams[0].aliases.forEach(function (team) {
                    names.push(team.name);
                });
            }
            db.match.findbydate({
                teams: {
                    $in: names
                }
            }, function (err, matches) {
                res.render('matches', {
                    'matches': matches
                });
            });
        });
    };
};
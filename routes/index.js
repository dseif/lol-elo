
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
            teams[0].aliases.forEach(function (team) {
                names.push(team.name.toLowerCase());
            });
            names.push(teams[0].name.toLowerCase());
            console.log('wat', names, teams);
            db.match.findbydate({
                teamsLower: {
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
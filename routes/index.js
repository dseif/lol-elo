
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
        db.team.findbyelo(function (err, teams){
            res.render('teams', {
                'teams': teams 
            });
        });
    };
};
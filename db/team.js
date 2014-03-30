var mongoose = require('mongoose'),
	Team,
	teamSchema;

exports.setup = function () {
	teamSchema = mongoose.Schema({
		name: String,
		aliases: [{
			name: String,
			date: Date
		}],
		elo: Number,
		region: {
			type: String,
			default: 'unknown'
		},
		active: {type : Boolean,
			default: 1
		},
		logos: [String],
		games: {
			type: Number,
			default: 0
		}
	});
	Team = mongoose.model('Team', teamSchema);
};

exports.insert = function (data, callback) {
 	var team = new Team(data);
	team.save(callback || function () {});
};

exports.update = function(query, data, callback) {
	Team.update(query, data, callback);
};

exports.find = function (query, callback) {
	if (!callback && typeof query === 'function') {
		callback = query;
		query = {};
	}
	Team.find(query, callback);
};

exports.updateelo = function (team, newelo, count, callback) {
	Team.update({$or: [{name : team}, { aliases: { $elemMatch: { name: team } } }]}, 
			{elo : newelo, $inc : { games : count} }, {multi : true}, function (err, response){
		callback();
	});
};

exports.findbyelo = function (query, callback) {
	if (!callback && typeof query === 'function') {
		callback = query;
		query = {};
	}
	Team.find(query)
	.sort({elo : -1})
	.exec(callback);
};

exports.findvalidteams = function (query, callback) {
	if (!callback && typeof query === 'function') {
		callback = query;
		query = {};
	}
	Team.find({$and: [{games : { $gt : -1 }}, {active : 1}]})
	.sort({elo : -1})
	.exec(callback);
};
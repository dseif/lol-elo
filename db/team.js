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
		logo: String,
		games: {type: Number, default: 0 }
	});
	Team = mongoose.model('Team', teamSchema);
};

exports.insert = function (data, callback) {
 	var team = new Team(data);
	team.save(callback || function () {});
};

exports.find = function (query, callback) {
	if (!callback && typeof query === 'function') {
		callback = query;
		query = {};
	}
	Team.find(query, callback);
};

exports.updateelo = function (team, newelo, count,  callback) {
	Team.update({$or: [{name : team}, { aliases: { $elemMatch: { name: team } } }]}, 
			{elo: newelo,  $inc : { games : count} }, {multi : true}, function (err, response){
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
	Team.find({ games : { $gt: 0 } })
	.sort({elo : -1})
	.exec(callback);
};
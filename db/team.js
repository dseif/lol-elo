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
		elo: Number
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

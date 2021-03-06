var Match,
	matchesSchema,
	mongoose = require('mongoose');

exports.setup = function () {
	matchesSchema = mongoose.Schema({
		teams: [String],
		teamsLower: [String],
		date: Date,
		result: [Number],
		eventName: String,
		region: String
	});
	Match = mongoose.model('Match', matchesSchema);
};

exports.insert = function (data, callback) {
	var match = new Match(data);
	match.save(callback || function () {});
};

exports.find = function (query, callback) {
	if (!callback && typeof query === 'function') {
		callback = query;
		query = {};
	}
	Match.find(query, callback);
};

exports.findbydate = function (query, callback) {
	if (!callback && typeof query === 'function') {
		callback = query;
		query = {};
	}
	Match.find(query)
	.sort({date : 1})
	.exec(callback);
};
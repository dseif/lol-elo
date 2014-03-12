var Match,
	matchesSchema,
	mongoose = require('mongoose');

exports.setup = function () {
	matchesSchema = mongoose.Schema({
		teams: [String],
		date: Date,
		result: [Number],
		eventName: String,
		region: String
	});
	Match = mongoose.model('Match', matchesSchema);
};

exports.insert = function (data) {
	var match = new Match(data);
	match.save();
};

exports.find = function (query, callback) {
	if (!callback && typeof query === 'function') {
		callback = query;
		query = {};
	}
	Match.find(query, callback);
};
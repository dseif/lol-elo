var Result,
	resultsSchema,
	mongoose = require('mongoose');

exports.setup = function () {
	resultsSchema = mongoose.Schema({
		teams: [String],
		teamsLower: [String],
		date: Date,
		result: [Number],
		eloBefore: [Number],
		eloAfter: [Number],
		games: [Number],
		eventName: String,
		region: String
	});
	Result = mongoose.model('Result', resultsSchema);
};

exports.insert = function (data, callback) {
	var result = new Result(data);
	result.save(callback || function () {});
};

exports.find = function (query, callback) {
	if (!callback && typeof query === 'function') {
		callback = query;
		query = {};
	}
	Result.find(query, callback);
};

exports.findbydate = function (query, callback) {
	if (!callback && typeof query === 'function') {
		callback = query;
		query = {};
	}
	Result.find(query)
	.sort({date : -1})
	.exec(callback);
};
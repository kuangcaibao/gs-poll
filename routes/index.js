var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/pollsapp');

var db = mongoose.connection;
db.on('error', function() { console.log('connect error.'); });
db.on('open', function(callback) {
	doSomething();
});
var Poll;
var doSomething = function() {
	var PollSchema = require('../models/Poll.js').PollSchema;
	Poll = mongoose.model('polls', PollSchema);
};

// var db = mongoose.createConnection('localhost', 'pollsapp');
// var PollSchema = require('../models/Poll.js').PollSchema;
// var Poll = db.model('polls', PollSchema);

exports.index = function(req, res) {
	res.render('index', { title: '一个简单的MEAN投票示例'});
};

exports.list = function(req, res) {
	// res.json({});
	Poll.find({}, 'question', function(err, polls) {
		// res.json(polls);
		if(err) res.send(err);
		else res.json(polls);
	});
	// Poll.find({}).remove(function() { console.log('delete data success.');}); // 清空数据
};

exports.create = function(req, res) {
	var reqBody = req.body;
	var choices = reqBody.choices.filter(function(v) { return v.text != ''; }); // 过滤掉为空的选项
	var pollObj = { question: reqBody.question, choices: choices };

	var poll = new Poll(pollObj);
	poll.save(function(err, doc) {
		if(err || !doc) {
			throw 'Error';
		} else {
			res.json(doc);
		}
	});
}

exports.item = function(req, res) {
	var pollid = req.params.pollid;
	Poll.findById(pollid, '', { lean: true }, function(err, poll) {
		if(poll) {
			var userVoted = false;
			var userChoice;
			var totalVotes = 0;

			for(c in poll.choices) {
				var choice = poll.choices[c];
				for(v in choice.votes) {
					var vote = choice.votes[v];
					totalVotes ++;
					if(vote.ip === (req.header('x-forwarded-for') || req.ip)) { // 用户已经投票
						userVoted = true;
						userChoice = { _id: choice._id, text: choice.text };
					}
				}
			}

			poll.userVoted = userVoted;
			poll.userChoice = userChoice;
			poll.totalVotes = totalVotes;
			res.json(poll);
		} else {
			res.json({error: true});
		}
	});
	// res.json([]);
}

exports.vote = function(socket) {
	socket.on('send:vote', function(data) {
		var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

		Poll.findById(data.pollid, function(err, poll) {
			var choice = poll.choices.id(data.choice);
			choice.votes.push({ ip: ip });
			poll.save(function(err, doc) {
				var theDoc = {
					question: doc.question,
					_id: doc._id,
					choices: doc.choices,
					userVoted: false,
					totalVotes: 0
				};

				for(var i = 0, ln = theDoc.choices.length; i < ln; i++) {
					var choice = theDoc.choices[i];
					for(var j = 0, jln = choice.votes.length; j < jln; j++) {
						var vote = choice.votes[j];
						theDoc.totalVotes ++;
						theDoc.ip = ip;

						if(vote.ip === ip) {
							theDoc.userVoted = true;
							theDoc.userChoice = {
								_id: choice._id,
								text: choice.text
							};
						}
					}
				}

				socket.emit('myvote', theDoc);
				socket.broadcast.emit('vote', theDoc);
			})
		})
	})
}
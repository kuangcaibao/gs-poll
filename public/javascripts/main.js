'use strict';

var pollApp = angular.module('poll', ['ngRoute', 'pollServices']);

pollApp.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/polls', {
		templateUrl: '/partials/list.html',
		controller: 'PollListCtrl'
	}).when('/poll/:pollid', {
		templateUrl: '/partials/item.html',
		controller: 'PollItemCtrl'
	}).when('/new', {
		templateUrl: 'partials/new.html',
		controller: 'PollNewCtrl'
	}).otherwise({
		redirectTo: '/polls'
	})
}]);

pollApp.controller('PollListCtrl', ['$scope', 'Poll', function($scope, Poll) {
	// $scope.polls = [{
	// 	_id: '001',
	// 	question: '谁是啃老族第一逗比？'
	// }, {
	// 	_id: '002',
	// 	question: '群主是一个合格的群主吗？'
	// }];
	$scope.polls = Poll.query();
}]);

pollApp.controller('PollItemCtrl', ['$scope', '$routeParams', 'socket', 'Poll', function($scope, $routeParams, socket, Poll) {
	// $scope.poll = {
	// 	question: '谁是啃老族第一逗比？',
	// 	choices: [ 
	// 		{ text: "小曼", votes: ["", "", ""] }, 
	// 		{ text: "群主", votes: [""]}, 
	// 		{ text: "小泽", votes: [""]}
	// 	],
	// 	// userVoted: true,
	// 	totalVotes: 5,
	// 	userChoice: { text: "小曼" }
	// };
	// $scope.vote = function() {};
	$scope.poll = Poll.get({ pollid: $routeParams.pollid });

	socket.on('myvote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.pollid) {
			$scope.poll = data;
		} 
	});

	socket.on('vote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.pollid) {
			$scope.poll.choices = data.choices;
			$scope.poll.totalVotes = data.totalVotes;
		}
	});

	$scope.vote = function() {
		var pollid = $scope.poll._id;
		var	choiced = $scope.poll.userVote;

		if(choiced) {
			var voteObj = { pollid: pollid, choice: choiced};
			socket.emit('send:vote', voteObj);
		} else {
			alert("你还没有选择一个选项。");
		}
	};
}]);

pollApp.controller('PollNewCtrl', ['$scope', 'Poll', '$location', function($scope, Poll, $location) {
	$scope.poll = {
		question: '',
		choices: []
	};
	$scope.addChoice = function() {
		$scope.poll.choices.push({ text: ''});
	};
	$scope.createPoll = function() { // 提交创建的投票到服务器数据库
		var poll = $scope.poll;
		if(poll.question === '') {
			alert('投票题目必填。')
			return;
		}

		var tmpChoices = poll.choices.filter(function(v) { return v.text !== ''; });
		if(tmpChoices.length < 2) {
			alert('至少需要输入2个选项。');
			return;
		}

		var newPoll = new Poll(poll);
		newPoll.$save(function(p, resp) {
			if(!p.error) {
				$location.path('polls');
			} else {
				alert('创建投票失败。')
			}
		});
	};
}]);
var express = require('express');
var bodyParser = require('body-Parser');
var socket = require('socket.io');
var http = require('http');
var path = require('path');

var routes = require('./routes/index');

var app = express();
var server = http.createServer(app);
var io = socket.listen(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

app.get('/', routes.index); // 获得首页页面内容
app.get('/polls/polls', routes.list); // 获得投票列表内容
app.get('/polls/:pollid', routes.item); // 查看单个投票内容
app.post('/polls', routes.create); // 创建新投票

// 监听socket.io的连接
io.sockets.on('connection', routes.vote); // 发起投票

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

server.listen(app.get('port'), function() {
    console.log("投票服务器已成功启动，监听端口：" + app.get('port'));
});

// module.exports = app;

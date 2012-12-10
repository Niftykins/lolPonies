var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	static = require('node-static'),
	util = require('util');

var fileServer = new static.Server('./');

function handler (req, res) {
	req.addListener('end', function () {
        fileServer.serve(req, res); // this will return the correct file
    });
}

io.set('log level',1);
app.listen(8001);

var players = {};

io.sockets.on('connection', function (socket) {
	console.log(socket.id+' has connected');
	console.log('current clients', util.inspect(io.connected));
	players[socket.id] = {x: 256, y: 256, id: socket.id};
	socket.broadcast.emit('updateplayers', players[socket.id]);

	socket.on('player_move', function (data) {
		players[socket.id].x = data.x;
		players[socket.id].y = data.y;
		socket.broadcast.emit('player_move', players[socket.id]);
	});

	socket.on('disconnect', function() {
		if (typeof players[socket.id] === 'undefined') return;

		delete players[socket.id];
		console.log(socket.id + ' has disconnect');
		//io.sockets.emit('updateusers', players);
	});
});

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
app.listen(80);

var players = {};

io.sockets.on('connection', function (socket) {
	console.log(socket.id+' has connected');
	//console.log('current clients', util.inspect(io.connected));

	// send the new guy a list of old guys
	if (Object.keys(players).length > 0) socket.emit('add_players', players);
	socket.emit('id', socket.id) // new guy needs an id

	players[socket.id] = {x: 256, y: 256, id: socket.id};
	// send the old guys the new guy
	socket.broadcast.emit('new_player', players[socket.id]);

	socket.on('player_move', function (data) {
		players[socket.id].x = data.x;
		players[socket.id].y = data.y;
		players[socket.id].action = data.action;
		socket.broadcast.emit('player_move', players[socket.id]);
	});

	socket.on('disconnect', function() {
		if (typeof players[socket.id] === 'undefined') return;
		if (!(socket.id in players)) return;

		delete players[socket.id];
		console.log(socket.id + ' has disconnect');
		//console.log('current clients', util.inspect(io.connected));
		io.sockets.emit('remove_player', socket.id);
	});
});

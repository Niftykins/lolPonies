var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	static = require('node-static');

var fileServer = new static.Server('./');

function handler (req, res) {
	req.addListener('end', function () {
        fileServer.serve(req, res); // this will return the correct file
    });
}

io.set('log level',1);
app.listen(80);

var players = {};
var id = 0;

io.sockets.on('connection', function (socket) {
	console.log(id+' has connected')
	socket.id = id;
	players[socket.id] = {x: 256, y: 256, id: socket.id};
	id++;
	socket.broadcast.emit('updateplayers', players[socket.id]);

	socket.on('receivedata', function (data) {
		socket.broadcast.emit('playermove', data);
	});

	socket.on('disconnect', function() {
		if (!socket.id) return;

		delete players[socket.id];
		console.log(socket.id + ' has disconnect');
		//io.sockets.emit('updateusers', players);
	});
});
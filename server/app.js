var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile('index.html');
});

var players = {
	player1: null,
	player2: null
}

io.on('connection', function(socket) {
	if(players.player1 == null) {
		socket.player = 'player1';
	} else if(players.player2 == null) {
		socket.player = 'player2';
	}
	socket.on('positions', positions => updatePositions(positions, socket));
	setInterval(() => {
		if(socket.player == 'player1') {
			socket.emit('updatePositions', players.player2);
		} else {
			socket.emit('updatePositions', players.player1);
		}
	}, 1000 / 60)
	socket.on('disconnect', () => {
		players[socket.player] = null;
	})
});

function updatePositions(positions, socket) {
	players[socket.player] = positions;
}

server.listen(3000, function(){
  console.log('listening on *:3000');
});
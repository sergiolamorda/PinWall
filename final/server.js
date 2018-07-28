const express = require('express'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    passport =  require('passport'),
    passportConfig = require('./config/passport'),
    MONGO_URL = 'mongodb://127.0.0.1:27017/auth',
    userController = require('./controllers/user');
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    Game = require('./Game.js'),
    Score = require('./models/Score');

mongoose.Promise = global.Promise;
mongoose.connect(MONGO_URL);
mongoose.connection.on('error', (err) => {
  throw err;
  process.exit(1);
});

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
    store: new MongoStore({
        url: MONGO_URL,
        autoReconnect: true
    })
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.post('/singup', userController.postSignup);
app.post('/login', userController.postLogin);

app.get('/', passportConfig.isAuthenticated, (req, res) => {
    res.render('index', { username: req.user.username });
});

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/logout', userController.logout);

app.get('/user', passportConfig.isAuthenticated, (req, res) => {
    res.json(req.user);
});

app.get('/ranking', (req, res) => {
    var query = Score.find().select('points username type');
    query.exec((err, score) => {
        if(err) return handleError(err);
        res.json(score);
    });
});

var games = { waiting: {}, playing: {} };

io.on('connection', socket => {
    console.log(socket.id)
    socket.on('playGame', data => playGame(socket, data));
    socket.on('updateFlipper', (data) => updateFlipper(socket, data));
    socket.on('spacePressed', (data) => updateShuttle(socket, data));
    socket.on('disconnect', () => leaveGame(socket));
    socket.on('leaveGame', () => leaveGame(socket));

});

function createGameId() {
    return Math.random().toString(36).slice(2);
}

function joinGame(socket, username, game) {
    var gameId = game.getId();
    socket.join(gameId);
    socket.gameId = gameId;
    game.addPlayer(socket.id, username);
}

function startGame(game) {
    var sceneDef = require('./public/levels/' + game.getLevelName() + '/scene.json');
    io.to(game.getId()).emit('loadScene', {
        players: game.players,
        sceneDef: sceneDef
    });
}

function playGame(socket, data) {
    if(!socket.gameId) {
        var username = data.user.username,
            level = data.level;
        if(level.type == 'singleplayer') {
            var gameId = createGameId(),
                game = new Game(gameId, level.name);

            joinGame(socket, username, game);
            games.playing[gameId] = game;

            startGame(games.playing[gameId]);
        } else {
            if(Object.keys(games.waiting).length) {
                var gameId = Object.keys(games.waiting)[0],
                    game = games.waiting[gameId];
                joinGame(socket, username, game);
                if(game.nPlayers == game.maxPlayers) {
                    games.playing[gameId] = game;
                    delete games.waiting[gameId];
                    startGame(game);
                }
            } else {
                var gameId = createGameId(),
                    game = new Game(gameId, level.name);
                joinGame(socket, username, game);

                games.waiting[gameId] = game;
            }
        }
    }
}

function updateFlipper(socket, data) {
    var game = games.playing[socket.gameId];
    if(game)
        game.updateFlipper(socket.id, data);
}

function updateShuttle(socket, data) {
    var game = games.playing[socket.gameId];
    if(game)
        game.updateShuttle(data);
}

function leaveGame(socket) {
    var gameId = socket.gameId;
    delete games.waiting[gameId];
    delete games.playing[gameId];
    delete socket.gameId;
    socket.leave(gameId);
    io.to(gameId).emit('playerDisconnects', 'El rival se ha desconectado');
}

//Server
http.listen(3000, function() {
    console.log('listening on *:3000');
    setInterval(() => {
        Object.entries(games.playing).forEach(game => {
            var gameId = game[0],
                game = game[1];

            res = game.update();
            if(res.lose == true) {
                if(game.levelType == 'singleplayer') {
                    var score = new Score({
                        points: res.score,
                        username: game.players.player1.username,
                        type: game.levelType
                    });
                    score.save(err => {
                        if(err)
                            console.error(error);
                    });
                    io.to(gameId).emit('gameOver', 'Has perdido, tu puntuacion es ' + res.score);
                } else {
                    Object.values(game.players).forEach(player => {
                        io.sockets.connected[player.id].emit('gameOver', player.id == game.playerLose ? 'Has perdido...' : 'Has ganado!!!');
                    });
                }
                delete games.playing[gameId];
            } else {
                io.to(gameId).emit('updateScene', res);
            }

        });
    }, 1000 / 100);
});

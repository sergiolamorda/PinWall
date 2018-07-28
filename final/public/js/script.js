var socket = io(),
    user,
    scene;

window.onload = () => {
    $.ajax({
        url: '/user',
        type: 'GET',
        async: false,
        success: function(data) {
            user = data;
        }
    });

    var playSingleplayerBtn = document.getElementById('playSingleplayerBtn'),
        playMultiplayerBtn = document.getElementById('playMultiplayerBtn'),
        showRankingBtn = document.getElementById('showRankingBtn'),
        exitBtn = document.getElementById('exitBtn');

    playSingleplayerBtn.addEventListener('click', playSingleplayer);
    playMultiplayerBtn.addEventListener('click', playMultiplayer);
    showRankingBtn.addEventListener('click', showRanking);
    exitBtn.addEventListener('click', exit);

    socket.on('loadScene', loadScene);
    socket.on('updateScene', updateScene);
	socket.on('playerDisconnects', playerDisconnects);
    socket.on('gameOver', gameOver);

    document.body.addEventListener('keydown', evt => {
        if(evt.keyCode == 37) socket.emit('updateFlipper', { active: true, side: 'left' });
        if(evt.keyCode == 39) socket.emit('updateFlipper', { active: true, side: 'right' });
        if(evt.keyCode == 32) socket.emit('spacePressed', true);
    });

    document.body.addEventListener('keyup', evt => {
        if(evt.keyCode == 37) socket.emit('updateFlipper', { active: false, side: 'left' });
        if(evt.keyCode == 39) socket.emit('updateFlipper', { active: false, side: 'right' });
        if(evt.keyCode == 32) socket.emit('spacePressed', false);
    });

    window.addEventListener('resize', () => scene.resize());

}

function playSingleplayer(evt) {
    multiplayerBtn = document.getElementById('playMultiplayerBtn');
    if(multiplayerBtn != 'Multiplayer') {
        multiplayerBtn.classList.remove('selected');
        multiplayerBtn.textContent = 'Multiplayer';
        exit();
    }
    socket.emit('playGame', {
		level: {
			type: 'singleplayer',
			name: 'singleplayer'
		},
		user: user
    });
}

function playMultiplayer(evt) {
    btn = evt.target;
    if(btn.textContent == 'Multiplayer') {
        socket.emit('playGame', {
    		level: {
    			type: 'multiplayer',
    			name: 'multiplayer'
    		},
    		user: user
        });
        btn.classList.add('selected');
        btn.textContent = 'Esperando...';
    } else {
        btn.classList.remove('selected');
        btn.textContent = 'Multiplayer';
        exit();
    }
}

function showRanking(evt) {
    multiplayerBtn = document.getElementById('playMultiplayerBtn');
    if(multiplayerBtn != 'Multiplayer') {
        multiplayerBtn.classList.remove('selected');
        multiplayerBtn.textContent = 'Multiplayer';
        exit();
    }
    var menuContainer = document.getElementById('menuContainer'),
        rankingContainer = document.getElementById('rankingContainer');

    [...rankingContainer.children].slice(1)
        .forEach(e => rankingContainer.removeChild(e));

    menuContainer.style.display = 'none';
    rankingContainer.style.display = 'block';

    $.ajax({
        url: '/ranking',
        type: 'GET',
        async: false,
        success: function(data) {
            var data = Object.values(data);
            var table = document.createElement('table');
                console.log(data);
                scores = data.sort((a, b) => b.points - a.points).slice(0, 9);
                console.log(data);
                headers = ['Score', 'User'];

            var tr = document.createElement('tr');
            headers.forEach(e => {
                var th = document.createElement('th');

                th.textContent = e;
                tr.appendChild(th);
            });

            table.appendChild(tr);

            var loadRanking = (table, scores) => {
                scores.forEach(e => {
                    var tr = document.createElement('tr'),
                        tdScore = document.createElement('td'),
                        tdUsername = document.createElement('td');

                    tdScore.textContent = e.points;
                    tdUsername.textContent = e.username;
                    tr.appendChild(tdScore);
                    tr.appendChild(tdUsername);
                    table.appendChild(tr);
                });
            }

            loadRanking(table, scores);

            var h2 = document.createElement('h2');

            h2.textContent = 'Ranking';

            table.style.marginBottom = '20px';
            rankingContainer.appendChild(h2);
            rankingContainer.appendChild(table);

            var link = document.createElement('a');
            link.textContent = 'Volver';
            link.addEventListener('click', () => {
                menuContainer.style.display = 'block';
                rankingContainer.style.display = 'none';
            });

            rankingContainer.appendChild(link);
        }
    });
}

function exit() {
    closeGame();
    socket.emit('leaveGame');
}

function loadScene(data) {
    var btn = document.getElementById('playMultiplayerBtn');
    btn.classList.remove('selected');
    btn.textContent = 'Multiplayer';

    var gameContainer = document.getElementById('gameContainer')
    document.getElementById('menuContainer').style.display = 'none';
    gameContainer.style.display = 'block';
    scene = new Scene(socket.id, data.players, gameContainer, data.sceneDef);
    scene.start()
}

function updateScene(data) {
    scene.update(data);
}

function playerDisconnects(message) {
    var div = document.createElement('div'),
        br = document.createElement('br'),
        link = document.createElement('a');

    div.classList.add('messageDiv')
    div.textContent = message;
    div.style.display = 'block';
    div.appendChild(br);
    link.textContent = 'Continuar';
    link.addEventListener('click', exit);
    div.appendChild(link);

    var container = document.getElementById('gameContainer');
    container.insertBefore(div, container.lastElementChild);
}

function closeGame() {
    var menuContainer = document.getElementById('menuContainer'),
        gameContainer = document.getElementById('gameContainer');
    menuContainer.style.display = 'block';
    gameContainer.style.display = 'none';
    [...gameContainer.children]
        .filter(e => e.id != 'exitBtn')
        .forEach(e => e.parentNode.removeChild(e));
}

function gameOver(message) {
    var div = document.createElement('div'),
        br = document.createElement('br'),
        link = document.createElement('a');

    div.classList.add('messageDiv')
    div.textContent = message;
    div.style.display = 'block';
    div.appendChild(br);
    link.textContent = 'Continuar';
    link.addEventListener('click', exit);
    div.appendChild(link);

    var container = document.getElementById('gameContainer');
    container.insertBefore(div, container.lastElementChild);
}

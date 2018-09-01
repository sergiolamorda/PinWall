const pl = require('planck-js'),
    Vec2 = pl.Vec2,
    fs = require("fs");

module.exports = Game;

/*const pl = planck,
    Vec2 = pl.Vec2;*/

function Game(id, name) {
    var def = JSON.parse(fs.readFileSync('./public/levels/' + name + '/level.json'));
    //var def = name;
    this.id = id;

    this.nPlayers = 0;
    this.maxPlayers = def.maxPlayers;
    this.players = {};

    Object.entries(def.players).forEach(player => {
        this.players[player[0]] = new Player(player[1]);
    });

    this.levelName = def.levelName;
    this.levelType = def.levelType;
    this.score = 0;
    this.playerLose = null;
    this.lose = false;

    this.world = new pl.World(Vec2(def.world.gravity.x, def.world.gravity.y));

    this.physics = {
        ball: {},
        flipper: {},
        stage: {},
        bouncer: {},
        sensor: {},
        ramp: {},
        shuttle: {},
        gravitySensor: {},
        lifeSensor: {}
    }
    Object.keys(def.physics).forEach(id => {
        var type = def.physics[id].type;
        this.physics[type][id] = Physic.types[type](this.world, def.physics[id]);
    });

    this.world.on('end-contact', contact => {
        var bodyA = contact.getFixtureA().getBody(),
            userData = bodyA.getUserData();
        if(userData && userData.score)
            this.score += userData.score || 0;
        if(userData && userData.type && userData.type == 'lifeSensor') {
            if(userData.owner) {
                this.playerLose  = this.players[userData.owner].id;
            }
            this.lose = true;
        }
    });
}

function Player(def) {
    this.balls = def.balls;
    this.flippers = def.flippers;
    this.camera = def.camera;
}

Game.prototype.addPlayer = function(id, username) {
    this.nPlayers += 1;

    var player = this.players['player' + this.nPlayers];
    player.id = id;
    player.username = username;
}

Game.prototype.getId = function() {
    return this.id;
}

Game.prototype.getLevelName = function() {
    return this.levelName;
}

Game.prototype.update = function() {
    this.world.step(1 / 25);

    var res = {}
    var balls = this.physics.ball,
        flippers = this.physics.flipper;

	Object.keys(balls).forEach(id => {
        var ball = balls[id];
			ballZ = ball.getZ(),
			inside = ball.getInside(),
			insideObject = this.physics[inside.type][inside.id],
			insideObjectZ = insideObject.getZ(ball.getY());

		ball.setZ(inside.type == 'stage' &&
            ballZ > insideObjectZ &&
            Math.abs(ballZ - insideObjectZ) > 0.5 ?
            ballZ - 0.5 : insideObjectZ
        );

        if(inside.type == 'shuttle' && insideObject.isActive()) {
            if(Math.abs(ball.getVelocity().y) < 0.05) {
                ball.applyImpulse(insideObject.getForce());
            }
            insideObject.setActive(false);
        }

		ball.update();
        res[id] = { p: ball.getPosition() };
	});

    Object.keys(flippers).forEach(id => {
        var flipper = flippers[id];
        flipper.update();
        res[id] = { p: flipper.getPosition(), a: flipper.getAngle() };
    });

    res.playerLose = this.playerLose;
    res.lose = this.lose;

    if(this.levelType == 'singleplayer')
        res.score = this.score;

    return res;
}

Game.prototype.updateFlipper = function(playerId, data) {
    var playerKey = Object.keys(this.players).find(key => this.players[key].id == playerId),
        player = this.players[playerKey];

    //player = this.players.player2;

    player.flippers[data.side].forEach(flipperId => {
        var flipper = this.physics.flipper[flipperId];
        this.physics.flipper[flipperId].setActive(data.active);
    });
}

Game.prototype.updateShuttle = function(data) {
    Object.values(this.physics.shuttle).forEach(shuttle => {
        if(data && !shuttle.isPressed()) {
            shuttle.setPressed(data);
            shuttle.setStartTime(new Date().getTime());
        }
        if(!data && shuttle.isPressed()) {
            shuttle.setPressed(data);
            shuttle.setActive(true);
        }
    });
}

Physic.types = {
    ball: function(world, def) { return new Ball(world, def); },
    flipper: function(world, def) { return new Flipper(world, def); },
    stage: function(world, def) { return new Stage(world, def); },
    bouncer: function(world, def) { return new Bouncer(world, def); },
    shuttle: function(world, def) { return new Shuttle(world, def); },
    sensor: function(world, def) { return new Sensor(world, def); },
    ramp: function(world, def) { return new Ramp(world, def); },
    gravitySensor: function(world, def) { return new GravitySensor(world, def); },
    lifeSensor: function(world, def) { return new LifeSensor(world, def); }
}

function Physic(world, def) {

    this.position = def.position || { x: 0, y: 0, z: 0 };

    this.body = world.createBody({
		position: Vec2(this.position.x, this.position.y)
	});

    if(def.points && def.lines) this.createFixture(this.body, def);
    if(def.score) this.body.setUserData({ score: def.score });
}

Physic.fylterCategory = {
	'ball': 0x0001,
	'stage': 0x0002,
	'ramp': 0x0004,
	'sensor': 0x0008,
	'shuttle': 0x0010,
};

Physic.prototype.setPosition = function(position) {
    this.position = position || { x: 0, y: 0, z: 0 };
}

Physic.prototype.getPosition = function() {
    return this.position;
}

Physic.prototype.createFixture = function(body, def) {
	var points = def.points,
		lines = def.lines;

	for(var i = 0; i < lines.length; i += 2) {
        var index1 = lines[i] * 3,
        	index2 = lines[i + 1] * 3;

        var x1 = points[index1],
        	y1 = points[index1 + 2],
        	x2 = points[index2],
        	y2 = points[index2 + 2];

        body.createFixture(pl.Edge(Vec2(x1, y1), Vec2(x2, y2)), 0);
    }
}

Physic.prototype.setFilterData = function(data) {
	var fixture = this.body.getFixtureList();
	while(fixture != null) {
		fixture.setFilterData(data);
		fixture = fixture.getNext();
	}
}

Physic.prototype.setSensor = function(sensor) {
	var fixture = this.body.getFixtureList();
	while(fixture != null) {
		fixture.setSensor(sensor);
		fixture = fixture.getNext();
	}
}

function Ball(world, def) {
    Physic.call(this, world, def);

    this.body.setDynamic();
    this.body.setBullet(true);

	this.body.createFixture(pl.Circle(def.radius), def.mass);
	this.setFilterData({
		groupIndex: 0,
		categoryBits: Physic.fylterCategory.ball,
		maskBits: Physic.fylterCategory.ball | Physic.fylterCategory.sensor | Physic.fylterCategory[def.inside.mask]
	});

    this.body.setGravityScale(def.gravityScale);
	this.body.setUserData({ inside: def.inside });
	this.radius = def.radius;
}

Ball.prototype = Object.create(Physic.prototype);

Ball.prototype.update = function() {
	var position = this.body.getPosition();
    this.position.x = position.x;
    this.position.y = position.y;
}

Ball.prototype.getY = function() {
	return this.position.y;
}

Ball.prototype.setZ = function(z) {
	this.position.z = z + this.radius;
}

Ball.prototype.getZ = function() {
	return this.position.z - this.radius;
}

Ball.prototype.getInside = function() {
	return this.body.getUserData().inside;
}

Ball.prototype.applyImpulse = function(impulse) {
    this.body.applyLinearImpulse(Vec2(0, impulse), Vec2(0,0), true);
}

Ball.prototype.getVelocity = function() {
    return this.body.getLinearVelocity();
}


function Flipper(world, def) {
    Physic.call(this, world, def);
    this.body.setDynamic();
    this.body.setBullet(true);

	this.body.createFixture(pl.Circle(1), def.mass);
    this.createFixture(this.body, def);

	this.orientation = def.orientation;
    this.direction = def.direction;
	this.velocity = { down: def.velocity.down, up: def.velocity.up };
	this.limits = { lower: def.limits.lower, upper: def.limits.upper };
    this.active = false;

	let optionJoint = {
		enableMotor: true,
		lowerAngle: this.limits.lower,
		upperAngle: this.limits.upper,
		enableLimit: true,
		collideConnected: false,
		maxMotorTorque: 150000
	};

	this.motor = world.createJoint(pl.RevoluteJoint(optionJoint, world.createBody(), this.body, Vec2(def.position.x, def.position.y)));
}

Flipper.prototype = Object.create(Physic.prototype);

Flipper.prototype.update = function() {
    this.body.setFixedRotation(false);
    if(this.orientation == 'right') {
        if(this.direction == 'down' ? !this.active : this.active) {
            if(this.motor.getJointAngle() >= this.limits.upper) {
                this.body.setAngle(this.limits.upper);
                this.body.setFixedRotation(true);
            }
        } else {
            if(this.motor.getJointAngle() <= this.limits.lower) {
                this.body.setAngle(this.limits.lower);
                this.body.setFixedRotation(true);
            }
        }
    } else {
        if(this.direction == 'down' ? !this.active : this.active) {
            if(this.motor.getJointAngle() <= this.limits.lower) {
                this.body.setAngle(this.limits.lower);
                this.body.setFixedRotation(true);
            }
        } else {
            if(this.motor.getJointAngle() >= this.limits.upper) {
                this.body.setAngle(this.limits.upper);
                this.body.setFixedRotation(true);
            }
        }
    }

    this.motor.setMotorSpeed(this.active ? this.velocity.up : this.velocity.down);
    this.angle = this.motor.getJointAngle();
}

Flipper.prototype.setActive = function(active) {
    this.active = active;
}

Flipper.prototype.getAngle = function() {
    return this.angle;
}

function Stage(world, def) {
    Physic.call(this, world, def);

	this.setFilterData({
		groupIndex: 0,
		categoryBits: def.mask ? Physic.fylterCategory[def.mask] : Physic.fylterCategory.stage,
		maskBits: 0xffff
	});
}

Stage.prototype = Object.create(Physic.prototype);

Stage.prototype.getZ = function(y) {
	return this.position.z;
}

function Bouncer(world, def) {
    Physic.call(this, world, def);

	this.createFixture(this.body, def);
	this.setFilterData({
		groupIndex: 0,
		categoryBits: Physic.fylterCategory.stage,
		maskBits: 0xffff
	});

	this.bouncing = def.bouncing;

	world.on('end-contact', contact => {
		if(this.body == contact.getFixtureA().getBody()) {
			var ball = contact.getFixtureB().getBody(),
				velocity = ball.getLinearVelocity(),
				impulse = velocity.mul(1.5);

			if(Math.abs(impulse.x) < this.bouncing.min && Math.abs(impulse.y) < this.bouncing.min) {
				var bigger = Math.abs(velocity.x) > Math.abs(velocity.y) ? velocity.x : velocity.y;
				var multipler = Math.abs(this.bouncing.min / bigger);
				impulse = velocity.mul(multipler);
			} else if(Math.abs(impulse.x) > this.bouncing.max || Math.abs(impulse.y) > this.bouncing.max) {
				var bigger = Math.abs(velocity.x) > Math.abs(velocity.y) ? velocity.x : velocity.y;
				var divisor = Math.abs(bigger / this.bouncing.max);
				impulse = Vec2(velocity.x / divisor, velocity.y / divisor);
			}
			ball.applyLinearImpulse(impulse, Vec2(0, 0), true);
		}
	});
}

Bouncer.prototype = Object.create(Physic.prototype);

function Shuttle(world, def) {
    Physic.call(this, world, def);

	this.setFilterData({
		groupIndex: 0,
		categoryBits: Physic.fylterCategory.shuttle,
		maskBits: 0xffff
	});

    this.active = false;
    this.pressed = false;
    this.startTime = null;

}

Shuttle.prototype = Object.create(Physic.prototype);

Shuttle.prototype.getZ = function() {
	return this.position.z;
}

Shuttle.prototype.isActive = function() {
	return this.active;
}

Shuttle.prototype.setActive = function(active) {
    this.active = active;
}

Shuttle.prototype.setPressed = function(pressed) {
    this.pressed = pressed;
}

Shuttle.prototype.isPressed = function() {
    return this.pressed;
}

Shuttle.prototype.setStartTime = function(startTime) {
    this.startTime = startTime;
}

Shuttle.prototype.getStartTime = function() {
    return this.startTime;
}

Shuttle.prototype.getForce = function() {
    let force = (new Date().getTime() - this.getStartTime()) * 0.5;
    let porcentaje = force * 100 / 300;
    return porcentaje;
}

function Sensor(world, def) {
    Physic.call(this, world, def);

	this.setFilterData({
		groupIndex: 0,
		categoryBits: Physic.fylterCategory[def.mask],
		maskBits: 0xffff
	});

	this.setSensor(true);

	this.body.setUserData({ from: def.in, to: def.out });

	world.on('end-contact', contact => {
		var ball = contact.getFixtureB().getBody(),
			sensor = contact.getFixtureA().getBody();

		if(sensor == this.body) {
			var inside = ball.getUserData().inside,
                ballVelocity = ball.getLinearVelocity(),
                ballGravity = ball.getGravityScale();

            if(ballGravity == 1)
                ball.setUserData(ballVelocity.y < 0 ? { inside: def.out } : { inside: def.in });
            else
                ball.setUserData(ballVelocity.y > 0 ? { inside: def.out } : { inside: def.in });

			ball.getFixtureList().setFilterData({
				groupIndex: 0,
				categoryBits: Physic.fylterCategory.ball,
				maskBits: Physic.fylterCategory.ball | Physic.fylterCategory.sensor | Physic.fylterCategory[ball.getUserData().inside.mask]
			});
            console.log(ball.getUserData().inside);
		}
	});
}

Sensor.prototype = Object.create(Physic.prototype);

Sensor.prototype.getFrom = function() {
	return this.body.getUserData().from;
}

Sensor.prototype.getTo = function() {
	return this.body.getUserData().to;
}

function GravitySensor(world, def) {
    Physic.call(this, world, def);

	this.setSensor(true);

	world.on('end-contact', contact => {
		var ball = contact.getFixtureB().getBody(),
			sensor = contact.getFixtureA().getBody();

		if(sensor == this.body) {
            var ballVelocity = ball.getLinearVelocity();
            ball.setGravityScale(ballVelocity.y < 0 ? 1 : -1);
        }
	});
}

GravitySensor.prototype = Object.create(Physic.prototype);

function Ramp(world, def) {
    Physic.call(this, world, def);

	this.createFixture(this.body, def);
	this.setFilterData({
		groupIndex: 0,
		categoryBits: Physic.fylterCategory[def.mask],
		maskBits: 0xffff
	});

	this.createHeightMap(def.heightMap);
}

Ramp.prototype = Object.create(Physic.prototype);

Ramp.prototype.createHeightMap = function(def) {
	this.heightMap = [];

    var points = def.points,
        lines = def.lines;
	for(var i = 0; i < lines.length; i += 2) {
        let index1 = lines[i] * 3,
			index2 = lines[i + 1] * 3;

        /*if(points[index1 + 2] > points[index2 + 2]) {
            index2 = lines[i] * 3;
            index1 = lines[i + 1] * 3;
        }*/

		this.heightMap.push({
            z1: points[index1 + 1],
            y1: points[index1 + 2],
            z2: points[index2 + 1],
            y2: points[index2 + 2]
		});
	}

    this.heightMap.forEach(height => {
        if(height.y1 > height.y2) {
            [height.y1, height.y2] = [height.y2, height.y1];
            [height.z1, height.z2] = [height.z2, height.z1];
        }
    });

    this.heightMap = this.heightMap.sort((a, b) => a.y1 - b.y1);

    //this.heightMap.forEach(e => console.log("y1: " + e.y1 + ", y2: " + e.y2 + ", z1: " + e.z1 + ", z2: " +  e.z2));
    //console.log('//////////////////');
    /*if(this.heightMap[0].z1 < this.heightMap[0].z2) {
    this.heightMap.forEach(height => {
            [height.z1, height.z2] = [height.z2, height.z1];
        });
    }*/

    this.min = Math.max(...this.heightMap.map(e => e.z1));
}

Ramp.prototype.getZ = function(y) {
    for(position of this.heightMap) {
        if(position.y1 < y && position.y2 > y) {
            let distanceY = Math.abs(position.y2 - position.y1);
            let subDistanceY = Math.abs(position.z1 > position.z2 ? position.y1 - y : position.y2 - y);//+ 0.5
            let distanceZ =  Math.abs(position.z1 - position.z2);
            let percentage = subDistanceY / distanceY;
            let z = position.z1 > position.z2 ? position.z1 - (distanceZ * percentage) : position.z2 - (distanceZ * percentage);
            //console.log(y + ", " + position.y1 + ", " + position.y2 + "," + porcentaje + "," + z + "," + lol);
            return -z;
        }
    }
    return this.min;
}

function LifeSensor(world, def) {
    Physic.call(this, world, def);
    this.type = 'lifeSensor';

    this.createFixture(this.body, def);
    this.setSensor(true);

    if(def.owner)
        var userData = { type: 'lifeSensor', owner: def.owner };
    else
        var userData = { type: 'lifeSensor'};

    this.body.setUserData(userData);
    console.log(this.body.getUserData());
}

LifeSensor.prototype = Object.create(Physic.prototype);

/////////////////////////////////
function setDefaults(to, from) {
	to = to || {};

	Object.keys(from).forEach(key => to[key] = to[key] || from[key]);

	return to;
}

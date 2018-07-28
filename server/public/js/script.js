var init = function() {
    //THREE
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF4DAE3);
    var camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -125, 90);
    camera.lookAt(0, 0, 0);

    var controls = new THREE.OrbitControls(camera);

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild( renderer.domElement );

    var light = new THREE.DirectionalLight( 0xffffff, 1, 100 );
    light.position.set(0, -125, 75);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    var loader = new THREE.ColladaLoader();
    loader.load("models/supreme.dae", function(collada) {
        scene.add(collada.scene);
    });

    var ball = new THREE.Mesh(
        new THREE.SphereGeometry(1.15, 20, 20),
        new THREE.MeshPhongMaterial({ color: 0xfcaf0a })
    );
    ball.position.set(-7, 0, 15);
    scene.add(ball);

    var flippers = [];
    //Physics
    pl = planck;
    Vec2 = pl.Vec2;
    //world = new pl.World(Vec2(0, -50));
    world = new pl.World(Vec2(0, -5));

    //var ballBody = world.createDynamicBody({ position: Vec2(-6, 0), bullet: true });
    var ballBody = world.createDynamicBody({ position: Vec2(23, -45), bullet: true });
    ballBody.createFixture(pl.Circle(1.15), 1);

    var bodys = {};
    baseGround.forEach(e => bodys[e.name] = world.createBody());
    console.log(bodys.groundExt);

    var heightmapRampaLeft = [];
    var rampaLeftIsActive = false;

    //Rampa Right
    var heightmapRampaRight = [];
    var rampaRightIsActive = false;

    var onTheTop = false;
    var theTop = 8.5;

    var inShuttle = true;
    var theTopOfShuttle = 2.75;

    for(var obj of baseGround) {
        for(var i = 0; i < obj.lines.length; i += 2) {
            let index1 = obj.lines[i] * 3;
            let index2 = obj.lines[i + 1] * 3;
            var x1 = obj.points[index1];
            var y1 = obj.points[index1 + 2];
            var x2 = obj.points[index2];
            var y2 = obj.points[index2 + 2];
            if(obj.name != 'flipperLeft' && obj.name != 'flipperRight') {
                bodys[obj.name].createFixture(pl.Edge(Vec2(x1, y1), Vec2(x2, y2)), 0);
            }
        }

        if(obj.name == 'heightmapRampaLeft' || obj.name == 'heightmapRampaRight') {
            for(var i = 0; i < obj.lines.length; i += 2) {
                let index1 = obj.lines[i] * 3;
                let index2 = obj.lines[i + 1] * 3;
                if(obj.points[index1 + 2] > obj.points[index2 + 2]) {
                    index2 = obj.lines[i] * 3;
                    index1 = obj.lines[i + 1] * 3;
                }
                var point = {
                    x1: obj.points[index1],
                    z1: obj.points[index1 + 1],
                    y1: obj.points[index1 + 2],
                    x2: obj.points[index2],
                    z2: obj.points[index2 + 1],
                    y2: obj.points[index2 + 2]
                };
                if(obj.name == 'heightmapRampaLeft') heightmapRampaLeft.push(point);
                else heightmapRampaRight.push(point);
            }
        }
    }

    //8.73, 36.5
    flippers.push(createFlipper(true, new THREE.Vector3(-7.92, -37.07, 1), bodys['groundInt'], scene, world, pl, Vec2, baseGround));
    //flippers.push(createFlipper(false, new THREE.Vector3(7.92, -37.07, 1), bodys['groundInt'], scene, world, pl, Vec2));

    console.table(flippers);


    heightmapRampaLeft.sort((a, b) => a.y1 - b.y1);
    heightmapRampaRight.sort((a, b) => a.y1 - b.y1);

    var filterCategoryBall = 0x0001;
    var filterCategoryGround = 0x0002;
    var filterCategoryRamp = 0x0004;
    var filterCategorySensor =  0x0008;
    var filterCategoryLanzadera = 0x0010;

    ballBody.getFixtureList().m_filterCategoryBits = filterCategoryBall;
    ballBody.getFixtureList().m_filterMaskBits = filterCategoryBall | filterCategoryLanzadera | filterCategorySensor;
    ballBody.getFixtureList().setRestitution(0.3);

    //GroundExt
    let fixture = bodys['groundExt'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryGround;
        fixture = fixture.getNext();
    }
    //GroundInt
    fixture = bodys['groundInt'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryGround;
        fixture = fixture.getNext();
    }
    //Pelotas
    fixture = bodys['pelotas'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryGround;
        fixture = fixture.getNext();
    }
    //Triangulos
    fixture = bodys['triangulos'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryGround;
        fixture = fixture.getNext();
    }
    //Tronchos
    fixture = bodys['tronchos'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryGround;
        fixture = fixture.getNext();
    }
    //RampaLeft
    fixture = bodys['rampaLeft'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryRamp;
        fixture = fixture.getNext();
    }
    //RampaRight
    fixture = bodys['rampaRight'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryRamp;
        fixture = fixture.getNext();
    }
    //entradaRampaLeftSensor
    fixture = bodys['entradaRampaLeftSensor'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //entradaRampaRightSensor
    fixture = bodys['entradaRampaRightSensor'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //salidaRampaLeftSensor
    fixture = bodys['salidaRampaLeftSensor'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //salidaRampaRightSensor
    fixture = bodys['salidaRampaRightSensor'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //heightmapRampaRight
    fixture = bodys['heightmapRampaRight'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = 0x0032;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //Shuttle
    fixture = bodys['lanzadera'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryLanzadera;
        fixture = fixture.getNext();
    }
    //ShuttleSensor
    fixture = bodys['lanzaderaSalida'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }

    //RampsLogic
    world.on('end-contact', (contact, oldManifold) => {
        let bodyA = contact.getFixtureA().getBody();
        let bodyEntradaLeft = bodys['entradaRampaLeftSensor'].getFixtureList().getBody();
        let bodySalidaLeft = bodys['salidaRampaLeftSensor'].getFixtureList().getBody();
        let bodyEntradaRight = bodys['entradaRampaRightSensor'].getFixtureList().getBody();
        let bodySalidaRight = bodys['salidaRampaRightSensor'].getFixtureList().getBody();
        if(bodyA == bodyEntradaLeft || bodyA == bodySalidaLeft || bodyA == bodyEntradaRight || bodyA == bodySalidaRight) {
            let velY = contact.getFixtureB().getBody().getLinearVelocity();
            let actualBall = contact.getFixtureB();
            if(bodyA == bodyEntradaLeft || bodyA == bodyEntradaRight) {
                rampaLeftIsActive = bodyA == bodyEntradaLeft ? true : false;
                rampaRightIsActive = bodyA == bodyEntradaRight ? true : false;
                if(velY.y > 0) {
                    actualBall.m_filterMaskBits = filterCategoryBall | filterCategoryRamp | filterCategorySensor;
                } else {
                    [rampaLeftIsActive, rampaRightIsActive] = [false, false];
                    actualBall.m_filterMaskBits = filterCategoryBall | filterCategoryGround | filterCategorySensor;
                    onTheTop = false;
                }
            } else {
                [rampaLeftIsActive, rampaRightIsActive] = [false, false];
                actualBall.m_filterMaskBits = filterCategoryBall | filterCategoryGround | filterCategorySensor;
                onTheTop = false;
            }
            actualBall.refilter();
        }
    });

    //LanzaderaLogic
    world.on('end-contact', (contact, oldManifold) => {
        let bodyA = contact.getFixtureA().getBody();
        let bodySalidaLanzadera = bodys['lanzaderaSalida'].getFixtureList().getBody();
        if(bodyA == bodySalidaLanzadera) {
            let actualBall = contact.getFixtureB();
            actualBall.m_filterMaskBits = filterCategoryBall | filterCategoryGround | filterCategorySensor;
            inShuttle = false;
        }
    });

    //CircleLogic
    world.on('end-contact', (contact, oldManifold) => {
        let circle = contact.getFixtureA().getBody();
        if(circle == bodys['pelotas']) {
            let bodyBall = contact.getFixtureB().getBody();
            let v = bodyBall.getLinearVelocity();
            bodyBall.applyLinearImpulse(v.mul(1.5), Vec2(0,0), true);
        }
    });

    var animate = function () {
        var ballPosition = ballBody.getPosition();
        camera.position.set(0, ballPosition.y - 100, 80);
        if(camera.position.y < -100) camera.position.y = -100;
        if(camera.position.y > 0) camera.position.y = 0;
        camera.lookAt(0, ball.position.y, ball.position.z);

        requestAnimationFrame(animate);
        updatePhysics();
        //controls.update();
        renderer.render(scene, camera);
    };

    flippers.left = flippers.right = false;

    document.body.addEventListener("keydown", evt => {
        if(evt.keyCode == 37 || evt.keyCode == 65) flippers.left = true;
        if(evt.keyCode == 39 || evt.keyCode == 80) flippers.right = true;
    });

    document.body.addEventListener("keyup", evt => {
        if(evt.keyCode == 37 || evt.keyCode == 65) flippers.left = false;
        if(evt.keyCode == 39 || evt.keyCode == 80) flippers.right = false;
    });

    document.body.addEventListener("keyup", evt => {
        if(evt.keyCode == 82) {
            ballBody.setPosition(Vec2(23, -45));
            ballBody.getFixtureList().m_filterMaskBits = filterCategoryBall | filterCategoryLanzadera | filterCategorySensor;
            ballBody.setLinearVelocity(Vec2(0, 0));
            inShuttle = true;
        }
        if(evt.keyCode == 32) {
            ballBody.applyLinearImpulse(Vec2(0, 2000), Vec2(0,0), true);
        }
    });

    var updatePhysics = () => {
        var flippersAngle = updateFlippers(flippers);
        world.step(1 / 25);
        var ballPosition = ballBody.getPosition();
        ball.position.x = ballPosition.x;
        ball.position.y = ballPosition.y;
        let salir = false;
        if(rampaLeftIsActive || rampaRightIsActive) {
            let heightmap = rampaLeftIsActive ? heightmapRampaLeft : heightmapRampaRight;
            for(position of heightmap) {
                if(salir == false) {
                    if(!onTheTop) {
                        if(position.y1 < ball.position.y && position.y2 > ball.position.y) {
                            salir = true;
                            let distance = Math.abs(position.y2 - position.y1);
                            let distance2 = Math.abs(position.y1 - (ballPosition.y + 0.5));
                            let porcentaje = distance2 / distance;
                            let lol =  Math.abs(position.z1 - position.z2);
                            let z = position.z1 - (lol * porcentaje);
                            //console.log(ballPosition.y + ", " + position.y1 + ", " + position.y2 + "," + porcentaje + "," + z + "," + lol);
                            ball.position.z = -z + 1;
                            //console.log(-z + 1);
                        }
                    } else {
                        salir = true;
                        ball.position.z = theTop;
                    }
                }
            }
            if(salir == false) onTheTop = true;
        } else if(inShuttle) {
            ball.position.z = theTopOfShuttle;
        } else {
            if(ball.position.z > 1.25) {
                ball.position.z -= 0.50;
            } else {
                ball.position.z = 1.25;
            }
        }
    }
    animate();

    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
}

window.onload = function() {
    init();
}

//#ff4f86
var init = function() {    
    //THREE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    var camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -100, 140);
    
    var controls = new THREE.OrbitControls(camera);
    
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    var light = new THREE.DirectionalLight( 0xffffff, 1, 100 );
    light.position.set(0, 50, 200);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
        
    var loader = new THREE.ColladaLoader();
    loader.load("models/model.dae", function(collada) {
        scene.add(collada.scene);
    });
    
    var ball = new THREE.Mesh(
        new THREE.SphereGeometry(1, 20, 20),
        new THREE.MeshPhongMaterial({ color: 0xfcaf0a })
    );
    ball.position.set(-7, 0, 1)
    scene.add(ball);    
    
    //Physics
    pl = planck;
    Vec2 = pl.Vec2;
    world = new pl.World(Vec2(0, -30));
    
    


    var ballBody = world.createDynamicBody({ position: Vec2(-7, 0), bullet: true });
    ballBody.createFixture(pl.Circle(1), 1);

    var ground = world.createBody();
    //ground.m_fixtureList.setRestitution(1);
    
    createFlipper(true, new THREE.Vector3(-8.28, -42.78, 1.5), ground);
    createFlipper(false, new THREE.Vector3(8.28, -42.78, 1.5), ground);

    for(var obj of baseGround) {
        for(var i = 0; i < obj.lines.length; i += 2) {
            let index1 = obj.lines[i] * 3;
            let index2 = obj.lines[i + 1] * 3;
            var x1 = obj.points[index1];
            var y1 = obj.points[index1 + 2];
            var x2 = obj.points[index2];
            var y2 = obj.points[index2 + 2];
            ground.createFixture(pl.Edge(Vec2(x1, y1), Vec2(x2, y2)), 0);
        }               
    }
    
    ballBody.getFixtureList().setRestitution(0.3);
    //compound shapes, edge shapes, convex hull, asteroid, car
    //////////////////
    var animate = function () {
        requestAnimationFrame(animate);
        updatePhysics();
        controls.update();
        renderer.render(scene, camera);
    };
    
    [flippers.left, flippers.right] = [false, false];

    document.body.addEventListener("keydown", evt => {
        if(evt.keyCode == 37 || evt.keyCode == 65) flippers.left = true;
        if(evt.keyCode == 39 || evt.keyCode == 80) flippers.right = true;
    });

    document.body.addEventListener("keyup", evt => {
        if(evt.keyCode == 37 || evt.keyCode == 65) flippers.left = false;
        if(evt.keyCode == 39 || evt.keyCode == 80) flippers.right = false;
    });

    var updatePhysics = () => {
        updateFlippers();
        world.step(1 / 60);
        var ballPosition = ballBody.getPosition();
        ball.position.x = ballPosition.x;
        ball.position.y = ballPosition.y;
    }
    
    animate();
}

window.onload = function() {
    init();
}
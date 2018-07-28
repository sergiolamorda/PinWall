// Global Variables
var balls = [];
// THREE Variables
//var scene;
// Planck Variables
//var world, pl, Vec2;

// @createFlipper(leftFlipper: boolean, position: Vector3, boardToConnect: Mesh, escena: THREE.Scene, world: PhysicsWorld)
function createFlipper(leftFlipper, position, ground, scene, world, pl, Vec2, baseGround) {
    let motor = new THREE.Object3D();
    motor.position.set(position.x - 1, position.y, position.z);
    scene.add(motor);

    var loader = new THREE.ColladaLoader();
    loader.load("models/flipper.dae", function(collada) {
        scene.add(collada.scene);
        motor.add(collada.scene);


    });

    var flipperBody = world.createDynamicBody({ position: Vec2(position.x, position.y), bullet: true });
    flipperBody.createFixture(pl.Circle(1), 20);

    let optionJoint = {
        enableMotor: true,
        lowerAngle: -0.5235,
        upperAngle: 0.5235,
        enableLimit: true,
        collideConnected: false,
        maxMotorTorque: 150000
    };

    let joint = world.createJoint(pl.RevoluteJoint(optionJoint, ground, flipperBody, Vec2(position.x, position.y)));

    for(var obj of baseGround) {
        for(var i = 0; i < obj.lines.length; i += 2) {
            let index1 = obj.lines[i] * 3;
            let index2 = obj.lines[i + 1] * 3;
            var x1 = obj.points[index1];
            var y1 = obj.points[index1 + 2];
            var x2 = obj.points[index2];
            var y2 = obj.points[index2 + 2];
            if(obj.name == 'flipperLeft') {
                flipperBody.createFixture(pl.Edge(Vec2(x1 - 1, y1), Vec2(x2 - 1, y2)), 50);
            }
        }
    }

    let object = {
        type: leftFlipper ? "leftFlipper" : "rightFlipper",
        //f_Mesh: collada.scene,
        f_Motor: motor,
        f_Body: flipperBody,
        f_Joint: joint
    };

    return object;



    /*for(var obj of baseGround) {
        for(var i = 0; i < obj.lines.length; i += 2) {
            let index1 = obj.lines[i] * 3;
            let index2 = obj.lines[i + 1] * 3;
            var x1 = obj.points[index1];
            var y1 = obj.points[index1 + 2];
            var x2 = obj.points[index2];
            var y2 = obj.points[index2 + 2];
            if(obj.name == 'flipperLeft') {
                flipperBody.createFixture(pl.Edge(Vec2(x1, y1), Vec2(x2, y2)), 50);
            }
        }
    }*/



    /*let flipper = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2, 2),
        new THREE.MeshNormalMaterial()
    );

    let flipperWidth = flipper.geometry.parameters.width;
    let anchorPosition = leftFlipper ? flipperWidth/2 : -(flipperWidth/2);
    flipper.position.x = anchorPosition;
    motor.add(flipper);

    let flipperBodyX = leftFlipper ? position.x + (flipperWidth/2) : position.x - (flipperWidth/2);
    let flipperBody = world.createDynamicBody({ position: Vec2(flipperBodyX, position.y), bullet: true });
    flipperBody.createFixture(pl.Box(flipperWidth/2, 1), 20);

    let optionJoint = {
        enableMotor: true,
        lowerAngle: -0.5235,
        upperAngle: 0.5235,
        enableLimit: true,
        collideConnected: false,
        maxMotorTorque: 150000
    };

    let joint = world.createJoint(pl.RevoluteJoint(optionJoint, ground, flipperBody, Vec2(position.x, position.y)));

    let object = {
        type: leftFlipper ? "leftFlipper" : "rightFlipper",
        f_Mesh: flipper,
        f_Motor: motor,
        f_Body: flipperBody,
        f_Joint: joint
    };*/

    //return object;
}

function createFlipperOponent(leftFlipper, position, scene) {
    let motor = new THREE.Object3D();
    motor.position.set(position.x, position.y, position.z);
    scene.add(motor);

    let flipper = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2, 2),
        new THREE.MeshNormalMaterial()
    );

    let flipperWidth = flipper.geometry.parameters.width;
    let anchorPosition = leftFlipper ? flipperWidth/2 : -(flipperWidth/2);
    flipper.position.x = anchorPosition;
    motor.add(flipper);

    let object = {
        type: leftFlipper ? "leftFlipper" : "rightFlipper",
        f_Mesh: flipper,
        f_Motor: motor
    };

    return object;
}

function updateFlippers(flippers) {
    var rotationAngles = [];
    for(flipper of flippers) {
        flipper.f_Joint.m_bodyB.setFixedRotation(false);
        let keyPress = flipper.type == 'leftFlipper' ? flippers.left : flippers.right;
        let [velUp, velDown] = flipper.type == 'leftFlipper' ? [30,-30] : [-30, 30];

        if(keyPress) {
            if(flipper.f_Joint.getJointAngle() >= 0.52) {
                flipper.f_Joint.m_bodyB.m_sweep.a = 0.52;
                flipper.f_Joint.m_bodyB.setFixedRotation(true);
            }
        } else {
            if(flipper.f_Joint.getJointAngle() <= -0.52) {
                flipper.f_Joint.m_bodyB.m_sweep.a = -0.52;
                flipper.f_Joint.m_bodyB.setFixedRotation(true);
            }
        }

        flipper.f_Joint.setMotorSpeed(keyPress ? velUp : velDown);
        flipper.f_Motor.rotation.z = flipper.f_Joint.getJointAngle();
        rotationAngles.push(flipper.f_Joint.getJointAngle());
    }
    return rotationAngles;
}

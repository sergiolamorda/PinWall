/*function setDefaults(to, from) {
	to = to || {};

	Object.keys(from).forEach(key => to[key] = to[key] || from[key]);

	return to;
}

function Scene(playerId, players, domElement, def) {
    this.scene = new THREE.Scene();

	this.player = Object.values(players).find(player => player.id == playerId);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    domElement.appendChild(this.renderer.domElement);

    this.cameras = {};
    this.lights = {};
    this.objects3D = {};
	this.score = {};

    Object.entries(def.cameras).forEach(camera => this.createCamera(...camera));
    Object.entries(def.lights).forEach(light => this.createLight(...light));
    Object.entries(def.objects3D).forEach(object3D => this.createObject3D(...object3D));

	this.createScore(def.score);
}

Scene.prototype.start = function() {
	this.renderer.render(this.scene, this.cameras[this.player.camera]);
	requestAnimationFrame(() => this.start());
}

Scene.prototype.update = function(data) {
    Object.entries(data).forEach(e => {
        var id = e[0],
            def = e[1];

        var obj = this.scene.children.find(e => e.name == id);

		if(obj) {
            if(def.p) obj.position.set(...Object.values(def.p));
            if(def.a) obj.rotation.z = def.a;
		}
    });

	var score = document.getElementById('score');
	score.textContent = data.score;
}

Scene.prototype.resize = function() {
	Object.values(this.cameras).forEach(camera => {
		camera.aspect = window.innerWidth / window.innerHeight;
	    camera.updateProjectionMatrix();
	});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
}

Scene.prototype.createScore = function(def) {
	var divScore = document.createElement('div');
	divScore.classList.add('score');
	divScore.id = "score";

	var container = document.getElementById('gameContainer');
    container.insertBefore(divScore, container.lastElementChild);

}*/

const Scene = (() => {
	const scene;
	const player;
	const renderer;

	const create = () => {
		scene = new THREE.Scene();

		player = Object.values(players).find(player => player.id == playerId);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		domElement.appendChild(this.renderer.domElement);

		def.cameras.forEach(camera => createCamera(camera));
		def.lights.forEach(light => this.createLight(id, def));
		def.object3D.forEach(object3D => this.createObject3D(id, def));

		createScore(def.score);
	}

	const createCamera = ({
		type = 'PerspectiveCamera',
		fov = 45,
		aspect = window.innerWidth / window.innerHeight,
		near = 1,
		far = 1000,
		position = { x: 0, y: 0, z: 0 },
		rotation = 0,
		lookAt = { x: 0, y: 0, z: 0 }
	} = {}) => {
		const camera = {
			PerspectiveCamera() { return new THREE.PerspectiveCamera(fov, aspect, near, far); }
		}[type];
	
		camera.position.set(...Object.values(position));
		camera.lookAt(...Object.values(lookAt));
		camera.rotation.z = rotation;
	
		// camera.userData.owner = owner;
		//this.cameras[id] = camera;
	}

	const createLight = ({
		type = 'AmbientLight',
		color = 0xffffff,
		intensity = 1,
		skyColor = 0xffffff,
		groundColor = 0xffffff,
		distance = 0,
		decay = 1,
		width = 10,
		height = 10,
		position = { x: 0, y: 0, z: 0 },
		lookAt = { x: 0, y: 0, z: 0 }
	} = {}) => {
		const light = {
			AmbientLight() { return new THREE.AmbientLight(color, intensity); },
			DirectionalLight() { return new THREE.DirectionalLight(color, intensity); },
			HemisphereLight() { return new THREE.HemisphereLight(skyColor, groundColor, intensity); },
			PointLight() { return new THREE.HemisphereLight(color, intensity, distance, decay); },
			RectAreaLight() { return new THREE.RectAreaLight(color, intensity, width, height); },
			SpotLight() { return new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay); }
		}[type];
	
		light.position.set(...Object.values(position));
		light.lookAt(...Object.values(lookAt));
	
		scene.add(light);
	}

	const createObject3D = ({id, dae} = {}) => {
		const loader = new THREE.ColladaLoader();
	
		const object3D = new THREE.Object3D();
		object3D.name = id;
	
		loader.load(dae, model => {
			object3D.add(model.scene);
			scene.add(object3D);
		});
	}

	return {
		create,
	}
})();
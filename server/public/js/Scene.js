const Scene = (() => {
	let scene;
	let player;
	let renderer;
	let cameras = {};

	const create = (playerId, players, domElement, def) => {
		player = Object.values(players).find(player => player.id == playerId);
		
		scene = new THREE.Scene();
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		domElement.appendChild(renderer.domElement);

		def.cameras.forEach(camera => createCamera(camera));
		def.lights.forEach(light => createLight(light));
		def.objects3D.forEach(object3D => createObject3D(object3D));

		createScore(def.score);
	}

	const start = () => {
		renderer.render(scene, cameras[player.camera]);
		requestAnimationFrame(() => start());
	}

	const update = (data) => {
		Object.entries(data).forEach(([name, def]) => {
			// True for recursive
			const obj = scene.getObjectByName(name, true);

			if (!obj) {
				return;
			}

			if(def.p) {
				obj.position.set(...Object.values(def.p));
			}

			if(def.a) {
				obj.rotation.z = def.a;
			}
		});
	
		const score = document.getElementById('score');
		score.textContent = data.score;
	}

	const createCamera = ({
		name,
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
			PerspectiveCamera: () => new THREE.PerspectiveCamera(fov, aspect, near, far)
		}[type]();

		camera.name = name;
		camera.position.set(...Object.values(position));
		camera.lookAt(...Object.values(lookAt));
		camera.rotation.z = rotation;
	
		//camera.userData.owner = owner;
		cameras[name] = camera;
	}

	const createLight = ({
		name,
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
			AmbientLight: () => new THREE.AmbientLight(color, intensity),
			DirectionalLight: () => new THREE.DirectionalLight(color, intensity),
			HemisphereLight: () => new THREE.HemisphereLight(skyColor, groundColor, intensity),
			PointLight: () => new THREE.HemisphereLight(color, intensity, distance, decay),
			RectAreaLight: () => new THREE.RectAreaLight(color, intensity, width, height),
			SpotLight: () => new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay),
		}[type]();

		light.name = name;
		light.position.set(...Object.values(position));
		light.lookAt(...Object.values(lookAt));
	
		scene.add(light);
	}

	const createObject3D = ({name, dae} = {}) => {
		const loader = new THREE.ColladaLoader();

		const object3D = new THREE.Object3D();
		object3D.name = name;
	
		loader.load(dae, model => {
			object3D.add(model.scene);
			scene.add(object3D);
		});
	}

	const createScore = (def) => {
		const divScore = document.createElement('div');
		divScore.classList.add('score');
		divScore.id = 'score';
	
		const container = document.getElementById('gameContainer');
		container.insertBefore(divScore, container.lastElementChild);
	}

	return {create, start, update};
})();
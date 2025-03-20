import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import * as dat from 'dat.gui';

const scene = new THREE.Scene();
//Have 2 camera type
//PerspectiveCamera, we will see the object is small or big base on the distance between it to the camera
//OrthographicCamera, opposite with the perspectiveCamera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1, 3, 3);
const material = new THREE.MeshBasicMaterial( { 
	color: 0x00ff00,
	wireframe: true, // Draw wire instead of boiled mesh, use most in debug
} );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const planeGeometry = new THREE.PlaneGeometry(30,30, 1, 1);
const planeMaterial = new THREE.MeshStandardMaterial({
	color:0xffffff,
	side: THREE.DoubleSide, //Render 2 side of the plane
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -0.5 * Math.PI;
scene.add(plane);

const orbit = new OrbitControls(camera, renderer.domElement);

camera.position.set(-10,30,30);
orbit.update();

const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

const directionLight = new THREE.DirectionalLight(0xffffff, 0.8);
scene.add(directionLight);


const gridHelper = new THREE.GridHelper(30);
scene.add(gridHelper);

const gui = new dat.GUI();

const options = {
	color: '#ffea00',
	wireframe: true
};

gui.addColor(options, 'color').onChange(function(e){
	cube.material.color.set(e);
});
gui.add(options, 'wireframe').onChange(function(e){
	cube.material.wireframe = e;
});

function animate(time) {

	cube.rotation.x = time/1000;
	cube.rotation.y = time/1000;

	renderer.render( scene, camera );

}
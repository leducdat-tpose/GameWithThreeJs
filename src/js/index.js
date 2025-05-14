var container, scene, camera, renderer, controls;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock;

var movingCube;
var collideMeshList = [];
var cubes = [];
var message = document.getElementById("message");
var crash = false;
var score = 0;
var scoreText = document.getElementById("score");
var id = 0;
var crashId = " ";
var lastCrashId = " ";

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    // Camera
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 1, 20000);
    camera.position.set(0, 200, 400);

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor( 0xffffff, 1);
    renderer.setSize(screenWidth * 0.85, screenHeight * 0.85);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use BasicShadowMap for better performance

    container = document.getElementById("ThreeJS");
    container.appendChild(renderer.domElement);

    THREEx.WindowResize(renderer, camera);
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Directional light
    const light = new THREE.DirectionalLight(0xFFFFFF, 1);
    light.position.set(200, 200, 200); // Position the light
    light.target.position.set(0, 0, 0); // Set the target of the light
    light.castShadow = true; // Enable shadow casting
    light.shadow.mapSize.width = 2048; // Increase shadow resolution
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 1000;
    light.shadow.camera.left = -2000;
    light.shadow.camera.right = 2000;
    light.shadow.camera.top = 2000;
    light.shadow.camera.bottom = -2000;
    scene.add(light);

    // Ground Plane to Receive Shadows
    const groundGeometry = new THREE.PlaneGeometry(590, 10000);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
    ground.receiveShadow = true; // Enable shadow receiving
    // ground.castShadow = true; // Disable shadow casting
    scene.add(ground);

    // 2 đường biên
    geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-250, -1, -3000));
    geometry.vertices.push(new THREE.Vector3(-300, -1, 200));
    material = new THREE.LineBasicMaterial({
        color: 0x66FFFF, linewidth: 5, fog: true
    });
    var line1 = new THREE.Line(geometry, material);
    scene.add(line1);
    geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(250, -1, -3000));
    geometry.vertices.push(new THREE.Vector3(300, -1, 200));
    var line2 = new THREE.Line(geometry, material);
    scene.add(line2);


    // Đây là đối tượng người chơi
    var cubeGeometry = new THREE.CubeGeometry(50, 25, 60, 5, 5, 5);
    var wireMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true
    });
    movingCube = new THREE.Mesh(cubeGeometry, wireMaterial);
    //            movingCube = new THREE.Mesh(cubeGeometry, material);
    //            movingCube = new THREE.BoxHelper(movingCube);
    movingCube.position.set(0, 25, -20);
    movingCube.castShadow = true; // Enable shadow casting
    movingCube.receiveShadow = true; // Enable shadow receiving
    scene.add(movingCube);

    // const helper = new THREE.CameraHelper( light.shadow.camera );
    // scene.add( helper );
}

function animate() {
    // Dừng màn hình khi va chạm
    if (!crash)
    {
        requestAnimationFrame(animate);
    }
    update();
    renderer.render(scene, camera);

}

function update() {
    var delta = clock.getDelta();
    var moveDistance = 2;
    //console.log(moveDistance);
    var rotateAngle = Math.PI / 2 * delta;

    //            if (keyboard.pressed("A")) {
    //                camera.rotation.z -= 0.2 * Math.PI / 180;
    //                console.log("press A")
    //            }
    //            if (keyboard.pressed("D")) {
    //                movingCube.rotation.y += rotateAngle;
    //            }

    if (keyboard.pressed("left") || keyboard.pressed("A")) {
        if (movingCube.position.x > -270)
            movingCube.position.x -= moveDistance;
        // if (camera.position.x > -150) {
        //     camera.position.x -= moveDistance * 0.6;
        //     if (camera.rotation.z > -5 * Math.PI / 180) {
        //         camera.rotation.z -= 0.2 * Math.PI / 180;
        //     }
        // }
    }
    if (keyboard.pressed("right") || keyboard.pressed("D")) {
        if (movingCube.position.x < 270)
            movingCube.position.x += moveDistance;
        // if (camera.position.x < 150) {
        //     camera.position.x += moveDistance * 0.6;
        //     if (camera.rotation.z < 5 * Math.PI / 180) {
        //         camera.rotation.z += 0.2 * Math.PI / 180;
        //     }
        // }
    }
    if (keyboard.pressed("up") || keyboard.pressed("W")) {
        movingCube.position.z -= moveDistance;
    }
    if (keyboard.pressed("down") || keyboard.pressed("S")) {
        movingCube.position.z += moveDistance;
    }

    // if (!(keyboard.pressed("left") || keyboard.pressed("right") ||
    //     keyboard.pressed("A") || keyboard.pressed("D"))) {
    //     delta = camera.rotation.z;
    //     camera.rotation.z -= delta / 10;
    // }


    var originPoint = movingCube.position.clone();

    for (var vertexIndex = 0; vertexIndex < movingCube.geometry.vertices.length; vertexIndex++) {
        // 顶点原始坐标
        var localVertex = movingCube.geometry.vertices[vertexIndex].clone();
        // 顶点经过变换后的坐标
        var globalVertex = localVertex.applyMatrix4(movingCube.matrix);
        var directionVector = globalVertex.sub(movingCube.position);

        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(collideMeshList);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            crash = true;
            crashId = collisionResults[0].object.name;
            break;
        }
        crash = false;
    }

    if (crash) {
        //            message.innerText = "crash";
        movingCube.material.color.setHex(0x346386);
        console.log("Crash");
        if (crashId !== lastCrashId) {
            // score -= 100;
            lastCrashId = crashId;
        }
        displayMessage();
    } else {
        //            message.innerText = "Safe";
        movingCube.material.color.setHex(0x00ff00);
    }

    if (Math.random() < 0.03 && cubes.length < 30) {
        makeRandomCube();
    }

    // Speed
    for (i = 0; i < cubes.length; i++) {
        if (cubes[i].position.z > camera.position.z) {
            scene.remove(cubes[i]);
            cubes.splice(i, 1);
            collideMeshList.splice(i, 1);
        } else {
            cubes[i].position.z += 2;
        }
        //                renderer.render(scene, camera);
    }

    score += 0.1;
    scoreText.innerText = "Score:" + Math.floor(score);

    //controls.update();
}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Chướng ngại vật
function makeRandomCube() {
    var a = 1 * 50,
        b = 1 * 50,
        c = 1 * 50;
    var geometry = new THREE.BoxGeometry(a, b, c);
    var material = new THREE.MeshBasicMaterial({
        color: Math.random() * 0xffffff,
        size: 3
    });


    var box = new THREE.Mesh(geometry, material);
    // var box = new THREE.BoxHelper(object);
    //            box.material.color.setHex(Math.random() * 0xffffff);
    // box.material.color.setHex(0xff0000);

    box.position.x = getRandomArbitrary(-250, 250);
    box.position.y = 1 + b / 2;
    box.position.z = -1500;
    cubes.push(box);
    box.name = "box_" + id;
    id++;
    // Enable shadow receiving
    box.castShadow = true; // Enable shadow casting
    box.receiveShadow = true; 
    collideMeshList.push(box);
    scene.add(box);
}
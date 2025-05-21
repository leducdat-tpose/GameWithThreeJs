// src/js/index.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
class Game {
    // Khởi tạo các thành phần cơ bản
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.keyboard = new THREEx.KeyboardState();
        this.clock = new THREE.Clock();   // Đồng hồ đo thời gian
        this.score = 0;
        this.scoreElement = document.getElementById('scoreboard');  // Hiển thị điểm số
        this.resetBtn = document.getElementById('reset-btn');  // Tham chiếu nút reset
        this.lastScoreUpdateTime = 0;

        this.player = null;  // Đối tượng người chơi
        this.vehicleType = null; // Loại xe
        this.rockModel = null;  // Vật cản
        this.obstacles = [];  // Danh sách vật cản
        this.colliders = [];  // Danh sách va chạm
        this.crash = false;

        this.rockSpeed = 5;  // Tốc độ vật cản
        this.rockScale = 30;  // Kích thước
        this.vision = 3;

        this.loader = new GLTFLoader();

        // Thêm sự kiện cho nút reset
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                this.resetGame();
            });
        }

        // Thêm sự kiện cho nút "C" để chuyển đổi góc nhìn
        document.addEventListener("keydown", (event) => {
    if ((event.key === "C" || event.key === "c")) {
        this.vision = this.vision === 3 ? 1 : 3;
    }
});

        this.init();
    }

    init() {
        this.initCamera();
        this.initRenderer();
        this.initControls();
        this.initLights();
        this.initBoundaries();
        this.preloadRockModel();

        // Chờ người dùng chọn xe
        this.selectPlayer((vehicleType) => {
            this.loadPlayer(vehicleType);
        });
    }


    // Camera perspective với góc nhìn 45 độ
    initCamera() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 20000);
        this.camera.position.set(0, 170, 400);
    }

    // Tạo renderer WebGL với nền trong suốt
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setClearColor(0xffffff, 1);
        this.renderer.setSize(window.innerWidth * 0.85, window.innerHeight * 0.85);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById("ThreeJS").appendChild(this.renderer.domElement);
        THREEx.WindowResize(this.renderer, this.camera);
    }

    // Điều khiển camera với OrbitControls
    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableRotate = false;
    }

    // Thêm ánh sáng để hiển thị model glb
    initLights() {
        // const ambient = new THREE.AmbientLight(0xffffff, 5);
        // const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        // directional.position.set(0, 300, 500);
        // this.scene.add(ambient, directional);

        const ambient = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambient);

        const light = new THREE.DirectionalLight(0xFFFFFF, 1.2); // Slightly stronger
        light.position.set(200, 200, 200);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 1000;
        light.shadow.camera.left = -2000;
        light.shadow.camera.right = 2000;
        light.shadow.camera.top = 2000;
        light.shadow.camera.bottom = -2000;
        this.scene.add(light);

        const groundGeometry = new THREE.PlaneGeometry(650, 10000);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.position.set(0, -20, 0);
        this.scene.add(ground);
    }

    // Hai đường biên
    initBoundaries() {
        const mat = new THREE.LineBasicMaterial({ color: 0x66FFFF });
        const mkLine = x => {
            const pts = [
                new THREE.Vector3(x, -1, -3000),
                new THREE.Vector3(x + (x > 0 ? 50 : -50), -1, 200)
            ];
            this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
        };
        mkLine(-250);
        mkLine(250);
    }

    // Tải model vật cản (rock)
    preloadRockModel(onLoaded) {
        this.loader.load('./assets/Rock.glb', (gltf) => {
            this.rockModel = gltf.scene;
            this.rockModel.scale.set(this.rockScale, this.rockScale, this.rockScale);

            this.rockModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material.side = THREE.DoubleSide;
                }
            });

            console.log('Rock model loaded');
            if (onLoaded) onLoaded();
        }, undefined, (error) => {
            console.error('Lỗi khi tải Rock.glb:', error);
        });
    }
    selectPlayer(onSelected) {
        const carBtn = document.getElementById('car');
        const busBtn = document.getElementById('bus');
        const selectUI = document.getElementById('select-car');

        carBtn.addEventListener('click', () => {
            this.vehicleType = 'car';
            selectUI.style.display = 'none';
            if (onSelected) onSelected(this.vehicleType);
        });

        busBtn.addEventListener('click', () => {
            this.vehicleType = 'bus';
            selectUI.style.display = 'none';
            if (onSelected) onSelected(this.vehicleType);
        });
    }


    // Tải model người chơi (car)
    loadPlayer(vehicleType) {
        let modelPath = '';

        if (vehicleType === 'car') {
            modelPath = './assets/CAR.glb';
            this.loader.load(modelPath, gltf => {
            this.player = gltf.scene;
            this.player.scale.set(0.25, 0.25, 0.25);
            this.player.position.set(0, -20, -20);
            this.player.rotation.y = Math.PI;
            //this.player.rotation.x = Math.PI / 2;

            this.player.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) child.material.side = THREE.DoubleSide;
                }
            });

            this.scene.add(this.player);
            this.animate();
        }, undefined, error => {
            console.error('Lỗi khi tải model:', error);
        });

        } else if (vehicleType === 'bus') {
            modelPath = './assets/SCHOOL_BUS.glb';
            this.loader.load(modelPath, gltf => {
            this.player = gltf.scene;
            this.player.scale.set(1, 1, 1);
            this.player.position.set(0, -20, -20);
            this.player.rotation.y = Math.PI;
            this.player.rotation.x = Math.PI / 2;

            this.player.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) child.material.side = THREE.DoubleSide;
                }
            });

            this.scene.add(this.player);
            this.animate();
        }, undefined, error => {
            console.error('Lỗi khi tải model:', error);
        });


        } else {
            console.error('Loại xe không hợp lệ!');
            return;
        }
    }


    switchCamera() {
        if (this.vision === 1 && this.player) {
            this.camera.position.set(
                this.player.position.x,
                this.player.position.y + 20,
                this.player.position.z - 40 
            );
            // Set the point that the camera will always look at
            this.controls.target.set(
                this.player.position.x,
                this.player.position.y + 20,
                this.player.position.z - 200
            ); 
        } else {
            this.camera.position.set(0, 170, 400);
            this.controls.target.set(0, 0, 0);   
        }
        this.controls.update();
    }

    animate() {
        if (!this.crash) {
            requestAnimationFrame(this.animate.bind(this)); // Chỉ request frame khi chưa crash
            this.update();
            this.renderer.render(this.scene, this.camera);
        }
        else {
            this.showGameOver();
        }
    }


    update() {
        const delta = this.clock.getDelta();

        if (this.crash) return;  // Dừng update điểm khi crash

        this.lastScoreUpdateTime = (this.lastScoreUpdateTime || 0) + delta;
        if (this.lastScoreUpdateTime > 0.1) {
            this.score += 1;
            this.lastScoreUpdateTime = 0;

            if (this.scoreElement) {
                this.scoreElement.innerText = `Score: ${this.score}`;
            }
        }

        // Xử lý di chuyển từ bàn phím
        const move = 2;
        if (this.player) {
            if (this.keyboard.pressed("left") || this.keyboard.pressed("A")) {
                if (this.player.position.x > -270) this.player.position.x -= move;
            }
            if (this.keyboard.pressed("right") || this.keyboard.pressed("D")) {
                if (this.player.position.x < 270) this.player.position.x += move;
            }
            if (this.keyboard.pressed("up") || this.keyboard.pressed("W")) {
                if (this.player.position.z > -1000) this.player.position.z -= move * 2;
            }
            if (this.keyboard.pressed("down") || this.keyboard.pressed("S")) {
                if (this.player.position.z < 500) this.player.position.z += move * 2;
            }
        }

        // this.camera.position.set(0, 170, 400);
        // this.controls.target.set(0, 25, -20);
        // this.controls.update();

        // Tạo vật cản ngẫu nhiên và xóa khi rời khỏi màn hình
        if (this.rockModel && Math.random() < 0.03 && this.obstacles.length < 30) {
            this.spawnRock(); // gọi hàm tạo vật cản
        }

        for (let i = 0; i < this.obstacles.length; i++) {
            const rock = this.obstacles[i];
            rock.position.z += this.rockSpeed;  

            if (rock.position.z > this.camera.position.z) {
                this.scene.remove(rock);
                this.obstacles.splice(i, 1);
                this.colliders.splice(i, 1);
                i--;
            }
        }

        // Kiểm tra va chạm 
        if (this.player) {
            const playerBox = new THREE.Box3().setFromObject(this.player);

            // Hiển thị bounding box để quan sát
            // const helper = new THREE.Box3Helper(playerBox, 0xff0000);
            // this.scene.add(helper);
            
            // // Xóa helper cũ ở frame tiếp theo
            // setTimeout(() => {
            //     this.scene.remove(helper);
            // }, 0);

            this.crash = this.colliders.some(obj => {
                const box = new THREE.Box3().setFromObject(obj);
                const isColliding = playerBox.intersectsBox(box);
                if (isColliding) console.log("Va chạm xảy ra!");
                return isColliding;
            });
        }

        this.switchCamera();
    }

    showGameOver() {
        console.log("Hàm showGameOver được gọi"); // Kiểm tra hàm có được gọi không
        if (this.scoreElement) {
            console.log("Cập nhật scoreElement");
            this.scoreElement.innerHTML = `Game Over. Final Score: ${this.score}`;
        }
        if (this.resetBtn) {
            console.log("Hiển thị nút reset");
            this.resetBtn.style.display = 'inline-block';

        }
    }

    resetGame() {
        // Ẩn nút reset
        if (this.resetBtn) {
            this.resetBtn.style.display = 'none';
        }
        // Reset điểm và trạng thái va chạm
        this.score = 0;
        this.crash = false;
        if (this.scoreElement) {
            this.scoreElement.innerText = 'Score: 0';
        }

        // Xóa các obstacles hiện tại
        this.obstacles.forEach(obj => this.scene.remove(obj));
        this.obstacles = [];
        this.colliders = [];

        // Reset vị trí player về mặc định
        if (this.player) {
            this.player.position.set(0, -25, -20);
        }

        this.clock.start();

        // Tiếp tục chạy lại animation
        this.animate();
    }
  
    // Hàm tạo vật cản 
    spawnRock() {
        if (!this.rockModel) {
            console.warn("Rock model chưa load xong");
            return;
        }

        const OBSTACLE_WIDTH = 50;
        const minX = -250 + OBSTACLE_WIDTH / 2;
        const maxX = 250 - OBSTACLE_WIDTH / 2;

        const rock = this.rockModel.clone(true);
        rock.position.set(
            THREE.MathUtils.randFloat(minX, maxX),
            0,
            -500
        );

        rock.scale.set(this.rockScale, this.rockScale, this.rockScale);

        this.scene.add(rock);
        this.obstacles.push(rock);
        this.colliders.push(rock);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});



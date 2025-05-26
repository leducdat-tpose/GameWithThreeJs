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
        this.menuBtn = document.getElementById('menu-btn');  // Tham chiếu nút menu
        this.lastScoreUpdateTime = 0;

        this.player = null;  // Đối tượng người chơi
        this.vehicleType = null; // Loại xe
        this.rockModel = null;  // Vật cản
        this.obstacles = [];  // Danh sách vật cản
        this.colliders = [];  // Danh sách va chạm
        this.crash = false;
        this.gameInitialized = false; // Theo dõi trạng thái khởi tạo
        this.animationId = null; // Để quản lý animation loop

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

        // Thêm sự kiện cho nút menu
        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => {
                this.menuGame();
            });
        }

        // Thêm sự kiện cho nút "C" để chuyển đổi góc nhìn
        document.addEventListener("keydown", (event) => {
            if ((event.key === "C" || event.key === "c")) {
                this.vision = this.vision === 3 ? 1 : 3;
            }
        });

        // Chờ người dùng chọn xe
        this.selectPlayer((vehicleType) => {
            this.loadPlayer(vehicleType);
            this.init();  // Khởi tạo các thành phần sau khi chọn xe
        });
    }

    init() {
        // Chỉ khởi tạo renderer một lần
        if (!this.gameInitialized) {
            this.initCamera();
            this.initRenderer();
            this.initControls();
            this.gameInitialized = true;
        } else {
            // Reset camera về vị trí ban đầu
            this.resetCamera();
        }
        
        this.initLights();
        this.initGround();
        this.preloadRockModel();
        this.scoreElement.style.display = 'flex';  // Hiển thị bảng điểm  
        document.getElementById("ThreeJS").style.display = 'flex';
    }

    // Phương thức mới để reset camera
    resetCamera() {
        this.camera.position.set(0, 170, 400);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
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
        this.renderer.setSize(window.innerWidth * 1, window.innerHeight * 1);
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
        // Xóa ánh sáng cũ trước khi thêm mới
        const lightsToRemove = [];
        this.scene.traverse((object) => {
            if (object.isLight) {
                lightsToRemove.push(object);
            }
        });
        lightsToRemove.forEach(light => this.scene.remove(light));

        // Ánh sáng môi trường: rất sáng, màu trắng
        const ambient = new THREE.AmbientLight(0xffffff, 1.5); // tăng intensity lên 1.5
        this.scene.add(ambient);

        // Directional light - ánh sáng chính như mặt trời
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0); // tăng cường độ sáng
        directionalLight.position.set(300, 400, 300);
        directionalLight.target.position.set(0, 0, 0);

        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096;   // nâng độ phân giải shadow cho nét hơn
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 1000;

        directionalLight.shadow.camera.left = -1000;
        directionalLight.shadow.camera.right = 1000;
        directionalLight.shadow.camera.top = 1000;
        directionalLight.shadow.camera.bottom = -1000;

        this.scene.add(directionalLight);
        this.scene.add(directionalLight.target);

        // Thêm 1 điểm sáng để làm sáng các vùng tối hơn
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-200, 200, 200);
        this.scene.add(pointLight);

        // Nếu background của bạn là plane hoặc mesh, bạn nên set vật liệu (material) có emissive hoặc color sáng
        // Ví dụ:
        // this.backgroundMesh.material.emissive = new THREE.Color(0xffffff);
        // this.backgroundMesh.material.emissiveIntensity = 0.7;
    }


    initGround() {
        // Xóa đường cũ nếu có
        if (this.road1) {
            this.scene.remove(this.road1);
            this.road1 = null;
        }
        if (this.road2) {
            this.scene.remove(this.road2);
            this.road2 = null;
        }

        const loader = new GLTFLoader();

        loader.load('./assets/road.glb', (gltf) => {
            this.road1 = gltf.scene.clone();
            this.road2 = gltf.scene.clone();

            // Cài đặt đổ bóng và chỉnh sáng mặt đường
            [this.road1, this.road2].forEach(road => {
                road.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                road.scale.set(150, 150, 150);
            });

            // Đặt vị trí 2 đoạn road nối tiếp nhau theo trục Z
            this.road1.position.set(0, -200, 0);
            this.road2.position.set(0, -200, 3000);

            this.scene.add(this.road1);
            this.scene.add(this.road2);
        });
    }


    // Hai đường biên
    // initBoundaries() {
    //     const mat = new THREE.LineBasicMaterial({ color: 0x66FFFF });
    //     const mkLine = x => {
    //         const pts = [
    //             new THREE.Vector3(x, -1, -3000),
    //             new THREE.Vector3(x + (x > 0 ? 50 : -50), -1, 200)
    //         ];
    //         this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    //     };
    //     mkLine(-250);
    //     mkLine(250);
    // }

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

        // Xóa event listeners cũ để tránh duplicate
        const newCarBtn = carBtn.cloneNode(true);
        const newBusBtn = busBtn.cloneNode(true);
        carBtn.parentNode.replaceChild(newCarBtn, carBtn);
        busBtn.parentNode.replaceChild(newBusBtn, busBtn);

        newCarBtn.addEventListener('click', () => {
            this.vehicleType = 'car';
            selectUI.style.display = 'none';
            if (onSelected) onSelected(this.vehicleType);
        });

        newBusBtn.addEventListener('click', () => {
            this.vehicleType = 'bus';
            selectUI.style.display = 'none';
            if (onSelected) onSelected(this.vehicleType);
        });
    }


    // Tải model người chơi (car)
    loadPlayer(vehicleType) {
        // Xóa player cũ nếu có
        if (this.player) {
            this.scene.remove(this.player);
            this.player = null;
        }

        let modelPath = '';

        if (vehicleType === 'car') {
            modelPath = './assets/CAR.glb';
            this.loader.load(modelPath, gltf => {
            this.player = gltf.scene;
            this.player.scale.set(0.25, 0.25, 0.25);
            this.player.position.set(0, -30, -20);
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
            this.player.position.set(0, -30, -20);
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

        // đường đi
        if (this.road1 && this.road2) {

            this.road1.position.z += this.rockSpeed;
            this.road2.position.z += this.rockSpeed;

            const resetZ = 0;       
            const roadLength = 3000; 

            if (this.road1.position.z > resetZ) {
                this.road1.position.z = this.road2.position.z - roadLength;
            }

            if (this.road2.position.z > resetZ) {
                this.road2.position.z = this.road1.position.z - roadLength;
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
        if (this.rockModel && Math.random() < 0.03 && this.obstacles.length < 10) {
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
        if (this.menuBtn) {
            console.log("Hiển thị nút menu");
            this.menuBtn.style.display = 'inline-block';
        }
    }

    resetGame() {
        // Dừng animation loop hiện tại
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Ẩn nút reset và menu
        if (this.resetBtn) {
            this.resetBtn.style.display = 'none';
        }
        if (this.menuBtn) {
            this.menuBtn.style.display = 'none';
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

    menuGame() {
        // Dừng animation loop hiện tại
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Ẩn các nút và scoreboard
        if (this.menuBtn) {
            this.menuBtn.style.display = 'none';
        }
        if (this.resetBtn) {
            this.resetBtn.style.display = 'none';
        }
        if (this.scoreElement) {
            this.scoreElement.style.display = 'none';
        }

        // Reset tất cả trạng thái game
        this.score = 0;
        this.crash = false;
        this.lastScoreUpdateTime = 0;
        document.getElementById("ThreeJS").style.display = 'none';

        // Xóa tất cả obstacles
        this.obstacles.forEach(obj => this.scene.remove(obj));
        this.obstacles = [];
        this.colliders = [];

        // Hiển thị lại menu chọn xe
        const selectUI = document.getElementById('select-car');
        selectUI.style.display = 'flex';

        // Cho phép người chơi chọn xe lại
        this.selectPlayer((vehicleType) => {
            this.vehicleType = vehicleType;
            this.loadPlayer(vehicleType);
            this.init();  // Khởi tạo lại game với xe mới
        });
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

        const minScale = this.rockScale * 0.5;
        const maxScale = this.rockScale * 3;
        const randomScale = THREE.MathUtils.randFloat(minScale, maxScale);

        rock.scale.set(randomScale, randomScale, randomScale);

        const baseY = -30;
        const baseScale = this.rockScale;
        rock.position.y = baseY - (baseScale - randomScale) * 0.5;

        rock.position.x = THREE.MathUtils.randFloat(minX, maxX);
        rock.position.z = -3000;

        this.scene.add(rock);
        this.obstacles.push(rock);
        this.colliders.push(rock);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
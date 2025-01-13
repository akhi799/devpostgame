import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import * as CANNON from 'cannon-es';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Set initial camera position within the boundary
camera.position.set(0, 10, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(100, 300, 100);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
scene.add(sunLight);

// Basketball court
const courtGeometry = new THREE.PlaneGeometry(100, 60);
const courtMaterial = new THREE.MeshStandardMaterial({ color: 0x006400 });
const court = new THREE.Mesh(courtGeometry, courtMaterial);
court.rotation.x = -Math.PI / 2;
court.receiveShadow = true;
scene.add(court);

// Basketball hoop
const hoopMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const backboardGeometry = new THREE.BoxGeometry(2, 10, 0.2);
const backboard = new THREE.Mesh(backboardGeometry, hoopMaterial);
backboard.position.set(0, 20, -28);
backboard.castShadow = true;
scene.add(backboard);

const rimGeometry = new THREE.TorusGeometry(3, 0.2, 16, 100);
const rim = new THREE.Mesh(rimGeometry, hoopMaterial);
rim.position.set(0, 16, -27);
rim.rotation.x = Math.PI / 2;
rim.castShadow = true;
scene.add(rim);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Ground physics
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Basketball physics
const ballShape = new CANNON.Sphere(2);
const ballBody = new CANNON.Body({
  mass: 5,
  shape: ballShape,
  position: new CANNON.Vec3(0, 4, 0),
});
world.addBody(ballBody);

// Basketball mesh
const ballGeometry = new THREE.SphereGeometry(2, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.castShadow = true;
scene.add(ball);

// Boundary walls
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
const wallHeight = 20;
const wallThickness = 2;

// Left wall
const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 60);
const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
leftWall.position.set(-50.5, wallHeight / 2, 0);
leftWall.castShadow = true;
scene.add(leftWall);

// Right wall
const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 60);
const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
rightWall.position.set(50.5, wallHeight / 2, 0);
rightWall.castShadow = true;
scene.add(rightWall);

// Front wall
const frontWallGeometry = new THREE.BoxGeometry(100, wallHeight, wallThickness);
const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
frontWall.position.set(0, wallHeight / 2, 30.5);
frontWall.castShadow = true;
scene.add(frontWall);

// Back wall
const backWallGeometry = new THREE.BoxGeometry(100, wallHeight, wallThickness);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.set(0, wallHeight / 2, -30.5);
backWall.castShadow = true;
scene.add(backWall);

// Player controls setup
const controls = new PointerLockControls(camera, document.body);
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Click to start
document.addEventListener('click', function() {
  controls.lock();
});

// Lock/unlock controls
controls.addEventListener('lock', function() {
  document.getElementById('instructions').style.display = 'none';
});

controls.addEventListener('unlock', function() {
  document.getElementById('instructions').style.display = 'block';
});

// Movement controls
document.addEventListener('keydown', function(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = true;
      break;
    case 'Space':
      if (canJump) {
        velocity.y += 350;
        canJump = false;
      }
      break;
    case 'KeyF': // Press 'F' to throw the ball
      throwBall();
      break;
  }
});

// Stop movement when keys are released
document.addEventListener('keyup', function(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = false;
      break;
  }
});

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Function to throw the ball
function throwBall() {
  const force = new CANNON.Vec3(0, 20, -50);
  ballBody.applyImpulse(force, ballBody.position);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked) {
    const delta = 0.1;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // Add gravity

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    // Calculate new position
    const newPosition = camera.position.clone();
    newPosition.x -= velocity.x * delta;
    newPosition.z -= velocity.z * delta;

    // Check boundaries
    if (newPosition.x > -48 && newPosition.x < 48 && newPosition.z > -28 && newPosition.z < 28) {
      controls.moveRight(-velocity.x * delta);
      controls.moveForward(-velocity.z * delta);
    } else {
      // Reset velocity if hitting the boundary
      velocity. HEx = 0;
      velocity.z = 0;
    }

    camera.position.y += (velocity.y * delta); // Apply gravity

    if (camera.position.y < 10) {
      velocity.y = 0;
      camera.position.y = 10;
      canJump = true;
    }
  }

  // Update physics
  world.step(1 / 60);

  // Update ball position
  ball.position.copy(ballBody.position);
  ball.quaternion.copy(ballBody.quaternion);

  renderer.render(scene, camera);
}

// Start animation
animate();
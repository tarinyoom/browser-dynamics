import * as THREE from 'three';

// Set up renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000); // Set background to black
document.body.appendChild(renderer.domElement);

// Set up scene
const scene = new THREE.Scene();

// Set up camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 5;

// Add a light
const light2 = new THREE.AmbientLight(0xaaaaff, 0.3);
scene.add(light2);
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// Create a white sphere geometry
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Create a small sphere geometry
const geometry2 = new THREE.SphereGeometry(0.1, 16, 16);
const material2 = new THREE.MeshStandardMaterial({ color: 0x888888});
const sphere2 = new THREE.Mesh(geometry2, material2);
sphere2.position.set(1.0, 0.0, 0.0);
scene.add(sphere2);

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

// index.ts

import * as THREE from 'three';
import { step } from './step'; 
import { createRenderer, createCamera, createScene, createParticles } from './render';

// Simulation parameters
const NUM_PARTICLES = 1000;
const DIM = 3;

const positions = new Float32Array(NUM_PARTICLES * DIM);
const velocities = new Float32Array(NUM_PARTICLES * DIM);

initSimulation(positions, velocities);

let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let particles: THREE.Points;

function init() {
  const container = document.getElementById('app');
  if (!container) throw new Error("Missing #app container");

  renderer = createRenderer(container);
  camera = createCamera(container.clientWidth / container.clientHeight);
  scene = createScene();

  particles = createParticles(positions);
  scene.add(particles);

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  animate();
}

const FIXED_DELTA = 1 / 60;
const MAX_STEPS = 5;

let accumulator = 0;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  let frameTime = clock.getDelta();
  accumulator += frameTime;

  // If accumulator is too large, step physics up to MAX_STEPS forward
  let steps = 0;
  while (accumulator >= FIXED_DELTA && steps < MAX_STEPS) {
    step(positions, velocities); // Mutates positions and velocities in-place
    accumulator -= FIXED_DELTA;
    steps++;
  }

  const geometry = particles.geometry as THREE.BufferGeometry;
  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  posAttr.copyArray(positions); // Efficient in-place copy
  posAttr.needsUpdate = true;

  renderer.render(scene, camera);
}

function initSimulation(pos: Float32Array, vel: Float32Array) {
  for (let i = 0; i < NUM_PARTICLES; i++) {
    pos[i * 3 + 0] = (Math.random() - 0.5) * 2;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 2;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 2;

    vel[i * 3 + 0] = 0;
    vel[i * 3 + 1] = 0;
    vel[i * 3 + 2] = 0;
  }
}

init();


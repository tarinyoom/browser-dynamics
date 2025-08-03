import * as THREE from 'three';
import { TIMESTEP, MAX_TIMESTEPS_PER_FRAME, NUM_PARTICLES, DIM } from './constants';
import { randomize, step } from './simulation'; 
import { createRenderer, createCamera, createScene, createParticles } from './render';
import { isDev } from './env';

function createModel(): Model {
  const positions = new Float32Array(NUM_PARTICLES * DIM);
  const velocities = new Float32Array(NUM_PARTICLES * DIM);
  return { positions, velocities };
}

let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let particles: THREE.Points;

function init() {
  const container = document.getElementById('app');
  if (!container) throw new Error("Missing #app container");

  const model = createModel();

  renderer = createRenderer(container, isDev());
  camera = createCamera(container.clientWidth / container.clientHeight);
  scene = createScene();

  particles = createParticles(model.positions);
  randomize(model);
  scene.add(particles);

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  makeAnimation(model)();
}

let accumulator = 0;
const clock = new THREE.Clock();

function drawFrame(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, positions: Float32Array) {
  const geometry = particles.geometry as THREE.BufferGeometry;
  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  posAttr.copyArray(positions);
  posAttr.needsUpdate = true;
  renderer.render(scene, camera);
  if (isDev()) {
    console.log(`Rendered frame with ${positions.length / 3} particles`);
  }
}
function makeAnimation(model: Model) {
  const animation = () => {
    requestAnimationFrame(animation);

    let frameTime = clock.getDelta();
    accumulator += frameTime;

    // If accumulator is too large, step physics up to MAX_STEPS forward
    let steps = 0;
    while (accumulator >= TIMESTEP && steps < MAX_TIMESTEPS_PER_FRAME) {
      step(model.positions, model.velocities); // Mutates positions and velocities in-place
      accumulator -= TIMESTEP;
      steps++;
    }

    drawFrame(renderer, scene, camera, model.positions);
  }
  return animation;
}

init();


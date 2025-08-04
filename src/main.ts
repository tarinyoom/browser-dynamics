import * as THREE from 'three';
import { globals } from './constants';
import { randomize, step } from './simulation'; 
import { createRenderer, createCamera, createScene, createParticles } from './render';
import { isDev } from './env';

function createArena(): Arena {
  const positions = new Float32Array(globals.numParticles * globals.dim);
  const velocities = new Float32Array(globals.numParticles * globals.dim);
  return { positions, velocities };
}

let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let particles: THREE.Points;

function init() {
  const container = document.getElementById('app');
  if (!container) throw new Error("Missing #app container");

  const arena = createArena();

  renderer = createRenderer(container, isDev());
  camera = createCamera(container.clientWidth / container.clientHeight);
  scene = createScene();

  particles = createParticles(arena.positions);
  randomize(arena);
  scene.add(particles);

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  makeAnimation(arena)();
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

function makeAnimation(arena: Arena) {
  const animation = () => {
    requestAnimationFrame(animation);

    let frameTime = clock.getDelta();
    accumulator += frameTime;

    // If accumulator is too large, step physics up to MAX_STEPS forward
    let steps = 0;
    while (accumulator >= globals.timestep && steps < globals.maxTimestepsPerFrame) {
      step(arena);
      accumulator -= globals.timestep;
      steps++;
    }

    drawFrame(renderer, scene, camera, arena.positions);
  }
  return animation;
}

init();

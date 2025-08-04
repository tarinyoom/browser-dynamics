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

function createView(container: HTMLElement): View {
  const renderer = createRenderer(container, isDev());
  const camera = createCamera(container.clientWidth / container.clientHeight);
  const scene = createScene();
  const arena = createArena();
  const particles = createParticles(arena.positions);

  scene.add(particles);

  return { renderer, camera, scene, particles };
}

function init() {
  const container = document.getElementById('app');
  if (!container) throw new Error("Missing #app container");

  const view = createView(container);
  const arena = createArena();

  randomize(arena);

  window.addEventListener('resize', () => {
    view.camera.aspect = container.clientWidth / container.clientHeight;
    view.camera.updateProjectionMatrix();
    view.renderer.setSize(container.clientWidth, container.clientHeight);
  });

  makeAnimation(view, arena)();
}

let accumulator = 0;
const clock = new THREE.Clock();

function drawFrame(view: View, positions: Float32Array) {
  const geometry = view.particles.geometry as THREE.BufferGeometry;
  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  posAttr.copyArray(positions);
  posAttr.needsUpdate = true;
  view.renderer.render(view.scene, view.camera);
  if (isDev()) {
    console.log(`Rendered frame with ${positions.length / 3} particles`);
  }
}

function makeAnimation(view: View, arena: Arena) {
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

    drawFrame(view, arena.positions);
  }
  return animation;
}

init();

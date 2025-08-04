import * as THREE from 'three';
import { globals } from './constants';
import { randomize, step } from './simulation'; 
import { createView, drawFrame } from './view';
import { isDev } from './env';

function createArena(): Arena {
  const positions = new Float32Array(globals.numParticles * globals.dim);
  const velocities = new Float32Array(globals.numParticles * globals.dim);
  return { positions, velocities };
}

function init() {
  const container = document.getElementById('app');
  if (!container) throw new Error("Missing #app container");

  const view = createView(container, isDev());
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

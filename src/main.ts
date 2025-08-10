import { globals } from './constants';
import { randomize, step } from './simulation'; 
import { createView, drawFrame } from './view';
import { isDev } from './env';
import { computeGrid } from './spatial-hash';

function createArena(): Arena {
  const positions = new Float32Array(globals.numParticles * 3);
  const velocities = new Float32Array(globals.numParticles * 3);
  const densities = new Float32Array(globals.numParticles);
  const extents = [[globals.boxMin, globals.boxMax], [globals.boxMin, globals.boxMax], [0.0, 0.0]];
  const grid = computeGrid(extents, globals.smoothingRadius);
  const nCells = grid.count.reduce((a, b) => a * b, 1);
  const cellContents: number[][] = Array.from({ length: nCells }, () => []);

  return { positions, velocities, densities, grid, cellContents };
}

function makeAnimation(view: View, arena: Arena) {
  let accumulator = 0;

  const animation = () => {
    requestAnimationFrame(animation);

    let frameTime = view.clock.getDelta();
    accumulator += frameTime;

    let steps = 0;
    while (accumulator >= globals.timestep && steps < globals.maxTimestepsPerFrame) {
      step(arena);
      accumulator -= globals.timestep;
      steps++;
    }

    drawFrame(view, arena.positions, arena.densities);
  }
  return animation;
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

init();

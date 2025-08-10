import { globals } from './constants';
import { initializeArena, step } from './simulation'; 
import { createView, drawFrame } from './view';
import { isDev } from './env';

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
  const arena = initializeArena();

  window.addEventListener('resize', () => {
    view.camera.aspect = container.clientWidth / container.clientHeight;
    view.camera.updateProjectionMatrix();
    view.renderer.setSize(container.clientWidth, container.clientHeight);
  });

  makeAnimation(view, arena)();
}

init();

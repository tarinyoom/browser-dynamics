import { initializeArena, step } from './simulation'; 
import { createView, drawFrame } from './view';
import { isDev } from './env';

function makeAnimation(view: View, arena: Arena) {
  const animation = () => {
    try {
      step(arena);
      drawFrame(view, arena.positions, arena.densities);
      requestAnimationFrame(animation);
    } catch (err) {
      console.error("Animation stopped due to error:", err);
    }
  };
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

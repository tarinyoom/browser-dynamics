import { initializeArena, step } from './simulation'; 
import { createView, drawFrame } from './view';
import { isDev } from './env';
import { debug } from './constants';

function makeAnimation(view: View, arena: Arena) {

  let nFrames = debug.pauseAfter;
  const animation = isDev() ?
    () => {
      try {
        if (nFrames-- > 0) {
          drawFrame(view, arena.positions, arena.pressures);
          step(arena);
          requestAnimationFrame(animation);
        }
      } catch (err) {
        console.error("Animation stopped due to error:", err);
      }
    } :
    () => {
      try {
        drawFrame(view, arena.positions, arena.pressures);
        step(arena);
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

  const view = createView(container, isDev() ? debug.recordUntil : undefined);
  const arena = initializeArena();

  window.addEventListener('resize', () => {
    view.camera.aspect = container.clientWidth / container.clientHeight;
    view.camera.updateProjectionMatrix();
    view.renderer.setSize(container.clientWidth, container.clientHeight);
  });

  makeAnimation(view, arena)();
}

init();

import { initializeArena, step } from './simulation'; 
import { createView, drawFrame } from './view';
import { isDev } from './env';
import { debug, globals } from './constants';
import init, { shout, /* memory, etc. */ } from "../crates/hello-world/pkg/hello_wasm.js";
import wasmUrl from "../crates/hello-world/pkg/hello_wasm_bg.wasm?url"; // <-- key line

await init(wasmUrl);

console.log(shout("adam"));

function createScalarMapper(colorMode: 'pressure' | 'density') {
  switch (colorMode) {
    case 'pressure':
      return (arena: Arena) => {
        return { scalars: arena.pressures, minValue: 0.0, maxValue: 50.0 };
      };
    case 'density':
      const referenceDensity = 2.0 / (globals.boxMax - globals.boxMin) ** 2;
      return (arena: Arena) => {
        return { scalars: arena.densities, minValue: 0, maxValue: 2 * referenceDensity };
      };
  }
}

function makeAnimation(view: View, arena: Arena) {
  const getScalarsAndRange = createScalarMapper(debug.colorMode);

  let nFrames = debug.pauseAfter;
  const animation = isDev() ?
    () => {
      try {
        if (nFrames-- > 0) {
          const { scalars, minValue, maxValue } = getScalarsAndRange(arena);
          drawFrame(view, arena.positions, scalars, minValue, maxValue);
          step(arena);
          requestAnimationFrame(animation);
        }
      } catch (err) {
        console.error("Animation stopped due to error:", err);
      }
    } :
    () => {
      try {
        const { scalars, minValue, maxValue } = getScalarsAndRange(arena);
        drawFrame(view, arena.positions, scalars, minValue, maxValue);
        step(arena);
        requestAnimationFrame(animation);
      } catch (err) {
        console.error("Animation stopped due to error:", err);
      }
    };
  return animation;
}

(() => {
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
})();

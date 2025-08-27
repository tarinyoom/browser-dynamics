import { initializeArena, step } from './simulation'; 
import { createView, drawFrame } from './view';
import { isDev } from './env';
import { debug, globals } from './constants';
import init, { arena_len, arena_ptr } from "../crates/sph/pkg/sph.js";
import wasmUrl from "../crates/sph/pkg/sph_bg.wasm?url";

const wasm = await init(wasmUrl);

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

function makeArenaView(): Float32Array {
  const ptr = arena_ptr();             // byte offset into wasm memory
  const len = arena_len();             // number of f32 elements
  if ((ptr & 3) !== 0) throw new Error("misaligned f32 pointer");
  return new Float32Array(wasm.memory.buffer, ptr, len);
}

function makeAnimation(view: View, arena: Arena) {
  const getScalarsAndRange = createScalarMapper(debug.colorMode);

  const ar = makeArenaView();
  console.log(ar);
  
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

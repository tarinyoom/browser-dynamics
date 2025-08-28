import { initializeArena, step } from './simulation'; 
import { createView, drawFrame } from './view';
import { isDev } from './env';
import { debug, globals } from './constants';

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

function nonZeroViewport() {
  const vv = window.visualViewport;
  const w = vv ? Math.floor(vv.width) : window.innerWidth;
  const h = vv ? Math.floor(vv.height) : window.innerHeight;
  return w > 2 && h > 2;
}

async function boot() {

  if (document.visibilityState !== 'visible') {
    await new Promise<void>(r => document.addEventListener('visibilitychange', function once() {
      if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', once); r(); }
    }));
  }

  if (!nonZeroViewport()) {
    await new Promise<void>(r => {
      const ro = new ResizeObserver(() => { if (nonZeroViewport()) { ro.disconnect(); r(); } });
      ro.observe(document.documentElement);
    });
  }

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

window.addEventListener('pageshow', boot, { once: true });

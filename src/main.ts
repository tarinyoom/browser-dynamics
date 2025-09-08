import { initializeArena, step } from './simulation'; 
import { createView, drawFrame } from './view';
import { isDev } from './env';
import { debug, globals } from './constants';
import init, { arena_ptr, InitOutput, update } from "../crates/sph/pkg/sph.js";
import wasmUrl from "../crates/sph/pkg/sph_bg.wasm?url";

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

function makeAnimation(view: View, arena: Arena, wasm: InitOutput) {
  const getScalarsAndRange = createScalarMapper(debug.colorMode);

  // Start with invalid state to force initial array creation
  let currentPtr = -1;
  let currentBuffer: ArrayBuffer | null = null;
  let wasm_x: Float32Array, wasm_y: Float32Array, wasm_z: Float32Array, wasm_rho: Float32Array;
  
  // Function to create arrays from current WASM memory
  function createWasmArrays(ptr: number, buffer: ArrayBuffer) {
    if ((ptr & 3) !== 0) throw new Error("misaligned f32 pointer");
    
    wasm_x = new Float32Array(buffer, ptr, globals.numParticles);
    wasm_y = new Float32Array(buffer, ptr + globals.numParticles * 4, globals.numParticles);
    wasm_z = new Float32Array(buffer, ptr + globals.numParticles * 8, globals.numParticles);
    wasm_rho = new Float32Array(buffer, ptr + globals.numParticles * 48, globals.numParticles);
  }
  
  // Function to detect discrepancies and update arrays
  function updateWasmArraysIfNeeded() {
    const newPtr = arena_ptr();
    const newBuffer = wasm.memory.buffer;
    
    // Check if pointer or buffer has changed
    if (newPtr !== currentPtr || newBuffer !== currentBuffer) {
      console.log(`WASM memory discrepancy detected: ptr ${currentPtr} -> ${newPtr}, buffer changed: ${newBuffer !== currentBuffer}`);
      
      currentPtr = newPtr;
      currentBuffer = newBuffer;
      createWasmArrays(currentPtr, currentBuffer);
    }
  }
  
  let nFrames = debug.pauseAfter;
  const animation = () => {
    try {
      // Update WASM arrays if needed before any other computation
      updateWasmArraysIfNeeded();
      
      if (isDev() && nFrames-- <= 0) return;
      
      const { scalars, minValue, maxValue } = getScalarsAndRange(arena);
      if (debug.backendMode === 'wasm') {
        update();
        drawFrame(view, wasm_x, wasm_y, wasm_z, wasm_rho, 0.0, 0.5);
      } else {
        drawFrame(view, arena.px, arena.py, arena.pz, scalars, minValue, maxValue);
        step(arena);
      }
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

  const wasm = await init(wasmUrl);

  const container = document.getElementById('app');
  if (!container) throw new Error("Missing #app container");

  const view = createView(container, isDev() ? debug.recordUntil : undefined);
  const arena = initializeArena();

  window.addEventListener('resize', () => {
    view.camera.aspect = container.clientWidth / container.clientHeight;
    view.camera.updateProjectionMatrix();
    view.renderer.setSize(container.clientWidth, container.clientHeight);
  });

  makeAnimation(view, arena, wasm)();
}

window.addEventListener('pageshow', boot, { once: true });

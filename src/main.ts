import { createView, drawFrame } from './view';
import { isDev } from './env';
import { debug } from './constants';
import init, { arena_ptr, InitOutput, update } from "../crates/wasm/pkg/wasm.js";
import wasmUrl from "../crates/wasm/pkg/wasm_bg.wasm?url";

function createScalarMapper(colorMode: 'pressure' | 'density') {
  switch (colorMode) {
    case 'pressure':
      return () => {
        return { minValue: 0.0, maxValue: 0.5 };
      };
    case 'density':
      const referenceDensity = 0.39;
      return () => {
        return { minValue: 0, maxValue: 2 * referenceDensity };
      };
  }
}

function makeAnimation(view: View, wasm: InitOutput) {
  const getScalarsAndRange = createScalarMapper(debug.colorMode);

  // Start with invalid state to force initial array creation
  let currentPtr = -1;
  let currentBuffer: ArrayBuffer | null = null;
  let wasm_x: Float32Array, wasm_y: Float32Array, wasm_z: Float32Array, wasm_rho: Float32Array;
  
  // Function to create arrays from current WASM memory
  function createWasmArrays(ptr: number, buffer: ArrayBuffer, numParticles: number) {
    if ((ptr & 3) !== 0) throw new Error("misaligned f32 pointer");
    
    wasm_x = new Float32Array(buffer, ptr, numParticles);
    wasm_y = new Float32Array(buffer, ptr + numParticles * 4, numParticles);
    wasm_z = new Float32Array(buffer, ptr + numParticles * 8, numParticles);
    wasm_rho = new Float32Array(buffer, ptr + numParticles * 48, numParticles);
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
      createWasmArrays(currentPtr, currentBuffer, 1000);
    }
  }
  
  let nFrames = debug.pauseAfter;
  const animation = () => {
    try {
      // Update WASM arrays if needed before any other computation
      updateWasmArraysIfNeeded();
      
      if (isDev() && nFrames-- <= 0) return;
      
      const { minValue, maxValue } = getScalarsAndRange();
      update();
      drawFrame(view, wasm_x, wasm_y, wasm_z, wasm_rho, minValue, maxValue);
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

  window.addEventListener('resize', () => {
    view.camera.aspect = container.clientWidth / container.clientHeight;
    view.camera.updateProjectionMatrix();
    view.renderer.setSize(container.clientWidth, container.clientHeight);
  });

  makeAnimation(view, wasm)();
}

window.addEventListener('pageshow', boot, { once: true });

import init, { draw_checkerboard } from "../crates/wasm/pkg/wasm.js";
import wasmUrl from "../crates/wasm/pkg/wasm_bg.wasm?url";

async function boot() {
  await init(wasmUrl);

  const container = document.getElementById('app');
  if (!container) throw new Error("Missing #app container");

  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  draw_checkerboard(canvas);

  window.addEventListener('resize', () => {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    draw_checkerboard(canvas);
  });
}

window.addEventListener('pageshow', boot, { once: true });

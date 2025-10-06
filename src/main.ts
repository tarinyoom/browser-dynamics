function drawCheckerboard(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context');
  }

  const squareSize = 50;
  const cols = Math.ceil(canvas.width / squareSize);
  const rows = Math.ceil(canvas.height / squareSize);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#000000' : '#ffffff';
      ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
    }
  }
}

async function boot() {
  const container = document.getElementById('app');
  if (!container) throw new Error("Missing #app container");

  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  drawCheckerboard(canvas);

  window.addEventListener('resize', () => {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawCheckerboard(canvas);
  });
}

window.addEventListener('pageshow', boot, { once: true });

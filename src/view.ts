import * as THREE from 'three';

function recordAndSave(canvas: HTMLCanvasElement, fps: number, duration: number): void {
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sph.webm";
    a.click();
  };

  recorder.start();
  setTimeout(() => recorder.stop(), duration);
}

function createRenderer(container: HTMLElement, recordUntil: number | undefined): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  if (recordUntil) {
      const canvas = renderer.domElement;
      recordAndSave(canvas, 60, recordUntil);
  }

  return renderer;
}

function createCamera(aspectRatio: number): THREE.PerspectiveCamera {
  const fov = 45;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
  camera.position.set(0, 0, 5);
  return camera;
}

function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);

  return scene;
}

function createParticles(count: number): THREE.Points {
  const positions = new Float32Array(count * 3); 
  const colors = new Float32Array(count * 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

export function createView(container: HTMLElement, recordUntil: number | undefined): View {
  const renderer = createRenderer(container, recordUntil);
  const camera = createCamera(container.clientWidth / container.clientHeight);
  const scene = createScene();
  const particles = createParticles(1000); // hardcoded for now, can be made configurable later
  const clock = new THREE.Clock();

  scene.add(particles);

  return { renderer, camera, scene, particles, clock };
}

export function drawFrame(view: View, px: Float32Array, py: Float32Array, pz: Float32Array, scalars: Float32Array, minValue: number, maxValue: number): void {
  const geometry = view.particles.geometry as THREE.BufferGeometry;

  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  const posArray = posAttr.array as Float32Array;
  
  for (let i = 0; i < px.length; i++) {
    posArray[i * 3] = px[i];
    posArray[i * 3 + 1] = py[i];
    posArray[i * 3 + 2] = pz[i];
  }
  
  posAttr.needsUpdate = true;

  const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
  const colors = colorAttr.array as Float32Array;

  const range = maxValue - minValue;
  let r, g, b;

  for (let i = 0; i < scalars.length; i++) {
    // Normalize scalar to [0, 1] range
    const t = range > 0 ? Math.max(0, Math.min(1, (scalars[i] - minValue) / range)) : 0;
    console.log(scalars[i], t);

    // [0, 1] -> [cold, hot] color mapping
    if (t < 0.5) {
      r = 0.0;
      g = t;
      b = 1 - 2 * t;
    } else {
      r = 2 * (t - 0.5);
      g = 1.0 - t;
      b = 0.0;
    }
 
    colors[3 * i]     = r;
    colors[3 * i + 1] = g;
    colors[3 * i + 2] = b;
  }

  colorAttr.needsUpdate = true;

  view.renderer.render(view.scene, view.camera);
}


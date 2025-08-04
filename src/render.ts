import * as THREE from 'three';
import { globals } from './constants';

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

function createRenderer(container: HTMLElement, dev: boolean): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  if (dev) {
      const canvas = renderer.domElement;
      recordAndSave(canvas, 60, 5000); // Record at 60fps for 5 seconds
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
  const positions = new Float32Array(count * 3); // initially all zeros

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x88ccff,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

export function createView(container: HTMLElement, dev: boolean): View {
  const renderer = createRenderer(container, dev);
  const camera = createCamera(container.clientWidth / container.clientHeight);
  const scene = createScene();
  const particles = createParticles(globals.numParticles);

  scene.add(particles);

  return { renderer, camera, scene, particles };
}

export function drawFrame(view: View, positions: Float32Array) {
  const geometry = view.particles.geometry as THREE.BufferGeometry;
  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  posAttr.copyArray(positions);
  posAttr.needsUpdate = true;
  view.renderer.render(view.scene, view.camera);
}


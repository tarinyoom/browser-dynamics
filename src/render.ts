import * as THREE from 'three';

/**
 * Sets up the WebGLRenderer and appends it to the container.
 */
export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  return renderer;
}

/**
 * Creates a perspective camera with standard settings.
 */
export function createCamera(aspectRatio: number): THREE.PerspectiveCamera {
  const fov = 45;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
  camera.position.set(0, 0, 5);
  return camera;
}

/**
 * Creates a basic scene with ambient light and background.
 */
export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111122);

  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);

  return scene;
}

/**
 * Creates a THREE.Points object from a flat Float32Array of XYZ positions.
 * Makes a shallow copy of positions to isolate GPU state from CPU simulation.
 */
export function createParticles(positions: Float32Array): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions.slice(), 3) // decouple GPU buffer
  );

  const material = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x88ccff,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}


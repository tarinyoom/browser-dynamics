import { WebGLRenderer, PerspectiveCamera, Scene, Points, Clock } from 'three';

export {};

declare global {

  interface Grid {
    count: number[];
    offset: number[];
  }

  interface Arena {
    positions: Float32Array;
    velocities: Float32Array;
    densities: Float32Array;
    grid: Grid;
    cellContents: number[][]; // index-based lists
  }

  interface CalculationParameters {
    timestep: number;
    maxTimestepsPerFrame: number;
    numParticles: number;
    smoothingRadius: number;
    dim: number;
    boxMin: number;
    boxMax: number;
    gravity: number;
  }

  interface View {
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    particles: Points;
    clock: Clock;
  }

}

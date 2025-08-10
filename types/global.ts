import { WebGLRenderer, PerspectiveCamera, Scene, Points, Clock } from 'three';

export {};

declare global {

  interface Arena {
    positions: Float32Array;
    velocities: Float32Array;
    densities: Float32Array;
  }

  interface CalculationParameters {
    timestep: number;
    maxTimestepsPerFrame: number;
    numParticles: number;
    smoothingRadius: number;
    dim: number;
  }

  interface Grid {
    count: number[];
    cellLength: number;
    offset: number[];
  }

  interface View {
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    particles: Points;
    clock: Clock;
  }

}

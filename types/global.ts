import { WebGLRenderer, PerspectiveCamera, Scene, Points, Clock } from 'three';

export {};

declare global {

  interface Grid {
    count: number[];
    offset: number[];
  }

  // Singleton-ish data structure to hold global simulation state
  interface Arena {
    positions: Float32Array;
    velocities: Float32Array;
    acceleration: Float32Array;
    preAcceleration: Float32Array;
    densities: Float32Array;
    pressures: Float32Array;
    grid: Grid;
    cellContents: number[][]; // index-based lists
    pointToCell: number[]; // maps particle index to cell index
    neighbors: number[][]; // neighbor adjacency list for each particle
    particleMass: number;
    invH: number;
    neighborOffsets: number[]; // in grid space

    // Additional derived properties
    invReferenceDensity: number; // inverse of reference density
    taitB: number; // 'B' constant for Tait's equation
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

    taitGamma: number; // exponent for Tait's equation
    taitC: number; // speed of sound in Tait's equation
  }

  interface DebugParameters {
    recordUntil: number;
    pauseAfter: number;
    colorMode: 'pressure' | 'density';
  }

  interface View {
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    particles: Points;
    clock: Clock;
  }

}

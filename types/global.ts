export {};

declare global {

  interface Arena {
    positions: Float32Array;
    velocities: Float32Array;
  }

  interface CalculationParameters {
    timestep: number;
    maxTimestepsPerFrame: number;
    numParticles: number;
    dim: number;
  }

}

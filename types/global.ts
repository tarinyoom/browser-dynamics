export {};

declare global {
  interface Model {
    positions: Float32Array;
    velocities: Float32Array;
  }
}

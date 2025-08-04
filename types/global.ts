export {};

declare global {
  interface Arena {
    positions: Float32Array;
    velocities: Float32Array;
  }
}

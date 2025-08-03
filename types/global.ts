export {};

declare global {
  interface PersistentState {
    positions: Float32Array;
    velocities: Float32Array;
  }
}

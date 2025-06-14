import { TIMESTEP, NUM_PARTICLES, DIM } from './constants';

const ARRAY_SIZE = NUM_PARTICLES * DIM;

export function step(positions: Float32Array, velocities: Float32Array) {
  for (let i = 0; i < ARRAY_SIZE; i++) {
    velocities[i] = velocities[i] -0.001 * positions[i];
    positions[i] = positions[i] + velocities[i] * TIMESTEP;
  }
}

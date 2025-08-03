import { TIMESTEP, NUM_PARTICLES, DIM } from './constants';

const BOX_MIN = -1.6;
const BOX_MAX = 1.6;
const GRAVITY = -1.0;

export function randomize(model: Model) {
  for (let i = 0; i < NUM_PARTICLES; i++) {
    // Initialize positions and velocities randomly
    for (let j = 0; j < DIM; j++) {
      model.positions[i * 3 + j] = (Math.random() - 0.5) * 2;
      model.velocities[i * 3 + j] = (Math.random() - 0.5) * 1;
    }
    // Fill in extra dimensions with zero
    for (let j = DIM; j < 3; j++) {
      model.positions[i * 3 + j] = 0;
      model.velocities[i * 3 + j] = 0;
    }
  }
}

export function step(positions: Float32Array, velocities: Float32Array) {
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const pos = positions.subarray(i * 3, (i + 1) * 3);
    const vel = velocities.subarray(i * 3, (i + 1) * 3);

    // Apply gravity (only y-axis)
    vel[1] += GRAVITY * TIMESTEP;

    // Update position
    pos[0] += vel[0] * TIMESTEP; // x
    pos[1] += vel[1] * TIMESTEP; // y

    // Wall collisions
    for (let j = 0; j < DIM; j++) {
      if (pos[j] < BOX_MIN) {
        pos[j] = BOX_MIN;
        vel[j] *= -1;
      } else if (pos[j] > BOX_MAX) {
        pos[j] = BOX_MAX;
        vel[j] *= -1;
      }
    }
  }
}
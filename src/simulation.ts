import { globals } from './constants';

const BOX_MIN = -1.6;
const BOX_MAX = 1.6;
const GRAVITY = -1.0;

export function randomize(arena: Arena) {
  for (let i = 0; i < globals.numParticles; i++) {

    arena.densities[i] = Math.random();

    for (let j = 0; j < globals.dim; j++) {
      arena.positions[i * 3 + j] = (Math.random() - 0.5) * 2;
      arena.velocities[i * 3 + j] = (Math.random() - 0.5) * 1;
    }

    for (let j = globals.dim; j < 3; j++) {
      arena.positions[i * 3 + j] = 0;
      arena.velocities[i * 3 + j] = 0;
    }
  }
}

export function step(arena: Arena) {

  for (let i = 0; i < globals.numParticles; i++) {
    arena.velocities[i * 3 + 1] += GRAVITY * globals.timestep;
  }

  for (let i = 0; i < globals.numParticles; i++) {
    arena.positions[i * 3] += arena.velocities[i * 3] * globals.timestep;
    arena.positions[i * 3 + 1] += arena.velocities[i * 3 + 1] * globals.timestep;
  }

  for (let i = 0; i < globals.numParticles; i++) {
    const pos = arena.positions.subarray(i * 3, (i + 1) * 3);
    const vel = arena.velocities.subarray(i * 3, (i + 1) * 3);

    for (let j = 0; j < globals.dim; j++) {
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
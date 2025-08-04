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

function resetDensities(arena: Arena) {
  for (let i = 0; i < globals.numParticles; i++) {
    arena.densities[i] = 0;
  }
}

function kernel(r: number): number {
  const h = 0.2;

  const norm = 10 / (7 * Math.PI * h * h);
  const invH = 1.0 / h;

  const q = r * invH;

  if (q >= 2) return 0;
  if (q < 1) {
    return norm * (1 - 1.5 * q * q + 0.75 * q * q * q);
  } else {
    const term = 2 - q;
    return norm * 0.25 * term * term * term;
  }

}

function accumulateDensities(arena: Arena) {

  for (let i = 1; i < globals.numParticles; i++) {
    const dx = arena.positions[i * 3]     - arena.positions[0];
    const dy = arena.positions[i * 3 + 1] - arena.positions[1];
    const dz = arena.positions[i * 3 + 2] - arena.positions[2];

    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    arena.densities[0] += kernel(d) * .005;
  }
}

export function step(arena: Arena) {

  resetDensities(arena);
  accumulateDensities(arena);

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
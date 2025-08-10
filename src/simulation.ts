import { globals } from './constants';
import { computeGrid, populateGrid } from './spatial-hash';

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
  const h = globals.smoothingRadius;

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

  populateGrid(arena.positions, arena.grid, arena.cellContents);
  
  for (let i = 0; i < globals.numParticles; i++) {
    const x = arena.positions[i * 3];
    const y = arena.positions[i * 3 + 1];
    const z = arena.positions[i * 3 + 2];

    const cellX = Math.floor((x - arena.grid.offset[0]) / globals.smoothingRadius);
    const cellY = Math.floor((y - arena.grid.offset[1]) / globals.smoothingRadius);
    const cellZ = Math.floor((z - arena.grid.offset[2]) / globals.smoothingRadius);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nx = cellX + dx;
          const ny = cellY + dy;
          const nz = cellZ + dz;

          if (nx >= 0 && nx < arena.grid.count[0] &&
              ny >= 0 && ny < arena.grid.count[1] &&
              nz >= 0 && nz < arena.grid.count[2]) {
            const neighborIndex = nx + ny * arena.grid.count[0] + nz * arena.grid.count[0] * arena.grid.count[1];
            for (const n of arena.cellContents[neighborIndex]) {
              if (i < n) { // Avoid double counting
                const dx = arena.positions[i * 3]     - arena.positions[n * 3];
                const dy = arena.positions[i * 3 + 1] - arena.positions[n * 3 + 1];
                const dz = arena.positions[i * 3 + 2] - arena.positions[n * 3 + 2];

                const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const density = kernel(d) * 3.0 / globals.numParticles;

                arena.densities[i] += density;
                arena.densities[n] += density;
              }
            }
          }
        }
      }
    }
  }
}

export function step(arena: Arena) {

  resetDensities(arena);
  accumulateDensities(arena);

  for (let i = 0; i < globals.numParticles; i++) {
    arena.velocities[i * 3 + 1] += globals.gravity * globals.timestep;
  }

  for (let i = 0; i < globals.numParticles; i++) {
    arena.positions[i * 3] += arena.velocities[i * 3] * globals.timestep;
    arena.positions[i * 3 + 1] += arena.velocities[i * 3 + 1] * globals.timestep;
  }

  for (let i = 0; i < globals.numParticles; i++) {
    const pos = arena.positions.subarray(i * 3, (i + 1) * 3);
    const vel = arena.velocities.subarray(i * 3, (i + 1) * 3);

    for (let j = 0; j < globals.dim; j++) {
      if (pos[j] < globals.boxMin) {
        pos[j] = globals.boxMin;
        vel[j] *= -1;
      } else if (pos[j] > globals.boxMax) {
        pos[j] = globals.boxMax;
        vel[j] *= -1;
      }
    }
  }
}
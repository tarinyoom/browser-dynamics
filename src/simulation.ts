import { globals } from './constants';
import { computeGrid, populateGrid, hash } from './spatial-hash';

export function initializeArena(): Arena {
  const positions = new Float32Array(globals.numParticles * 3);
  const velocities = new Float32Array(globals.numParticles * 3);
  const densities = new Float32Array(globals.numParticles);
  const extents = [[globals.boxMin, globals.boxMax], [globals.boxMin, globals.boxMax], [0.0, 0.0]];
  const grid = computeGrid(extents, globals.smoothingRadius);
  const nCells = grid.count.reduce((a, b) => a * b, 1);
  const cellContents: number[][] = Array.from({ length: nCells }, () => []);
  const pointToCell = Array.from({ length: globals.numParticles }, () => [0, 0, 0]);
  const invNumParticles = 1.0 / globals.numParticles;
  const invH = 1.0 / globals.smoothingRadius;

  for (let i = 0; i < globals.numParticles; i++) {

    densities[i] = Math.random();

    for (let j = 0; j < globals.dim; j++) {
      positions[i * 3 + j] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + j] = (Math.random() - 0.5) * 1;
    }

    for (let j = globals.dim; j < 3; j++) {
      positions[i * 3 + j] = 0;
      velocities[i * 3 + j] = 0;
    }
  }

  return { positions: positions,
           velocities: velocities,
           densities: densities,
           grid: grid,
           cellContents: cellContents,
           pointToCell: pointToCell,
           invNumParticles: invNumParticles,
           invH: invH
        };
}

function resetDensities(arena: Arena) {
  for (let i = 0; i < globals.numParticles; i++) {
    arena.densities[i] = 0;
  }
}

function kernel(r: number, invH: number): number {
  const norm = 10 * invH * invH / (7 * Math.PI);

  const q = r * invH;

  if (q >= 2) return 0;
  if (q < 1) {
    return norm * (1 - 1.5 * q * q + 0.75 * q * q * q);
  } else {
    const term = 2 - q;
    return norm * 0.25 * term * term * term;
  }

}

function addDensity(arena: Arena, i: number, j: number): void {
    const dx = arena.positions[i * 3] - arena.positions[j * 3];
    const dy = arena.positions[i * 3 + 1] - arena.positions[j * 3 + 1];
    const dz = arena.positions[i * 3 + 2] - arena.positions[j * 3 + 2];

    const r2 = dx * dx + dy * dy + dz * dz;
    if (r2 > globals.smoothingRadius * globals.smoothingRadius) return;

    const d = Math.sqrt(r2);
    const density = kernel(d, arena.invH) * 3.0 * arena.invNumParticles;

    arena.densities[i] += density;
    arena.densities[j] += density;
}

function accumulateDensities(arena: Arena) {

  for (let i = 0; i < globals.numParticles; i++) {
    const cell = arena.pointToCell[i];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nx = cell[0] + dx;
          const ny = cell[1] + dy;
          const nz = cell[2] + dz;

          if (nx < 0 || nx >= arena.grid.count[0] ||
              ny < 0 || ny >= arena.grid.count[1] ||
              nz < 0 || nz >= arena.grid.count[2]) continue;

          const neighborCell = hash(nx, ny, nz, arena.grid);

          for (let n = 0; n < arena.cellContents[neighborCell].length; n++) {
            const j = arena.cellContents[neighborCell][n];
            if (i < j) addDensity(arena, i, j);
          }
        }
      }
    }
  }
}

export function step(arena: Arena) {
  populateGrid(arena.positions, arena.grid, arena.cellContents, arena.pointToCell);
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
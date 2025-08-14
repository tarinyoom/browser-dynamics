import { globals } from './constants';
import { computeGrid, populateGrid } from './spatial-hash';

export function initializeArena(): Arena {
  const positions = new Float32Array(globals.numParticles * 3);
  const velocities = new Float32Array(globals.numParticles * 3);
  const densities = new Float32Array(globals.numParticles);
  const pressures = new Float32Array(globals.numParticles);
  const extents = [[globals.boxMin, globals.boxMax], [globals.boxMin, globals.boxMax], [0.0, 0.0]];
  const grid = computeGrid(extents, globals.smoothingRadius);
  const nCells = grid.count.reduce((a, b) => a * b, 1);
  const cellContents: number[][] = Array.from({ length: nCells }, () => []);
  const pointToCell = new Array(globals.numParticles).fill(0);
  const invNumParticles = 1.0 / globals.numParticles;
  const invH = 1.0 / globals.smoothingRadius;
  const referenceDensity = globals.numParticles / (grid.count[0] * grid.count[1] * grid.count[2]);
  const invReferenceDensity = 1.0 / referenceDensity;
  const taitB = referenceDensity * globals.taitC * globals.taitC / globals.taitGamma;

  // Precompute neighbor offsets for neighboring cells
  const neighborOffsets: number[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
        const offset = dx + dy * grid.count[0];
        neighborOffsets.push(offset);
    }
  }

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
           pressures: pressures,
           grid: grid,
           cellContents: cellContents,
           pointToCell: pointToCell,
           invNumParticles: invNumParticles,
           invH: invH,
           neighborOffsets: neighborOffsets,
           invReferenceDensity: invReferenceDensity,
           taitB: taitB
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

function dKernel(r: number, invH: number): number {
  const norm = 10 * invH * invH / (7 * Math.PI);

  const q = r * invH;

  if (q >= 2) return 0;
  if (q < 1) {
    const ret = norm * (- 3.0 * q + 2.25 * q * q) * invH;
    //console.log(`dKernel: r=${r}, invH=${invH}, q=${q}, ret=${ret}`);
    return ret;
  } else {
    const term = 2 - q;
    const ret = -1.0 * norm * 0.75 * term * term * invH;
    //console.log(`dKernel: r=${r}, invH=${invH}, q=${q}, ret=${ret}`);
    return ret;
  }

}

function addDensity(arena: Arena, i: number, j: number): void {
    const dx = arena.positions[i * 3] - arena.positions[j * 3];
    const dy = arena.positions[i * 3 + 1] - arena.positions[j * 3 + 1];
    const dz = arena.positions[i * 3 + 2] - arena.positions[j * 3 + 2];

    const r2 = dx * dx + dy * dy + dz * dz;

    // Early exit before having to compute square root
    if (r2 > globals.smoothingRadius * globals.smoothingRadius) return;

    const d = Math.sqrt(r2);
    const density = kernel(d, arena.invH) * 3.0 * arena.invNumParticles;

    arena.densities[i] += density;
    arena.densities[j] += density;
}

function accumulateDensities(arena: Arena) {

  for (let i = 0; i < globals.numParticles; i++) {
    const cell = arena.pointToCell[i];

    for (let j = 0; j < 9; j++) {

      // Neighbor cell index does not need to be checked for bounds because of grid padding
      const neighborCell = cell + arena.neighborOffsets[j];

      for (let n = 0; n < arena.cellContents[neighborCell].length; n++) {
        const j = arena.cellContents[neighborCell][n];

        // Only accumulate density if i < j to avoid double counting
        if (i < j) addDensity(arena, i, j);
      }

    }
  }
}

// Using Tait's method for pressure calculation
function computePressures(arena: Arena) {
  for (let i = 0; i < globals.numParticles; i++) {
    const density = arena.densities[i];
    //console.log(`arenaInvReferenceDensity is ${arena.invReferenceDensity}, density is ${density}`);
    const pressure = arena.taitB * (Math.pow(density * arena.invReferenceDensity, globals.taitGamma) - 1);
    //console.log(`Particle ${i} density: ${density}, pressure: ${pressure}`);
    arena.pressures[i] = pressure;
    console.log(`Particle ${i} pressure: ${pressure}, density: ${density}`);
    console.log(`taitB is ${arena.taitB}, invReferenceDensity is ${arena.invReferenceDensity}, taitGamma is ${globals.taitGamma}`);
  }
}

function accelerateAlongPressureGradient(arena: Arena, i: number, j: number): void {
  if (arena.densities[i] <= 0 || arena.densities[j] <= 0) return;

  const dx = arena.positions[i * 3] - arena.positions[j * 3];
  const dy = arena.positions[i * 3 + 1] - arena.positions[j * 3 + 1];
  const dz = arena.positions[i * 3 + 2] - arena.positions[j * 3 + 2];

  const r2 = dx * dx + dy * dy + dz * dz;

  // Early exit before having to compute square root
  if (r2 > globals.smoothingRadius * globals.smoothingRadius) return;

  const d = Math.sqrt(r2);

  if (d < .2 * globals.smoothingRadius) return;

  const rhoisq = arena.densities[i] * arena.densities[i];
  const rhojsq = arena.densities[j] * arena.densities[j];

  // Compute pressure contributions
  const pi = rhoisq > 1e-6 ? arena.pressures[i] / rhoisq : 0;
  const pj = rhojsq > 1e-6 ? arena.pressures[j] / rhojsq : 0;

  //console.log(`pi is ${pi}, pj is ${pj}, rhoisq is ${rhoisq}, rhojsq is ${rhojsq}, arena pressures are ${arena.pressures[i]}, ${arena.pressures[j]}, d is ${d}`);

  const invD = 1.0 / d;

  const dx_normed = dx * invD;
  const dy_normed = dy * invD;
  const dz_normed = dz * invD;

  const scale = dKernel(d, arena.invH) * (pi + pj);

  if (scale > 1) {
    //console.warn(`Scale factor ${scale} exceeds 1`);
  }

  //console.log(`Particle ${i} pressure: ${arena.pressures[i]}, density: ${arena.densities[i]}`);

  // Compute acceleration contribution
  const ax = dx_normed * scale;
  const ay = dy_normed * scale;
  const az = dz_normed * scale;

  // Update velocities
  arena.velocities[i * 3] += ax * globals.timestep;
  arena.velocities[i * 3 + 1] += ay * globals.timestep;
  arena.velocities[i * 3 + 2] += az * globals.timestep;

  arena.velocities[j * 3] -= ax * globals.timestep;
  arena.velocities[j * 3 + 1] -= ay * globals.timestep;
  arena.velocities[j * 3 + 2] -= az * globals.timestep;

  //console.log(`Accelerating particles ${i} and ${j}: (${ax.toFixed(4)}, ${ay.toFixed(4)}, ${az.toFixed(4)})`);
}

function accelerate(arena: Arena): void {
  for (let i = 0; i < globals.numParticles; i++) {
    const cell = arena.pointToCell[i];

    for (let j = 0; j < 9; j++) {

      // Neighbor cell index does not need to be checked for bounds because of grid padding
      const neighborCell = cell + arena.neighborOffsets[j];

      for (let n = 0; n < arena.cellContents[neighborCell].length; n++) {
        const j = arena.cellContents[neighborCell][n];

        // Only accumulate density if i < j to avoid double counting
        if (i < j) accelerateAlongPressureGradient(arena, i, j);
      }

    }
  }
}

export function step(arena: Arena) {
  populateGrid(arena.positions, arena.grid, arena.cellContents, arena.pointToCell);
  resetDensities(arena);
  accumulateDensities(arena);
  computePressures(arena);
  accelerate(arena);

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
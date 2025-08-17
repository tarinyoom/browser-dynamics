import { globals } from './constants';
import { computeGrid, populateGrid, findNeighbors } from './spatial-hash';
import { kernel } from './kernel';

export function initializeArena(): Arena {
  const positions = new Float32Array(globals.numParticles * 3);
  const velocities = new Float32Array(globals.numParticles * 3);
  const acceleration = new Float32Array(globals.numParticles * 3);
  const preAcceleration = new Float32Array(globals.numParticles * 3);
  const densities = new Float32Array(globals.numParticles);
  const pressures = new Float32Array(globals.numParticles);
  const extents = [[globals.boxMin, globals.boxMax], [globals.boxMin, globals.boxMax], [0.0, 0.0]];
  const grid = computeGrid(extents, globals.smoothingRadius);
  const nCells = grid.count.reduce((a, b) => a * b, 1);
  const cellContents: number[][] = Array.from({ length: nCells }, () => []);
  const pointToCell = new Array(globals.numParticles).fill(0);
  const neighbors: number[][] = Array.from({ length: globals.numParticles }, () => []);
  const particleMass = 1.0 / globals.numParticles;
  const invH = 1.0 / globals.smoothingRadius;
  const referenceDensity = 1.0 / (globals.boxMax - globals.boxMin) ** 2;
  const invReferenceDensity = 1.0 / referenceDensity;
  const taitB = referenceDensity * globals.taitC * globals.taitC / globals.taitGamma;
  
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
           acceleration: acceleration,
           preAcceleration: preAcceleration,
           densities: densities,
           pressures: pressures,
           grid: grid,
           cellContents: cellContents,
           pointToCell: pointToCell,
           neighbors: neighbors,
           particleMass: particleMass,
           invH: invH,
           neighborOffsets: neighborOffsets,
           invReferenceDensity: invReferenceDensity,
           taitB: taitB
        };
}

function addDensity(arena: Arena, i: number, j: number): void {
    const dx = arena.positions[i * 3] - arena.positions[j * 3];
    const dy = arena.positions[i * 3 + 1] - arena.positions[j * 3 + 1];
    const dz = arena.positions[i * 3 + 2] - arena.positions[j * 3 + 2];

    const r2 = dx * dx + dy * dy + dz * dz;

    
    if (r2 > globals.smoothingRadius * globals.smoothingRadius) return;

    const d = Math.sqrt(r2);
    const density = kernel(d, arena.invH) * arena.particleMass;

    arena.densities[i] += density;
    arena.densities[j] += density;
}

function accumulateDensities(arena: Arena, neighbors: number[][]) {
  for (let i = 0; i < neighbors.length; i++) {
    for (const j of neighbors[i]) {
      addDensity(arena, i, j);
    }
  }
}

function computePressures(arena: Arena) {
  for (let i = 0; i < globals.numParticles; i++) {
    const density = arena.densities[i];
    console.log(`densitiy is ${density} and ref is ${1.0 / arena.invReferenceDensity}`);
    const pressure = arena.taitB * (Math.pow(density * arena.invReferenceDensity, globals.taitGamma) - 1);
    arena.pressures[i] = pressure;
  }
}

function initializeTimestep(arena: Arena) {
  populateGrid(arena.positions, arena.grid, arena.cellContents, arena.pointToCell, globals.numParticles, arena.invH);

  for (let i = 0; i < globals.numParticles * 3; i++) {
    arena.preAcceleration[i] = arena.acceleration[i];
    arena.acceleration[i] = 0;
  }

  for (let i = 0; i < globals.numParticles; i++) {
    arena.densities[i] = 0;
  }
}

function generateNeighborLists(arena: Arena) {
  findNeighbors(arena.grid, arena.cellContents, arena.neighbors);
}

function leapfrog(arena: Arena) {
  for (let i = 0; i < globals.numParticles; i++) {    
    arena.positions[i * 3] += arena.velocities[i * 3] * globals.timestep + 0.5 * arena.preAcceleration[i * 3] * globals.timestep * globals.timestep;
    arena.positions[i * 3 + 1] += arena.velocities[i * 3 + 1] * globals.timestep + 0.5 * arena.preAcceleration[i * 3 + 1] * globals.timestep * globals.timestep;
    
    arena.velocities[i * 3] += 0.5 * (arena.preAcceleration[i * 3] + arena.acceleration[i * 3]) * globals.timestep;
    arena.velocities[i * 3 + 1] += 0.5 * (arena.preAcceleration[i * 3 + 1] + arena.acceleration[i * 3 + 1]) * globals.timestep;
  }
}

function reflect(arena: Arena) {
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

export function step(arena: Arena) {
  initializeTimestep(arena);
  generateNeighborLists(arena);

  accumulateDensities(arena, arena.neighbors);
  computePressures(arena);

  for (let i = 0; i < globals.numParticles; i++) {
    arena.acceleration[i * 3 + 1] += globals.gravity;
  }

  reflect(arena);

  leapfrog(arena);
}
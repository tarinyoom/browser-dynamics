import { globals } from './constants';
import { computeGrid, populateGrid, findNeighbors } from './spatial-hash';
import { kernel, dKernel } from './kernel';

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
  const referenceDensity = 2.0 / (globals.boxMax - globals.boxMin) ** 2;
  const invReferenceDensity = 1.0 / referenceDensity;
  const taitB = referenceDensity * globals.taitC * globals.taitC / globals.taitGamma;
  
  const neighborOffsets: number[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
        const offset = dx + dy * grid.count[0];
        neighborOffsets.push(offset);
    }
  }

  const domainWidth = globals.boxMax - globals.boxMin;
  
  const triangleBaseY = globals.boxMin + 0.1;
  const triangleTopY = globals.boxMax - 0.1;
  const triangleHeight = triangleTopY - triangleBaseY;
  const triangleBaseWidth = domainWidth - 0.2;
  
  const aspectRatio = triangleBaseWidth / triangleHeight;
  const approxRows = Math.sqrt(globals.numParticles / (0.5 * aspectRatio));
  const rows = Math.max(1, Math.ceil(approxRows));
  
  let particleIndex = 0;
  
  for (let row = 0; row < rows && particleIndex < globals.numParticles; row++) {

    const rowProgress = row / (rows - 1);
    const y = triangleBaseY + rowProgress * triangleHeight;
    
    const widthAtHeight = triangleBaseWidth * (1 - rowProgress);
    
    const particlesInRow = Math.max(1, Math.ceil(widthAtHeight / triangleHeight * approxRows));
    
    const spacing = particlesInRow > 1 ? widthAtHeight / (particlesInRow - 1) : 0;
    
    for (let col = 0; col < particlesInRow && particleIndex < globals.numParticles; col++) {
      const x = globals.boxMin + 0.1 + col * spacing;
      
      positions[particleIndex * 3] = x;
      positions[particleIndex * 3 + 1] = y;
      positions[particleIndex * 3 + 2] = 0;
      
      velocities[particleIndex * 3] = 0;
      velocities[particleIndex * 3 + 1] = 0;
      velocities[particleIndex * 3 + 2] = 0;
      
      densities[particleIndex] = 0;
      
      particleIndex++;
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

function addDensity(arena: Arena, i: number, j: number, symm: boolean): void {
    const dx = arena.positions[i * 3] - arena.positions[j * 3];
    const dy = arena.positions[i * 3 + 1] - arena.positions[j * 3 + 1];
    const dz = arena.positions[i * 3 + 2] - arena.positions[j * 3 + 2];

    const r2 = dx * dx + dy * dy + dz * dz;

    
    if (r2 > globals.smoothingRadius * globals.smoothingRadius) return;

    const d = Math.sqrt(r2);
    const density = kernel(d, arena.invH) * arena.particleMass;

    arena.densities[i] += density;
    if (symm) {
      arena.densities[j] += density;
    }
}

function accumulateDensities(arena: Arena, neighbors: number[][]) {
  for (let i = 0; i < neighbors.length; i++) {
    for (const j of neighbors[i]) {
      addDensity(arena, i, j, true);
    }
    addDensity(arena, i, i, false);
  }
}

function computePressures(arena: Arena) {
  for (let i = 0; i < globals.numParticles; i++) {
    const density = arena.densities[i];
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

function accelerateAlongPressureGradient(arena: Arena, i: number, j: number): void {
  if (arena.densities[i] <= 0 || arena.densities[j] <= 0) return;

  const dx = arena.positions[i * 3] - arena.positions[j * 3];
  const dy = arena.positions[i * 3 + 1] - arena.positions[j * 3 + 1];

  const r2 = dx * dx + dy * dy;

  // Early exit before having to compute square root
  if (r2 > globals.smoothingRadius * globals.smoothingRadius) return;

  const d = Math.sqrt(r2);

  if (d < .2 * globals.smoothingRadius) return;

  const rhoisq = arena.densities[i] * arena.densities[i];
  const rhojsq = arena.densities[j] * arena.densities[j];

  if (rhoisq < 1e-6 || rhojsq < 1e-6) return;

  const pi = arena.pressures[i] / rhoisq;
  const pj = arena.pressures[j] / rhojsq;

  const invD = 1.0 / d;

  const dx_normed = dx * invD;
  const dy_normed = dy * invD;

  const scale = dKernel(d, arena.invH) * (pi + pj) * arena.particleMass;

  const ax = dx_normed * scale;
  const ay = dy_normed * scale;

  arena.acceleration[i * 3] -= ax;
  arena.acceleration[i * 3 + 1] -= ay;

  arena.acceleration[j * 3] += ax;
  arena.acceleration[j * 3 + 1] += ay;
}

function addMomentum(arena: Arena) {
  for (let i = 0; i < globals.numParticles; i++) {
    for (const j of arena.neighbors[i]) {
      accelerateAlongPressureGradient(arena, i, j);
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

  addMomentum(arena);

  reflect(arena);

  leapfrog(arena);
}

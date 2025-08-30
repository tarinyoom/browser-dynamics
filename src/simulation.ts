import { globals } from './constants';
import { computeGrid, populateGrid, findNeighbors } from './spatial-hash';
import { kernel, dKernel } from './kernel';

export function initializeArena(): Arena {
  const px = new Float32Array(globals.numParticles);
  const py = new Float32Array(globals.numParticles);
  const pz = new Float32Array(globals.numParticles);
  const vx = new Float32Array(globals.numParticles);
  const vy = new Float32Array(globals.numParticles);
  const vz = new Float32Array(globals.numParticles);
  const ax = new Float32Array(globals.numParticles);
  const ay = new Float32Array(globals.numParticles);
  const az = new Float32Array(globals.numParticles);
  const aax = new Float32Array(globals.numParticles);
  const aay = new Float32Array(globals.numParticles);
  const aaz = new Float32Array(globals.numParticles);
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
      
      px[particleIndex] = x;
      py[particleIndex] = y;
      pz[particleIndex] = 0;
      
      vx[particleIndex] = 0;
      vy[particleIndex] = 0;
      vz[particleIndex] = 0;
      
      densities[particleIndex] = 0;
      
      particleIndex++;
    }
  }

  return { px: px,
           py: py,
           pz: pz,
           vx: vx,
           vy: vy,
           vz: vz,
           ax: ax,
           ay: ay,
           az: az,
           aax: aax,
           aay: aay,
           aaz: aaz,
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
    const dx = arena.px[i] - arena.px[j];
    const dy = arena.py[i] - arena.py[j];
    const dz = arena.pz[i] - arena.pz[j];

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
  populateGrid(arena.px, arena.py, arena.pz, arena.grid, arena.cellContents, arena.pointToCell, globals.numParticles, arena.invH);

  for (let i = 0; i < globals.numParticles; i++) {
    arena.aax[i] = arena.ax[i];
    arena.aay[i] = arena.ay[i];
    arena.aaz[i] = arena.az[i];
    arena.ax[i] = 0;
    arena.ay[i] = 0;
    arena.az[i] = 0;
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
    arena.px[i] += arena.vx[i] * globals.timestep + 0.5 * arena.aax[i] * globals.timestep * globals.timestep;
    arena.py[i] += arena.vy[i] * globals.timestep + 0.5 * arena.aay[i] * globals.timestep * globals.timestep;
    
    arena.vx[i] += 0.5 * (arena.aax[i] + arena.ax[i]) * globals.timestep;
    arena.vy[i] += 0.5 * (arena.aay[i] + arena.ay[i]) * globals.timestep;
  }
}

function reflect(arena: Arena) {
  for (let i = 0; i < globals.numParticles; i++) {
    if (arena.px[i] < globals.boxMin) {
      arena.px[i] = globals.boxMin;
      arena.vx[i] *= -1;
    } else if (arena.px[i] > globals.boxMax) {
      arena.px[i] = globals.boxMax;
      arena.vx[i] *= -1;
    }
    
    if (arena.py[i] < globals.boxMin) {
      arena.py[i] = globals.boxMin;
      arena.vy[i] *= -1;
    } else if (arena.py[i] > globals.boxMax) {
      arena.py[i] = globals.boxMax;
      arena.vy[i] *= -1;
    }
    
    if (globals.dim > 2) {
      if (arena.pz[i] < globals.boxMin) {
        arena.pz[i] = globals.boxMin;
        arena.vz[i] *= -1;
      } else if (arena.pz[i] > globals.boxMax) {
        arena.pz[i] = globals.boxMax;
        arena.vz[i] *= -1;
      }
    }
  }
}

function accelerateAlongPressureGradient(arena: Arena, i: number, j: number): void {
  if (arena.densities[i] <= 0 || arena.densities[j] <= 0) return;

  const dx = arena.px[i] - arena.px[j];
  const dy = arena.py[i] - arena.py[j];

  const r2 = dx * dx + dy * dy;

  // Early exit before having to compute square root
  if (r2 > globals.smoothingRadius * globals.smoothingRadius) return;

  const d = Math.sqrt(r2);

  if (d < .2 * globals.smoothingRadius) return;

  const rhoisq = arena.densities[i] * arena.densities[i];
  const rhojsq = arena.densities[j] * arena.densities[j];

  const pi = arena.pressures[i] / rhoisq;
  const pj = arena.pressures[j] / rhojsq;

  const invD = 1.0 / d;

  const dx_normed = dx * invD;
  const dy_normed = dy * invD;

  const scale = dKernel(d, arena.invH) * (pi + pj) * arena.particleMass;

  const ax = dx_normed * scale;
  const ay = dy_normed * scale;

  arena.ax[i] -= ax;
  arena.ay[i] -= ay;

  arena.ax[j] += ax;
  arena.ay[j] += ay;
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
    arena.ay[i] += globals.gravity;
  }

  addMomentum(arena);

  reflect(arena);

  leapfrog(arena);
}

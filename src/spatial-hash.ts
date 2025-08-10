import { globals } from "./constants";

/**
 * Computes the grid structure for spatial hashing. The grid will cover the
 * specified extents with cells of a given length. This grid will always exceed
 * the extents, ensuring that all particles fit within the grid, even if they
 * are at the edges. The grid will be centered around the center of the extents.
 * @param extents array of [min, max] pairs for each dimension
 * @param cellLength length of each cell in the grid
 * @returns a Grid object containing the specification of the grid
 */
function computeGrid(extents: number[][], cellLength: number): Grid {
  const dimensions = extents.length;
  const count = new Array(dimensions);
  const offset = new Array(dimensions);

  for (let i = 0; i < dimensions; i++) {
    const [min, max] = extents[i];

    // Add 1 to ensure grid always exceeds extents, handling floating-point edge cases
    count[i] = Math.ceil((max - min) / cellLength) + 1;
    const gridSize = count[i] * cellLength;
    const center = (min + max) / 2;
    offset[i] = center - gridSize / 2;
  }
  
  return { count, offset };
}

function hash(x: number, y: number, z: number, grid: Grid): number {
  const { count, offset } = grid;
  const cellX = Math.floor((x - offset[0]) / globals.smoothingRadius);
  const cellY = Math.floor((y - offset[1]) / globals.smoothingRadius);
  const cellZ = Math.floor((z - offset[2]) / globals.smoothingRadius);

  return cellX + cellY * count[0] + cellZ * count[0] * count[1];
}

function populateGrid(positions: Float32Array, grid: Grid): number[][] {
  const nCells = grid.count.reduce((a, b) => a * b, 1);
  const neighbors: number[][] = Array.from({ length: nCells }, () => []);
  for (let i = 0; i < globals.numParticles; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];

    const cellIndex = hash(x, y, z, grid);
    neighbors[cellIndex].push(i);
  }
  return neighbors;
}

export { computeGrid, populateGrid, hash };

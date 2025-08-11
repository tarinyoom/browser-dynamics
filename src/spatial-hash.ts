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

    // Add 3 cells to guarantee 1-cell-width buffer around extents
    count[i] = Math.ceil((max - min) / cellLength) + 3;
    const gridSize = count[i] * cellLength;
    const center = (min + max) / 2;
    offset[i] = center - gridSize / 2;
  }
  
  return { count, offset };
}

function getCell(x: number, y: number, z: number, grid: Grid): number[] {
  const offset = grid.offset;
  const cellX = Math.floor((x - offset[0]) / globals.smoothingRadius);
  const cellY = Math.floor((y - offset[1]) / globals.smoothingRadius);
  const cellZ = Math.floor((z - offset[2]) / globals.smoothingRadius);

  return [cellX, cellY, cellZ];
}

function hash(x: number, y: number, z: number, grid: Grid): number {
  const count = grid.count;
  return x + count[0] * (y + count[1] * z);
}

function populateGrid(positions: Float32Array, grid: Grid, contents: number[][], gridMap: number[][]): void {
  for (let i = 0; i < contents.length; i++) {
    contents[i].length = 0;
  }

  for (let i = 0; i < globals.numParticles; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const cell = getCell(x, y, z, grid);
    const cellIndex = hash(cell[0], cell[1], cell[2], grid);
    contents[cellIndex].push(i);
    for (let j = 0; j < 3; j++) {
      gridMap[i][j] = cell[j];
    }
  }
}

export { computeGrid, populateGrid, hash };

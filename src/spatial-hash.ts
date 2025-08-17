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

function getCell(x: number, y: number, z: number, grid: Grid, invH: number): number[] {
  const offset = grid.offset;
  const cellX = Math.floor((x - offset[0]) * invH);
  const cellY = Math.floor((y - offset[1]) * invH);
  const cellZ = Math.floor((z - offset[2]) * invH);
  return [cellX, cellY, cellZ];
}

function hash(x: number, y: number, z: number, grid: Grid): number {
  const count = grid.count;
  return x + count[0] * (y + count[1] * z);
}

function populateGrid(positions: Float32Array, grid: Grid, contents: number[][], gridMap: number[], numParticles: number, invH: number): void {
  for (let i = 0; i < contents.length; i++) {
    contents[i].length = 0;
  }

  for (let i = 0; i < numParticles; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const cell = getCell(x, y, z, grid, invH);
    const cellIndex = hash(cell[0], cell[1], cell[2], grid);
    contents[cellIndex].push(i);
    gridMap[i] = cellIndex;
 }
}

function findNeighbors(grid: Grid, contents: number[][], numParticles: number): number[][] {
  const neighbors: number[][] = Array.from({ length: numParticles }, () => []);
  
  // Iterate through all grid cells
  for (let x = 0; x < grid.count[0]; x++) {
    for (let y = 0; y < grid.count[1]; y++) {
      for (let z = 0; z < grid.count[2]; z++) {
        const cellIndex = hash(x, y, z, grid);
        const cellPoints = contents[cellIndex];
        
        // Check all 27 neighboring cells (including self)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              const nx = x + dx;
              const ny = y + dy;
              const nz = z + dz;
              
              // Check bounds
              if (nx >= 0 && nx < grid.count[0] && 
                  ny >= 0 && ny < grid.count[1] && 
                  nz >= 0 && nz < grid.count[2]) {
                
                const neighborCellIndex = hash(nx, ny, nz, grid);
                const neighborPoints = contents[neighborCellIndex];
                
                // Add all pairs where i < j to avoid double counting
                for (const i of cellPoints) {
                  for (const j of neighborPoints) {
                    if (i < j) {
                      neighbors[i].push(j);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  return neighbors;
}

export { computeGrid, populateGrid, hash, findNeighbors };

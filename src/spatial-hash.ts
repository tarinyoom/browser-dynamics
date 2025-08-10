
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
  
  return { count, cellLength, offset };
}

export { computeGrid };

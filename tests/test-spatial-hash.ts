import { describe, test, expect } from 'vitest'
import { computeGrid, populateGrid, findNeighbors } from '../src/spatial-hash'

describe('computeGrid', () => {
  describe('1D grid', () => {
    test('creates grid for simple case', () => {
      const result = computeGrid([[0, 10]], 2);
      expect(result.count).toEqual([8]);
      expect(result.offset).toEqual([-3]);
    });

    test('handles exact cell divisions', () => {
      const result = computeGrid([[0, 4]], 1);
      expect(result.count).toEqual([7]);
      expect(result.offset).toEqual([-1.5]);
    });

    test('handles negative extents', () => {
      const result = computeGrid([[-5, 5]], 2);
      expect(result.count).toEqual([8]);
      expect(result.offset).toEqual([-8]);
    });

    test('handles fractional cell length', () => {
      const result = computeGrid([[0, 3]], 0.5);
      expect(result.count).toEqual([9]);
      expect(result.offset).toEqual([-0.75]);
    });
  });

  describe('2D grid', () => {
    test('creates grid for 2D case', () => {
      const result = computeGrid([[0, 10], [0, 20]], 5);
      expect(result.count).toEqual([5, 7]);
      expect(result.offset).toEqual([-7.5, -7.5]);
    });

    test('handles different ranges per dimension', () => {
      const result = computeGrid([[-1, 1], [0, 3]], 1);
      expect(result.count).toEqual([5, 6]);
      expect(result.offset).toEqual([-2.5, -1.5]);
    });
  });

  describe('3D grid', () => {
    test('creates grid for 3D case', () => {
      const result = computeGrid([[0, 2], [0, 4], [0, 6]], 1);
      expect(result.count).toEqual([5, 7, 9]);
      expect(result.offset).toEqual([-1.5, -1.5, -1.5]);
    });
  });

  describe('grid coverage verification', () => {
    test('grid always covers original extents', () => {
      const extents = [[1, 7], [2, 8]];
      const cellLength = 1.5;
      const grid = computeGrid(extents, cellLength);

      for (let dim = 0; dim < extents.length; dim++) {
        const gridMin = grid.offset[dim];
        const gridMax = grid.offset[dim] + grid.count[dim] * cellLength;

        expect(gridMin).toBeLessThan(extents[dim][0]);
        expect(gridMax).toBeGreaterThan(extents[dim][1]);
      }
    });

    test('grid covers extents with floating point precision edge case', () => {
      const extents = [[0, 0.1 + 0.2]];
      const cellLength = 0.1;
      const grid = computeGrid(extents, cellLength);

      const gridMin = grid.offset[0];
      const gridMax = grid.offset[0] + grid.count[0] * cellLength;

      expect(gridMin).toBeLessThan(extents[0][0]);
      expect(gridMax).toBeGreaterThan(extents[0][1]);
    });
  });

  describe('centering behavior', () => {
    test('grid is centered around extent center', () => {
      const extents = [[10, 20]];
      const cellLength = 2;
      const grid = computeGrid(extents, cellLength);

      const extentCenter = (extents[0][0] + extents[0][1]) / 2;
      const gridCenter = grid.offset[0] + (grid.count[0] * cellLength) / 2;

      expect(gridCenter).toBeCloseTo(extentCenter, 10);
    });
  });
});

describe('findNeighbors', () => {
  test('finds neighbors in same cell', () => {
    const numParticles = 4;
    const smoothingRadius = 1.0;
    const invH = 1.0 / smoothingRadius;
    
    const grid = computeGrid([[0, 2], [0, 2], [0, 0]], smoothingRadius);
    const nCells = grid.count.reduce((a: number, b: number) => a * b, 1);
    const cellContents: number[][] = Array.from({ length: nCells }, () => []);
    const pointToCell = new Array(numParticles).fill(0);
    
    // Place 4 points in the center area of the grid
    const positions = new Float32Array([
      1.0, 1.0, 0,  // point 0
      1.1, 1.1, 0,  // point 1
      1.2, 1.2, 0,  // point 2
      1.3, 1.3, 0   // point 3
    ]);
    
    populateGrid(positions, grid, cellContents, pointToCell, numParticles, invH);
    const neighbors: number[][] = Array.from({ length: numParticles }, () => []);
    findNeighbors(grid, cellContents, neighbors);
    
    // Each point should be neighbors with all points with higher indices
    expect(neighbors[0]).toEqual([1, 2, 3]);
    expect(neighbors[1]).toEqual([2, 3]);
    expect(neighbors[2]).toEqual([3]);
    expect(neighbors[3]).toEqual([]);
  });

  test('finds neighbors in adjacent cells', () => {
    const numParticles = 4;
    const smoothingRadius = 1.0;
    const invH = 1.0 / smoothingRadius;
    
    const grid = computeGrid([[-1, 3], [-1, 3], [0, 0]], smoothingRadius);
    const nCells = grid.count.reduce((a: number, b: number) => a * b, 1);
    const cellContents: number[][] = Array.from({ length: nCells }, () => []);
    const pointToCell = new Array(numParticles).fill(0);
    
    // Place points in adjacent cells
    const positions = new Float32Array([
      0.9, 0.9, 0,  // point 0 - cell (2,2)
      1.1, 0.9, 0,  // point 1 - cell (3,2) 
      0.9, 1.1, 0,  // point 2 - cell (2,3)
      1.1, 1.1, 0   // point 3 - cell (3,3)
    ]);
    
    populateGrid(positions, grid, cellContents, pointToCell, numParticles, invH);
    const neighbors: number[][] = Array.from({ length: numParticles }, () => []);
    findNeighbors(grid, cellContents, neighbors);
    
    // Each point should be neighbors with all other points
    expect(neighbors[0]).toEqual([1, 2, 3]);
    expect(neighbors[1]).toEqual([2, 3]);
    expect(neighbors[2]).toEqual([3]);
    expect(neighbors[3]).toEqual([]);
  });

  test('does not include distant points as neighbors', () => {
    const numParticles = 4;
    const smoothingRadius = 1.0;
    const invH = 1.0 / smoothingRadius;
    
    const grid = computeGrid([[-2, 4], [-2, 4], [0, 0]], smoothingRadius);
    const nCells = grid.count.reduce((a: number, b: number) => a * b, 1);
    const cellContents: number[][] = Array.from({ length: nCells }, () => []);
    const pointToCell = new Array(numParticles).fill(0);
    
    // Place points far apart
    const positions = new Float32Array([
      0, 0, 0,    // point 0
      3, 3, 0,    // point 1 - far away
      0.5, 0.5, 0, // point 2 - close to 0
      3.5, 3.5, 0  // point 3 - close to 1
    ]);
    
    populateGrid(positions, grid, cellContents, pointToCell, numParticles, invH);
    const neighbors: number[][] = Array.from({ length: numParticles }, () => []);
    findNeighbors(grid, cellContents, neighbors);
    
    // Points 0 and 2 should be neighbors, points 1 and 3 should be neighbors
    // But 0,1 and 0,3 and 2,1 and 2,3 should NOT be neighbors
    expect(neighbors[0]).toEqual([2]);
    expect(neighbors[1]).toEqual([3]);
    expect(neighbors[2]).toEqual([]);
    expect(neighbors[3]).toEqual([]);
  });

  test('handles edge cases with empty cells', () => {
    const numParticles = 2;
    const smoothingRadius = 1.0;
    const invH = 1.0 / smoothingRadius;
    
    const grid = computeGrid([[-1, 3], [-1, 3], [0, 0]], smoothingRadius);
    const nCells = grid.count.reduce((a: number, b: number) => a * b, 1);
    const cellContents: number[][] = Array.from({ length: nCells }, () => []);
    const pointToCell = new Array(numParticles).fill(0);
    
    // Only place 2 points in sparse grid
    const positions = new Float32Array([
      0, 0, 0,    // point 0
      2, 2, 0     // point 1 - diagonal, not adjacent
    ]);
    
    populateGrid(positions, grid, cellContents, pointToCell, numParticles, invH);
    const neighbors: number[][] = Array.from({ length: numParticles }, () => []);
    findNeighbors(grid, cellContents, neighbors);
    
    // Points should not be neighbors (too far apart)
    expect(neighbors[0]).toEqual([]);
    expect(neighbors[1]).toEqual([]);
  });

  test('respects i < j constraint to avoid double counting', () => {
    const numParticles = 4;
    const smoothingRadius = 1.0;
    const invH = 1.0 / smoothingRadius;
    
    const grid = computeGrid([[0, 2], [0, 2], [0, 0]], smoothingRadius);
    const nCells = grid.count.reduce((a: number, b: number) => a * b, 1);
    const cellContents: number[][] = Array.from({ length: nCells }, () => []);
    const pointToCell = new Array(numParticles).fill(0);
    
    // Place points in same cell but test ordering
    const positions = new Float32Array([
      0.5, 0.5, 0,  // point 0
      0.6, 0.6, 0,  // point 1
      0.7, 0.7, 0,  // point 2
      0.8, 0.8, 0   // point 3
    ]);
    
    populateGrid(positions, grid, cellContents, pointToCell, numParticles, invH);
    const neighbors: number[][] = Array.from({ length: numParticles }, () => []);
    findNeighbors(grid, cellContents, neighbors);
    
    // Verify no point appears in neighbor list of a point with lower index
    for (let i = 0; i < neighbors.length; i++) {
      for (const j of neighbors[i]) {
        expect(j).toBeGreaterThan(i);
      }
    }
    
    // Verify we get all expected pairs exactly once
    const allPairs: [number, number][] = [];
    for (let i = 0; i < neighbors.length; i++) {
      for (const j of neighbors[i]) {
        allPairs.push([i, j]);
      }
    }
    
    expect(allPairs).toEqual([[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]);
  });
});

import { describe, test, expect } from 'vitest'
import { computeGrid } from '../src/spatial-hash.js'

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

#[derive(Debug, Clone)]
pub struct Grid {
    pub count: Vec<usize>,
    pub offset: Vec<f32>,
}

pub fn compute_grid(extents: &[&[f32; 2]], cell_length: f32) -> Grid {
    let dimensions = extents.len();
    let mut count = vec![0; dimensions];
    let mut offset = vec![0.0; dimensions];

    for i in 0..dimensions {
        let (min, max) = (extents[i][0], extents[i][1]);
        
        count[i] = ((max - min) / cell_length).ceil() as usize + 3;
        let grid_size = count[i] as f32 * cell_length;
        let center = (min + max) / 2.0;
        offset[i] = center - grid_size / 2.0;
    }

    Grid { count, offset }
}

pub fn get_cell(x: f32, y: f32, z: f32, grid: &Grid, inv_h: f32) -> [i32; 3] {
    let cell_x = ((x - grid.offset[0]) * inv_h).floor() as i32;
    let cell_y = ((y - grid.offset[1]) * inv_h).floor() as i32;
    let cell_z = ((z - grid.offset[2]) * inv_h).floor() as i32;
    [cell_x, cell_y, cell_z]
}

pub fn hash(x: i32, y: i32, z: i32, grid: &Grid) -> usize {
    let count = &grid.count;
    (x as usize) + count[0] * ((y as usize) + count[1] * (z as usize))
}

pub fn populate_grid(
    px: &[f32],
    py: &[f32], 
    pz: &[f32],
    grid: &Grid,
    contents: &mut [Vec<usize>],
    grid_map: &mut [usize],
    num_particles: usize,
    inv_h: f32,
) {
    for cell_contents in contents.iter_mut() {
        cell_contents.clear();
    }

    for i in 0..num_particles {
        let x = px[i];
        let y = py[i];
        let z = pz[i];
        let cell = get_cell(x, y, z, grid, inv_h);
        let cell_index = hash(cell[0], cell[1], cell[2], grid);
        contents[cell_index].push(i);
        grid_map[i] = cell_index;
    }

}

pub fn find_neighbors(
    grid: &Grid,
    contents: &[Vec<usize>],
    neighbors: &mut [Vec<usize>],
) {
    for neighbor_list in neighbors.iter_mut() {
        neighbor_list.clear();
    }

    for x in 0..grid.count[0] as i32 {
        for y in 0..grid.count[1] as i32 {
            for z in 0..grid.count[2] as i32 {
                let cell_index = hash(x, y, z, grid);
                let cell_points = &contents[cell_index];

                for dx in -1..=1 {
                    for dy in -1..=1 {
                        for dz in -1..=1 {
                            let nx = x + dx;
                            let ny = y + dy;
                            let nz = z + dz;

                            if nx >= 0 && nx < grid.count[0] as i32 &&
                               ny >= 0 && ny < grid.count[1] as i32 &&
                               nz >= 0 && nz < grid.count[2] as i32 {
                                
                                let neighbor_cell_index = hash(nx, ny, nz, grid);
                                let neighbor_points = &contents[neighbor_cell_index];

                                for &i in cell_points {
                                    for &j in neighbor_points {
                                        if i < j {
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compute_grid_1d_simple_case() {
        let extents = &[&[0.0_f32, 10.0_f32]];
        let result = compute_grid(extents, 2.0);
        assert_eq!(result.count, vec![8]);
        assert_eq!(result.offset, vec![-3.0]);
    }

    #[test]
    fn compute_grid_1d_exact_cell_divisions() {
        let extents = &[&[0.0_f32, 4.0_f32]];
        let result = compute_grid(extents, 1.0);
        assert_eq!(result.count, vec![7]);
        assert_eq!(result.offset, vec![-1.5]);
    }

    #[test]
    fn compute_grid_1d_negative_extents() {
        let extents = &[&[-5.0_f32, 5.0_f32]];
        let result = compute_grid(extents, 2.0);
        assert_eq!(result.count, vec![8]);
        assert_eq!(result.offset, vec![-8.0]);
    }

    #[test]
    fn compute_grid_1d_fractional_cell_length() {
        let extents = &[&[0.0_f32, 3.0_f32]];
        let result = compute_grid(extents, 0.5);
        assert_eq!(result.count, vec![9]);
        assert_eq!(result.offset, vec![-0.75]);
    }

    #[test]
    fn compute_grid_2d_case() {
        let extents = &[&[0.0_f32, 10.0_f32], &[0.0_f32, 20.0_f32]];
        let result = compute_grid(extents, 5.0);
        assert_eq!(result.count, vec![5, 7]);
        assert_eq!(result.offset, vec![-7.5, -7.5]);
    }

    #[test]
    fn compute_grid_2d_different_ranges() {
        let extents = &[&[-1.0_f32, 1.0_f32], &[0.0_f32, 3.0_f32]];
        let result = compute_grid(extents, 1.0);
        assert_eq!(result.count, vec![5, 6]);
        assert_eq!(result.offset, vec![-2.5, -1.5]);
    }

    #[test]
    fn compute_grid_3d_case() {
        let extents = &[&[0.0_f32, 2.0_f32], &[0.0_f32, 4.0_f32], &[0.0_f32, 6.0_f32]];
        let result = compute_grid(extents, 1.0);
        assert_eq!(result.count, vec![5, 7, 9]);
        assert_eq!(result.offset, vec![-1.5, -1.5, -1.5]);
    }

    #[test]
    fn compute_grid_coverage_verification() {
        let extents = &[&[1.0_f32, 7.0_f32], &[2.0_f32, 8.0_f32]];
        let cell_length = 1.5;
        let grid = compute_grid(extents, cell_length);

        for dim in 0..extents.len() {
            let grid_min = grid.offset[dim];
            let grid_max = grid.offset[dim] + grid.count[dim] as f32 * cell_length;

            assert!(grid_min < extents[dim][0]);
            assert!(grid_max > extents[dim][1]);
        }
    }

    #[test]
    fn compute_grid_floating_point_precision_edge_case() {
        let extents = &[&[0.0_f32, 0.1_f32 + 0.2_f32]];
        let cell_length = 0.1;
        let grid = compute_grid(extents, cell_length);

        let grid_min = grid.offset[0];
        let grid_max = grid.offset[0] + grid.count[0] as f32 * cell_length;

        assert!(grid_min < extents[0][0]);
        assert!(grid_max > extents[0][1]);
    }

    #[test]
    fn compute_grid_centering_behavior() {
        let extents = &[&[10.0_f32, 20.0_f32]];
        let cell_length = 2.0;
        let grid = compute_grid(extents, cell_length);

        let extent_center = (extents[0][0] + extents[0][1]) / 2.0;
        let grid_center = grid.offset[0] + (grid.count[0] as f32 * cell_length) / 2.0;

        assert!((grid_center - extent_center).abs() < 1e-6);
    }

    #[test]
    fn find_neighbors_same_cell() {
        let num_particles = 4;
        let smoothing_radius = 1.0;
        let inv_h = 1.0 / smoothing_radius;
        
        let grid = compute_grid(&[&[0.0_f32, 2.0_f32], &[0.0_f32, 2.0_f32], &[0.0_f32, 0.0_f32]], smoothing_radius);
        let n_cells = grid.count.iter().product();
        let mut cell_contents: Vec<Vec<usize>> = vec![vec![]; n_cells];
        let mut point_to_cell = vec![0; num_particles];
        
        // Place 4 points in the center area of the grid
        let px = [1.0, 1.1, 1.2, 1.3];
        let py = [1.0, 1.1, 1.2, 1.3];
        let pz = [0.0, 0.0, 0.0, 0.0];
        
        populate_grid(&px, &py, &pz, &grid, &mut cell_contents, &mut point_to_cell, num_particles, inv_h);
        let mut neighbors: Vec<Vec<usize>> = vec![vec![]; num_particles];
        find_neighbors(&grid, &cell_contents, &mut neighbors);
        
        // Each point should be neighbors with all points with higher indices
        assert_eq!(neighbors[0], vec![1, 2, 3]);
        assert_eq!(neighbors[1], vec![2, 3]);
        assert_eq!(neighbors[2], vec![3]);
        assert_eq!(neighbors[3], vec![]);
    }

    #[test]
    fn find_neighbors_adjacent_cells() {
        let num_particles = 4;
        let smoothing_radius = 1.0;
        let inv_h = 1.0 / smoothing_radius;
        
        let grid = compute_grid(&[&[-1.0_f32, 3.0_f32], &[-1.0_f32, 3.0_f32], &[0.0_f32, 0.0_f32]], smoothing_radius);
        let n_cells = grid.count.iter().product();
        let mut cell_contents: Vec<Vec<usize>> = vec![vec![]; n_cells];
        let mut point_to_cell = vec![0; num_particles];
        
        // Place points in adjacent cells
        let px = [0.9, 1.1, 0.9, 1.1];
        let py = [0.9, 0.9, 1.1, 1.1];
        let pz = [0.0, 0.0, 0.0, 0.0];
        
        populate_grid(&px, &py, &pz, &grid, &mut cell_contents, &mut point_to_cell, num_particles, inv_h);
        let mut neighbors: Vec<Vec<usize>> = vec![vec![]; num_particles];
        find_neighbors(&grid, &cell_contents, &mut neighbors);
        
        // Each point should be neighbors with all other points
        assert_eq!(neighbors[0], vec![1, 2, 3]);
        assert_eq!(neighbors[1], vec![2, 3]);
        assert_eq!(neighbors[2], vec![3]);
        assert_eq!(neighbors[3], vec![]);
    }

    #[test]
    fn find_neighbors_no_distant_points() {
        let num_particles = 4;
        let smoothing_radius = 1.0;
        let inv_h = 1.0 / smoothing_radius;
        
        let grid = compute_grid(&[&[-2.0_f32, 4.0_f32], &[-2.0_f32, 4.0_f32], &[0.0_f32, 0.0_f32]], smoothing_radius);
        let n_cells = grid.count.iter().product();
        let mut cell_contents: Vec<Vec<usize>> = vec![vec![]; n_cells];
        let mut point_to_cell = vec![0; num_particles];
        
        // Place points far apart
        let px = [0.0, 3.0, 0.5, 3.5];
        let py = [0.0, 3.0, 0.5, 3.5];
        let pz = [0.0, 0.0, 0.0, 0.0];
        
        populate_grid(&px, &py, &pz, &grid, &mut cell_contents, &mut point_to_cell, num_particles, inv_h);
        let mut neighbors: Vec<Vec<usize>> = vec![vec![]; num_particles];
        find_neighbors(&grid, &cell_contents, &mut neighbors);
        
        // Points 0 and 2 should be neighbors, points 1 and 3 should be neighbors
        // But 0,1 and 0,3 and 2,1 and 2,3 should NOT be neighbors
        assert_eq!(neighbors[0], vec![2]);
        assert_eq!(neighbors[1], vec![3]);
        assert_eq!(neighbors[2], vec![]);
        assert_eq!(neighbors[3], vec![]);
    }

    #[test]
    fn find_neighbors_empty_cells() {
        let num_particles = 2;
        let smoothing_radius = 1.0;
        let inv_h = 1.0 / smoothing_radius;
        
        let grid = compute_grid(&[&[-1.0_f32, 3.0_f32], &[-1.0_f32, 3.0_f32], &[0.0_f32, 0.0_f32]], smoothing_radius);
        let n_cells = grid.count.iter().product();
        let mut cell_contents: Vec<Vec<usize>> = vec![vec![]; n_cells];
        let mut point_to_cell = vec![0; num_particles];
        
        // Only place 2 points in sparse grid
        let px = [0.0, 2.0];
        let py = [0.0, 2.0];
        let pz = [0.0, 0.0];
        
        populate_grid(&px, &py, &pz, &grid, &mut cell_contents, &mut point_to_cell, num_particles, inv_h);
        let mut neighbors: Vec<Vec<usize>> = vec![vec![]; num_particles];
        find_neighbors(&grid, &cell_contents, &mut neighbors);
        
        // Points should not be neighbors (too far apart)
        assert_eq!(neighbors[0], vec![]);
        assert_eq!(neighbors[1], vec![]);
    }

    #[test]
    fn find_neighbors_ordering_constraint() {
        let num_particles = 4;
        let smoothing_radius = 1.0;
        let inv_h = 1.0 / smoothing_radius;
        
        let grid = compute_grid(&[&[0.0_f32, 2.0_f32], &[0.0_f32, 2.0_f32], &[0.0_f32, 0.0_f32]], smoothing_radius);
        let n_cells = grid.count.iter().product();
        let mut cell_contents: Vec<Vec<usize>> = vec![vec![]; n_cells];
        let mut point_to_cell = vec![0; num_particles];
        
        // Place points in same cell but test ordering
        let px = [0.5, 0.6, 0.7, 0.8];
        let py = [0.5, 0.6, 0.7, 0.8];
        let pz = [0.0, 0.0, 0.0, 0.0];
        
        populate_grid(&px, &py, &pz, &grid, &mut cell_contents, &mut point_to_cell, num_particles, inv_h);
        let mut neighbors: Vec<Vec<usize>> = vec![vec![]; num_particles];
        find_neighbors(&grid, &cell_contents, &mut neighbors);
        
        // Verify no point appears in neighbor list of a point with lower index
        for (i, neighbor_list) in neighbors.iter().enumerate() {
            for &j in neighbor_list {
                assert!(j > i);
            }
        }
        
        // Verify we get all expected pairs exactly once
        let mut all_pairs: Vec<(usize, usize)> = Vec::new();
        for (i, neighbor_list) in neighbors.iter().enumerate() {
            for &j in neighbor_list {
                all_pairs.push((i, j));
            }
        }
        
        assert_eq!(all_pairs, vec![(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]);
    }
}

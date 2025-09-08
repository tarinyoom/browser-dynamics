use crate::arena::Arena;
use crate::constants::{N, GLOBALS};
use crate::spatial_hash::compute_grid;

pub fn fill_arena(arena: &mut Arena) {
    // Initialize grid structure
    let extents = [
        &[GLOBALS.box_min as f32, GLOBALS.box_max as f32],
        &[GLOBALS.box_min as f32, GLOBALS.box_max as f32], 
        &[0.0_f32, 0.0_f32]
    ];
    let grid = compute_grid(&extents, GLOBALS.smoothing_radius as f32);
    let n_cells = grid.count.iter().product();
    
    // Initialize collections
    *arena.grid_mut() = grid;
    *arena.cell_contents_mut() = vec![Vec::new(); n_cells];
    *arena.point_to_cell_mut() = vec![0; N];
    *arena.neighbors_mut() = vec![Vec::new(); N];
    
    // Initialize scalar values
    arena.set_particle_mass(1.0 / N as f32);
    arena.set_inv_h(1.0 / GLOBALS.smoothing_radius as f32);
    
    let reference_density = 2.0 / (GLOBALS.box_max - GLOBALS.box_min).powi(2);
    arena.set_inv_reference_density(1.0 / reference_density as f32);
    arena.set_tait_b((reference_density * GLOBALS.tait_c * GLOBALS.tait_c / GLOBALS.tait_gamma) as f32);
    
    // Initialize neighbor offsets
    let mut neighbor_offsets = Vec::new();
    for dx in -1..=1 {
        for dy in -1..=1 {
            let offset = (dx + dy * arena.grid().count[0] as i32) as usize;
            neighbor_offsets.push(offset);
        }
    }
    *arena.neighbor_offsets_mut() = neighbor_offsets;

    // Initialize particle positions (triangle layout)
    let domain_width = GLOBALS.box_max - GLOBALS.box_min;
    let triangle_base_y = GLOBALS.box_min + 0.1;
    let triangle_top_y = GLOBALS.box_max - 0.1;
    let triangle_height = triangle_top_y - triangle_base_y;
    let triangle_base_width = domain_width - 0.2;
    
    let aspect_ratio = triangle_base_width / triangle_height;
    let approx_rows = (N as f64 / (0.5 * aspect_ratio)).sqrt();
    let rows = (approx_rows.ceil() as usize).max(1);
    
    let mut particle_index = 0;
    
    for row in 0..rows {
        if particle_index >= N { break; }
        
        let row_progress = if rows > 1 { row as f64 / (rows - 1) as f64 } else { 0.0 };
        let y = triangle_base_y + row_progress * triangle_height;
        
        let width_at_height = triangle_base_width * (1.0 - row_progress);
        let particles_in_row = ((width_at_height / triangle_height * approx_rows).ceil() as usize).max(1);
        let spacing = if particles_in_row > 1 { 
            width_at_height / (particles_in_row - 1) as f64 
        } else { 
            0.0 
        };
        
        for col in 0..particles_in_row {
            if particle_index >= N { break; }
            
            let x = GLOBALS.box_min + 0.1 + col as f64 * spacing;
            
            // Set positions
            arena.x()[particle_index] = x as f32;
            arena.y()[particle_index] = y as f32;
            arena.z()[particle_index] = 0.0;
            
            // Set velocities to zero
            arena.vx()[particle_index] = 0.0;
            arena.vy()[particle_index] = 0.0;
            arena.vz()[particle_index] = 0.0;
            
            // Set accelerations to zero
            arena.ax()[particle_index] = 0.0;
            arena.ay()[particle_index] = 0.0;
            arena.az()[particle_index] = 0.0;
            arena.ax_()[particle_index] = 0.0;
            arena.ay_()[particle_index] = 0.0;
            arena.az_()[particle_index] = 0.0;
            
            // Set density and pressure to zero
            arena.rho()[particle_index] = 0.0;
            arena.p()[particle_index] = 0.0;
            
            particle_index += 1;
        }
    }
}
use crate::state::State;
use crate::constants::{N, GLOBALS};
use crate::spatial_hash::compute_grid;

pub fn fill_state(state: &mut State) {
    // Initialize grid structure
    let extents = [
        &[GLOBALS.box_min as f32, GLOBALS.box_max as f32],
        &[GLOBALS.box_min as f32, GLOBALS.box_max as f32], 
        &[0.0_f32, 0.0_f32]
    ];
    let grid = compute_grid(&extents, GLOBALS.smoothing_radius as f32);
    let n_cells = grid.count.iter().product();
    
    // Initialize collections
    state.grid = grid;
    state.cell_contents = vec![Vec::new(); n_cells];
    state.point_to_cell = vec![0; N];
    state.neighbors = vec![Vec::new(); N];
    
    // Initialize scalar values
    state.particle_mass = 1.0 / N as f32;
    state.inv_h = 1.0 / GLOBALS.smoothing_radius as f32;
    
    let reference_density = 2.0 / (GLOBALS.box_max - GLOBALS.box_min).powi(2);
    state.inv_reference_density = 1.0 / reference_density as f32;
    state.tait_b = (reference_density * GLOBALS.tait_c * GLOBALS.tait_c / GLOBALS.tait_gamma) as f32;
    
    // Initialize neighbor offsets
    let mut neighbor_offsets = Vec::new();
    for dx in -1..=1 {
        for dy in -1..=1 {
            let offset = (dx + dy * state.grid.count[0] as i32) as usize;
            neighbor_offsets.push(offset);
        }
    }
    state.neighbor_offsets = neighbor_offsets;

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
            state.x[particle_index] = x as f32;
            state.y[particle_index] = y as f32;
            state.z[particle_index] = 0.0;
            
            // Set velocities to zero
            state.vx[particle_index] = 0.0;
            state.vy[particle_index] = 0.0;
            state.vz[particle_index] = 0.0;
            
            // Set accelerations to zero
            state.ax[particle_index] = 0.0;
            state.ay[particle_index] = 0.0;
            state.az[particle_index] = 0.0;
            state.ax_[particle_index] = 0.0;
            state.ay_[particle_index] = 0.0;
            state.az_[particle_index] = 0.0;
            
            // Set density and pressure to zero
            state.rho[particle_index] = 0.0;
            state.p[particle_index] = 0.0;
            
            particle_index += 1;
        }
    }
}
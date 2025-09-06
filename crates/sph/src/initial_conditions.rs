use crate::arena::*;

const N: usize = 1000;

pub fn fill_arena() {
    let box_min = -1.6f32;
    let box_max = 1.6f32;
    let domain_width = box_max - box_min;

    let triangle_base_y = box_min + 0.1;
    let triangle_top_y = box_max - 0.1;
    let triangle_height = triangle_top_y - triangle_base_y;
    let triangle_base_width = domain_width - 0.2;

    let aspect_ratio = triangle_base_width / triangle_height;
    let approx_rows = ((N as f32) / (0.5 * aspect_ratio)).sqrt();
    let rows = (approx_rows.ceil() as usize).max(1);

    let x_slice = x();
    let y_slice = y();
    let z_slice = z();
    let vx_slice = vx();
    let vy_slice = vy();
    let vz_slice = vz();
    let ax_slice = ax();
    let ay_slice = ay();
    let az_slice = az();
    let ax_prev = ax_();
    let ay_prev = ay_();
    let az_prev = az_();
    let rho_slice = rho();
    let p_slice = p();

    let mut particle_index = 0;

    for row in 0..rows {
        if particle_index >= N { break; }

        let row_progress = if rows > 1 { row as f32 / (rows - 1) as f32 } else { 0.0 };
        let y = triangle_base_y + row_progress * triangle_height;

        let width_at_height = triangle_base_width * (1.0 - row_progress);

        let particles_in_row = ((width_at_height / triangle_height * approx_rows).ceil() as usize).max(1);

        let spacing = if particles_in_row > 1 {
            width_at_height / (particles_in_row - 1) as f32
        } else {
            0.0
        };

        for col in 0..particles_in_row {
            if particle_index >= N { break; }

            let x = box_min + 0.1 + col as f32 * spacing;

            x_slice[particle_index] = x;
            y_slice[particle_index] = y;
            z_slice[particle_index] = 0.0;

            vx_slice[particle_index] = 0.0;
            vy_slice[particle_index] = 0.0;
            vz_slice[particle_index] = 0.0;

            ax_slice[particle_index] = 0.0;
            ay_slice[particle_index] = 0.0;
            az_slice[particle_index] = 0.0;
            ax_prev[particle_index] = 0.0;
            ay_prev[particle_index] = 0.0;
            az_prev[particle_index] = 0.0;

            rho_slice[particle_index] = 0.0;
            p_slice[particle_index] = 0.0;

            particle_index += 1;
        }
    }
}
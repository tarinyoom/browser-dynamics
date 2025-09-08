use crate::arena::Arena;
use crate::constants::N;

pub fn fill_arena(arena: &mut Arena) {
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

            { arena.x()[particle_index] = x; }
            { arena.y()[particle_index] = y; }
            { arena.z()[particle_index] = 0.0; }

            { arena.vx()[particle_index] = 0.0; }
            { arena.vy()[particle_index] = 0.0; }
            { arena.vz()[particle_index] = 0.0; }

            { arena.ax()[particle_index] = 0.0; }
            { arena.ay()[particle_index] = 0.0; }
            { arena.az()[particle_index] = 0.0; }
            { arena.ax_()[particle_index] = 0.0; }
            { arena.ay_()[particle_index] = 0.0; }
            { arena.az_()[particle_index] = 0.0; }

            { arena.rho()[particle_index] = 0.0; }
            { arena.p()[particle_index] = 0.0; }

            particle_index += 1;
        }
    }
}
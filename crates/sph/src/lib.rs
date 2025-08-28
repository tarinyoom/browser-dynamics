use wasm_bindgen::prelude::*;

const N: usize = 1000;
const ARENA_SIZE: usize = N * 14;

static mut ARENA: [f32; ARENA_SIZE] = [0.0; ARENA_SIZE];

#[wasm_bindgen]
pub fn arena_len() -> usize { ARENA_SIZE }

#[wasm_bindgen]
pub fn arena_ptr() -> *const f32 {
    unsafe { ARENA.as_ptr() }
}

#[wasm_bindgen]
pub fn fill_arena(v: f32) {
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

pub fn x() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(0 * N), N) }
}

pub fn y() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(1 * N), N) }
}

pub fn z() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(2 * N), N) }
}

pub fn vx() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(3 * N), N) }
}

pub fn vy() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(4 * N), N) }
}

pub fn vz() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(5 * N), N) }
}

pub fn ax() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(6 * N), N) }
}

pub fn ay() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(7 * N), N) }
}

pub fn az() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(8 * N), N) }
}

pub fn ax_() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(9 * N), N) }
}

pub fn ay_() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(10 * N), N) }
}

pub fn az_() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(11 * N), N) }
}

pub fn rho() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(12 * N), N) }
}

pub fn p() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(13 * N), N) }
}

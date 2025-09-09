use crate::constants::{GLOBALS, N};
use crate::state::State;
use crate::spatial_hash::{populate_grid, find_neighbors};
use crate::kernel::{kernel, d_kernel};

fn initialize_timestep(state: &mut State) {
    // Populate the spatial grid for neighbor finding
    populate_grid(
        &state.x,
        &state.y,
        &state.z,
        &state.grid,
        &mut state.cell_contents,
        &mut state.point_to_cell,
        N,
        state.inv_h,
    );
    
    // Find neighbors based on the populated grid
    find_neighbors(&state.grid, &state.cell_contents, &mut state.neighbors);
    
    // Store previous accelerations, reset current ones, and reset densities in single loop
    for i in 0..N {
        state.ax_[i] = state.ax[i];
        state.ay_[i] = state.ay[i];
        state.az_[i] = state.az[i];
        
        state.ax[i] = 0.0;
        state.ay[i] = 0.0;
        state.az[i] = 0.0;
        
        state.rho[i] = 0.0;
    }
}

fn add_density(state: &mut State, i: usize, j: usize, symm: bool) {
    let dx = state.x[i] - state.x[j];
    let dy = state.y[i] - state.y[j];
    let dz = state.z[i] - state.z[j];

    let r2 = dx * dx + dy * dy + dz * dz;

    let smoothing_radius = GLOBALS.smoothing_radius as f32;
    if r2 > smoothing_radius * smoothing_radius {
        return;
    }

    let d = r2.sqrt();
    let density = kernel(d as f64, state.inv_h as f64) as f32 * state.particle_mass;

    state.rho[i] += density;
    if symm {
        state.rho[j] += density;
    }
}

fn add_densities(state: &mut State) {
    // Accumulate densities using neighbors (following TypeScript accumulateDensities)
    for i in 0..N {
        let neighbor_count = state.neighbors[i].len();
        for j_idx in 0..neighbor_count {
            let j = state.neighbors[i][j_idx];
            add_density(state, i, j, true);
        }
        // Self contribution
        add_density(state, i, i, false);
    }
}

fn compute_pressures(state: &mut State) {
    for i in 0..N {
        let density = state.rho[i];
        let pressure = state.tait_b * ((density * state.inv_reference_density).powf(GLOBALS.tait_gamma as f32) - 1.0);
        state.p[i] = pressure;
    }
}

fn accelerate_along_pressure_gradient(state: &mut State, i: usize, j: usize) {
    if state.rho[i] <= 0.0 || state.rho[j] <= 0.0 {
        return;
    }

    let dx = state.x[i] - state.x[j];
    let dy = state.y[i] - state.y[j];

    let r2 = dx * dx + dy * dy;

    let smoothing_radius = GLOBALS.smoothing_radius as f32;
    if r2 > smoothing_radius * smoothing_radius {
        return;
    }

    let d = r2.sqrt();

    if d < 0.2 * smoothing_radius {
        return;
    }

    let rho_i_sq = state.rho[i] * state.rho[i];
    let rho_j_sq = state.rho[j] * state.rho[j];

    let pi = state.p[i] / rho_i_sq;
    let pj = state.p[j] / rho_j_sq;

    let inv_d = 1.0 / d;

    let dx_normed = dx * inv_d;
    let dy_normed = dy * inv_d;

    let scale = d_kernel(d as f64, state.inv_h as f64) as f32 * (pi + pj) * state.particle_mass;

    let ax = dx_normed * scale;
    let ay = dy_normed * scale;

    state.ax[i] -= ax;
    state.ay[i] -= ay;

    state.ax[j] += ax;
    state.ay[j] += ay;
}

fn add_momentum(state: &mut State) {
    for i in 0..N {
        let neighbor_count = state.neighbors[i].len();
        for j_idx in 0..neighbor_count {
            let j = state.neighbors[i][j_idx];
            accelerate_along_pressure_gradient(state, i, j);
        }
    }
}

fn leapfrog(state: &mut State) {
    let dt = GLOBALS.timestep as f32;
    let dt_sq_half = 0.5 * dt * dt;
    let dt_half = 0.5 * dt;
    
    for i in 0..N {
        state.x[i] += state.vx[i] * dt + state.ax_[i] * dt_sq_half;
        state.y[i] += state.vy[i] * dt + state.ay_[i] * dt_sq_half;
        
        state.vx[i] += (state.ax_[i] + state.ax[i]) * dt_half;
        state.vy[i] += (state.ay_[i] + state.ay[i]) * dt_half;
    }
}

fn reflect(state: &mut State) {
    let box_min = GLOBALS.box_min as f32;
    let box_max = GLOBALS.box_max as f32;
    let is_3d = GLOBALS.dim > 2;
    
    for i in 0..N {
        if state.x[i] < box_min {
            state.x[i] = box_min;
            state.vx[i] *= -1.0;
        } else if state.x[i] > box_max {
            state.x[i] = box_max;
            state.vx[i] *= -1.0;
        }
        
        if state.y[i] < box_min {
            state.y[i] = box_min;
            state.vy[i] *= -1.0;
        } else if state.y[i] > box_max {
            state.y[i] = box_max;
            state.vy[i] *= -1.0;
        }
        
        if is_3d {
            if state.z[i] < box_min {
                state.z[i] = box_min;
                state.vz[i] *= -1.0;
            } else if state.z[i] > box_max {
                state.z[i] = box_max;
                state.vz[i] *= -1.0;
            }
        }
    }
}

pub fn update(state: &mut State) {
    initialize_timestep(state);
    add_densities(state);
    compute_pressures(state);

    // Add gravity to accelerations
    let gravity = GLOBALS.gravity as f32;
    for i in 0..N {
        state.ay[i] += gravity;
    }
    
    add_momentum(state);
    
    reflect(state);
    leapfrog(state);
}
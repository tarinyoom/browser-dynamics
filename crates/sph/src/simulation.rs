use crate::constants::{GLOBALS, N};
use crate::state::State;

fn initialize_timestep(state: &mut State) {
    // Store previous accelerations and reset current ones
    for i in 0..N {
        let ax_prev_val = state.ax[i];
        let ay_prev_val = state.ay[i];
        let az_prev_val = state.az[i];
        
        state.ax_[i] = ax_prev_val;
        state.ay_[i] = ay_prev_val;
        state.az_[i] = az_prev_val;
        
        state.ax[i] = 0.0;
        state.ay[i] = 0.0;
        state.az[i] = 0.0;
    }
    
    // Reset densities
    for i in 0..N {
        state.rho[i] = 0.0;
    }
}

fn add_densities(state: &mut State) {
    for i in 0..N {
        state.rho[i] += 2.1;
    }
}

fn leapfrog(state: &mut State) {
    let dt = GLOBALS.timestep as f32;
    
    for i in 0..N {
        let vx_val = state.vx[i];
        let vy_val = state.vy[i];
        let ax_prev_val = state.ax_[i];
        let ay_prev_val = state.ay_[i];
        
        state.x[i] += vx_val * dt + 0.5 * ax_prev_val * dt * dt;
        state.y[i] += vy_val * dt + 0.5 * ay_prev_val * dt * dt;
        
        let ax_val = state.ax[i];
        let ay_val = state.ay[i];
        
        state.vx[i] += 0.5 * (ax_prev_val + ax_val) * dt;
        state.vy[i] += 0.5 * (ay_prev_val + ay_val) * dt;
    }
}

fn reflect(state: &mut State) {
    let box_min = GLOBALS.box_min as f32;
    let box_max = GLOBALS.box_max as f32;
    
    for i in 0..N {
        {
            let px_val = state.x[i];
            if px_val < box_min {
                state.x[i] = box_min;
                state.vx[i] *= -1.0;
            } else if px_val > box_max {
                state.x[i] = box_max;
                state.vx[i] *= -1.0;
            }
        }
        
        {
            let py_val = state.y[i];
            if py_val < box_min {
                state.y[i] = box_min;
                state.vy[i] *= -1.0;
            } else if py_val > box_max {
                state.y[i] = box_max;
                state.vy[i] *= -1.0;
            }
        }
        
        if GLOBALS.dim > 2 {
            let pz_val = state.z[i];
            if pz_val < box_min {
                state.z[i] = box_min;
                state.vz[i] *= -1.0;
            } else if pz_val > box_max {
                state.z[i] = box_max;
                state.vz[i] *= -1.0;
            }
        }
    }
}

pub fn update(state: &mut State) {
    initialize_timestep(state);
    add_densities(state);

    // Add gravity to accelerations
    for i in 0..N {
        state.ay[i] += GLOBALS.gravity as f32;
    }
    
    reflect(state);
    leapfrog(state);
}
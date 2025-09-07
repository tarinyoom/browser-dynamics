use crate::constants::{GLOBALS, N};
use crate::arena::{x, y, z, vx, vy, vz, ax, ay, az, ax_, ay_, az_, rho};

fn initialize_timestep() {
    let ax_slice = ax();
    let ay_slice = ay();
    let az_slice = az();
    let ax_prev = ax_();
    let ay_prev = ay_();
    let az_prev = az_();
    let densities = rho();
    
    // Store previous accelerations and reset current ones
    for i in 0..N {
        ax_prev[i] = ax_slice[i];
        ay_prev[i] = ay_slice[i];
        az_prev[i] = az_slice[i];
        ax_slice[i] = 0.0;
        ay_slice[i] = 0.0;
        az_slice[i] = 0.0;
    }
    
    // Reset densities
    for i in 0..N {
        densities[i] = 0.0;
    }
}

fn add_densities() {
    let densities = rho();
    for i in 0..N {
        densities[i] += 2.1;
    }
}

fn leapfrog() {
    let px = x();
    let py = y();
    let vx_slice = vx();
    let vy_slice = vy();
    let ax_slice = ax();
    let ay_slice = ay();
    let ax_prev = ax_();
    let ay_prev = ay_();
    
    let dt = GLOBALS.timestep as f32;
    
    for i in 0..N {
        px[i] += vx_slice[i] * dt + 0.5 * ax_prev[i] * dt * dt;
        py[i] += vy_slice[i] * dt + 0.5 * ay_prev[i] * dt * dt;
        
        vx_slice[i] += 0.5 * (ax_prev[i] + ax_slice[i]) * dt;
        vy_slice[i] += 0.5 * (ay_prev[i] + ay_slice[i]) * dt;
    }
}

fn reflect() {
    let px = x();
    let py = y();
    let pz = z();
    let vx_slice = vx();
    let vy_slice = vy();
    let vz_slice = vz();
    
    let box_min = GLOBALS.box_min as f32;
    let box_max = GLOBALS.box_max as f32;
    
    for i in 0..N {
        if px[i] < box_min {
            px[i] = box_min;
            vx_slice[i] *= -1.0;
        } else if px[i] > box_max {
            px[i] = box_max;
            vx_slice[i] *= -1.0;
        }
        
        if py[i] < box_min {
            py[i] = box_min;
            vy_slice[i] *= -1.0;
        } else if py[i] > box_max {
            py[i] = box_max;
            vy_slice[i] *= -1.0;
        }
        
        if GLOBALS.dim > 2 {
            if pz[i] < box_min {
                pz[i] = box_min;
                vz_slice[i] *= -1.0;
            } else if pz[i] > box_max {
                pz[i] = box_max;
                vz_slice[i] *= -1.0;
            }
        }
    }
}

pub fn update() {
    initialize_timestep();
    add_densities();

    // Add gravity to accelerations
    let ay_slice = ay();
    for i in 0..N {
        ay_slice[i] += GLOBALS.gravity as f32;
    }
    
    reflect();
    leapfrog();
}
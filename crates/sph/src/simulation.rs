use crate::constants::{GLOBALS, N};
use crate::arena::Arena;

fn initialize_timestep(arena: &mut Arena) {
    // Store previous accelerations and reset current ones
    for i in 0..N {
        let ax_prev_val = { arena.ax()[i] };
        let ay_prev_val = { arena.ay()[i] };
        let az_prev_val = { arena.az()[i] };
        
        { arena.ax_()[i] = ax_prev_val; }
        { arena.ay_()[i] = ay_prev_val; }
        { arena.az_()[i] = az_prev_val; }
        
        { arena.ax()[i] = 0.0; }
        { arena.ay()[i] = 0.0; }
        { arena.az()[i] = 0.0; }
    }
    
    // Reset densities
    for i in 0..N {
        arena.rho()[i] = 0.0;
    }
}

fn add_densities(arena: &mut Arena) {
    for i in 0..N {
        arena.rho()[i] += 2.1;
    }
}

fn leapfrog(arena: &mut Arena) {
    let dt = GLOBALS.timestep as f32;
    
    for i in 0..N {
        let vx_val = { arena.vx()[i] };
        let vy_val = { arena.vy()[i] };
        let ax_prev_val = { arena.ax_()[i] };
        let ay_prev_val = { arena.ay_()[i] };
        
        { arena.x()[i] += vx_val * dt + 0.5 * ax_prev_val * dt * dt; }
        { arena.y()[i] += vy_val * dt + 0.5 * ay_prev_val * dt * dt; }
        
        let ax_val = { arena.ax()[i] };
        let ay_val = { arena.ay()[i] };
        
        { arena.vx()[i] += 0.5 * (ax_prev_val + ax_val) * dt; }
        { arena.vy()[i] += 0.5 * (ay_prev_val + ay_val) * dt; }
    }
}

fn reflect(arena: &mut Arena) {
    let box_min = GLOBALS.box_min as f32;
    let box_max = GLOBALS.box_max as f32;
    
    for i in 0..N {
        {
            let px_val = arena.x()[i];
            if px_val < box_min {
                arena.x()[i] = box_min;
                arena.vx()[i] *= -1.0;
            } else if px_val > box_max {
                arena.x()[i] = box_max;
                arena.vx()[i] *= -1.0;
            }
        }
        
        {
            let py_val = arena.y()[i];
            if py_val < box_min {
                arena.y()[i] = box_min;
                arena.vy()[i] *= -1.0;
            } else if py_val > box_max {
                arena.y()[i] = box_max;
                arena.vy()[i] *= -1.0;
            }
        }
        
        if GLOBALS.dim > 2 {
            let pz_val = arena.z()[i];
            if pz_val < box_min {
                arena.z()[i] = box_min;
                arena.vz()[i] *= -1.0;
            } else if pz_val > box_max {
                arena.z()[i] = box_max;
                arena.vz()[i] *= -1.0;
            }
        }
    }
}

pub fn update(arena: &mut Arena) {
    initialize_timestep(arena);
    add_densities(arena);

    // Add gravity to accelerations
    for i in 0..N {
        arena.ay()[i] += GLOBALS.gravity as f32;
    }
    
    reflect(arena);
    leapfrog(arena);
}
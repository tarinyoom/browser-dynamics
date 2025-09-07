use crate::constants::{GLOBALS, N};
use crate::arena::{x, y, vx, vy};

pub fn update() {
    let px = x();
    let py = y();
    let vx_slice = vx();
    let vy_slice = vy();
    
    let dt = GLOBALS.timestep as f32;
    let box_min = GLOBALS.box_min as f32;
    let box_max = GLOBALS.box_max as f32;
    
    for i in 0..N {
        // Apply gravity to velocity
        vy_slice[i] += GLOBALS.gravity as f32 * dt;
        
        // Update positions
        px[i] += vx_slice[i] * dt;
        py[i] += vy_slice[i] * dt;
        
        // Bounce off walls
        if px[i] < box_min {
            px[i] = box_min;
            vx_slice[i] = -vx_slice[i];
        } else if px[i] > box_max {
            px[i] = box_max;
            vx_slice[i] = -vx_slice[i];
        }
        
        if py[i] < box_min {
            py[i] = box_min;
            vy_slice[i] = -vy_slice[i];
        } else if py[i] > box_max {
            py[i] = box_max;
            vy_slice[i] = -vy_slice[i];
        }
    }
}
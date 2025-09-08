use sph::{arena_len, update};

fn main() {
    println!("SPH Simulation CLI");
    
    println!("Initial particle count: {}", arena_len());
    
    println!("Running simulation step...");
    update();
    
    println!("Simulation step completed");
    println!("Final particle count: {}", arena_len());
}
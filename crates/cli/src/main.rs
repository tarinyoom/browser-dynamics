use sph::{state::State, simulation};

fn main() {
    println!("SPH Simulation CLI");
    
    let mut state = State::new();
    
    println!("Initial particle count: {}", state.len());
    
    println!("Running simulation step...");
    simulation::update(&mut state);
    
    println!("Simulation step completed");
    println!("Final particle count: {}", state.len());
}
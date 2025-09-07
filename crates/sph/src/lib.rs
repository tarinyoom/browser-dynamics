use wasm_bindgen::prelude::*;

pub mod spatial_hash;
pub mod kernel;
pub mod arena;
pub mod initial_conditions;
pub mod constants;
pub mod simulation;

#[wasm_bindgen]
pub fn arena_len() -> usize { 
    arena::arena_len()
}

#[wasm_bindgen]
pub fn arena_ptr() -> *const f32 {
    arena::arena_ptr()
}

#[wasm_bindgen]
pub fn fill_arena() {
    initial_conditions::fill_arena();
}

#[wasm_bindgen]
pub fn update() {
    simulation::update();
}

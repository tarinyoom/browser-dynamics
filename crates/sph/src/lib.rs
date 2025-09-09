use wasm_bindgen::prelude::*;
use std::sync::{Mutex, OnceLock};

pub mod spatial_hash;
pub mod kernel;
pub mod state;
pub mod initial_conditions;
pub mod constants;
pub mod simulation;

static STATE: OnceLock<Mutex<state::State>> = OnceLock::new();

fn get_state() -> &'static Mutex<state::State> {
    STATE.get_or_init(|| Mutex::new(state::State::new()))
}

#[wasm_bindgen]
pub fn arena_len() -> usize { 
    get_state().lock().unwrap().len()
}

#[wasm_bindgen]
pub fn arena_ptr() -> *const f32 {
    get_state().lock().unwrap().ptr()
}

#[wasm_bindgen]
pub fn update() {
    let mut state_guard = get_state().lock().unwrap();
    simulation::update(&mut *state_guard);
}

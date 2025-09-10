use wasm_bindgen::prelude::*;
use std::sync::{Mutex, OnceLock};
use sph::state::State;
use sph::simulation;

static STATE: OnceLock<Mutex<State>> = OnceLock::new();

fn get_state() -> &'static Mutex<State> {
    STATE.get_or_init(|| Mutex::new(State::new()))
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

#[wasm_bindgen]
pub fn num_particles() -> usize {
    sph::constants::N
}

#[wasm_bindgen]
pub fn get_x() -> *const f32 {
    get_state().lock().unwrap().x.as_ptr()
}

#[wasm_bindgen]
pub fn get_y() -> *const f32 {
    get_state().lock().unwrap().y.as_ptr()
}

#[wasm_bindgen]
pub fn get_z() -> *const f32 {
    get_state().lock().unwrap().z.as_ptr()
}

#[wasm_bindgen]
pub fn get_rho() -> *const f32 {
    get_state().lock().unwrap().rho.as_ptr()
}
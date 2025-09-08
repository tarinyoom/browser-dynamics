use wasm_bindgen::prelude::*;
use std::sync::{Mutex, OnceLock};

pub mod spatial_hash;
pub mod kernel;
pub mod arena;
pub mod initial_conditions;
pub mod constants;
pub mod simulation;

static ARENA: OnceLock<Mutex<arena::Arena>> = OnceLock::new();

fn get_arena() -> &'static Mutex<arena::Arena> {
    ARENA.get_or_init(|| Mutex::new(arena::Arena::new()))
}

#[wasm_bindgen]
pub fn arena_len() -> usize { 
    get_arena().lock().unwrap().len()
}

#[wasm_bindgen]
pub fn arena_ptr() -> *const f32 {
    get_arena().lock().unwrap().ptr()
}

#[wasm_bindgen]
pub fn update() {
    let mut arena_guard = get_arena().lock().unwrap();
    simulation::update(&mut *arena_guard);
}

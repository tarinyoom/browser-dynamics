use wasm_bindgen::prelude::*;

const N: usize = 3000;

static mut ARENA: [f32; N] = [0.0; N];

#[wasm_bindgen]
pub fn arena_len() -> usize { N }

#[wasm_bindgen]
pub fn arena_ptr() -> *const f32 {
    unsafe { ARENA.as_ptr() }
}

#[wasm_bindgen]
pub fn fill_arena(v: f32) {
    unsafe {
        for x in ARENA.iter_mut() { *x = v; }
    }
}

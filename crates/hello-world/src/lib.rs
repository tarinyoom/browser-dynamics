use wasm_bindgen::prelude::*;

// 1) A tiny function
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 2) Strings cross the boundary via binding glue:
#[wasm_bindgen]
pub fn shout(name: &str) -> String {
    format!("HELLO, {name}!")
}

// 3) Zero-copy-ish array interop: JS views into wasm memory
#[wasm_bindgen]
pub fn sum_f32(ptr: *const f32, len: usize) -> f32 {
    // Safety: called correctly from JS with a typed array backed by wasm memory.
    let slice = unsafe { std::slice::from_raw_parts(ptr, len) };
    slice.iter().copied().sum()
}

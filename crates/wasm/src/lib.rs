use wasm_bindgen::prelude::*;
use std::sync::{Mutex, OnceLock};
use sph::state::State;
use sph::simulation;

static STATE: OnceLock<Mutex<State>> = OnceLock::new();

fn get_state() -> &'static Mutex<State> {
    STATE.get_or_init(|| Mutex::new(State::new()))
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
pub fn get_state_ptr() -> *const f32 {
    get_state().lock().unwrap().ptr()
}

#[wasm_bindgen]
pub fn get_x_ptr() -> *const f32 {
    get_state().lock().unwrap().x.as_ptr()
}

#[wasm_bindgen]
pub fn get_y_ptr() -> *const f32 {
    get_state().lock().unwrap().y.as_ptr()
}

#[wasm_bindgen]
pub fn get_z_ptr() -> *const f32 {
    get_state().lock().unwrap().z.as_ptr()
}

#[wasm_bindgen]
pub fn get_rho_ptr() -> *const f32 {
    get_state().lock().unwrap().rho.as_ptr()
}

#[wasm_bindgen]
pub fn draw_checkerboard(canvas: web_sys::HtmlCanvasElement) -> Result<(), JsValue> {
    let ctx = canvas
        .get_context("2d")?
        .ok_or("Could not get 2D context")?
        .dyn_into::<web_sys::CanvasRenderingContext2d>()?;

    let width = canvas.width();
    let height = canvas.height();
    let square_size = 50;
    let cols = (width + square_size - 1) / square_size; // ceiling division
    let rows = (height + square_size - 1) / square_size;

    for row in 0..rows {
        for col in 0..cols {
            let color = if (row + col) % 2 == 0 {
                "#000000"
            } else {
                "#ff69b4" // pink
            };
            ctx.set_fill_style_str(color);
            ctx.fill_rect(
                (col * square_size) as f64,
                (row * square_size) as f64,
                square_size as f64,
                square_size as f64,
            );
        }
    }

    Ok(())
}
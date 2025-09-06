const N: usize = 1000;
const ARENA_SIZE: usize = N * 14;

static mut ARENA: [f32; ARENA_SIZE] = [0.0; ARENA_SIZE];

pub fn arena_len() -> usize { 
    ARENA_SIZE 
}

pub fn arena_ptr() -> *const f32 {
    unsafe { ARENA.as_ptr() }
}

pub fn x() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(0 * N), N) }
}

pub fn y() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(1 * N), N) }
}

pub fn z() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(2 * N), N) }
}

pub fn vx() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(3 * N), N) }
}

pub fn vy() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(4 * N), N) }
}

pub fn vz() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(5 * N), N) }
}

pub fn ax() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(6 * N), N) }
}

pub fn ay() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(7 * N), N) }
}

pub fn az() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(8 * N), N) }
}

pub fn ax_() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(9 * N), N) }
}

pub fn ay_() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(10 * N), N) }
}

pub fn az_() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(11 * N), N) }
}

pub fn rho() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(12 * N), N) }
}

pub fn p() -> &'static mut [f32] {
    unsafe { std::slice::from_raw_parts_mut(ARENA.as_mut_ptr().add(13 * N), N) }
}
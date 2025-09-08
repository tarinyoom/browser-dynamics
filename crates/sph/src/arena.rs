use crate::constants::{N, ARENA_SIZE};
use crate::initial_conditions::fill_arena;

pub struct Arena {
    data: [f32; ARENA_SIZE],
}

impl Arena {
    pub fn new() -> Self {
        let mut arena = Arena {
            data: [0.0; ARENA_SIZE],
        };
        fill_arena(&mut arena);
        arena
    }

    pub fn len(&self) -> usize { 
        ARENA_SIZE 
    }

    pub fn ptr(&self) -> *const f32 {
        self.data.as_ptr()
    }

    pub fn x(&mut self) -> &mut [f32] {
        &mut self.data[0 * N..(0 * N) + N]
    }

    pub fn y(&mut self) -> &mut [f32] {
        &mut self.data[1 * N..(1 * N) + N]
    }

    pub fn z(&mut self) -> &mut [f32] {
        &mut self.data[2 * N..(2 * N) + N]
    }

    pub fn vx(&mut self) -> &mut [f32] {
        &mut self.data[3 * N..(3 * N) + N]
    }

    pub fn vy(&mut self) -> &mut [f32] {
        &mut self.data[4 * N..(4 * N) + N]
    }

    pub fn vz(&mut self) -> &mut [f32] {
        &mut self.data[5 * N..(5 * N) + N]
    }

    pub fn ax(&mut self) -> &mut [f32] {
        &mut self.data[6 * N..(6 * N) + N]
    }

    pub fn ay(&mut self) -> &mut [f32] {
        &mut self.data[7 * N..(7 * N) + N]
    }

    pub fn az(&mut self) -> &mut [f32] {
        &mut self.data[8 * N..(8 * N) + N]
    }

    pub fn ax_(&mut self) -> &mut [f32] {
        &mut self.data[9 * N..(9 * N) + N]
    }

    pub fn ay_(&mut self) -> &mut [f32] {
        &mut self.data[10 * N..(10 * N) + N]
    }

    pub fn az_(&mut self) -> &mut [f32] {
        &mut self.data[11 * N..(11 * N) + N]
    }

    pub fn rho(&mut self) -> &mut [f32] {
        &mut self.data[12 * N..(12 * N) + N]
    }

    pub fn p(&mut self) -> &mut [f32] {
        &mut self.data[13 * N..(13 * N) + N]
    }
}
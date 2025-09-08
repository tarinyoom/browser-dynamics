use crate::constants::{N, ARENA_SIZE};
use crate::initial_conditions::fill_arena;
use crate::spatial_hash::Grid;

pub struct Arena {
    data: [f32; ARENA_SIZE],
    grid: Grid,
    cell_contents: Vec<Vec<usize>>,
    point_to_cell: Vec<usize>,
    neighbors: Vec<Vec<usize>>,
    particle_mass: f32,
    inv_h: f32,
    neighbor_offsets: Vec<usize>,
    inv_reference_density: f32,
    tait_b: f32,
}

impl Arena {
    pub fn new() -> Self {
        let mut arena = Arena {
            data: [0.0; ARENA_SIZE],
            grid: Grid { count: Vec::new(), offset: Vec::new() },
            cell_contents: Vec::new(),
            point_to_cell: vec![0; N],
            neighbors: vec![Vec::new(); N],
            particle_mass: 0.0,
            inv_h: 0.0,
            neighbor_offsets: Vec::new(),
            inv_reference_density: 0.0,
            tait_b: 0.0,
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

    pub fn grid(&self) -> &Grid {
        &self.grid
    }

    pub fn grid_mut(&mut self) -> &mut Grid {
        &mut self.grid
    }

    pub fn cell_contents(&self) -> &Vec<Vec<usize>> {
        &self.cell_contents
    }

    pub fn cell_contents_mut(&mut self) -> &mut Vec<Vec<usize>> {
        &mut self.cell_contents
    }

    pub fn point_to_cell(&self) -> &Vec<usize> {
        &self.point_to_cell
    }

    pub fn point_to_cell_mut(&mut self) -> &mut Vec<usize> {
        &mut self.point_to_cell
    }

    pub fn neighbors(&self) -> &Vec<Vec<usize>> {
        &self.neighbors
    }

    pub fn neighbors_mut(&mut self) -> &mut Vec<Vec<usize>> {
        &mut self.neighbors
    }

    pub fn particle_mass(&self) -> f32 {
        self.particle_mass
    }

    pub fn set_particle_mass(&mut self, mass: f32) {
        self.particle_mass = mass;
    }

    pub fn inv_h(&self) -> f32 {
        self.inv_h
    }

    pub fn set_inv_h(&mut self, inv_h: f32) {
        self.inv_h = inv_h;
    }

    pub fn neighbor_offsets(&self) -> &Vec<usize> {
        &self.neighbor_offsets
    }

    pub fn neighbor_offsets_mut(&mut self) -> &mut Vec<usize> {
        &mut self.neighbor_offsets
    }

    pub fn inv_reference_density(&self) -> f32 {
        self.inv_reference_density
    }

    pub fn set_inv_reference_density(&mut self, inv_ref_density: f32) {
        self.inv_reference_density = inv_ref_density;
    }

    pub fn tait_b(&self) -> f32 {
        self.tait_b
    }

    pub fn set_tait_b(&mut self, tait_b: f32) {
        self.tait_b = tait_b;
    }
}
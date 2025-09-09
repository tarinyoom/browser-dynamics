use crate::constants::N;
use crate::initial_conditions::fill_state;
use crate::spatial_hash::Grid;

pub struct State {
    pub x: [f32; N],
    pub y: [f32; N],
    pub z: [f32; N],
    pub vx: [f32; N],
    pub vy: [f32; N],
    pub vz: [f32; N],
    pub ax: [f32; N],
    pub ay: [f32; N],
    pub az: [f32; N],
    pub ax_: [f32; N],
    pub ay_: [f32; N],
    pub az_: [f32; N],
    pub rho: [f32; N],
    pub p: [f32; N],
    pub grid: Grid,
    pub cell_contents: Vec<Vec<usize>>,
    pub point_to_cell: Vec<usize>,
    pub neighbors: Vec<Vec<usize>>,
    pub particle_mass: f32,
    pub inv_h: f32,
    pub neighbor_offsets: Vec<usize>,
    pub inv_reference_density: f32,
    pub tait_b: f32,
}

impl State {
    pub fn new() -> Self {
        let mut state = State {
            x: [0.0; N],
            y: [0.0; N],
            z: [0.0; N],
            vx: [0.0; N],
            vy: [0.0; N],
            vz: [0.0; N],
            ax: [0.0; N],
            ay: [0.0; N],
            az: [0.0; N],
            ax_: [0.0; N],
            ay_: [0.0; N],
            az_: [0.0; N],
            rho: [0.0; N],
            p: [0.0; N],
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
        fill_state(&mut state);
        state
    }

    pub fn len(&self) -> usize {
        N * 14
    }

    pub fn ptr(&self) -> *const f32 {
        self.x.as_ptr()
    }
}
#[derive(Debug, Clone, Copy)]
pub struct CalculationParameters {
    pub timestep: f64,
    pub max_timesteps_per_frame: usize,
    pub num_particles: usize,
    pub smoothing_radius: f64,
    pub dim: usize,
    pub box_min: f64,
    pub box_max: f64,
    pub gravity: f64,
    pub tait_c: f64,
    pub tait_gamma: f64,
}

pub const GLOBALS: CalculationParameters = CalculationParameters {
    timestep: 1.0 / 2000.0,
    max_timesteps_per_frame: 5,
    num_particles: 1000,
    smoothing_radius: 0.3,
    dim: 2,
    box_min: -1.6,
    box_max: 1.6,
    gravity: -200.0,
    tait_c: 10.0,
    tait_gamma: 7.0,
};

pub const N: usize = GLOBALS.num_particles;
pub const ARENA_SIZE: usize = N * 14;
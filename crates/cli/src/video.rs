use image::{ImageBuffer, Rgb, RgbImage};
use std::path::Path;

pub struct FrameGenerator {
    frames: Vec<Vec<u8>>,
    width: usize,
    height: usize,
}

impl FrameGenerator {
    pub fn new(width: usize, height: usize) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(FrameGenerator {
            frames: Vec::new(),
            width,
            height,
        })
    }

    pub fn add_frame(&mut self, pixels: Vec<u8>) -> Result<(), Box<dyn std::error::Error>> {
        self.frames.push(pixels);
        Ok(())
    }

    pub fn save_frames(&self, output_dir: &str) -> Result<(), Box<dyn std::error::Error>> {
        std::fs::create_dir_all(output_dir)?;

        for (frame_idx, frame_data) in self.frames.iter().enumerate() {
            let img: RgbImage = ImageBuffer::from_raw(
                self.width as u32,
                self.height as u32,
                frame_data.clone(),
            )
            .ok_or("Failed to create image buffer")?;

            let filename = format!("{}/frame_{:04}.png", output_dir, frame_idx);
            img.save(&filename)?;
        }

        println!("Saved {} frames to {}/", self.frames.len(), output_dir);
        Ok(())
    }
}

pub fn create_pixel_frame(width: usize, height: usize, pixel_x: usize, pixel_y: usize) -> Vec<u8> {
    let mut pixels = vec![0u8; width * height * 3]; // RGB

    // Set background to black
    for chunk in pixels.chunks_mut(3) {
        chunk[0] = 0; // R
        chunk[1] = 0; // G
        chunk[2] = 0; // B
    }

    // Set the moving pixel to white
    if pixel_x < width && pixel_y < height {
        let idx = (pixel_y * width + pixel_x) * 3;
        pixels[idx] = 255;     // R
        pixels[idx + 1] = 255; // G
        pixels[idx + 2] = 255; // B
    }

    pixels
}

pub fn generate_fluid_animation(
    width: usize,
    height: usize,
    frames: usize,
    output_dir: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    use sph::{state::State, simulation};

    let mut frame_gen = FrameGenerator::new(width, height)?;
    let mut state = State::new();

    println!("Initial particle count: {}", state.len());

    for frame in 0..frames {
        println!("Generating frame {}/{}", frame + 1, frames);

        // Update simulation state
        simulation::update(&mut state);

        // Render particles to frame
        let frame_data = render_particles(&state, width, height);
        frame_gen.add_frame(frame_data)?;
    }

    frame_gen.save_frames(output_dir)?;
    println!("Simulation completed with {} particles", state.len());
    Ok(())
}

fn render_particles(state: &sph::state::State, width: usize, height: usize) -> Vec<u8> {
    use sph::constants::N;

    let mut pixels = vec![0u8; width * height * 3]; // RGB

    // Set background to dark blue (water-like)
    for chunk in pixels.chunks_mut(3) {
        chunk[0] = 20;  // R
        chunk[1] = 50;  // G
        chunk[2] = 80;  // B
    }

    // Render each particle as a white pixel
    for i in 0..N {
        let x_pos = state.x[i];
        let y_pos = state.y[i];

        // Map particle position to screen coordinates
        // Assuming particle positions are roughly in [-1.6, 1.6] range (from constants)
        let x = ((x_pos + 1.6) / 3.2 * width as f32) as usize;
        let y = ((y_pos + 1.6) / 3.2 * height as f32) as usize;

        if x < width && y < height {
            let idx = (y * width + x) * 3;
            pixels[idx] = 255;     // R - white particle
            pixels[idx + 1] = 255; // G
            pixels[idx + 2] = 255; // B
        }
    }

    pixels
}
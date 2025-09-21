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

pub fn generate_pixel_animation(
    width: usize,
    height: usize,
    frames: usize,
    output_dir: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut frame_gen = FrameGenerator::new(width, height)?;

    for frame in 0..frames {
        let t = frame as f32 / frames as f32;

        // Circular motion
        let center_x = width as f32 / 2.0;
        let center_y = height as f32 / 2.0;
        let radius = width.min(height) as f32 / 3.0;

        let pixel_x = (center_x + radius * (t * 2.0 * std::f32::consts::PI).cos()) as usize;
        let pixel_y = (center_y + radius * (t * 2.0 * std::f32::consts::PI).sin()) as usize;

        let frame_data = create_pixel_frame(width, height, pixel_x, pixel_y);
        frame_gen.add_frame(frame_data)?;
    }

    frame_gen.save_frames(output_dir)?;
    Ok(())
}
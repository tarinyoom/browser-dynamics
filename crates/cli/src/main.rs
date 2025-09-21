use sph::{state::State, simulation};
use clap::{Parser, Subcommand};

mod video;

#[derive(Parser)]
#[command(name = "sph-cli")]
#[command(about = "SPH Simulation CLI with video generation")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run the SPH simulation
    Simulate,
    /// Generate a sequence of PNG frames
    Frames {
        #[arg(short, long, default_value = "frames")]
        output: String,
        #[arg(long, default_value_t = 640)]
        width: usize,
        #[arg(long, default_value_t = 480)]
        height: usize,
        #[arg(short, long, default_value_t = 120)]
        frames: usize,
    },
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Simulate => {
            println!("SPH Simulation CLI");
            let mut state = State::new();
            println!("Initial particle count: {}", state.len());
            println!("Running simulation step...");
            simulation::update(&mut state);
            println!("Simulation step completed");
            println!("Final particle count: {}", state.len());
        }
        Commands::Frames { output, width, height, frames } => {
            match video::generate_fluid_animation(width, height, frames, &output) {
                Ok(()) => println!("Frames generated successfully in directory: {}", output),
                Err(e) => eprintln!("Error generating frames: {}", e),
            }
        }
    }
}
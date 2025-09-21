use clap::Parser;

mod video;

#[derive(Parser)]
#[command(name = "sph-cli")]
#[command(about = "SPH Simulation frame generator")]
struct Cli {
    #[arg(short, long, default_value = "frames")]
    output: String,
    #[arg(long, default_value_t = 640)]
    width: usize,
    #[arg(long, default_value_t = 480)]
    height: usize,
    #[arg(short, long, default_value_t = 120)]
    frames: usize,
    #[arg(short, long, default_value_t = 1)]
    step_interval: usize,
}

fn main() {
    let cli = Cli::parse();

    match video::generate_fluid_animation(cli.width, cli.height, cli.frames, cli.step_interval, &cli.output) {
        Ok(()) => println!("Frames generated successfully in directory: {}", cli.output),
        Err(e) => eprintln!("Error generating frames: {}", e),
    }
}
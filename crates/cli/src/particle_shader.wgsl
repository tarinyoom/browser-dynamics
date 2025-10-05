struct VertexInput {
    @location(0) quad_vertex: vec2<f32>,
    @location(1) particle_pos: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

struct Uniforms {
    resolution: vec2<f32>,
    particle_radius: f32,
    _padding: f32,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var out: VertexOutput;

    // Calculate particle size in NDC space
    let particle_size = uniforms.particle_radius / 100.0;

    // Position the quad vertex relative to the particle position
    let vertex_pos = input.particle_pos + input.quad_vertex * particle_size;

    out.clip_position = vec4<f32>(vertex_pos, 0.0, 1.0);
    out.uv = input.quad_vertex;

    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // Create circular particle
    let dist = length(in.uv);

    if (dist > 1.0) {
        discard;
    }

    // Soft edge for antialiasing
    let alpha = 1.0 - smoothstep(0.8, 1.0, dist);

    return vec4<f32>(1.0, 1.0, 1.0, alpha);
}
import * as THREE from 'three';

// SPH Parameters
const REST_DENSITY: number = 1000; // rest density
const GAS_CONSTANT: number = 2000; // gas constant
const H: number = 16; // smoothing radius
const H2: number = H * H; // squared smoothing radius
const MASS: number = 65; // particle mass
const VISCOSITY: number = 250; // viscosity constant
const DT: number = 0.0008; // time step
const BOUND_DAMPING: number = -0.5; // boundary damping

// Container dimensions
const WIDTH: number = 600;
const HEIGHT: number = 400;

// Kernel constants
const POLY6: number = (315.0 / (64.0 * Math.PI * Math.pow(H, 9)));
const SPIKY_GRAD: number = -(45.0 / (Math.PI * Math.pow(H, 6)));
const VISC_LAP: number = (45.0 / (Math.PI * Math.pow(H, 6)));

// Simulation state
let gravity: number = 12000;
let particleCount: number = 150;
let isRunning: boolean = true;
let isDragging: boolean = false;
let dragForceX: number = 0;
let dragForceY: number = 0;
let mouseX: number = 0;
let mouseY: number = 0;

// Particle class
class Particle {
    x: number;
    y: number;
    vx: number = 0;
    vy: number = 0;
    fx: number = 0;
    fy: number = 0;
    density: number = 0;
    pressure: number = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

// Three.js objects
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let particles: Particle[] = [];
let particleMeshes: THREE.Mesh[] = [];

// Initialize the simulation
function init(): void {
    // Set up Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111133);
    
    camera = new THREE.OrthographicCamera(
        -WIDTH / 2, WIDTH / 2, 
        HEIGHT / 2, -HEIGHT / 2, 
        0.1, 1000
    );
    camera.position.z = 100;
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(WIDTH, HEIGHT);
    
    const simulationElement = document.getElementById('simulation');
    if (simulationElement) {
        simulationElement.appendChild(renderer.domElement);
    } else {
        console.error("Could not find simulation element");
        return;
    }
    
    // Initialize UI controls
    setupUIControls();
    
    // Initialize mouse/touch controls
    setupInteractionControls();
    
    // Create initial particles
    initParticles();
    
    // Start animation loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    onWindowResize();
}

// Function to initialize particles
function initParticles(): void {
    // Clear existing particles
    particles = [];
    particleMeshes.forEach(mesh => scene.remove(mesh));
    particleMeshes = [];
    
    // Create new particles
    const initialRegionWidth: number = WIDTH * 0.4;
    const startX: number = -WIDTH/2 + 50;
    const startY: number = -HEIGHT/2 + 50;
    
    const particlesPerRow: number = Math.ceil(Math.sqrt(particleCount));
    const spacing: number = initialRegionWidth / particlesPerRow;
    
    for (let i = 0; i < particleCount; i++) {
        const row: number = Math.floor(i / particlesPerRow);
        const col: number = i % particlesPerRow;
        
        const particle: Particle = new Particle(
            startX + col * spacing + (Math.random() * 5), 
            startY + row * spacing + (Math.random() * 5)
        );
        
        particles.push(particle);
        
        // Create visual representation
        const geometry: THREE.CircleGeometry = new THREE.CircleGeometry(4, 16);
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x3399ff,
            transparent: true,
            opacity: 0.8
        });
        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(particle.x, particle.y, 0);
        
        particleMeshes.push(mesh);
        scene.add(mesh);
    }
}

// SPH functions
function computeDensityPressure(): void {
    for (const particle of particles) {
        particle.density = 0;
        
        // Compute density and pressure
        for (const neighbor of particles) {
            const dx: number = neighbor.x - particle.x;
            const dy: number = neighbor.y - particle.y;
            const r2: number = dx * dx + dy * dy;
            
            if (r2 < H2) {
                // Compute density with Poly6 kernel
                particle.density += MASS * POLY6 * Math.pow(H2 - r2, 3);
            }
        }
        
        // Compute pressure using equation of state
        particle.pressure = GAS_CONSTANT * (particle.density - REST_DENSITY);
    }
}

function computeForces(): void {
    for (const particle of particles) {
        let fx: number = 0;
        let fy: number = 0;
        
        // Compute pressure and viscosity forces
        for (const neighbor of particles) {
            if (particle === neighbor) continue;
            
            const dx: number = neighbor.x - particle.x;
            const dy: number = neighbor.y - particle.y;
            const r2: number = dx * dx + dy * dy;
            
            if (r2 < H2) {
                const r: number = Math.sqrt(r2);
                const factor: number = (r > 0) ? 1 / r : 0;
                
                // Normalized direction
                const nx: number = dx * factor;
                const ny: number = dy * factor;
                
                // Pressure force
                const pressureForce: number = -MASS * (particle.pressure + neighbor.pressure) / 
                    (2 * neighbor.density) * SPIKY_GRAD * Math.pow(H - r, 2);
                fx += pressureForce * nx;
                fy += pressureForce * ny;
                
                // Viscosity force
                const vx: number = neighbor.vx - particle.vx;
                const vy: number = neighbor.vy - particle.vy;
                const viscForce: number = VISCOSITY * MASS * VISC_LAP * (H - r) / neighbor.density;
                fx += viscForce * vx;
                fy += viscForce * vy;
            }
        }
        
        // Gravity force
        fy += gravity;
        
        // Mouse interaction
        if (isDragging) {
            const dx: number = mouseX - particle.x;
            const dy: number = mouseY - particle.y;
            const r2: number = dx * dx + dy * dy;
            const dragRadius: number = 50 * 50;
            
            if (r2 < dragRadius) {
                const factor: number = 1.0 - Math.sqrt(r2) / 50;
                fx += dragForceX * factor * 500;
                fy += dragForceY * factor * 500;
            }
        }
        
        // Store forces
        particle.fx = fx;
        particle.fy = fy;
    }
}

function integrate(): void {
    // Update positions, velocities, and handle boundaries
    for (let i = 0; i < particles.length; i++) {
        const particle: Particle = particles[i];
        
        // Forward Euler integration
        particle.vx += DT * particle.fx / particle.density;
        particle.vy += DT * particle.fy / particle.density;
        
        particle.x += DT * particle.vx;
        particle.y += DT * particle.vy;
        
        // Boundary conditions
        if (particle.x < -WIDTH/2) {
            particle.vx *= BOUND_DAMPING;
            particle.x = -WIDTH/2;
        }
        
        if (particle.x > WIDTH/2) {
            particle.vx *= BOUND_DAMPING;
            particle.x = WIDTH/2;
        }
        
        if (particle.y < -HEIGHT/2) {
            particle.vy *= BOUND_DAMPING;
            particle.y = -HEIGHT/2;
        }
        
        if (particle.y > HEIGHT/2) {
            particle.vy *= BOUND_DAMPING;
            particle.y = HEIGHT/2;
        }
        
        // Update mesh position
        const mesh: THREE.Mesh = particleMeshes[i];
        mesh.position.set(particle.x, particle.y, 0);
        
        // Update color based on pressure
        const pressureColor: number = Math.min(1.0, particle.pressure / (GAS_CONSTANT * REST_DENSITY));
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.color.setRGB(
            0.2 + pressureColor * 0.8,
            0.4 + (1.0 - pressureColor) * 0.5,
            0.8 + (1.0 - pressureColor) * 0.2
        );
    }
}

// Animation loop
function animate(): void {
    requestAnimationFrame(animate);
    
    if (isRunning) {
        computeDensityPressure();
        computeForces();
        integrate();
    }
    
    renderer.render(scene, camera);
}

// UI Controls setup
function setupUIControls(): void {
    const playPauseButton = document.getElementById('playPause');
    const resetButton = document.getElementById('reset');
    const gravitySlider = document.getElementById('gravitySlider') as HTMLInputElement;
    const particleSlider = document.getElementById('particleSlider') as HTMLInputElement;
    const gravityValue = document.getElementById('gravityValue');
    const particleValue = document.getElementById('particleValue');
    
    if (playPauseButton) {
        playPauseButton.addEventListener('click', () => {
            isRunning = !isRunning;
            playPauseButton.textContent = isRunning ? 'Pause' : 'Resume';
            playPauseButton.classList.toggle('pause', isRunning);
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            initParticles();
        });
    }
    
    if (gravitySlider && gravityValue) {
        gravitySlider.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            gravity = parseFloat(target.value);
            gravityValue.textContent = gravity.toString();
        });
    }
    
    if (particleSlider && particleValue) {
        particleSlider.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            particleCount = parseInt(target.value);
            particleValue.textContent = particleCount.toString();
        });
    }
}

// Mouse and touch interaction setup
function setupInteractionControls(): void {
    // Mouse interaction
    renderer.domElement.addEventListener('mousedown', (e: MouseEvent) => {
        isDragging = true;
        updateMousePosition(e);
    });
    
    renderer.domElement.addEventListener('mousemove', (e: MouseEvent) => {
        if (isDragging) {
            const lastX: number = mouseX;
            const lastY: number = mouseY;
            updateMousePosition(e);
            dragForceX = mouseX - lastX;
            dragForceY = mouseY - lastY;
        }
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    renderer.domElement.addEventListener('mouseleave', () => {
        isDragging = false;
    });
    
    // Touch support
    renderer.domElement.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        isDragging = true;
        updateTouchPosition(e.touches[0]);
    });
    
    renderer.domElement.addEventListener('touchmove', (e: TouchEvent) => {
        e.preventDefault();
        if (isDragging) {
            const lastX: number = mouseX;
            const lastY: number = mouseY;
            updateTouchPosition(e.touches[0]);
            dragForceX = mouseX - lastX;
            dragForceY = mouseY - lastY;
        }
    });
    
    renderer.domElement.addEventListener('touchend', () => {
        isDragging = false;
    });
}

// Helper functions for mouse/touch interaction
function updateMousePosition(e: MouseEvent): void {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * WIDTH - WIDTH/2;
    mouseY = -((e.clientY - rect.top) / rect.height) * HEIGHT + HEIGHT/2;
}

function updateTouchPosition(touch: Touch): void {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseX = ((touch.clientX - rect.left) / rect.width) * WIDTH - WIDTH/2;
    mouseY = -((touch.clientY - rect.top) / rect.height) * HEIGHT + HEIGHT/2;
}

// Window resize handler
function onWindowResize(): void {
    const simulationElement = document.getElementById('simulation');
    if (!simulationElement) return;
    
    const width: number = Math.min(600, window.innerWidth - 40);
    const height: number = (width / 600) * 400;
    
    renderer.setSize(width, height);
    
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

// Export functions for external access if needed
export {
    initParticles,
    isRunning,
    gravity,
    particleCount
};

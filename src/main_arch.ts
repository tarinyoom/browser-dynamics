import * as THREE from 'three';

// Types
type Vector2D = {
    x: number;
    y: number;
};

type Particle = {
    position: Vector2D;
    velocity: Vector2D;
    force: Vector2D;
    density: number;
    pressure: number;
    mesh: THREE.Mesh;
};

type InteractionState = {
    isDragging: boolean;
    position: Vector2D;
    dragForce: Vector2D;
};

type SimulationState = {
    particles: Particle[];
    isRunning: boolean;
    gravity: number;
    interaction: InteractionState;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
};

// Constants
const Constants = {
    // SPH Parameters
    REST_DENSITY: 1000, // rest density
    GAS_CONSTANT: 2000, // gas constant
    H: 16, // smoothing radius
    H2: 16 * 16, // squared smoothing radius
    MASS: 65, // particle mass
    VISCOSITY: 250, // viscosity constant
    DT: 0.0008, // time step
    BOUND_DAMPING: -0.5, // boundary damping

    // Container dimensions
    WIDTH: 600,
    HEIGHT: 400,

    // Kernel constants
    POLY6: 315.0 / (64.0 * Math.PI * Math.pow(16, 9)),
    SPIKY_GRAD: -45.0 / (Math.PI * Math.pow(16, 6)),
    VISC_LAP: 45.0 / (Math.PI * Math.pow(16, 6))
};

// Particle Functions
function createParticle(position: Vector2D, mesh: THREE.Mesh): Particle {
    return {
        position: { ...position },
        velocity: { x: 0, y: 0 },
        force: { x: 0, y: 0 },
        density: 0,
        pressure: 0,
        mesh: mesh
    };
}

function updateParticleMeshPosition(particle: Particle): void {
    particle.mesh.position.set(particle.position.x, particle.position.y, 0);
}

function updateParticleColor(particle: Particle, pressureNorm: number): void {
    const material = particle.mesh.material as THREE.MeshBasicMaterial;
    material.color.setRGB(
        0.2 + pressureNorm * 0.8,
        0.4 + (1.0 - pressureNorm) * 0.5,
        0.8 + (1.0 - pressureNorm) * 0.2
    );
}

// Interaction Functions
function createInteractionState(): InteractionState {
    return {
        isDragging: false,
        position: { x: 0, y: 0 },
        dragForce: { x: 0, y: 0 }
    };
}

function startDrag(interaction: InteractionState, position: Vector2D): void {
    interaction.isDragging = true;
    interaction.position = { ...position };
}

function updateDrag(interaction: InteractionState, newPosition: Vector2D): void {
    interaction.dragForce = {
        x: newPosition.x - interaction.position.x,
        y: newPosition.y - interaction.position.y
    };
    interaction.position = { ...newPosition };
}

function endDrag(interaction: InteractionState): void {
    interaction.isDragging = false;
    interaction.dragForce = { x: 0, y: 0 };
}

// Main Simulation Functions
function createSimulation(
    containerId: string, 
    initialParticleCount: number = 150, 
    initialGravity: number = 12000
): SimulationState {
    // Set up Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111133);
    
    const camera = new THREE.OrthographicCamera(
        -Constants.WIDTH / 2, Constants.WIDTH / 2, 
        Constants.HEIGHT / 2, -Constants.HEIGHT / 2, 
        0.1, 1000
    );
    camera.position.z = 100;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(Constants.WIDTH, Constants.HEIGHT);
    
    const simulationElement = document.getElementById(containerId);
    if (simulationElement) {
        simulationElement.appendChild(renderer.domElement);
    } else {
        console.error(`Could not find element with id: ${containerId}`);
        throw new Error(`Could not find element with id: ${containerId}`);
    }
    
    // Create the simulation state
    const simulation: SimulationState = {
        particles: [],
        isRunning: true,
        gravity: initialGravity,
        interaction: createInteractionState(),
        scene,
        camera,
        renderer
    };
    
    // Initialize particles
    initParticles(simulation, initialParticleCount);
    
    return simulation;
}

function initParticles(simulation: SimulationState, count: number): void {
    const { scene } = simulation;
    
    // Clear existing particles
    simulation.particles.forEach(particle => scene.remove(particle.mesh));
    simulation.particles = [];
    
    // Create new particles
    const initialRegionWidth: number = Constants.WIDTH * 0.4;
    const startX: number = -Constants.WIDTH/2 + 50;
    const startY: number = -Constants.HEIGHT/2 + 50;
    
    const particlesPerRow: number = Math.ceil(Math.sqrt(count));
    const spacing: number = initialRegionWidth / particlesPerRow;
    
    for (let i = 0; i < count; i++) {
        const row: number = Math.floor(i / particlesPerRow);
        const col: number = i % particlesPerRow;
        
        // Set initial position
        const position = {
            x: startX + col * spacing + (Math.random() * 5),
            y: startY + row * spacing + (Math.random() * 5)
        };
        
        // Create visual representation
        const geometry: THREE.CircleGeometry = new THREE.CircleGeometry(4, 16);
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x3399ff,
            transparent: true,
            opacity: 0.8
        });
        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, 0);
        
        // Create and add particle
        const particle = createParticle(position, mesh);
        simulation.particles.push(particle);
        scene.add(mesh);
    }
}

function computeDensityPressure(particles: Particle[]): void {
    // Reset densities
    particles.forEach(particle => {
        particle.density = 0;
    });
    
    // Compute density for each particle
    particles.forEach(particle => {
        particles.forEach(neighbor => {
            const dx: number = neighbor.position.x - particle.position.x;
            const dy: number = neighbor.position.y - particle.position.y;
            const r2: number = dx * dx + dy * dy;
            
            if (r2 < Constants.H2) {
                // Compute density with Poly6 kernel
                particle.density += Constants.MASS * Constants.POLY6 * Math.pow(Constants.H2 - r2, 3);
            }
        });
        
        // Compute pressure using equation of state
        particle.pressure = Constants.GAS_CONSTANT * (particle.density - Constants.REST_DENSITY);
    });
}

function computeForces(particles: Particle[], gravity: number, interaction: InteractionState): void {
    // Reset forces
    particles.forEach(particle => {
        particle.force = { x: 0, y: 0 };
    });
    
    // Compute forces for each particle
    particles.forEach(particle => {
        // Compute pressure and viscosity forces
        particles.forEach(neighbor => {
            if (particle === neighbor) return;
            
            const dx: number = neighbor.position.x - particle.position.x;
            const dy: number = neighbor.position.y - particle.position.y;
            const r2: number = dx * dx + dy * dy;
            
            if (r2 < Constants.H2) {
                const r: number = Math.sqrt(r2);
                const factor: number = (r > 0) ? 1 / r : 0;
                
                // Normalized direction
                const nx: number = dx * factor;
                const ny: number = dy * factor;
                
                // Pressure force
                const pressureForce: number = -Constants.MASS * (particle.pressure + neighbor.pressure) / 
                    (2 * neighbor.density) * Constants.SPIKY_GRAD * Math.pow(Constants.H - r, 2);
                particle.force.x += pressureForce * nx;
                particle.force.y += pressureForce * ny;
                
                // Viscosity force
                const vx: number = neighbor.velocity.x - particle.velocity.x;
                const vy: number = neighbor.velocity.y - particle.velocity.y;
                const viscForce: number = Constants.VISCOSITY * Constants.MASS * 
                    Constants.VISC_LAP * (Constants.H - r) / neighbor.density;
                particle.force.x += viscForce * vx;
                particle.force.y += viscForce * vy;
            }
        });
        
        // Gravity force
        particle.force.y += gravity;
        
        // Mouse interaction
        if (interaction.isDragging) {
            const dx: number = interaction.position.x - particle.position.x;
            const dy: number = interaction.position.y - particle.position.y;
            const r2: number = dx * dx + dy * dy;
            const dragRadius: number = 2500; // 50^2
            
            if (r2 < dragRadius) {
                const factor: number = 1.0 - Math.sqrt(r2) / 50;
                particle.force.x += interaction.dragForce.x * factor * 500;
                particle.force.y += interaction.dragForce.y * factor * 500;
            }
        }
    });
}

function integrateParticles(particles: Particle[]): void {
    // Update positions, velocities, and handle boundaries
    particles.forEach(particle => {
        // Forward Euler integration
        particle.velocity.x += Constants.DT * particle.force.x / particle.density;
        particle.velocity.y += Constants.DT * particle.force.y / particle.density;
        
        particle.position.x += Constants.DT * particle.velocity.x;
        particle.position.y += Constants.DT * particle.velocity.y;
        
        // Boundary conditions
        if (particle.position.x < -Constants.WIDTH/2) {
            particle.velocity.x *= Constants.BOUND_DAMPING;
            particle.position.x = -Constants.WIDTH/2;
        }
        
        if (particle.position.x > Constants.WIDTH/2) {
            particle.velocity.x *= Constants.BOUND_DAMPING;
            particle.position.x = Constants.WIDTH/2;
        }
        
        if (particle.position.y < -Constants.HEIGHT/2) {
            particle.velocity.y *= Constants.BOUND_DAMPING;
            particle.position.y = -Constants.HEIGHT/2;
        }
        
        if (particle.position.y > Constants.HEIGHT/2) {
            particle.velocity.y *= Constants.BOUND_DAMPING;
            particle.position.y = Constants.HEIGHT/2;
        }
        
        // Update mesh position
        updateParticleMeshPosition(particle);
        
        // Update color based on pressure
        const pressureColor: number = Math.min(1.0, particle.pressure / (Constants.GAS_CONSTANT * Constants.REST_DENSITY));
        updateParticleColor(particle, pressureColor);
    });
}

function simulationStep(simulation: SimulationState): void {
    if (!simulation.isRunning) return;
    
    computeDensityPressure(simulation.particles);
    computeForces(simulation.particles, simulation.gravity, simulation.interaction);
    integrateParticles(simulation.particles);
}

function renderSimulation(simulation: SimulationState): void {
    simulation.renderer.render(simulation.scene, simulation.camera);
}

function startAnimationLoop(simulation: SimulationState): void {
    const animate = () => {
        requestAnimationFrame(animate);
        
        if (simulation.isRunning) {
            simulationStep(simulation);
        }
        
        renderSimulation(simulation);
    };
    
    animate();
}

// Interaction Helpers
function getMousePosition(renderer: THREE.WebGLRenderer, event: MouseEvent): Vector2D {
    const rect = renderer.domElement.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * Constants.WIDTH - Constants.WIDTH/2,
        y: -((event.clientY - rect.top) / rect.height) * Constants.HEIGHT + Constants.HEIGHT/2
    };
}

function getTouchPosition(renderer: THREE.WebGLRenderer, touch: Touch): Vector2D {
    const rect = renderer.domElement.getBoundingClientRect();
    return {
        x: ((touch.clientX - rect.left) / rect.width) * Constants.WIDTH - Constants.WIDTH/2,
        y: -((touch.clientY - rect.top) / rect.height) * Constants.HEIGHT + Constants.HEIGHT/2
    };
}

// Setup interaction controls
function setupInteractionControls(simulation: SimulationState): void {
    const { renderer, interaction } = simulation;
    
    // Mouse interaction
    renderer.domElement.addEventListener('mousedown', (e: MouseEvent) => {
        const position = getMousePosition(renderer, e);
        startDrag(interaction, position);
    });
    
    renderer.domElement.addEventListener('mousemove', (e: MouseEvent) => {
        if (interaction.isDragging) {
            const position = getMousePosition(renderer, e);
            updateDrag(interaction, position);
        }
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        endDrag(interaction);
    });
    
    renderer.domElement.addEventListener('mouseleave', () => {
        endDrag(interaction);
    });
    
    // Touch support
    renderer.domElement.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        const position = getTouchPosition(renderer, e.touches[0]);
        startDrag(interaction, position);
    });
    
    renderer.domElement.addEventListener('touchmove', (e: TouchEvent) => {
        e.preventDefault();
        if (interaction.isDragging) {
            const position = getTouchPosition(renderer, e.touches[0]);
            updateDrag(interaction, position);
        }
    });
    
    renderer.domElement.addEventListener('touchend', () => {
        endDrag(interaction);
    });
}

// Window resize handler
function handleWindowResize(simulation: SimulationState): void {
    const simulationElement = simulation.renderer.domElement.parentElement;
    if (!simulationElement) return;
    
    const width: number = Math.min(600, window.innerWidth - 40);
    const height: number = (width / 600) * 400;
    
    simulation.renderer.setSize(width, height);
    
    simulation.camera.left = -width / 2;
    simulation.camera.right = width / 2;
    simulation.camera.top = height / 2;
    simulation.camera.bottom = -height / 2;
    simulation.camera.updateProjectionMatrix();
}

// Public API functions
function toggleSimulation(simulation: SimulationState): boolean {
    simulation.isRunning = !simulation.isRunning;
    return simulation.isRunning;
}

function resetSimulation(simulation: SimulationState): void {
    initParticles(simulation, simulation.particles.length);
}

function setGravity(simulation: SimulationState, value: number): void {
    simulation.gravity = value;
}

function setParticleCount(simulation: SimulationState, count: number): void {
    initParticles(simulation, count);
}

function getParticleCount(simulation: SimulationState): number {
    return simulation.particles.length;
}

function getIsRunning(simulation: SimulationState): boolean {
    return simulation.isRunning;
}

function getGravity(simulation: SimulationState): number {
    return simulation.gravity;
}

// UI Controls setup
function setupUIControls(simulation: SimulationState): void {
    const playPauseButton = document.getElementById('playPause');
    const resetButton = document.getElementById('reset');
    const gravitySlider = document.getElementById('gravitySlider') as HTMLInputElement;
    const particleSlider = document.getElementById('particleSlider') as HTMLInputElement;
    const gravityValue = document.getElementById('gravityValue');
    const particleValue = document.getElementById('particleValue');
    
    if (playPauseButton) {
        playPauseButton.addEventListener('click', () => {
            const isRunning = toggleSimulation(simulation);
            playPauseButton.textContent = isRunning ? 'Pause' : 'Resume';
            playPauseButton.classList.toggle('pause', isRunning);
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            resetSimulation(simulation);
        });
    }
    
    if (gravitySlider && gravityValue) {
        // Set initial value
        gravitySlider.value = getGravity(simulation).toString();
        gravityValue.textContent = getGravity(simulation).toString();
        
        gravitySlider.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            const value = parseFloat(target.value);
            setGravity(simulation, value);
            gravityValue.textContent = value.toString();
        });
    }
    
    if (particleSlider && particleValue) {
        // Set initial value
        particleSlider.value = getParticleCount(simulation).toString();
        particleValue.textContent = getParticleCount(simulation).toString();
        
        particleSlider.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            const value = parseInt(target.value);
            setParticleCount(simulation, value);
            particleValue.textContent = value.toString();
        });
    }
}

// Initialize the application
function initializeApplication(containerId: string): SimulationState {
    // Create simulation
    const simulation = createSimulation(containerId, 150, 12000);
    
    // Setup interaction
    setupInteractionControls(simulation);
    
    // Handle window resize
    window.addEventListener('resize', () => handleWindowResize(simulation));
    handleWindowResize(simulation);
    
    // Start animation loop
    startAnimationLoop(simulation);
    
    return simulation;
}

// Main entry point
document.addEventListener('DOMContentLoaded', () => {
    const simulation = initializeApplication('simulation');
    setupUIControls(simulation);
});

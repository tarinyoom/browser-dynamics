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

// Particle data arrays
let posX: Float32Array;
let posY: Float32Array;
let velX: Float32Array;
let velY: Float32Array;
let forceX: Float32Array;
let forceY: Float32Array;
let density: Float32Array;
let pressure: Float32Array;

// Three.js objects
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
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
    
    // Initialize particle data arrays
    initParticleArrays();
    
    // Create initial particles
    initParticles();
    
    // Start animation loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    onWindowResize();
}

// Initialize particle data arrays
function initParticleArrays(): void {
    posX = new Float32Array(particleCount);
    posY = new Float32Array(particleCount);
    velX = new Float32Array(particleCount);
    velY = new Float32Array(particleCount);
    forceX = new Float32Array(particleCount);
    forceY = new Float32Array(particleCount);
    density = new Float32Array(particleCount);
    pressure = new Float32Array(particleCount);
}

// Function to initialize particles
function initParticles(): void {
    // Clear existing particles
    particleMeshes.forEach(mesh => scene.remove(mesh));
    particleMeshes = [];
    
    // Resize arrays if particle count has changed
    if (posX.length !== particleCount) {
        initParticleArrays();
    } else {
        // Reset arrays to zero
        velX.fill(0);
        velY.fill(0);
        forceX.fill(0);
        forceY.fill(0);
        density.fill(0);
        pressure.fill(0);
    }
    
    // Create new particles
    const initialRegionWidth: number = WIDTH * 0.4;
    const startX: number = -WIDTH/2 + 50;
    const startY: number = -HEIGHT/2 + 50;
    
    const particlesPerRow: number = Math.ceil(Math.sqrt(particleCount));
    const spacing: number = initialRegionWidth / particlesPerRow;
    
    for (let i = 0; i < particleCount; i++) {
        const row: number = Math.floor(i / particlesPerRow);
        const col: number = i % particlesPerRow;
        
        // Set initial position
        posX[i] = startX + col * spacing + (Math.random() * 5);
        posY[i] = startY + row * spacing + (Math.random() * 5);
        
        // Create visual representation
        const geometry: THREE.CircleGeometry = new THREE.CircleGeometry(4, 16);
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x3399ff,
            transparent: true,
            opacity: 0.8
        });
        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(posX[i], posY[i], 0);
        
        particleMeshes.push(mesh);
        scene.add(mesh);
    }
}

// SPH functions
function computeDensityPressure(): void {
    // Reset densities to zero
    density.fill(0);
    
    // Compute density for each particle
    for (let i = 0; i < particleCount; i++) {
        for (let j = 0; j < particleCount; j++) {
            const dx: number = posX[j] - posX[i];
            const dy: number = posY[j] - posY[i];
            const r2: number = dx * dx + dy * dy;
            
            if (r2 < H2) {
                // Compute density with Poly6 kernel
                density[i] += MASS * POLY6 * Math.pow(H2 - r2, 3);
            }
        }
        
        // Compute pressure using equation of state
        pressure[i] = GAS_CONSTANT * (density[i] - REST_DENSITY);
    }
}

function computeForces(): void {
    // Reset forces to zero
    forceX.fill(0);
    forceY.fill(0);
    
    // Compute forces for each particle
    for (let i = 0; i < particleCount; i++) {
        // Compute pressure and viscosity forces
        for (let j = 0; j < particleCount; j++) {
            if (i === j) continue;
            
            const dx: number = posX[j] - posX[i];
            const dy: number = posY[j] - posY[i];
            const r2: number = dx * dx + dy * dy;
            
            if (r2 < H2) {
                const r: number = Math.sqrt(r2);
                const factor: number = (r > 0) ? 1 / r : 0;
                
                // Normalized direction
                const nx: number = dx * factor;
                const ny: number = dy * factor;
                
                // Pressure force
                const pressureForce: number = -MASS * (pressure[i] + pressure[j]) / 
                    (2 * density[j]) * SPIKY_GRAD * Math.pow(H - r, 2);
                forceX[i] += pressureForce * nx;
                forceY[i] += pressureForce * ny;
                
                // Viscosity force
                const vx: number = velX[j] - velX[i];
                const vy: number = velY[j] - velY[i];
                const viscForce: number = VISCOSITY * MASS * VISC_LAP * (H - r) / density[j];
                forceX[i] += viscForce * vx;
                forceY[i] += viscForce * vy;
            }
        }
        
        // Gravity force
        forceY[i] += gravity;
        
        // Mouse interaction
        if (isDragging) {
            const dx: number = mouseX - posX[i];
            const dy: number = mouseY - posY[i];
            const r2: number = dx * dx + dy * dy;
            const dragRadius: number = 50 * 50;
            
            if (r2 < dragRadius) {
                const factor: number = 1.0 - Math.sqrt(r2) / 50;
                forceX[i] += dragForceX * factor * 500;
                forceY[i] += dragForceY * factor * 500;
            }
        }
    }
}

function integrate(): void {
    // Update positions, velocities, and handle boundaries
    for (let i = 0; i < particleCount; i++) {
        // Forward Euler integration
        velX[i] += DT * forceX[i] / density[i];
        velY[i] += DT * forceY[i] / density[i];
        
        posX[i] += DT * velX[i];
        posY[i] += DT * velY[i];
        
        // Boundary conditions
        if (posX[i] < -WIDTH/2) {
            velX[i] *= BOUND_DAMPING;
            posX[i] = -WIDTH/2;
        }
        
        if (posX[i] > WIDTH/2) {
            velX[i] *= BOUND_DAMPING;
            posX[i] = WIDTH/2;
        }
        
        if (posY[i] < -HEIGHT/2) {
            velY[i] *= BOUND_DAMPING;
            posY[i] = -HEIGHT/2;
        }
        
        if (posY[i] > HEIGHT/2) {
            velY[i] *= BOUND_DAMPING;
            posY[i] = HEIGHT/2;
        }
        
        // Update mesh position
        const mesh: THREE.Mesh = particleMeshes[i];
        mesh.position.set(posX[i], posY[i], 0);
        
        // Update color based on pressure
        const pressureColor: number = Math.min(1.0, pressure[i] / (GAS_CONSTANT * REST_DENSITY));
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

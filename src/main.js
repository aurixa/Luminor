/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { createPlanet, PLANET_RADIUS } from './planet.js';
import { setupResources } from './resources.js';
import { setupUI } from './ui.js';
import { createBikePlayer } from './bikePlayer.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

// Main game state
const gameState = {
    isPlaying: false,
    isPaused: false,
    playerLength: 3,
    gameHasEnded: false
};

// Initialize Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011); // Dark blue background

// Create a camera with improved settings
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Position camera to see the entire planet initially
camera.position.set(0, PLANET_RADIUS * 0.5, PLANET_RADIUS * 2);
camera.lookAt(0, 0, 0);

// Add ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0x666666, 1.0); // Brighter 
scene.add(ambientLight);

// Add directional light (sun)
const sunLight = new THREE.DirectionalLight(0xffffdd, 1.8); // Brighter
sunLight.position.set(PLANET_RADIUS, PLANET_RADIUS/2, PLANET_RADIUS);
sunLight.castShadow = true;

// Optimize shadow settings for larger planet
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = PLANET_RADIUS * 3;

// Adjust shadow camera to fit large planet
const shadowSize = PLANET_RADIUS * 1.2;
sunLight.shadow.camera.left = -shadowSize;
sunLight.shadow.camera.right = shadowSize;
sunLight.shadow.camera.top = shadowSize;
sunLight.shadow.camera.bottom = -shadowSize;
scene.add(sunLight);

// Add a secondary light source from another angle (fill light)
const fillLight = new THREE.DirectionalLight(0x7799ff, 0.8); // Blue-tinted fill light
fillLight.position.set(-PLANET_RADIUS, PLANET_RADIUS, -PLANET_RADIUS);
scene.add(fillLight);

// Create the planet
const planet = createPlanet(scene);
console.log("Planet created:", 
    {
        radius: PLANET_RADIUS,
        position: planet.mesh.position,
        visible: planet.mesh.visible
    }
);

// Create the debug panel
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

// Initialize game elements
let bikePlayer = null;
let resources = null;
let cameraHelper = null;
const clock = new THREE.Clock();

// Set up UI
let ui;
// Delay UI setup until DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup UI system
    ui = setupUI(gameState, startGame);
    
    // Add keyboard control to start game
    document.addEventListener('keydown', (event) => {
        if (event.code === 'KeyS') {
            console.log("Starting game with keyboard shortcut (S key)");
            startGame();
        }
    });
    
    // Expose startGame function globally for the loading screen to access
    window.startGameFromLoader = startGame;
    window.startGame = startGame; // Direct access
    
    // Setup terrain panel interactions
    setupTerrainPanelControls();
    
    // Create stars
    createStarField();
    
    // Start animation loop
    animate();
});

/**
 * Create a starfield of particles for the background
 */
function createStarField() {
    console.log("Creating star field");
    
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.0,  // Larger stars for better visibility
        transparent: true,
        opacity: 0.8,
        map: createStarTexture(),
        sizeAttenuation: false  // Stars same size regardless of distance
    });
    
    const starCount = 5000;  // More stars for better starfield
    const starVertices = [];
    
    // Create stars in a large sphere around the scene
    // Use a radius much larger than the planet
    const radius = PLANET_RADIUS * 10;
    for (let i = 0; i < starCount; i++) {
        // Use spherical distribution
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        starVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.frustumCulled = false; // Prevent stars from disappearing
    scene.add(stars);
}

/**
 * Create a circular texture for stars
 */
function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    // Create a radial gradient for a circular star
    const gradient = context.createRadialGradient(
        16, 16, 0,   // Inner circle x, y, radius
        16, 16, 16   // Outer circle x, y, radius
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

/**
 * Main animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    stats.begin();
    
    // Log camera position occasionally for debugging
    if (Math.random() < 0.005) { // Reduced frequency to avoid console spam
        console.log("Camera position:", camera.position);
        console.log("Camera rotation:", camera.rotation);
    }
    
    // Update based on game state
    if (gameState.isPlaying && !gameState.isPaused && !gameState.gameHasEnded) {
        // Calculate delta time (capped to prevent large jumps after pausing)
        const deltaTime = Math.min(0.016, clock.getDelta());
        
        // Update bike player
        if (bikePlayer) {
            bikePlayer.update(deltaTime);
            
            // Update camera to follow player
            updateCamera(deltaTime);
        }
        
        // Update resources
        if (resources) {
            resources.update(bikePlayer ? bikePlayer.getPosition() : null);
        }
        
        // Update debug helpers
        if (cameraHelper) {
            cameraHelper.update();
        }
    }
    
    // Ensure the camera is not inside the planet
    ensureCameraIsValid();
    
    // Render the scene
    renderer.render(scene, camera);
    
    stats.end();
}

/**
 * Camera settings for following the player
 */
const CAMERA_CONFIG = {
    distance: 100,        // Distance behind player
    height: 50,           // Height above player
    lookAheadDistance: 50, // Look ahead of player
    lerpFactor: 0.07      // Smooth camera movement
};

/**
 * Update camera position to follow the player
 */
function updateCamera(deltaTime) {
    if (!bikePlayer) return;
    
    try {
        // Get player position and orientation
        const playerPos = bikePlayer.getPosition();
        const playerForward = bikePlayer.getForwardDirection();
        const playerUp = bikePlayer.getUpDirection();
        
        // Calculate target camera position
        const targetCameraPos = new THREE.Vector3()
            .copy(playerPos)                                        // Start at player position
            .add(playerUp.clone().multiplyScalar(CAMERA_CONFIG.height))    // Move up
            .sub(playerForward.clone().multiplyScalar(CAMERA_CONFIG.distance)); // Move back
            
        // Calculate look-at position (ahead of player)
        const lookAtPos = new THREE.Vector3()
            .copy(playerPos)
            .add(playerForward.clone().multiplyScalar(CAMERA_CONFIG.lookAheadDistance));
        
        // Smoothly move camera toward target position
        camera.position.lerp(targetCameraPos, CAMERA_CONFIG.lerpFactor);
        
        // Look at the player's position plus a bit ahead
        camera.lookAt(lookAtPos);
        
        // Ensure camera up aligns with player up
        camera.up.copy(playerUp);
        
    } catch (error) {
        console.error("Error updating camera:", error);
    }
}

/**
 * Ensure camera is not inside the planet
 */
function ensureCameraIsValid() {
    try {
        // Calculate distance from planet center
        const distanceFromCenter = camera.position.length();
        
        // Minimum safe distance is the planet radius plus some margin
        const minimumSafeDistance = PLANET_RADIUS * 1.05;
        
        if (distanceFromCenter < minimumSafeDistance) {
            // Camera is too close to or inside the planet
            // Move it outward in the same direction
            const direction = camera.position.clone().normalize();
            camera.position.copy(direction.multiplyScalar(minimumSafeDistance));
        }
    } catch (error) {
        console.error("Error validating camera position:", error);
    }
}

/**
 * Start the game
 */
function startGame() {
    console.log("Starting game...");
    
    // Check if game is already started
    if (gameState.isPlaying) {
        console.log("Game already started, resetting...");
        // Reset but don't try to remove loading screen again
        
        // Dispose old player if exists
        if (bikePlayer) {
            console.log("Removing existing player");
            bikePlayer.dispose();
            bikePlayer = null;
        }
    } else {
        // Set game state to playing for the first time
        gameState.isPlaying = true;
        
        // IMPORTANT: Remove the loading screen if it exists
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            console.log("Found loading-screen, removing it");
            loadingScreen.parentNode.removeChild(loadingScreen);
        }
    }
    
    // Reset game state values
    gameState.isPaused = false;
    gameState.playerLength = 3;
    gameState.gameHasEnded = false;
    
    // Show controls info
    const controlsInfo = document.getElementById('controls-info');
    if (controlsInfo) {
        controlsInfo.style.display = 'block';
    }
    
    // Update game UI via the UI module
    if (ui && ui.updateUI) {
        ui.updateUI();
    }
    
    // Create bike player
    console.log("Creating new bike player");
    bikePlayer = createBikePlayer(scene, planet, camera);
    
    // Reset resources
    if (!resources) {
        console.log("Setting up resources");
        resources = setupResources(scene, planet, gameState);
    } else {
        console.log("Resetting resources");
        resources.reset();
    }
    
    // Reset the clock
    clock.start();
    console.log("Game started successfully");
}

/**
 * End the game
 */
function endGame() {
    console.log("Ending game");
    
    gameState.gameHasEnded = true;
    
    // Update UI to show game over state
    if (ui && ui.showGameOver) {
        ui.showGameOver(gameState.playerLength);
    }
    
    // Stop player
    if (bikePlayer) {
        // No need to dispose, just freeze updates
    }
}

/**
 * Setup terrain panel controls
 */
function setupTerrainPanelControls() {
    // This could be used for terrain adjustment if needed
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}); 	
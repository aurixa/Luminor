/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createPlanet } from './planet.js';
import { setupPlayer } from './player.js';
import { setupResources } from './resources.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

// Main game state
const gameState = {
    isPlaying: false,
    score: 0,
    playerLength: 1,
};

// Initialize Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011); // Dark blue background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Setup camera position
camera.position.z = 15;

// Camera configuration
const CAMERA_DISTANCE = 18;    // Increased distance from player for better visibility
const CAMERA_HEIGHT = 35;      // Increased height for better terrain visibility
const CAMERA_SMOOTHNESS = 0.1; // Increased for more responsive camera following
const CAMERA_FORWARD_OFFSET = 10; // Reduced to look closer to the player

// Add ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0x666666, 0.7); // Brighter ambient for better terrain visibility
scene.add(ambientLight);

// Add directional light (sun)
const sunLight = new THREE.DirectionalLight(0xffffdd, 1.4); // Warmer sunlight
sunLight.position.set(200, 100, 200); // Position further away for the larger planet
sunLight.castShadow = true;

// Optimize shadow settings for larger planet
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 1000;
sunLight.shadow.camera.left = -150;
sunLight.shadow.camera.right = 150;
sunLight.shadow.camera.top = 150;
sunLight.shadow.camera.bottom = -150;
sunLight.shadow.bias = -0.0001;

scene.add(sunLight);

// Add a subtle point light at the camera for better visibility
const cameraLight = new THREE.PointLight(0xffffee, 0.7);
camera.add(cameraLight);
scene.add(camera);

// Debug controls - will be disabled during gameplay
let orbitControls = null;
setupDebugControls();

function setupDebugControls() {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.enabled = !gameState.isPlaying;
}

// Create the planet
const planet = createPlanet(scene);

// Initialize game elements
let player = null;
let resources = null;

// Create score display
const scoreDisplay = document.createElement('div');
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '20px';
scoreDisplay.style.right = '20px';
scoreDisplay.style.color = 'white';
scoreDisplay.style.fontSize = '24px';
scoreDisplay.style.fontFamily = 'Arial, sans-serif';
scoreDisplay.style.textShadow = '0 0 5px #000';
scoreDisplay.style.display = 'none';
document.body.appendChild(scoreDisplay);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create starfield
const starField = createStarField();

// Add stats for debugging
const stats = new Stats();
document.body.appendChild(stats.dom);

// Controls info display
const controlsInfo = document.createElement('div');
controlsInfo.style.position = 'absolute';
controlsInfo.style.bottom = '20px';
controlsInfo.style.left = '20px';
controlsInfo.style.color = 'white';
controlsInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
controlsInfo.style.padding = '10px';
controlsInfo.style.borderRadius = '5px';
controlsInfo.style.fontFamily = 'Arial, sans-serif';
controlsInfo.style.display = 'none';
controlsInfo.innerHTML = `
<h3>Controls:</h3>
<p>← Left Arrow / A: Turn Left</p>
<p>→ Right Arrow / D: Turn Right</p>
`;
document.body.appendChild(controlsInfo);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup UI interaction
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
    
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.addEventListener('click', startGame);
    }
});

/**
 * Create a star field background
 */
function createStarField() {
    const starCount = 4000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        
        // Position stars in a sphere around the scene
        const radius = THREE.MathUtils.randFloat(300, 900);
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
        const phi = THREE.MathUtils.randFloat(0, Math.PI);
        
        starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i3 + 2] = radius * Math.cos(phi);
        
        // Vary star sizes
        starSizes[i] = THREE.MathUtils.randFloat(0.1, 1.0);
        
        // Vary star colors
        const colorChoice = Math.random();
        if (colorChoice < 0.6) {
            // White/blue stars (most common)
            starColors[i3] = THREE.MathUtils.randFloat(0.8, 1.0);
            starColors[i3 + 1] = THREE.MathUtils.randFloat(0.8, 1.0);
            starColors[i3 + 2] = THREE.MathUtils.randFloat(0.9, 1.0);
        } else if (colorChoice < 0.8) {
            // Yellow/orange stars
            starColors[i3] = THREE.MathUtils.randFloat(0.9, 1.0);
            starColors[i3 + 1] = THREE.MathUtils.randFloat(0.6, 0.9);
            starColors[i3 + 2] = THREE.MathUtils.randFloat(0.1, 0.4);
        } else if (colorChoice < 0.95) {
            // Red stars
            starColors[i3] = THREE.MathUtils.randFloat(0.8, 1.0);
            starColors[i3 + 1] = THREE.MathUtils.randFloat(0.1, 0.5);
            starColors[i3 + 2] = THREE.MathUtils.randFloat(0.1, 0.3);
        } else {
            // A few bright blue stars
            starColors[i3] = THREE.MathUtils.randFloat(0.3, 0.6);
            starColors[i3 + 1] = THREE.MathUtils.randFloat(0.7, 0.9);
            starColors[i3 + 2] = THREE.MathUtils.randFloat(0.9, 1.0);
        }
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
    
    return starField;
}

// Animation loop
function animate() {
    const currentTime = Date.now();
    const deltaTime = currentTime - (lastTime || currentTime);
    lastTime = currentTime;
    
    requestAnimationFrame(animate);
    
    if (stats) stats.update();
    
    if (orbitControls && orbitControls.enabled) {
        orbitControls.update();
    }
    
    // Slight starfield rotation for subtle effect
    if (starField) {
        starField.rotation.y += 0.00001 * deltaTime;
    }
    
    if (gameState.isPlaying && player) {
        // Update player and get its current state
        const playerState = player.update();
        
        // Update camera position based on current mode
        updateCameraPosition(playerState);
        
        // Update resources if they exist
        if (resources) {
            resources.update();
            
            // Check for resource collection
            const collected = resources.checkCollisions(player);
            if (collected > 0) {
                // Increase score and grow player
                gameState.score += collected;
                scoreDisplay.textContent = `Score: ${gameState.score}`;
                player.grow(collected);
            }
        }
        
        // Check self-collision (game over condition)
        if (player.checkSelfCollision()) {
            endGame();
        }
    }
    
    renderer.render(scene, camera);
}

// Store last time for deltaTime calculation
let lastTime = null;

/**
 * Update camera position to follow player
 */
function updateCameraPosition(playerState) {
    if (!playerState) return;
    
    // Make sure the camera stays behind the player (reverse direction for camera position calculation)
    const cameraDirection = playerState.direction.clone().negate();
    
    // Get the up vector (normal to planet surface at player position)
    const up = playerState.position.clone().normalize();
    
    // Create a position behind and above the player
    const idealPosition = playerState.position.clone()
        .add(cameraDirection.multiplyScalar(CAMERA_DISTANCE))
        .add(up.multiplyScalar(CAMERA_HEIGHT));
    
    // Smooth transition to ideal camera position
    camera.position.lerp(idealPosition, CAMERA_SMOOTHNESS);
    
    // Look at player position plus a small offset in the direction of travel
    const lookTarget = playerState.position.clone().add(
        playerState.direction.clone().multiplyScalar(CAMERA_FORWARD_OFFSET)
    );
    camera.lookAt(lookTarget);
    
    // Set camera up direction to match planet normal at player position
    camera.up.copy(up);
}

// Start the game
function startGame() {
    // Reset game state
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.playerLength = 1;
    
    // Hide loading/start screen if it exists
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    
    // Show controls info
    controlsInfo.style.display = 'block';
    
    // Show score display
    scoreDisplay.textContent = `Score: ${gameState.score}`;
    scoreDisplay.style.display = 'block';
    
    // Disable orbit controls during gameplay
    if (orbitControls) {
        orbitControls.enabled = false;
    }
    
    // Remove old player if it exists
    if (player) {
        player.remove();
    }
    
    // Remove old resources if they exist
    if (resources) {
        resources.remove();
    }
    
    // Create new player
    player = setupPlayer(scene, planet, camera);
    
    // Create new resources
    resources = setupResources(scene, planet);
    
    // Add initial segments
    player.grow(2); // Start with 3 segments total
    
    // Set initial camera position
    const playerState = {
        position: player.getHeadPosition(),
        direction: new THREE.Vector3(0, 0, 1),
        up: player.getHeadPosition().clone().normalize()
    };
    updateCameraPosition(playerState);
}

// End the game
function endGame() {
    gameState.isPlaying = false;
    
    // Re-enable orbit controls for free camera movement
    if (orbitControls) {
        orbitControls.enabled = true;
    }
    
    // Hide score display
    scoreDisplay.style.display = 'none';
    controlsInfo.style.display = 'none';
    
    alert(`Game Over! Score: ${gameState.score}`);
}

// Start animation loop
animate(); 
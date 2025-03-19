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
const CAMERA_DISTANCE = 5; // Distance from player
const CAMERA_HEIGHT = 2.5; // Height above player
const CAMERA_SMOOTHNESS = 0.05; // Lower = smoother but slower camera

// Add ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0x333344, 0.3);
scene.add(ambientLight);

// Add directional light (sun)
const sunLight = new THREE.DirectionalLight(0xffffaa, 1.2);
sunLight.position.set(50, 30, 50);
sunLight.castShadow = true;

// Optimize shadow settings
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -35;
sunLight.shadow.camera.right = 35;
sunLight.shadow.camera.top = 35;
sunLight.shadow.camera.bottom = -35;
sunLight.shadow.bias = -0.0005;

scene.add(sunLight);

// Add a subtle point light at the camera for better visibility
const cameraLight = new THREE.PointLight(0x3333ff, 0.5);
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
createStarField();

// Add stats for debugging
const stats = new Stats();
document.body.appendChild(stats.dom);

// UI elements
let startButton = null;
let restartButton = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup UI interaction
    startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
    
    restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.addEventListener('click', startGame);
    }
});

/**
 * Create a star field background
 */
function createStarField() {
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        
        // Position stars in a sphere around the scene
        const radius = THREE.MathUtils.randFloat(50, 150);
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
        const phi = THREE.MathUtils.randFloat(0, Math.PI);
        
        starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i3 + 2] = radius * Math.cos(phi);
        
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
        } else {
            // Red stars
            starColors[i3] = THREE.MathUtils.randFloat(0.8, 1.0);
            starColors[i3 + 1] = THREE.MathUtils.randFloat(0.1, 0.5);
            starColors[i3 + 2] = THREE.MathUtils.randFloat(0.1, 0.3);
        }
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (stats) stats.update();
    
    if (orbitControls && orbitControls.enabled) {
        orbitControls.update();
    }
    
    if (gameState.isPlaying && player) {
        // Update player and get its current state
        const playerState = player.update();
        
        // Update third person camera position
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

/**
 * Update camera position to follow player in third-person view
 */
function updateCameraPosition(playerState) {
    if (!playerState) return;
    
    // Calculate ideal camera position (behind and above player)
    const idealPosition = playerState.position.clone()
        .sub(playerState.direction.clone().multiplyScalar(CAMERA_DISTANCE)) // Move backward from player
        .add(playerState.up.clone().multiplyScalar(CAMERA_HEIGHT));         // Move up from player
    
    // Smoothly interpolate current camera position toward ideal position
    camera.position.lerp(idealPosition, CAMERA_SMOOTHNESS);
    
    // Make camera look at player position
    camera.lookAt(playerState.position);
    
    // Set camera up direction to match planet normal at player position
    camera.up.copy(playerState.up);
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
    const controlsInfo = document.getElementById('controls-info');
    if (controlsInfo) {
        controlsInfo.style.display = 'block';
    }
    
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
    
    alert(`Game Over! Score: ${gameState.score}`);
}

// Start animation loop
animate(); 
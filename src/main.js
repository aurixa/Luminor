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
const CAMERA_DISTANCE = 60;    // Increased distance to see more of the terrain
const CAMERA_HEIGHT = 60;      // Reduced height for better terrain alignment
const CAMERA_SMOOTHNESS = 0.08; // Slightly reduced for more responsive camera over terrain
const CAMERA_FORWARD_OFFSET = 20; // Increased to see more of upcoming terrain

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

// Create controls info display
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
<p>T: Toggle terrain adjustment panel</p>
`;
document.body.appendChild(controlsInfo);

// Create a terrain adjustment panel
const terrainPanel = document.createElement('div');
terrainPanel.style.position = 'absolute';
terrainPanel.style.top = '20px';
terrainPanel.style.left = '20px';
terrainPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
terrainPanel.style.padding = '15px';
terrainPanel.style.borderRadius = '8px';
terrainPanel.style.color = 'white';
terrainPanel.style.fontFamily = 'Arial, sans-serif';
terrainPanel.style.width = '250px';
terrainPanel.style.display = 'none';
terrainPanel.style.zIndex = '1000';
terrainPanel.innerHTML = `
<h3 style="margin-top:0">Terrain Adjustments</h3>
<div class="slider-container">
  <label>Height Scale</label>
  <input type="range" id="height-scale" min="0.02" max="0.2" step="0.01" value="0.12">
  <span id="height-scale-value">0.12</span>
</div>
<div class="slider-container">
  <label>Roughness</label>
  <input type="range" id="roughness" min="0.1" max="1.5" step="0.1" value="0.8">
  <span id="roughness-value">0.8</span>
</div>
<div class="slider-container">
  <label>Large Scale Influence</label>
  <input type="range" id="large-scale" min="0.1" max="0.9" step="0.1" value="0.5">
  <span id="large-scale-value">0.5</span>
</div>
<div class="slider-container">
  <label>Medium Scale Influence</label>
  <input type="range" id="medium-scale" min="0.1" max="0.9" step="0.1" value="0.4">
  <span id="medium-scale-value">0.4</span>
</div>
<div class="slider-container">
  <label>Small Scale Influence</label>
  <input type="range" id="small-scale" min="0" max="0.4" step="0.05" value="0.1">
  <span id="small-scale-value">0.1</span>
</div>
<div style="margin-top:10px">
  <button id="apply-terrain">Apply Changes</button>
  <button id="reset-terrain">Reset</button>
</div>
`;
document.body.appendChild(terrainPanel);

// Add style for the sliders
const style = document.createElement('style');
style.textContent = `
.slider-container {
  margin-bottom: 8px;
}
.slider-container label {
  display: block;
  margin-bottom: 3px;
  font-size: 14px;
}
.slider-container input {
  width: 180px;
  vertical-align: middle;
}
.slider-container span {
  display: inline-block;
  width: 40px;
  text-align: right;
  font-size: 14px;
}
button {
  background-color: #00ffaa;
  border: none;
  color: #000;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
}
button:hover {
  background-color: #00cc88;
}
`;
document.head.appendChild(style);

// Toggle terrain panel with T key
window.addEventListener('keydown', (event) => {
    if (event.key === 't' || event.key === 'T') {
        terrainPanel.style.display = terrainPanel.style.display === 'none' ? 'block' : 'none';
    }
});

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
    
    // Setup terrain panel interactions
    setupTerrainPanelControls();
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
    
    // Get the player's position, direction and up vector (planet normal)
    const playerPos = playerState.position.clone();
    const playerDir = playerState.direction.clone();
    const up = playerPos.clone().normalize(); // Normal at player position
    
    // Calculate the right vector
    const right = new THREE.Vector3().crossVectors(playerDir, up).normalize();
    
    // Recalculate forward to ensure orthogonality with up
    const forward = new THREE.Vector3().crossVectors(up, right).normalize();
    
    // Calculate terrain slope at player position and in forward direction
    // Check points in front and behind to estimate slope orientation
    const forwardCheckDist = 20; // Distance to check forward
    const forwardPoint = playerPos.clone().add(forward.clone().multiplyScalar(forwardCheckDist));
    
    // Use terrain data to get actual surface points
    // We need to access planet object and surface functions
    const planetRadius = planet.radius;
    const forwardSurfacePoint = planet.getNearestPointOnSurface(forwardPoint);
    
    // Create slope-adjusted up vector by finding the plane normal of the slope
    // Get a vector from player position to forward terrain point
    const playerToForward = forwardSurfacePoint.clone().sub(playerPos);
    
    // Calculated slope-aligned camera axis
    // We create a camera orientation that's aligned with the slope
    let slopeRight = right.clone(); // Keep the same right vector
    
    // Calculate slope-aligned up that's perpendicular to the movement direction
    // This is a weighted blend between straight up and slope-following
    let slopeUp = up.clone();
    
    // Project forward direction onto the plane perpendicular to up
    // This gives us the tangent to the planet surface in player's direction
    const surfaceTangent = forward.clone()
        .sub(up.clone().multiplyScalar(forward.dot(up)))
        .normalize();
    
    // Get the angle between forward on a flat surface and actual forward point
    const surfaceToForward = forwardSurfacePoint.clone().sub(
        playerPos.clone().add(surfaceTangent.clone().multiplyScalar(forwardCheckDist))
    );
    
    // Calculate a slope factor - how steep is the terrain ahead?
    // Higher value means steeper uphill/downhill
    const slopeDot = surfaceTangent.dot(surfaceToForward.normalize());
    const slopeAngle = Math.asin(Math.min(1, Math.max(-1, slopeDot)));
    
    // Normalize to 0-1 range where 0.5 is flat, >0.5 is uphill, <0.5 is downhill
    const normalizedSlope = (slopeAngle / (Math.PI/4)) + 0.5;
    
    // Adjust camera height based on slope
    // We want the camera lower when going uphill and higher when going downhill
    let dynamicHeight = CAMERA_HEIGHT;
    let dynamicDistance = CAMERA_DISTANCE;
    
    if (normalizedSlope > 0.55) {
        // Going uphill - lower the camera
        dynamicHeight = CAMERA_HEIGHT * (1 - (normalizedSlope - 0.55) * 1.5);
        dynamicDistance = CAMERA_DISTANCE * (1 + (normalizedSlope - 0.55) * 0.5);
    } else if (normalizedSlope < 0.45) {
        // Going downhill - raise the camera and move it back
        dynamicHeight = CAMERA_HEIGHT * (1 + (0.45 - normalizedSlope) * 0.5);
        dynamicDistance = CAMERA_DISTANCE * (1 + (0.45 - normalizedSlope) * 0.5);
    }
    
    // Adjust the actual camera position based on slope
    // Calculate base camera position behind player
    const cameraDirection = playerDir.clone().negate();
    
    // Create a position behind and above the player, adjusted for slope
    const idealPosition = playerPos.clone()
        .add(cameraDirection.multiplyScalar(dynamicDistance))
        .add(up.multiplyScalar(dynamicHeight));
    
    // Smooth transition to ideal camera position
    camera.position.lerp(idealPosition, CAMERA_SMOOTHNESS);
    
    // Look ahead of player, adjusted based on slope
    // Look slightly farther ahead when going downhill to see upcoming terrain
    let forwardOffset = CAMERA_FORWARD_OFFSET;
    if (normalizedSlope < 0.5) {
        // Going downhill, look farther ahead
        forwardOffset *= (1 + (0.5 - normalizedSlope) * 2);
    }
    
    const lookTarget = playerPos.clone().add(
        playerDir.clone().multiplyScalar(forwardOffset)
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

// Setup terrain panel
function setupTerrainPanelControls() {
    // Update value displays when sliders change
    document.getElementById('height-scale').addEventListener('input', function() {
        document.getElementById('height-scale-value').textContent = this.value;
    });
    
    document.getElementById('roughness').addEventListener('input', function() {
        document.getElementById('roughness-value').textContent = this.value;
    });
    
    document.getElementById('large-scale').addEventListener('input', function() {
        document.getElementById('large-scale-value').textContent = this.value;
    });
    
    document.getElementById('medium-scale').addEventListener('input', function() {
        document.getElementById('medium-scale-value').textContent = this.value;
    });
    
    document.getElementById('small-scale').addEventListener('input', function() {
        document.getElementById('small-scale-value').textContent = this.value;
    });
    
    // Apply button updates the terrain parameters
    document.getElementById('apply-terrain').addEventListener('click', function() {
        if (!planet) return;
        
        // Get values from sliders
        const heightScale = parseFloat(document.getElementById('height-scale').value);
        const roughness = parseFloat(document.getElementById('roughness').value);
        const largeScale = parseFloat(document.getElementById('large-scale').value);
        const mediumScale = parseFloat(document.getElementById('medium-scale').value);
        const smallScale = parseFloat(document.getElementById('small-scale').value);
        
        // Update parameters
        planet.updateTerrainParams({
            heightScale: heightScale,
            roughness: roughness,
            largeScale: { influence: largeScale },
            mediumScale: { influence: mediumScale },
            smallScale: { influence: smallScale }
        });
        
        // We would rebuild the planet here, but for this simple demo
        // we'll just restart the game to regenerate the planet
        alert("To see changes, the game will restart with new terrain settings");
        startGame();
    });
    
    // Reset button resets to defaults
    document.getElementById('reset-terrain').addEventListener('click', function() {
        document.getElementById('height-scale').value = 0.12;
        document.getElementById('height-scale-value').textContent = 0.12;
        
        document.getElementById('roughness').value = 0.8;
        document.getElementById('roughness-value').textContent = 0.8;
        
        document.getElementById('large-scale').value = 0.5;
        document.getElementById('large-scale-value').textContent = 0.5;
        
        document.getElementById('medium-scale').value = 0.4;
        document.getElementById('medium-scale-value').textContent = 0.4;
        
        document.getElementById('small-scale').value = 0.1;
        document.getElementById('small-scale-value').textContent = 0.1;
    });
} 
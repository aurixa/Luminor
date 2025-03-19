/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

// Import THREE and dependencies properly as ES modules
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { createPlanet } from './planet.js';
import { setupPlayer } from './player.js';
import { setupPhysicsPlayer } from './physicsPlayer.js';
import { setupResources } from './resources.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';

// Helper functions for vector validation
function isValidVector(vector) {
    if (!vector) return false;
    if (typeof vector.x !== 'number' || isNaN(vector.x)) return false;
    if (typeof vector.y !== 'number' || isNaN(vector.y)) return false;
    if (typeof vector.z !== 'number' || isNaN(vector.z)) return false;
    return true;
}

function vectorToString(vector) {
    if (!vector) return "null";
    return `{x: ${vector.x}, y: ${vector.y}, z: ${vector.z}}`;
}

// Create a namespace for our game
window.Luminor = window.Luminor || {};

// Use physics-based player
const USE_PHYSICS = true;

// Main game state
const gameState = {
    isPlaying: false,
    score: 0,
    playerLength: 1,
};

// Clear any existing console logs
console.clear();

console.log("========== LUMINOR GAME ==========");
console.log("Welcome to Luminor - Dark Orbit");
console.log("Game initializing...");

// Create a function to handle initializing the game
function initializeGame() {
    // Verify THREE.js is available (should be loaded via import)
    if (typeof THREE === 'undefined') {
        showFatalError("THREE.js library could not be loaded.");
        return false;
    } else {
        console.log("THREE.js loaded successfully (version: " + THREE.REVISION + ")");
    }
    
    // SimplexNoise check is no longer needed since we use our own implementation in planet.js
    
    return true;
}

/**
 * Display a fatal error message
 */
function showFatalError(message) {
    console.error(message);
    
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.style.display = 'block';
        errorContainer.innerHTML = `
            <h3>Luminor - Initialization Error</h3>
            <p>${message}</p>
            <p>Please check the debug console for more information.</p>
            <button onclick="location.reload()">Retry</button>
        `;
    }
    
    // Hide loading screen if it exists
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    
    // Create a simple fallback scene to show something
    createFallbackScene(message);
}

/**
 * Create a simple fallback scene with error message
 */
function createFallbackScene(message) {
    console.log("Creating fallback scene display");
    
    try {
        // Create a simple scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000011); // Dark blue background
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        
        // Create a colored cube
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffaa });  // Green
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        
        // Create error message overlay
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '40%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '20px';
        errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        errorDiv.style.borderRadius = '10px';
        errorDiv.style.maxWidth = '600px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.boxShadow = '0 0 20px rgba(0, 255, 170, 0.5)';
        errorDiv.innerHTML = `
            <h2 style="color: #00ffaa; margin-top: 0;">Luminor - Initialization Error</h2>
            <p style="margin: 15px 0;">${message}</p>
            <p style="font-size: 0.9em; margin-top: 20px;">Please check the debug console for more information.</p>
        `;
        document.body.appendChild(errorDiv);
        
        // Simple animation function
        function animate() {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
        
        // Start animation
        animate();
    } catch (e) {
        console.error("Could not create fallback scene:", e);
        // Display a very basic text error as a last resort
        document.body.innerHTML = `
            <div style="color: white; text-align: center; margin-top: 100px; font-family: Arial;">
                <h1>Error Loading Luminor</h1>
                <p>${message}</p>
                <p>Additionally failed to create fallback scene: ${e.message}</p>
            </div>
        `;
    }
}

// Initialize the game
if (!initializeGame()) {
    console.error("Game initialization failed!");
} else {
    // Wrap the game setup in a function
    function setupGame() {
        // Initialize Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000011); // Dark blue background
        console.log("Scene created");

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        console.log("Camera created with FOV:", camera.fov);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);
        console.log("Renderer created and added to DOM");

        // Position camera much closer - only 100 units away
        camera.position.set(0, 0, 150);
        camera.lookAt(0, 0, 0);

        // Camera configuration
        const CAMERA_DISTANCE = 60;
        const CAMERA_HEIGHT = 60;
        const CAMERA_SMOOTHNESS = 0.08;
        const CAMERA_FORWARD_OFFSET = 20;

        // Add lights
        setupLights(scene, camera);

        // Debug controls
        let orbitControls = setupDebugControls(camera, renderer);

        // Create the planet first and ensure it's ready
        console.log("Creating planet...");
        const planet = createPlanet(scene);

        // Check if planet creation was successful
        if (!planet || !planet.mesh || !planet.radius) {
            showFatalError("Failed to create planet properly");
            return false;
        }

        // Initialize physics world with planet gravity
        console.log("Initializing physics world...");
        const physicsWorld = new PhysicsWorld({
            gravity: -9.81,
            planetRadius: planet.radius
        });

        // Create the player
        console.log("Setting up player...");
        let player = null;
        try {
            player = setupPhysicsPlayer(scene, planet, camera, physicsWorld);
            if (!player) {
                throw new Error("Failed to create player");
            }
        } catch (error) {
            console.error("Error setting up player:", error);
            showFatalError("Failed to initialize player properly");
            return false;
        }

        // Initialize resources
        console.log("Setting up resources...");
        const resources = setupResources(scene, planet);

        // Setup UI elements
        setupUI();

        // Create starfield
        const starField = createStarField(scene);

        // Setup animation loop
        function animate(timestamp) {
            try {
                // Update physics world first
                if (physicsWorld) {
                    physicsWorld.update(1/60);
                }
                
                // Update player if it exists and is properly initialized
                if (player && player.update) {
                    const playerState = player.update(1/60);
                    if (playerState && isValidVector(playerState.position)) {
                        updateCameraPosition(playerState, camera, planet);
                    }
                }
                
                // Update resources
                if (resources) {
                    resources.update(1/60);
                }
                
                // Render the scene
                renderer.render(scene, camera);
                
                // Continue animation loop
                requestAnimationFrame(animate);
            } catch (error) {
                console.error("Error in animation loop:", error);
            }
        }

        // Start the animation loop
        animate();
        return true;
    }

    // Run the game setup
    if (!setupGame()) {
        console.error("Game setup failed!");
    }
}

// Helper function to setup lights
function setupLights(scene, camera) {
    const ambientLight = new THREE.AmbientLight(0x666666, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffdd, 1.4);
    sunLight.position.set(200, 100, 200);
    sunLight.castShadow = true;
    setupShadowSettings(sunLight);
    scene.add(sunLight);

    const cameraLight = new THREE.PointLight(0xffffee, 0.7);
    camera.add(cameraLight);
    scene.add(camera);
}

// Helper function to setup shadow settings
function setupShadowSettings(light) {
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 1000;
    light.shadow.camera.left = -150;
    light.shadow.camera.right = 150;
    light.shadow.camera.top = 150;
    light.shadow.camera.bottom = -150;
    light.shadow.bias = -0.0001;
}

// Helper function to setup debug controls
function setupDebugControls(camera, renderer) {
    let orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.enabled = !gameState.isPlaying;
    return orbitControls;
}

// Helper function to setup UI elements
function setupUI() {
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
}

/**
 * Create a star field background
 */
function createStarField(scene) {
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
function animate(timestamp) {
    try {
        // Update physics world first
        if (physicsWorld) {
            physicsWorld.update(1/60); // Fixed timestep
        }
        
        // Update player if it exists and is properly initialized
        if (player && player.update) {
            const playerState = player.update(1/60);
            
            // Validate player state before using it
            if (playerState && isValidVector(playerState.position)) {
                // Update camera position
                updateCameraPosition(playerState);
            } else {
                console.warn("Invalid player state:", 
                    playerState ? vectorToString(playerState.position) : "null"
                );
            }
        }
        
        // Update resources
        if (resources) {
            resources.update(1/60);
        }
        
        // Render the scene
        renderer.render(scene, camera);
        
        // Continue animation loop
        requestAnimationFrame(animate);
    } catch (error) {
        console.error("Error in animation loop:", error);
    }
}

// Start the animation loop
animate();

// On window load, start the game
window.addEventListener('load', function() {
    console.log("Window loaded, starting game...");
    
    // Start the game after a short delay to ensure everything is loaded
    setTimeout(() => {
        startGame();
    }, 500);
}); 
/**
 * Luminor
 * Main game entry point
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { initializeScene, setupGameScene } from './core/sceneSetup.js';
import { setupControls } from './core/controls.js';
import { initGameLoop } from './core/gameLoop.js';
import { createPlanet } from './planet/planetCore.js';
import { setupPlayer } from './player/playerCore.js';
import { setupResources } from './resources.js';
import { setupUI } from './ui/interface.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { CAMERA_CONFIG, LIGHTING_CONFIG, STARFIELD_CONFIG } from './utils/constants.js';

// Main game state
const gameState = {
    isPlaying: false,
    isPaused: false,
    playerLength: 3,
    gameHasEnded: false
};

// Initialize scene, camera, renderer
const { scene, camera, renderer } = initializeScene();

// Setup game scene (lighting, starfield, etc.)
setupGameScene(scene, camera);

// Create the debug panel
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// Create the planet
const planet = createPlanet(scene);

// Initialize UI
const ui = setupUI(gameState, startGame);

// Initialize callback functions
const callbacks = {
    onSpacePressed: handleSpacePressed,
    onEscapePressed: handleEscapePressed,
    onPausePressed: handlePausePressed,
    onRestartPressed: handleRestartPressed,
    onMenuPressed: handleMenuPressed,
    onResourceCollected: handleResourceCollected,
    onScoreUpdated: handleScoreUpdated,
    onGameOver: handleGameOver
};

// Setup controls
const controls = setupControls(callbacks);

// Game objects (initialized when game starts)
let player = null;
let resources = null;
let gameLoop = null;
let starField = null;

// Listen for cleanup events (for full resource disposal)
document.addEventListener('luminorCleanup', cleanupAllResources);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/**
 * Initialize the game
 */
function startGame() {
    // Reset game state if needed
    if (gameState.gameHasEnded) {
        resetGame();
    }
    
    // Update game state
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.gameHasEnded = false;
    
    // Create player if needed
    if (!player) {
        player = setupPlayer(scene, planet, camera, controls.keys);
    }
    
    // Create resources if needed
    if (!resources) {
        resources = setupResources(scene, planet);
    }
    
    // Initialize game loop if needed
    if (!gameLoop) {
        gameLoop = initGameLoop(
            gameState, scene, camera, renderer, 
            player, planet, resources, stats, callbacks
        );
    }
    
    // Start the game loop
    gameLoop.start();
    
    // Update UI
    ui.updateUI(gameState);
}

/**
 * Reset the game
 */
function resetGame() {
    // Remove existing player and resources
    if (player) {
        player.dispose(scene);
        player = null;
    }
    
    if (resources) {
        resources.dispose(scene);
        resources = null;
    }
    
    // Reset game state
    gameState.playerLength = 3;
    gameState.gameHasEnded = false;
    
    // Create new player and resources
    player = setupPlayer(scene, planet, camera, controls.keys);
    resources = setupResources(scene, planet);
    
    // Update UI
    ui.updateUI(gameState);
}

/**
 * Handle space key press
 */
function handleSpacePressed() {
    if (!gameState.isPlaying) {
        startGame();
    } else if (gameState.isPaused) {
        gameLoop.resume();
        gameState.isPaused = false;
        ui.updateUI(gameState);
    }
}

/**
 * Handle escape key press
 */
function handleEscapePressed() {
    if (gameState.isPlaying && !gameState.gameHasEnded) {
        gameState.isPaused = !gameState.isPaused;
        
        if (gameState.isPaused) {
            gameLoop.pause();
        } else {
            gameLoop.resume();
        }
        
        ui.updateUI(gameState);
    }
}

/**
 * Handle pause key press
 */
function handlePausePressed() {
    handleEscapePressed();
}

/**
 * Handle restart key press
 */
function handleRestartPressed() {
    if (gameState.isPlaying) {
        resetGame();
    }
}

/**
 * Handle menu key press
 */
function handleMenuPressed() {
    if (gameState.isPlaying) {
        gameState.isPlaying = false;
        gameLoop.stop();
        resetGame();
        ui.updateUI(gameState);
    }
}

/**
 * Handle resource collection
 */
function handleResourceCollected(count) {
    ui.updateResourceCount(count);
}

/**
 * Handle score update
 */
function handleScoreUpdated(score) {
    ui.updateScore(score);
}

/**
 * Handle game over
 */
function handleGameOver(finalScore) {
    gameState.gameHasEnded = true;
    ui.showGameOver(finalScore);
}

// Store last time for deltaTime calculation
let lastTime = null;

/**
 * Update camera position to follow player
 */
function updateCameraPosition() {
    if (!player) return;
    
    // Get the player's position, direction and up vector (planet normal)
    const playerPos = player.getHeadPosition();
    const playerDir = player.getHeadDirection();
    const up = playerPos.clone().normalize(); // Normal at player position
    
    // Calculate the right vector
    const right = new THREE.Vector3().crossVectors(playerDir, up).normalize();
    
    // Recalculate forward to ensure orthogonality with up
    const forward = new THREE.Vector3().crossVectors(up, right).normalize();
    
    // Calculate terrain slope at player position and in forward direction
    const forwardCheckDist = 20;
    const forwardPoint = playerPos.clone().add(forward.clone().multiplyScalar(forwardCheckDist));
    
    const planetRadius = planet.radius;
    const forwardSurfacePoint = planet.getNearestPointOnSurface(forwardPoint);
    
    const playerToForward = forwardSurfacePoint.clone().sub(playerPos);
    let slopeRight = right.clone();
    let slopeUp = up.clone();
    
    const surfaceTangent = forward.clone()
        .sub(up.clone().multiplyScalar(forward.dot(up)))
        .normalize();
    
    const surfaceToForward = forwardSurfacePoint.clone().sub(
        playerPos.clone().add(surfaceTangent.clone().multiplyScalar(forwardCheckDist))
    );
    
    const slopeDot = surfaceTangent.dot(surfaceToForward.normalize());
    const slopeAngle = Math.asin(Math.min(1, Math.max(-1, slopeDot)));
    const normalizedSlope = (slopeAngle / (Math.PI/4)) + 0.5;
    
    let dynamicHeight = CAMERA_CONFIG.HEIGHT;
    let dynamicDistance = CAMERA_CONFIG.DISTANCE;
    
    if (normalizedSlope > CAMERA_CONFIG.SLOPE.THRESHOLD.UPHILL) {
        // Going uphill - lower the camera
        const slopeFactor = normalizedSlope - CAMERA_CONFIG.SLOPE.THRESHOLD.UPHILL;
        dynamicHeight = CAMERA_CONFIG.HEIGHT * (1 - slopeFactor * CAMERA_CONFIG.SLOPE.UPHILL_HEIGHT_FACTOR);
        dynamicDistance = CAMERA_CONFIG.DISTANCE * (1 + slopeFactor * CAMERA_CONFIG.SLOPE.UPHILL_DISTANCE_FACTOR);
    } else if (normalizedSlope < CAMERA_CONFIG.SLOPE.THRESHOLD.DOWNHILL) {
        // Going downhill - raise the camera and move it back
        const slopeFactor = CAMERA_CONFIG.SLOPE.THRESHOLD.DOWNHILL - normalizedSlope;
        dynamicHeight = CAMERA_CONFIG.HEIGHT * (1 + slopeFactor * CAMERA_CONFIG.SLOPE.DOWNHILL_HEIGHT_FACTOR);
        dynamicDistance = CAMERA_CONFIG.DISTANCE * (1 + slopeFactor * CAMERA_CONFIG.SLOPE.DOWNHILL_DISTANCE_FACTOR);
    }
    
    const cameraDirection = playerDir.clone().negate();
    const idealPosition = playerPos.clone()
        .add(cameraDirection.multiplyScalar(dynamicDistance))
        .add(up.multiplyScalar(dynamicHeight));
    
    camera.position.lerp(idealPosition, CAMERA_CONFIG.SMOOTHNESS);
    
    let forwardOffset = CAMERA_CONFIG.FORWARD_OFFSET;
    if (normalizedSlope < 0.5) {
        forwardOffset *= (1 + (0.5 - normalizedSlope) * 2);
    }
    
    const lookTarget = playerPos.clone().add(
        playerDir.clone().multiplyScalar(forwardOffset)
    );
    
    camera.lookAt(lookTarget);
    camera.up.copy(up);
}

/**
 * Main animation loop
 */
function animate(time) {
    // Start performance measurement
    stats.begin();
    
    // Calculate time delta
    const currentTime = time;
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // In playing state (not paused, not game over)
    if (gameState.isPlaying && !gameState.isPaused && !gameState.gameHasEnded) {
        // Update player
        if (player) {
            player.update(deltaTime / 1000);
        }
        
        // Update resources
        if (resources) {
            resources.update(player, deltaTime / 1000);
        }
        
        // Update UI
        if (ui) {
            ui.updateUI(gameState);
        }
    }
    
    // Always rotate starfield
    if (starField && starField.update) {
        starField.update(deltaTime);
    }
    
    // Update camera position
    updateCameraPosition();
    
    // Render the scene
    renderer.render(scene, camera);
    
    // End performance measurement
    stats.end();
    
    // Request next frame
    requestAnimationFrame(animate);
}

// Start animation loop
animate();

// Setup terrain panel for testing
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

/**
 * Comprehensive cleanup of all game resources
 * Called when returning to main menu or before page reload
 */
function cleanupAllResources(event) {
    console.log(`Cleaning up all resources (triggered by: ${event?.detail?.source || 'unknown'})`);
    
    // Stop the game loop
    if (gameLoop) {
        gameLoop.stop();
        gameLoop = null;
    }
    
    // Dispose of player
    if (player) {
        player.dispose(scene);
        player = null;
    }
    
    // Dispose of resources
    if (resources) {
        resources.dispose(scene);
        resources = null;
    }
    
    // Clear the scene
    while(scene.children.length > 0) { 
        const object = scene.children[0];
        disposeObject(object);
        scene.remove(object); 
    }
    
    // Dispose of renderer
    if (renderer) {
        renderer.renderLists.dispose();
        renderer.dispose();
    }
    
    // Remove stats if present
    if (stats && stats.dom && stats.dom.parentElement) {
        stats.dom.parentElement.removeChild(stats.dom);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', onWindowResize);
    document.removeEventListener('keydown', controls.handleKeyDown);
    document.removeEventListener('keyup', controls.handleKeyUp);
    
    // Force garbage collection hint (not guaranteed to work)
    if (window.gc) {
        window.gc();
    }
    
    console.log("All resources cleaned up");
}

/**
 * Helper function to dispose of a THREE.js object and all its children
 */
function disposeObject(object) {
    if (!object) return;
    
    // Dispose of geometries
    if (object.geometry) {
        object.geometry.dispose();
    }
    
    // Dispose of materials
    if (object.material) {
        if (Array.isArray(object.material)) {
            object.material.forEach(material => material && material.dispose());
        } else {
            object.material.dispose();
        }
    }
    
    // Dispose of textures
    if (object.material && object.material.map) {
        object.material.map.dispose();
    }
    
    // Recursively dispose of children
    if (object.children && object.children.length > 0) {
        const children = [...object.children];
        children.forEach(child => disposeObject(child));
    }
} 	
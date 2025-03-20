/**
 * Luminor
 * Game loop and animation management
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Animation loop timing variables
let lastTime = 0;
let animationFrame = null;
let deltaTime = 0;

/**
 * Initialize the game loop
 * @param {Object} gameState - Current game state object
 * @param {THREE.Scene} scene - Three.js scene
 * @param {THREE.Camera} camera - Three.js camera
 * @param {THREE.WebGLRenderer} renderer - Three.js renderer
 * @param {Object} player - Player object
 * @param {Object} planet - Planet object
 * @param {Object} resources - Resources manager
 * @param {Object} stats - Performance stats display
 * @param {Object} callbacks - Event callbacks object
 * @returns {Object} Game loop controller
 */
export function initGameLoop(gameState, scene, camera, renderer, player, planet, resources, stats, callbacks) {
    // Store references
    const gameLoop = {
        start: () => startGameLoop(gameState, scene, camera, renderer, player, planet, resources, stats, callbacks),
        stop: stopGameLoop,
        pause: () => pauseGame(gameState),
        resume: () => resumeGame(gameState),
        isRunning: false
    };
    
    return gameLoop;
}

/**
 * Start the game animation loop
 * @private
 */
function startGameLoop(gameState, scene, camera, renderer, player, planet, resources, stats, callbacks) {
    lastTime = performance.now();
    animationFrame = requestAnimationFrame((time) => 
        animate(time, gameState, scene, camera, renderer, player, planet, resources, stats, callbacks)
    );
    
    return true;
}

/**
 * Stop the game animation loop
 * @private
 */
function stopGameLoop() {
    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    
    return true;
}

/**
 * Pause the game
 * @private
 */
function pauseGame(gameState) {
    gameState.isPaused = true;
    return true;
}

/**
 * Resume the game
 * @private
 */
function resumeGame(gameState) {
    gameState.isPaused = false;
    return true;
}

/**
 * Main animation loop
 * @private
 */
function animate(time, gameState, scene, camera, renderer, player, planet, resources, stats, callbacks) {
    // Start performance measurement
    stats.begin();
    
    // Calculate delta time
    deltaTime = (time - lastTime) / 1000;
    lastTime = time;
    
    // Cap delta time to prevent large jumps after tab switch, etc.
    if (deltaTime > 0.1) deltaTime = 0.1;
    
    // Skip updates if paused, but still render
    if (gameState.isPlaying && !gameState.isPaused && !gameState.gameHasEnded) {
        // Update player
        if (player && player.update) {
            player.update(deltaTime);
        }
        
        // Update resources
        if (resources && resources.update) {
            resources.update(player, deltaTime);
            
            if (callbacks.onResourceCollected && resources.getCollectedCount && resources.getCollectedCount() > 0) {
                callbacks.onResourceCollected(resources.getCollectedCount());
            }
        }
        
        // Update game state
        if (player && player.getSegmentCount) {
            gameState.playerLength = player.getSegmentCount();
            
            if (callbacks.onScoreUpdated) {
                callbacks.onScoreUpdated(gameState.playerLength);
            }
        }
        
        // Game over condition
        if (!gameState.gameHasEnded && callbacks.onGameOver && gameState.isPlaying && player.checkCollision()) {
            gameState.gameHasEnded = true;
            callbacks.onGameOver(gameState.playerLength);
        }
    }
    
    // Update starfield rotation if available
    if (scene.getObjectByName('starfield') && typeof scene.getObjectByName('starfield').update === 'function') {
        scene.getObjectByName('starfield').update(deltaTime * 1000);
    }
    
    // Update camera position
    if (player && planet && callbacks.updateCamera) {
        callbacks.updateCamera(camera, player, planet, deltaTime);
    }
    
    // Render the scene
    renderer.render(scene, camera);
    
    // End performance measurement
    stats.end();
    
    // Request next frame
    animationFrame = requestAnimationFrame((newTime) => 
        animate(newTime, gameState, scene, camera, renderer, player, planet, resources, stats, callbacks)
    );
} 
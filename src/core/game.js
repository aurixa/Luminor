/**
 * Luminor
 * Core game controller
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

// Import subsystems
import { setupRenderer } from '../rendering/renderer.js';
import { setupCamera } from '../rendering/camera.js';
import { setupLighting } from '../rendering/lighting.js';
import { createStarField } from '../rendering/starfield.js';
import { createPlanet } from '../entities/planet.js';
import { setupPlayer } from '../entities/player.js';
import { setupResources } from '../entities/resources.js';
import { setupUI, updateUI } from '../ui/interface.js';
import { setupControls } from '../core/controls.js';
import { updateCameraPosition } from '../rendering/cameraController.js';

// Game state object
const gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    playerLength: 1,
    debugMode: false,
};

// Core game objects
let scene, renderer, camera, controls;
let stats;

// Game entities
let planet, player, resources;

/**
 * Initialize the game
 */
export function initializeGame() {
    console.log('Game initialization started');
    
    // Create the Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    
    // Setup renderer and camera
    renderer = setupRenderer();
    camera = setupCamera();
    
    // Add lighting to the scene
    setupLighting(scene);
    
    // Create starfield background
    createStarField(scene);
    
    // Create the planet
    planet = createPlanet(scene);
    
    // Setup player with planet reference
    player = setupPlayer(scene, planet, camera);
    
    // Setup resources with planet reference
    resources = setupResources(scene, planet);
    
    // Setup UI with game state and start function
    setupUI(gameState, startGame);
    
    // Setup controls
    controls = setupControls(player, gameState);
    
    // Setup performance stats
    if (gameState.debugMode) {
        stats = new Stats();
        document.body.appendChild(stats.dom);
    }
    
    // Start animation loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    console.log('Game initialization completed');
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = 1/60; // Fixed delta time for consistent physics
    
    if (gameState.isPlaying && !gameState.isPaused) {
        // Update player
        player.update(deltaTime);
        
        // Update camera
        updateCameraPosition(player.getState(), camera, planet);
        
        // Check resource collection
        const collected = resources.checkCollection(player.getHeadPosition());
        if (collected) {
            gameState.score += 10;
            gameState.playerLength += 1;
            player.addSegment();
            updateUI(gameState);
        }
        
        // Check for game over conditions
        if (player.checkCollision()) {
            endGame();
        }
    }
    
    // Always render scene (even when paused)
    renderer.render(scene, camera);
    
    // Update stats
    if (gameState.debugMode && stats) {
        stats.update();
    }
}

/**
 * Handle window resize
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Start a new game
 */
function startGame() {
    console.log('Starting new game');
    
    // Reset game state
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.playerLength = 1;
    
    // Reset player
    player.reset();
    
    // Reset resources
    resources.reset();
    
    // Update UI
    updateUI(gameState);
}

/**
 * End the current game
 */
function endGame() {
    console.log('Game over');
    
    gameState.isPlaying = false;
    gameState.isPaused = false;
    updateUI(gameState);
} 
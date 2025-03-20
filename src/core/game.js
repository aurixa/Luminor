/**
 * Luminor
 * Main game initialization and entry point
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { initializeScene, setupGameScene } from './sceneSetup.js';
import { setupControls } from './controls.js';
import { initGameLoop } from './gameLoop.js';
import { createPlanet } from '../planet/planetCore.js';
import { setupPlayer } from '../player/playerCore.js';
import { setupResources } from '../resources.js';
import { setupUI } from '../ui/interface.js';
import { setupCamera, updateCameraPosition } from '../rendering/camera.js';
import { setupLighting } from '../rendering/lighting.js';
import { createStarField } from '../rendering/starfield.js';

// Game state object
const gameState = {
    isPlaying: false,
    isPaused: false,
    playerLength: 3,
    gameHasEnded: false
};

// Game components
let scene = null;
let camera = null;
let renderer = null;
let stats = null;
let controls = null;
let planet = null;
let player = null;
let resources = null;
let gameLoop = null;
let starField = null;
let ui = null;

// Game callbacks
let gameCallbacks = null;

/**
 * Initialize the game
 * The main entry point from index.js
 */
export function initializeGame() {
    console.log('Initializing Luminor game...');
    
    // Setup scene, camera, and renderer
    const sceneSetup = initializeScene();
    scene = sceneSetup.scene;
    camera = sceneSetup.camera;
    renderer = sceneSetup.renderer;
    
    // Setup stats for performance monitoring
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    
    // Setup lighting
    setupLighting(scene);
    
    // Create starfield
    starField = createStarField(scene);
    
    // Create planet
    planet = createPlanet(scene);
    
    // Setup control callbacks
    gameCallbacks = {
        onSpacePressed: handleSpacePressed,
        onEscapePressed: handleEscapePressed,
        onPausePressed: handlePausePressed,
        onRestartPressed: handleRestartPressed,
        onMenuPressed: handleMenuPressed,
        onResourceCollected: handleResourceCollected,
        onScoreUpdated: handleScoreUpdated,
        onGameOver: handleGameOver,
        updateCamera: (camera, player, planet, deltaTime) => {
            updateCameraPosition(camera, player, planet, deltaTime);
        }
    };
    
    // Setup controls
    controls = setupControls(gameCallbacks);
    
    // Setup UI
    ui = setupUI(gameState, startGame);
}

/**
 * Start or restart the game
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
            player, planet, resources, stats, 
            gameCallbacks
        );
    }
    
    // Start the game loop
    gameLoop.start();
    
    // Update UI
    ui.updateUI(gameState);
}

/**
 * Reset the game state for a new game
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
 * Event handler callbacks
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

function handlePausePressed() {
    handleEscapePressed();
}

function handleRestartPressed() {
    if (gameState.isPlaying) {
        resetGame();
    }
}

function handleMenuPressed() {
    if (gameState.isPlaying) {
        gameState.isPlaying = false;
        gameLoop.stop();
        resetGame();
        ui.updateUI(gameState);
    }
}

function handleResourceCollected(count) {
    ui.updateResourceCount(count);
}

function handleScoreUpdated(score) {
    ui.updateScore(score);
}

function handleGameOver(finalScore) {
    gameState.gameHasEnded = true;
    ui.showGameOver(finalScore);
} 
/**
 * Luminor
 * Main game initialization and entry point
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { initializeScene } from './sceneSetup';
import { setupControls } from './controls';
import { initGameLoop } from './gameLoop';
import { createPlanet } from '../planet/planetCore';
import { setupPlayer } from '../player/playerCore';
import { setupResources } from './resources';
import { setupUI } from '../ui/interface';
import { updateCameraPosition } from '../rendering/camera';
import { setupLighting } from '../rendering/lighting';
import { createStarfield } from '../rendering/starfield';
import { GameState, GameCallbacks, Player, ResourceManager, GameLoop, GameUI, Planet, Controls } from '../types';

// Game components and callbacks
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let stats: Stats | null = null;
let controls: Controls | null = null;
let planet: Planet | null = null;
let player: Player | null = null;
let resources: ResourceManager | null = null;
let gameLoop: GameLoop | null = null;
let ui: GameUI | null = null;
let gameCallbacks: GameCallbacks;

// Game state object
const gameState: GameState = {
    scene: null,
    camera: null,
    player: null,
    planet: null,
    controls: null,
    gameLoop: null,
    gameUI: null,
    stats: null,
    callbacks: {} as GameCallbacks, // Temporarily initialize with empty object
    isPlaying: false,
    isPaused: false,
    playerLength: 3,
    gameHasEnded: false,
    score: 0,
    resourceCount: 0
};

// Define game callbacks
gameCallbacks = {
    onSpacePressed: () => {
        if (!gameState.isPlaying) {
            startGame();
        }
    },
    onEscapePressed: () => {
        if (gameState.isPlaying) {
            pauseGame();
        }
    },
    onPausePressed: () => {
        if (gameState.isPlaying) {
            pauseGame();
        }
    },
    onRestartPressed: () => {
        if (gameState.gameHasEnded) {
            restartGame();
        }
    },
    onMenuPressed: () => {
        if (gameState.isPlaying || gameState.gameHasEnded) {
            returnToMenu();
        }
    },
    onResourceCollected: (count: number) => {
        gameState.resourceCount = count;
        if (gameState.gameUI) {
            gameState.gameUI.updateResourceCount(count);
        }
    },
    onScoreUpdated: (score: number) => {
        gameState.score = score;
        if (gameState.gameUI) {
            gameState.gameUI.updateScore(score);
        }
    },
    onGameOver: (finalScore?: number) => {
        gameState.gameHasEnded = true;
        gameState.isPlaying = false;
        if (gameState.gameUI) {
            gameState.gameUI.showGameOver(finalScore || gameState.score);
        }
    },
    onGameWon: () => {
        gameState.gameHasEnded = true;
        gameState.isPlaying = false;
        // Add game won logic here
    },
    onScoreUpdate: () => {
        if (gameState.gameUI) {
            gameState.gameUI.updateScore(gameState.score);
        }
    },
    updateCamera: () => {
        if (gameState.camera && gameState.player && gameState.planet) {
            updateCameraPosition(gameState.camera, gameState.player, gameState.planet, 0);
        }
    }
};

// Set callbacks after initialization
gameState.callbacks = gameCallbacks;

/**
 * Initialize the game
 * The main entry point from index.js
 */
export function initializeGame(): void {
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
    if (scene) {
        setupLighting(scene);
        
        // Create starfield
        createStarfield(scene);
        
        // Create planet
        planet = createPlanet(scene);
    }
    
    // Setup controls
    controls = setupControls(gameCallbacks);
    
    // Setup UI
    ui = setupUI(gameState, startGame);
}

/**
 * Start or restart the game
 */
function startGame(): void {
    // Reset game state if needed
    if (gameState.gameHasEnded) {
        resetGame();
    }
    
    // Update game state
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.gameHasEnded = false;
    
    // Create player if needed
    if (!player && scene && planet && camera && controls) {
        player = setupPlayer(scene, planet, camera, controls.keys);
    }
    
    // Create resources if needed
    if (!resources && scene && planet) {
        resources = setupResources(scene, planet);
    }
    
    // Initialize game loop if needed
    if (!gameLoop && scene && camera && renderer && player && planet && resources && stats) {
        gameLoop = initGameLoop(
            gameState,
            scene,
            camera,
            renderer,
            player,
            planet,
            resources,
            stats,
            gameCallbacks
        );
    }
    
    // Start the game loop
    if (gameLoop) {
        gameLoop.start();
    }
    
    // Update UI
    if (ui) {
        ui.updateUI(gameState);
    }
}

/**
 * Reset the game state for a new game
 */
function resetGame(): void {
    // Remove existing player and resources
    if (player && scene) {
        player.dispose(scene);
        player = null;
    }
    
    if (resources && scene) {
        resources.dispose(scene);
        resources = null;
    }
    
    // Reset game state
    gameState.playerLength = 3;
    gameState.gameHasEnded = false;
    gameState.score = 0;
    gameState.resourceCount = 0;
    
    // Create new player and resources
    if (scene && planet && camera && controls) {
        player = setupPlayer(scene, planet, camera, controls.keys);
    }
    
    if (scene && planet) {
        resources = setupResources(scene, planet);
    }
    
    // Update UI
    if (ui) {
        ui.updateUI(gameState);
    }
}

/**
 * Event handler callbacks
 */
function handleSpacePressed(): void {
    if (!gameState.isPlaying) {
        startGame();
    } else if (gameState.isPaused && gameLoop) {
        gameLoop.resume();
        gameState.isPaused = false;
        if (ui) ui.updateUI(gameState);
    }
}

function handleEscapePressed(): void {
    if (gameState.isPlaying && !gameState.gameHasEnded) {
        gameState.isPaused = !gameState.isPaused;
        
        if (gameState.isPaused && gameLoop) {
            gameLoop.pause();
        } else if (gameLoop) {
            gameLoop.resume();
        }
        
        if (ui) ui.updateUI(gameState);
    }
}

function handlePausePressed(): void {
    handleEscapePressed();
}

function handleRestartPressed(): void {
    if (gameState.isPlaying) {
        resetGame();
    }
}

function handleMenuPressed(): void {
    if (gameState.isPlaying && gameLoop) {
        gameState.isPlaying = false;
        gameLoop.stop();
        resetGame();
        if (ui) ui.updateUI(gameState);
    }
}

function handleResourceCollected(count: number): void {
    gameState.resourceCount = count;
    if (ui) ui.updateResourceCount(count);
}

function handleScoreUpdated(score: number): void {
    gameState.score = score;
    if (ui) ui.updateScore(score);
}

function handleGameOver(finalScore: number): void {
    gameState.gameHasEnded = true;
    if (ui) ui.showGameOver(finalScore);
}

/**
 * Pause the game
 */
function pauseGame(): void {
    if (gameLoop) {
        gameLoop.pause();
        gameState.isPaused = true;
        if (ui) ui.updateUI(gameState);
    }
}

/**
 * Return to the main menu
 */
function returnToMenu(): void {
    if (gameLoop) {
        gameLoop.stop();
        gameState.isPlaying = false;
        gameState.isPaused = false;
        if (ui) ui.updateUI(gameState);
    }
}

/**
 * Restart the game
 */
function restartGame(): void {
    resetGame();
    startGame();
} 
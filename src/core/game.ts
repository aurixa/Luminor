/**
 * Luminor
 * Main game initialization and entry point
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { initializeScene, setupGameScene } from './sceneSetup';
import { setupControls } from './controls';
import { initGameLoop } from './gameLoop';
import { createPlanet } from '../planet/planetCore';
import { setupPlayer } from '../player/playerCore';
import { setupResources } from '../resources';
import { setupUI } from '../ui/interface';
import { setupCamera, updateCameraPosition } from '../rendering/camera';
import { setupLighting } from '../rendering/lighting';
import { createStarField } from '../rendering/starfield';

// Game state object
const gameState: GameState = {
  isPlaying: false,
  isPaused: false,
  playerLength: 3,
  gameHasEnded: false
};

// Game components
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let stats: Stats | null = null;
let controls: any = null; // Will be properly typed when controls.js is converted
let planet: any = null; // Will be properly typed when planetCore.js is converted
let player: Player | null = null;
let resources: any = null; // Will be properly typed when resources.js is converted
let gameLoop: any = null; // Will be properly typed when gameLoop.js is converted
let starField: THREE.Points | null = null;
let ui: GameUI | null = null;

// Game callbacks
let gameCallbacks: GameCallbacks | null = null;

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
    updateCamera: (camera: THREE.PerspectiveCamera, player: Player, planet: any, deltaTime: number): void => {
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
  if (!gameLoop && scene && camera && renderer && player && planet && resources && stats && gameCallbacks) {
    gameLoop = initGameLoop(
      gameState, scene, camera, renderer, 
      player, planet, resources, stats, 
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
  if (ui) ui.updateResourceCount(count);
}

function handleScoreUpdated(score: number): void {
  if (ui) ui.updateScore(score);
}

function handleGameOver(finalScore: number): void {
  gameState.gameHasEnded = true;
  if (ui) ui.showGameOver(finalScore);
} 
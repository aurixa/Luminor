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
import { setupLighting } from '../rendering/lighting';
import { createStarfield } from '../rendering/starfield';
import {
  GameState,
  GameCallbacks,
  Player,
  ResourceManager,
  GameLoop,
  GameUI,
  Planet,
  Controls
} from '../types';

// Game components and callbacks
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let stats: Stats | null = null;
let controls: Controls | null = null;
let planet: Planet | null = null;
let player: Player | null = null;
let resources: ResourceManager | null = null;
const gameLoop: GameLoop | null = null;
const ui: GameUI | null = null;

const gameCallbacks: GameCallbacks = {
  onSpacePressed: () => {
    if (!gameState.isPlaying) {
      startGame();
    }
  },
  onEscapePressed: handleEscapePressed,
  onPausePressed: handlePausePressed,
  onRestartPressed: handleRestartPressed,
  onMenuPressed: handleMenuPressed,
  onResourceCollected: handleResourceCollected,
  onScoreUpdated: handleScoreUpdated,
  onGameOver: handleGameOver,
  onGameWon: () => {
    gameState.gameHasEnded = true;
    gameState.isPlaying = false;
  },
  onScoreUpdate: (score: number) => {
    gameState.score = score;
  }
};

const gameState: GameState = {
  scene: null,
  camera: null,
  renderer: null,
  stats: null,
  controls: null,
  planet: null,
  player: null,
  resources: null,
  gameLoop: null,
  gameUI: null,
  callbacks: gameCallbacks,
  isPlaying: false,
  isPaused: false,
  isRunning: false,
  gameHasEnded: false,
  score: 0,
  playerLength: 1,
  resourceCount: 0
};

// Set callbacks after initialization
gameState.callbacks = gameCallbacks;

/**
 * Initialize the game
 * The main entry point from index.js
 */
export function initializeGame(): void {
  console.log('Initializing Luminor game...');

  try {
    // Initialize core game components
    initializeGameComponents();

    // Make sure renderer is attached to DOM
    if (renderer && !document.body.contains(renderer.domElement)) {
      document.body.appendChild(renderer.domElement);
    }

    gameState.scene = scene;
    gameState.camera = camera;
    gameState.renderer = renderer;

    // Setup stats
    stats = new Stats();
    document.body.appendChild(stats.dom);
    gameState.stats = stats;

    // Setup lighting and environment
    if (scene) {
      setupLighting(scene);
      createStarfield(scene);
    }

    // Initialize player and resources
    initializePlayerAndResources();

    // Initialize UI and game loop
    initializeUIAndGameLoop();

    // Start the game loop
    if (gameState.gameLoop) {
      gameState.gameLoop.start();
      gameState.isPlaying = true;
      gameState.isPaused = false;
      gameState.gameHasEnded = false;
    } else {
      throw new Error('Game loop failed to initialize');
    }
  } catch (error) {
    console.error('Failed to initialize game:', error);
    throw error;
  }
}

/**
 * Initialize game components
 * @private
 */
function initializeGameComponents(): void {
  // Setup scene
  const sceneSetup = initializeScene();
  scene = sceneSetup.scene;
  camera = sceneSetup.camera;
  renderer = sceneSetup.renderer;
  gameState.scene = scene;
  gameState.camera = camera;

  // Setup stats
  stats = new Stats();
  document.body.appendChild(stats.dom);
  gameState.stats = stats;

  // Setup planet
  planet = createPlanet(scene);
  gameState.planet = planet;

  // Setup controls
  controls = setupControls(gameCallbacks);
  gameState.controls = controls;
}

/**
 * Initialize player and resources
 * @private
 */
function initializePlayerAndResources(): void {
  if (!gameState.scene || !gameState.planet || !gameState.camera || !gameState.controls) {
    throw new Error('Required game components not initialized');
  }

  // Setup player
  const player = setupPlayer(
    gameState.scene,
    gameState.planet,
    gameState.camera,
    gameState.controls.keys
  );
  gameState.player = player;

  // Setup resources
  const resources = setupResources(gameState.scene, gameState.planet);
  gameState.resources = resources;
}

/**
 * Initialize UI and game loop
 * @private
 */
function initializeUIAndGameLoop(): void {
  if (
    !gameState.scene ||
    !gameState.camera ||
    !gameState.player ||
    !gameState.planet ||
    !renderer ||
    !gameState.stats
  ) {
    throw new Error('Required game components not initialized');
  }

  // Setup UI
  const ui = setupUI(gameState, startGame);
  gameState.gameUI = ui;

  // Setup game loop
  if (gameState.resources) {
    const gameLoop = initGameLoop(
      gameState,
      gameState.scene,
      gameState.camera,
      renderer,
      gameState.player,
      gameState.planet,
      gameState.resources,
      gameState.stats,
      gameCallbacks
    );
    gameState.gameLoop = gameLoop;
  }
}

/**
 * Start the game
 */
function startGame(): void {
  try {
    // Reset game state if needed
    if (gameState.gameHasEnded || gameState.isPaused) {
      resetGame();
    }

    // Update game state
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.gameHasEnded = false;

    // Start/resume game loop
    if (gameState.gameLoop) {
      gameState.gameLoop.start();
    } else {
      throw new Error('Game loop not initialized');
    }
  } catch (error) {
    console.error('Failed to start game:', error);
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
  if (ui) ui.update(gameState);
}

/**
 * Event handler callbacks
 */
function handleEscapePressed(): void {
  if (gameState.isPlaying && !gameState.gameHasEnded) {
    gameState.isPaused = !gameState.isPaused;

    if (gameState.isPaused && gameLoop) {
      gameLoop.pause();
    } else if (gameLoop) {
      gameLoop.resume();
    }

    if (ui) ui.update(gameState);
  }
}

function handlePausePressed(): void {
  if (gameState.isPlaying) {
    pauseGame();
  }
}

function handleRestartPressed(): void {
  if (gameState.gameHasEnded) {
    restartGame();
  }
}

function handleMenuPressed(): void {
  if (gameState.isPlaying || gameState.gameHasEnded) {
    returnToMenu();
  }
}

function handleResourceCollected(count: number): void {
  gameState.resourceCount = count;
  if (gameState.gameUI) {
    gameState.gameUI.updateResourceCount(count);
  }
}

function handleScoreUpdated(score: number): void {
  gameState.score = score;
  if (gameState.gameUI) {
    gameState.gameUI.updateScore(score);
  }
}

function handleGameOver(finalScore?: number): void {
  gameState.gameHasEnded = true;
  gameState.isPlaying = false;
  if (gameState.gameUI) {
    gameState.gameUI.showGameOver(finalScore || gameState.score);
  }
}

/**
 * Pause the game
 */
function pauseGame(): void {
  if (gameLoop) {
    gameLoop.pause();
    gameState.isPaused = true;
    if (ui) ui.update(gameState);
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
    if (ui) ui.update(gameState);
  }
}

/**
 * Restart the game
 */
function restartGame(): void {
  resetGame();
  startGame();
}

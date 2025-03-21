/**
 * Luminor
 * Main game entry point
 * Code written by a mixture of AI (2025)
 */

import Stats from 'three/examples/jsm/libs/stats.module.js';
import { initializeScene } from './core/sceneSetup';
import { setupControls } from './core/controls';
import { initGameLoop } from './core/gameLoop';
import { createPlanet } from './planet/planetCore';
import { setupPlayer } from './player/playerCore';
import { GameState, GameCallbacks } from './types';
import { setupResources } from './core/resources';
import { setupUI } from './ui/interface';

// Game callbacks
const gameCallbacks: GameCallbacks = {
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
  }
};

// Initialize game state
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

// Initialize game
export async function initGame(): Promise<void> {
  try {
    // Setup scene
    const { scene, camera, renderer } = initializeScene();
    gameState.scene = scene;
    gameState.camera = camera;

    // Setup stats
    const stats = new Stats();
    document.body.appendChild(stats.dom);
    gameState.stats = stats;

    // Setup planet
    const planet = createPlanet(scene);
    gameState.planet = planet;

    // Setup controls
    const controls = setupControls(gameCallbacks);
    gameState.controls = controls;

    // Setup player
    if (scene && planet && camera && controls) {
      const player = setupPlayer(scene, planet, camera, controls.keys);
      gameState.player = player;
    }

    // Setup resources
    if (scene && planet) {
      const resources = setupResources(scene, planet);
      gameState.resources = resources;
    }

    // Setup UI
    const ui = setupUI(gameState, startGame);
    gameState.gameUI = ui;

    // Setup game loop
    if (gameState.player && gameState.resources) {
      const gameLoop = initGameLoop(
        gameState,
        scene,
        camera,
        renderer,
        gameState.player,
        planet,
        gameState.resources,
        stats,
        gameCallbacks
      );
      gameState.gameLoop = gameLoop;

      // Start game loop
      gameLoop.start();
    } else {
      throw new Error('Failed to initialize player or resources');
    }
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

// Game control functions
function startGame(): void {
  gameState.isPlaying = true;
  gameState.isPaused = false;
  gameState.gameHasEnded = false;
  if (gameState.gameLoop) {
    gameState.gameLoop.start();
  }
}

function pauseGame(): void {
  gameState.isPaused = true;
  if (gameState.gameLoop) {
    gameState.gameLoop.pause();
  }
}

function restartGame(): void {
  gameState.score = 0;
  gameState.resourceCount = 0;
  gameState.playerLength = 3;
  gameState.gameHasEnded = false;
  startGame();
}

function returnToMenu(): void {
  gameState.isPlaying = false;
  gameState.isPaused = false;
  gameState.gameHasEnded = false;
  if (gameState.gameLoop) {
    gameState.gameLoop.stop();
  }
}

// Start the game
initGame().catch(console.error);

/**
 * Luminor
 * Game loop and animation management
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GameState, GameCallbacks, Player, ResourceManager, GameLoop, Planet } from '../types';
import { updateCameraPosition } from '../rendering/camera';

// Animation loop timing variables
let lastTime = 0;
let animationFrame: number | null = null;
let deltaTime = 0;

/**
 * Initialize the game loop
 * @param gameState - Current game state object
 * @param scene - Three.js scene
 * @param camera - Three.js camera
 * @param renderer - Three.js renderer
 * @param player - Player object
 * @param planet - Planet object
 * @param resources - Resources manager
 * @param stats - Performance stats display
 * @param callbacks - Event callbacks object
 * @returns Game loop controller
 */
export function initGameLoop(
  gameState: GameState,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  player: Player,
  planet: Planet,
  resources: ResourceManager,
  stats: Stats,
  callbacks: GameCallbacks
): GameLoop {
  // Store references
  const gameLoop: GameLoop = {
    start: () => {
      startGameLoop(
        gameState,
        scene,
        camera,
        renderer,
        player,
        planet,
        resources,
        stats,
        callbacks
      );
    },
    stop: stopGameLoop,
    pause: () => pauseGame(gameState),
    resume: () => resumeGame(gameState),
    dispose: () => {
      stopGameLoop();
      // Additional cleanup if needed
    }
  };

  return gameLoop;
}

/**
 * Start the game animation loop
 * @private
 */
function startGameLoop(
  gameState: GameState,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  player: Player,
  planet: Planet,
  resources: ResourceManager,
  stats: Stats,
  callbacks: GameCallbacks
): void {
  lastTime = performance.now();
  animationFrame = requestAnimationFrame(time =>
    animate(time, gameState, scene, camera, renderer, player, planet, resources, stats, callbacks)
  );
}

/**
 * Stop the game animation loop
 * @private
 */
function stopGameLoop(): void {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

/**
 * Pause the game
 * @private
 */
function pauseGame(gameState: GameState): void {
  gameState.isPaused = true;
}

/**
 * Resume the game
 * @private
 */
function resumeGame(gameState: GameState): void {
  gameState.isPaused = false;
}

/**
 * Main animation loop
 * @private
 */
function animate(
  time: number,
  gameState: GameState,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  player: Player,
  planet: Planet,
  resources: ResourceManager,
  stats: Stats,
  callbacks: GameCallbacks
): void {
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
    if (player) {
      player.update(deltaTime);

      // Check for collisions with resources
      if (resources) {
        resources.checkCollisions(player);
      }

      // Update camera to follow player
      updateCameraPosition(camera, player);
    }

    // Update resources
    if (resources) {
      resources.update(player, deltaTime);
    }

    // Update game state and score
    if (callbacks.onScoreUpdated) {
      callbacks.onScoreUpdated(gameState.score);
    }
  }

  // Render the scene
  renderer.render(scene, camera);

  // End performance measurement
  stats.end();

  // Continue animation loop if not stopped
  if (animationFrame !== null) {
    animationFrame = requestAnimationFrame(nextTime =>
      animate(
        nextTime,
        gameState,
        scene,
        camera,
        renderer,
        player,
        planet,
        resources,
        stats,
        callbacks
      )
    );
  }
}

/**
 * Luminor
 * Game controls and input handling
 * Code written by a mixture of AI (2025)
 */

import { InputKeys, GameCallbacks, Controls } from '../types';

// Key state tracking
const keys: InputKeys = {
  up: false,
  down: false,
  left: false,
  right: false,
  space: false
};

// Track event listeners for cleanup
let keydownListener: ((event: KeyboardEvent) => void) | null = null;
let keyupListener: ((event: KeyboardEvent) => void) | null = null;

/**
 * Initialize game controls
 * @param callbacks - Event callback functions
 * @returns Controls object with key states and functions
 */
export function setupControls(callbacks: GameCallbacks): Controls {
  // Create bound event handlers
  keydownListener = (event: KeyboardEvent) => handleKeyDown(event, callbacks);
  keyupListener = (event: KeyboardEvent) => handleKeyUp(event);
  
  // Add event listeners
  window.addEventListener('keydown', keydownListener);
  window.addEventListener('keyup', keyupListener);
  
  return {
    keys,
    disable: disableControls,
    enable: enableControls,
    handleKeyDown: (event: KeyboardEvent) => handleKeyDown(event, callbacks),
    handleKeyUp: (event: KeyboardEvent) => handleKeyUp(event)
  };
}

/**
 * Handle key down events
 * @private
 */
function handleKeyDown(event: KeyboardEvent, callbacks: GameCallbacks): void {
  updateKeyState(event.code, true);
  
  // Special key handlers
  switch (event.code) {
    case 'Space':
      if (callbacks.onSpacePressed) callbacks.onSpacePressed();
      break;
    case 'Escape':
      if (callbacks.onEscapePressed) callbacks.onEscapePressed();
      break;
    case 'KeyP':
      if (callbacks.onPausePressed) callbacks.onPausePressed();
      break;
    case 'KeyR':
      if (callbacks.onRestartPressed) callbacks.onRestartPressed();
      break;
    case 'KeyM':
      if (callbacks.onMenuPressed) callbacks.onMenuPressed();
      break;
  }
  
  // Prevent default behavior for game control keys
  if (isGameControlKey(event.code)) {
    event.preventDefault();
  }
}

/**
 * Handle key up events
 * @private
 */
function handleKeyUp(event: KeyboardEvent): void {
  updateKeyState(event.code, false);
  
  // Prevent default behavior for game control keys
  if (isGameControlKey(event.code)) {
    event.preventDefault();
  }
}

/**
 * Update key state
 * @private
 */
function updateKeyState(code: string, isPressed: boolean): void {
  switch (code) {
    case 'ArrowUp':
    case 'KeyW':
      keys.up = isPressed;
      break;
    case 'ArrowDown':
    case 'KeyS':
      keys.down = isPressed;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = isPressed;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = isPressed;
      break;
    case 'Space':
      keys.space = isPressed;
      break;
  }
}

/**
 * Check if a key is used for game controls
 * @private
 */
function isGameControlKey(code: string): boolean {
  return [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyP', 'KeyR', 'KeyM', 'Escape'
  ].includes(code);
}

/**
 * Disable game controls
 */
function disableControls(): void {
  resetKeys();
  if (keydownListener) {
    window.removeEventListener('keydown', keydownListener);
  }
  if (keyupListener) {
    window.removeEventListener('keyup', keyupListener);
  }
}

/**
 * Enable game controls
 */
function enableControls(): void {
  resetKeys();
  if (keydownListener) {
    window.addEventListener('keydown', keydownListener);
  }
  if (keyupListener) {
    window.addEventListener('keyup', keyupListener);
  }
}

/**
 * Reset all key states
 * @private
 */
function resetKeys(): void {
  keys.up = false;
  keys.down = false;
  keys.left = false;
  keys.right = false;
  keys.space = false;
} 
/**
 * Luminor
 * Game controls and input handling
 * Code written by a mixture of AI (2025)
 */

// Key state tracking
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

/**
 * Initialize game controls
 * @param {Object} callbacks - Event callback functions
 * @param {Function} callbacks.onSpacePressed - Space key handler
 * @param {Function} callbacks.onEscapePressed - Escape key handler
 * @param {Function} callbacks.onPausePressed - Pause key handler
 * @param {Function} callbacks.onRestartPressed - Restart key handler
 * @param {Function} callbacks.onMenuPressed - Menu key handler
 * @returns {Object} Controls object with key states and functions
 */
export function setupControls(callbacks) {
    // Add event listeners
    window.addEventListener('keydown', (event) => handleKeyDown(event, callbacks));
    window.addEventListener('keyup', (event) => handleKeyUp(event, callbacks));
    window.addEventListener('resize', handleResize);
    
    return {
        keys,
        disable: disableControls,
        enable: enableControls
    };
}

/**
 * Handle key down events
 * @private
 */
function handleKeyDown(event, callbacks) {
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
function handleKeyUp(event) {
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
function updateKeyState(code, isPressed) {
    switch (code) {
        case 'ArrowUp':
        case 'KeyW':
            keys.up = isPressed;
            keys.w = isPressed;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.down = isPressed;
            keys.s = isPressed;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = isPressed;
            keys.a = isPressed;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = isPressed;
            keys.d = isPressed;
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
function isGameControlKey(code) {
    return [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyP', 'KeyR'
    ].includes(code);
}

/**
 * Handle window resize events
 * @private
 */
function handleResize() {
    // Will be setup in main.js
}

/**
 * Disable game controls
 */
function disableControls() {
    resetKeys();
    // Could be extended to remove event listeners if needed
}

/**
 * Enable game controls
 */
function enableControls() {
    resetKeys();
    // Could be extended to add event listeners if they were removed
}

/**
 * Reset all key states
 * @private
 */
function resetKeys() {
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;
    keys.space = false;
} 
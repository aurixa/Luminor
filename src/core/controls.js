/**
 * Luminor
 * Game controls handling
 * Code written by a mixture of AI (2025)
 */

// Control state object
const controlState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false
};

/**
 * Setup game controls
 * @param {Object} player - The player object to control
 * @param {Object} gameState - The game state object
 * @returns {Object} The control state object
 */
export function setupControls(player, gameState) {
    // Keyboard event handlers
    function handleKeyDown(event) {
        if (!gameState.isPlaying) return;
        
        switch (event.key.toLowerCase()) {
            case 'w': 
            case 'arrowup':
                controlState.forward = true;
                break;
            case 's': 
            case 'arrowdown':
                controlState.backward = true;
                break;
            case 'a': 
            case 'arrowleft':
                controlState.left = true;
                break;
            case 'd': 
            case 'arrowright':
                controlState.right = true;
                break;
            case 'shift':
                controlState.boost = true;
                break;
            case ' ':  // Spacebar
                // Special action (could be used later)
                break;
            case 'p':
                // Toggle debug mode
                if (gameState.debugMode !== undefined) {
                    gameState.debugMode = !gameState.debugMode;
                    console.log(`Debug mode: ${gameState.debugMode ? 'ON' : 'OFF'}`);
                }
                break;
        }
        
        // Apply control state to player
        updatePlayerControls();
    }
    
    function handleKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case 'w': 
            case 'arrowup':
                controlState.forward = false;
                break;
            case 's': 
            case 'arrowdown':
                controlState.backward = false;
                break;
            case 'a': 
            case 'arrowleft':
                controlState.left = false;
                break;
            case 'd': 
            case 'arrowright':
                controlState.right = false;
                break;
            case 'shift':
                controlState.boost = false;
                break;
        }
        
        // Apply control state to player
        updatePlayerControls();
    }
    
    // Update player based on control state
    function updatePlayerControls() {
        if (player && player.setControlState) {
            player.setControlState(controlState);
        }
    }
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Touch controls
    const setupTouchControls = () => {
        const touchZones = createTouchZones();
        
        // Handle touch events
        window.addEventListener('touchstart', (event) => {
            event.preventDefault();
            handleTouchEvent(event, true);
        }, { passive: false });
        
        window.addEventListener('touchend', (event) => {
            event.preventDefault();
            handleTouchEvent(event, false);
        }, { passive: false });
        
        function handleTouchEvent(event, isStart) {
            if (!gameState.isPlaying) return;
            
            const touches = event.touches;
            
            // Reset control states on touch end
            if (!isStart) {
                controlState.left = false;
                controlState.right = false;
                controlState.forward = false;
                controlState.backward = false;
                controlState.boost = false;
                updatePlayerControls();
                return;
            }
            
            // Process each touch
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                const zone = getTouchZone(touch.clientX, touch.clientY, touchZones);
                
                if (zone) {
                    controlState[zone] = isStart;
                }
            }
            
            updatePlayerControls();
        }
    };
    
    // Create touch control zones
    function createTouchZones() {
        // Simple implementation - divide screen into zones
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        return {
            left: { x: 0, y: height / 2, width: width / 4, height: height / 2 },
            right: { x: width * 3 / 4, y: height / 2, width: width / 4, height: height / 2 },
            forward: { x: width / 2, y: 0, width: width / 2, height: height / 4 },
            backward: { x: width / 2, y: height * 3 / 4, width: width / 2, height: height / 4 },
            boost: { x: width / 2, y: height / 2, width: width / 2, height: height / 2 }
        };
    }
    
    // Helper to determine which zone a touch is in
    function getTouchZone(x, y, zones) {
        for (const [name, zone] of Object.entries(zones)) {
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                return name;
            }
        }
        return null;
    }
    
    // Setup touch controls for mobile
    if ('ontouchstart' in window) {
        setupTouchControls();
    }
    
    return controlState;
} 
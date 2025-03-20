/**
 * Luminor
 * Game UI system - consolidated UI management
 * Code written by a mixture of AI (2025)
 */

/**
 * Setup the game UI
 * @param {Object} gameState - The game state object
 * @param {Function} startGame - Function to start/restart the game
 * @returns {Object} UI controller object
 */
export function setupUI(gameState, startGame) {
    // Get UI elements or create them if they don't exist
    const uiElements = {
        loadingScreen: document.getElementById('loading-screen'),
        startButton: document.getElementById('start-button'),
        gameOverScreen: getOrCreateElement('game-over-screen', 'div'),
        hudContainer: getOrCreateElement('hud-container', 'div'),
        scoreDisplay: getOrCreateElement('score-display', 'div'),
        lengthDisplay: getOrCreateElement('length-display', 'div'),
        pauseButton: getOrCreateElement('pause-button', 'button'),
        restartButton: getOrCreateElement('restart-button', 'button'),
        mainMenuButton: getOrCreateElement('main-menu-button', 'button'),
        finalLength: getOrCreateElement('final-length', 'span')
    };
    
    // Update the start button text to "PLAY"
    if (uiElements.startButton) {
        uiElements.startButton.textContent = 'PLAY';
    }
    
    // Setup the UI elements if they're new
    setupUIStyles(uiElements);
    
    // Add elements directly to the body to ensure they're on top
    for (const key in uiElements) {
        if (uiElements[key] && !document.body.contains(uiElements[key]) && 
            key !== 'loadingScreen' && key !== 'startButton') {
            document.body.appendChild(uiElements[key]);
        }
    }
    
    // Make sure the game over screen is hidden at start
    hideElement(uiElements.gameOverScreen);
    
    // Setup event listeners
    setupEventListeners(uiElements, gameState, startGame);
    
    // Return the UI controller interface
    return {
        updateUI: (state = gameState) => updateGameUI(uiElements, state),
        updateScore: (score) => updateScoreDisplay(uiElements, score),
        updateResourceCount: () => {}, // No-op function as we're removing resources display
        showGameOver: (finalScore) => showGameOverScreen(uiElements, finalScore)
    };
}

/**
 * Setup event listeners for UI elements
 */
function setupEventListeners(uiElements, gameState, startGame) {
    // Start/play button
    if (uiElements.startButton) {
        uiElements.startButton.addEventListener('click', () => {
            if (uiElements.loadingScreen) hideElement(uiElements.loadingScreen);
            hideElement(uiElements.gameOverScreen);
            startGame();
        });
    }
    
    // Main menu button
    if (uiElements.mainMenuButton) {
        uiElements.mainMenuButton.addEventListener('click', function() {
            console.log("Main menu button clicked, cleaning up resources and reloading page");
            
            // Create and dispatch a custom event to signal resource cleanup
            const cleanupEvent = new CustomEvent('luminorCleanup', {
                detail: { source: 'mainMenuButton' }
            });
            document.dispatchEvent(cleanupEvent);
            
            // Short timeout to allow cleanup to complete before reload
            setTimeout(() => {
                window.location.reload();
            }, 100);
        });
    }
    
    // Pause button
    if (uiElements.pauseButton) {
        uiElements.pauseButton.textContent = 'PAUSE';
        uiElements.pauseButton.addEventListener('click', () => {
            gameState.isPaused = !gameState.isPaused;
            updateGameUI(uiElements, gameState);
        });
    }
    
    // Restart button
    if (uiElements.restartButton) {
        uiElements.restartButton.textContent = 'RESTART';
        uiElements.restartButton.addEventListener('click', () => {
            console.log("Restart button clicked");
            // Set game as ended but don't restart yet
            gameState.gameHasEnded = true;
            gameState.isPlaying = false;
            // Stop game loop if it's running (through gameState)
            gameState.isPaused = true;
            // Show game over screen with current score
            showGameOverScreen(uiElements, gameState.playerLength);
            // Update UI to reflect game over state
            updateGameUI(uiElements, gameState);
        });
    }
}

/**
 * Update the game UI based on game state
 */
function updateGameUI(uiElements, gameState) {
    // Update based on game state
    if (gameState.isPlaying) {
        if (uiElements.loadingScreen) hideElement(uiElements.loadingScreen);
        hideElement(uiElements.gameOverScreen);
        showElement(uiElements.hudContainer);
        showElement(uiElements.pauseButton);
        showElement(uiElements.restartButton);
        
        // Update HUD values
        if (uiElements.lengthDisplay) {
            uiElements.lengthDisplay.textContent = `Length: ${gameState.playerLength}`;
        }
        
        // Handle pause state
        if (gameState.isPaused) {
            uiElements.pauseButton.textContent = 'RESUME';
            // Show pause overlay
            showPauseOverlay();
        } else {
            uiElements.pauseButton.textContent = 'PAUSE';
            // Hide pause overlay
            hidePauseOverlay();
        }
    } else {
        // Game is not playing
        hideElement(uiElements.hudContainer);
        hideElement(uiElements.pauseButton);
        hideElement(uiElements.restartButton);
        
        // Initial state when first loading the game
        if (gameState.playerLength === 3 && !gameState.gameHasEnded) {
            // Initial load - show loading screen with start button
            if (uiElements.loadingScreen) {
                showElement(uiElements.loadingScreen);
                // Make sure the start button is visible
                if (uiElements.startButton) {
                    uiElements.startButton.style.display = 'block';
                }
            }
        } else if (gameState.gameHasEnded) {
            // Game over state
            showGameOverScreen(uiElements, gameState.playerLength);
        }
    }
}

/**
 * Update the score display
 */
function updateScoreDisplay(uiElements, score) {
    if (uiElements.scoreDisplay) {
        uiElements.scoreDisplay.textContent = `Length: ${score}`;
    }
    
    if (uiElements.lengthDisplay) {
        uiElements.lengthDisplay.textContent = `Length: ${score}`;
    }
}

/**
 * Show the game over screen
 */
function showGameOverScreen(uiElements, finalScore) {
    if (uiElements.gameOverScreen) {
        showElement(uiElements.gameOverScreen);
        if (uiElements.finalLength) {
            uiElements.finalLength.textContent = finalScore;
        }
    }
}

/**
 * Create a pause overlay element
 */
function showPauseOverlay() {
    let pauseOverlay = document.getElementById('pause-overlay');
    if (!pauseOverlay) {
        pauseOverlay = document.createElement('div');
        pauseOverlay.id = 'pause-overlay';
        pauseOverlay.style.position = 'fixed';
        pauseOverlay.style.top = '0';
        pauseOverlay.style.left = '0';
        pauseOverlay.style.width = '100%';
        pauseOverlay.style.height = '100%';
        pauseOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        pauseOverlay.style.color = 'white';
        pauseOverlay.style.display = 'flex';
        pauseOverlay.style.justifyContent = 'center';
        pauseOverlay.style.alignItems = 'center';
        pauseOverlay.style.fontSize = '32px';
        pauseOverlay.style.fontFamily = 'Arial, sans-serif';
        pauseOverlay.style.zIndex = '1000';
        pauseOverlay.textContent = 'PAUSED';
        document.body.appendChild(pauseOverlay);
    } else {
        pauseOverlay.style.display = 'flex';
    }
}

/**
 * Hide the pause overlay
 */
function hidePauseOverlay() {
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) {
        pauseOverlay.style.display = 'none';
    }
}

/**
 * Create a start screen element
 * @deprecated Use the existing loading screen instead
 */
function createStartScreen() {
    return document.getElementById('loading-screen');
}

/**
 * Get an element by ID or create it if it doesn't exist
 */
function getOrCreateElement(id, tagName) {
    let element = document.getElementById(id);
    if (!element) {
        element = document.createElement(tagName);
        element.id = id;
    }
    return element;
}

/**
 * Setup styles for UI elements
 */
function setupUIStyles(uiElements) {
    // Set up the HUD container for buttons
    if (uiElements.hudContainer) {
        uiElements.hudContainer.style.position = 'fixed';
        uiElements.hudContainer.style.top = '10px';
        uiElements.hudContainer.style.right = '10px';
        uiElements.hudContainer.style.padding = '10px';
        uiElements.hudContainer.style.display = 'flex';
        uiElements.hudContainer.style.justifyContent = 'flex-end';
        uiElements.hudContainer.style.zIndex = '100';
    }
    
    // Set up the score display in center
    if (uiElements.scoreDisplay) {
        uiElements.scoreDisplay.style.position = 'fixed';
        uiElements.scoreDisplay.style.top = '10px';
        uiElements.scoreDisplay.style.left = '50%';
        uiElements.scoreDisplay.style.transform = 'translateX(-50%)';
        uiElements.scoreDisplay.style.padding = '10px';
        uiElements.scoreDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        uiElements.scoreDisplay.style.color = 'white';
        uiElements.scoreDisplay.style.fontFamily = 'Arial, sans-serif';
        uiElements.scoreDisplay.style.fontSize = '24px';
        uiElements.scoreDisplay.style.borderRadius = '5px';
        uiElements.scoreDisplay.style.zIndex = '100';
        uiElements.scoreDisplay.textContent = 'Length: 3';
    }
    
    // Remove the length display from HUD as we now have score display in center
    if (uiElements.lengthDisplay) {
        uiElements.lengthDisplay.style.display = 'none';
    }
    
    if (uiElements.gameOverScreen) {
        uiElements.gameOverScreen.style.position = 'fixed';
        uiElements.gameOverScreen.style.top = '0';
        uiElements.gameOverScreen.style.left = '0';
        uiElements.gameOverScreen.style.width = '100%';
        uiElements.gameOverScreen.style.height = '100%';
        uiElements.gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        uiElements.gameOverScreen.style.color = 'white';
        uiElements.gameOverScreen.style.display = 'flex';
        uiElements.gameOverScreen.style.flexDirection = 'column';
        uiElements.gameOverScreen.style.justifyContent = 'center';
        uiElements.gameOverScreen.style.alignItems = 'center';
        uiElements.gameOverScreen.style.fontSize = '32px';
        uiElements.gameOverScreen.style.fontFamily = 'Arial, sans-serif';
        uiElements.gameOverScreen.style.zIndex = '1000';
        
        const gameOverTitle = document.createElement('h1');
        gameOverTitle.textContent = 'GAME OVER';
        gameOverTitle.style.color = '#ff3333';
        gameOverTitle.style.fontSize = '48px';
        gameOverTitle.style.marginBottom = '20px';
        
        const finalScoreText = document.createElement('div');
        finalScoreText.innerHTML = `Final Length: <span id="final-length">0</span>`;
        finalScoreText.style.marginBottom = '30px';
        
        uiElements.finalLength = finalScoreText.querySelector('#final-length');
        
        uiElements.gameOverScreen.appendChild(gameOverTitle);
        uiElements.gameOverScreen.appendChild(finalScoreText);
    }
    
    if (uiElements.pauseButton) {
        uiElements.pauseButton.style.position = 'fixed';
        uiElements.pauseButton.style.top = '10px';
        uiElements.pauseButton.style.right = '130px'; // Position to the left of restart button
        uiElements.pauseButton.style.backgroundColor = '#00ffaa';
        uiElements.pauseButton.style.color = 'black';
        uiElements.pauseButton.style.border = 'none';
        uiElements.pauseButton.style.padding = '10px 20px';
        uiElements.pauseButton.style.fontSize = '18px';
        uiElements.pauseButton.style.borderRadius = '5px';
        uiElements.pauseButton.style.cursor = 'pointer';
        uiElements.pauseButton.style.zIndex = '100';
    }
    
    if (uiElements.restartButton) {
        uiElements.restartButton.style.position = 'fixed';
        uiElements.restartButton.style.top = '10px';
        uiElements.restartButton.style.right = '10px'; // Position at far right
        uiElements.restartButton.style.backgroundColor = '#00ffaa';
        uiElements.restartButton.style.color = 'black';
        uiElements.restartButton.style.border = 'none';
        uiElements.restartButton.style.padding = '10px 20px';
        uiElements.restartButton.style.fontSize = '18px';
        uiElements.restartButton.style.borderRadius = '5px';
        uiElements.restartButton.style.cursor = 'pointer';
        uiElements.restartButton.style.zIndex = '100';
    }
    
    if (uiElements.mainMenuButton) {
        uiElements.mainMenuButton.textContent = 'MAIN MENU';
        uiElements.mainMenuButton.style.backgroundColor = '#00ffaa';
        uiElements.mainMenuButton.style.color = 'black';
        uiElements.mainMenuButton.style.border = 'none';
        uiElements.mainMenuButton.style.padding = '15px 30px';
        uiElements.mainMenuButton.style.fontSize = '18px';
        uiElements.mainMenuButton.style.borderRadius = '5px';
        uiElements.mainMenuButton.style.cursor = 'pointer';
        uiElements.mainMenuButton.style.marginTop = '20px';
        
        if (uiElements.gameOverScreen) {
            uiElements.gameOverScreen.appendChild(uiElements.mainMenuButton);
        }
    }
}

/**
 * Helper function to show an element
 */
function showElement(element) {
    if (element) {
        element.style.display = element.tagName.toLowerCase() === 'div' ? 'flex' : 'block';
    }
}

/**
 * Helper function to hide an element
 */
function hideElement(element) {
    if (element) {
        element.style.display = 'none';
    }
} 
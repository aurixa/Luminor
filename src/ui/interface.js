/**
 * Luminor
 * Game UI system
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
        gameOverScreen: getOrCreateElement('game-over-screen', 'div'),
        hudContainer: getOrCreateElement('hud-container', 'div'),
        lengthDisplay: getOrCreateElement('length-display', 'div'),
        pauseButton: getOrCreateElement('pause-button', 'button'),
        restartButton: getOrCreateElement('restart-button', 'button'),
        mainMenuButton: getOrCreateElement('main-menu-button', 'button'),
        finalLength: getOrCreateElement('final-length', 'span')
    };
    
    // Setup the UI elements if they're new
    setupUIStyles(uiElements);
    
    // Add elements directly to the body to ensure they're on top
    for (const key in uiElements) {
        if (uiElements[key] && !document.body.contains(uiElements[key])) {
            document.body.appendChild(uiElements[key]);
        }
    }
    
    // Get existing loading screen elements
    const loadingScreen = document.getElementById('loading-screen');
    const startButton = document.getElementById('start-button');
    
    // Make sure the game over screen is hidden at start
    hideElement(uiElements.gameOverScreen);
    
    // Setup event listeners for existing start button
    if (startButton) {
        startButton.addEventListener('click', () => {
            if (loadingScreen) loadingScreen.style.display = 'none';
            hideElement(uiElements.gameOverScreen);
            startGame();
        });
    }
    
    // Main menu button - go back to the main menu
    if (uiElements.mainMenuButton) {
        uiElements.mainMenuButton.addEventListener('click', function() {
            console.log("Main menu button clicked, reloading page");
            window.location.reload();
        });
    }
    
    // Pause button functionality - only pause player movement
    if (uiElements.pauseButton) {
        uiElements.pauseButton.textContent = 'PAUSE';
        uiElements.pauseButton.addEventListener('click', () => {
            gameState.isPaused = !gameState.isPaused;
        });
    }
    
    // Restart button functionality
    if (uiElements.restartButton) {
        uiElements.restartButton.textContent = 'RESTART';
    }
    
    // Function to update the UI
    function updateGameUI() {
        // Update based on game state
        if (gameState.isPlaying) {
            if (loadingScreen) loadingScreen.style.display = 'none';
            hideElement(uiElements.gameOverScreen);
            showElement(uiElements.hudContainer);
            showElement(uiElements.pauseButton);
            showElement(uiElements.restartButton);
            
            // Update HUD values
            if (uiElements.lengthDisplay) {
                uiElements.lengthDisplay.textContent = `Length: ${gameState.playerLength}`;
            }
        } else {
            // Game is not playing
            hideElement(uiElements.hudContainer);
            hideElement(uiElements.pauseButton);
            hideElement(uiElements.restartButton);
            
            // Initial state when first loading the game
            if (gameState.playerLength === 3 && !gameState.gameHasEnded) {
                // Initial load - show loading screen
                if (loadingScreen) loadingScreen.style.display = 'flex';
                hideElement(uiElements.gameOverScreen);
            } else {
                // Game over - always show game over screen
                showElement(uiElements.gameOverScreen);
                
                // Update final stats
                if (uiElements.finalLength) {
                    uiElements.finalLength.textContent = gameState.playerLength;
                }
            }
        }
    }
    
    // Initial UI update
    updateGameUI();
    
    // Return the UI controller
    return {
        elements: uiElements,
        updateUI: updateGameUI
    };
}

// Helper function to get or create UI elements
function getOrCreateElement(id, tagName) {
    let element = document.getElementById(id);
    
    if (!element) {
        element = document.createElement(tagName);
        element.id = id;
    }
    
    return element;
}

// Helper to show an element
function showElement(element) {
    if (element) {
        element.style.display = 'block';
        element.classList.remove('hidden');
    }
}

// Helper to hide an element
function hideElement(element) {
    if (element) {
        element.style.display = 'none';
        element.classList.add('hidden');
    }
}

// Setup the UI styles
function setupUIStyles(elements) {
    // Add CSS class to body if it doesn't have it
    if (!document.querySelector('style#game-ui-styles')) {
        const style = document.createElement('style');
        style.id = 'game-ui-styles';
        style.textContent = `
            .hidden { display: none !important; }
            
            #game-over-screen {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: white;
                background-color: rgba(0, 0, 0, 0.7);
                padding: 2rem;
                border-radius: 1rem;
                z-index: 2000; /* Increase z-index to be higher than anything else */
                display: none; /* Start hidden by default */
            }
            
            #main-menu-button {
                padding: 1rem 2rem;
                font-size: 1.5rem;
                background-color: #00ffaa;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                color: #000;
                font-weight: bold;
                margin: 10px;
                position: relative;
                z-index: 2001; /* Higher than the game over screen */
                pointer-events: auto; /* Ensure it can be clicked */
            }
            
            #hud-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 1rem;
                z-index: 100;
                text-align: center;
            }
            
            #length-display {
                color: white;
                font-size: 1.5rem;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                font-weight: bold;
            }
            
            #pause-button, #restart-button {
                position: fixed;
                top: 1rem;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                border: none;
                border-radius: 5px;
                padding: 0.5rem 1rem;
                cursor: pointer;
                font-size: 1rem;
                z-index: 1000;
            }
            
            #pause-button {
                right: 9rem;
            }
            
            #restart-button {
                right: 1rem;
            }
            
            #pause-button:hover, #restart-button:hover {
                background-color: rgba(0, 0, 0, 0.9);
            }
            
            #final-length {
                font-weight: bold;
                font-size: 1.2em;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Setup HUD
    if (elements.hudContainer) {
        elements.hudContainer.innerHTML = '';
        
        if (elements.lengthDisplay) {
            elements.hudContainer.appendChild(elements.lengthDisplay);
            elements.lengthDisplay.textContent = 'Length: 3';
        }
    }
    
    // Setup game over screen
    if (elements.gameOverScreen) {
        elements.gameOverScreen.innerHTML = `
            <h1>GAME OVER</h1>
            <p>Length: <span id="final-length">3</span></p>
            <div class="game-over-buttons">
                <button id="main-menu-button" onclick="window.location.reload()">MAIN MENU</button>
            </div>
        `;
        
        // Get references to the elements for updating values
        elements.finalLength = document.getElementById('final-length');
    }
    
    // Setup game control buttons
    if (elements.pauseButton) {
        elements.pauseButton.textContent = 'PAUSE';
    }

    if (elements.restartButton) {
        elements.restartButton.textContent = 'RESTART';
    }
} 
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
        startScreen: getOrCreateElement('start-screen', 'div'),
        gameOverScreen: getOrCreateElement('game-over-screen', 'div'),
        hudContainer: getOrCreateElement('hud-container', 'div'),
        scoreDisplay: getOrCreateElement('score-display', 'div'),
        lengthDisplay: getOrCreateElement('length-display', 'div'),
        playButton: getOrCreateElement('play-button', 'button'),
        playAgainButton: getOrCreateElement('play-again-button', 'button'),
        finalScore: getOrCreateElement('final-score', 'span'),
        finalLength: getOrCreateElement('final-length', 'span')
    };
    
    // Setup the UI elements if they're new
    setupUIStyles(uiElements);
    
    // Setup event listeners
    uiElements.playButton.addEventListener('click', () => {
        hideElement(uiElements.startScreen);
        hideElement(uiElements.gameOverScreen);
        startGame();
    });
    
    uiElements.playAgainButton.addEventListener('click', () => {
        hideElement(uiElements.startScreen);
        hideElement(uiElements.gameOverScreen);
        startGame();
    });
    
    // Initial UI update
    updateUI(gameState);
    
    // Return the UI controller
    return {
        elements: uiElements,
        updateUI: () => updateUI(gameState)
    };
}

/**
 * Update the UI based on game state
 * @param {Object} gameState - The game state object
 */
export function updateUI(gameState) {
    const uiElements = {
        startScreen: document.getElementById('start-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        hudContainer: document.getElementById('hud-container'),
        scoreDisplay: document.getElementById('score-display'),
        lengthDisplay: document.getElementById('length-display'),
        finalScore: document.getElementById('final-score'),
        finalLength: document.getElementById('final-length')
    };
    
    // Update UI based on game state
    if (gameState.isPlaying) {
        hideElement(uiElements.startScreen);
        hideElement(uiElements.gameOverScreen);
        showElement(uiElements.hudContainer);
        
        // Update HUD values
        if (uiElements.scoreDisplay) {
            uiElements.scoreDisplay.textContent = `Score: ${gameState.score}`;
        }
        if (uiElements.lengthDisplay) {
            uiElements.lengthDisplay.textContent = `Length: ${gameState.playerLength}`;
        }
    } else {
        // Game is not playing
        hideElement(uiElements.hudContainer);
        
        if (gameState.score > 0) {
            // Show game over screen
            showElement(uiElements.gameOverScreen);
            hideElement(uiElements.startScreen);
            
            // Update final stats
            if (uiElements.finalScore) {
                uiElements.finalScore.textContent = gameState.score;
            }
            if (uiElements.finalLength) {
                uiElements.finalLength.textContent = gameState.playerLength;
            }
        } else {
            // Show start screen
            showElement(uiElements.startScreen);
            hideElement(uiElements.gameOverScreen);
        }
    }
}

// Helper function to get or create UI elements
function getOrCreateElement(id, tagName) {
    let element = document.getElementById(id);
    
    if (!element) {
        element = document.createElement(tagName);
        element.id = id;
        document.body.appendChild(element);
    }
    
    return element;
}

// Helper to show an element
function showElement(element) {
    if (element) {
        element.classList.remove('hidden');
    }
}

// Helper to hide an element
function hideElement(element) {
    if (element) {
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
            
            #start-screen, #game-over-screen {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: white;
                background-color: rgba(0, 0, 0, 0.7);
                padding: 2rem;
                border-radius: 1rem;
                z-index: 100;
            }
            
            #play-button, #play-again-button {
                padding: 1rem 2rem;
                font-size: 1.5rem;
                background-color: #00ffaa;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                color: #000;
                font-weight: bold;
                margin: 10px;
            }
            
            #hud-container {
                position: absolute;
                top: 1rem;
                left: 1rem;
                color: white;
                font-size: 1.2rem;
                z-index: 10;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Setup start screen
    if (elements.startScreen) {
        elements.startScreen.innerHTML = `
            <h1>LUMINOR</h1>
            <p>Navigate the planet and collect energy orbs</p>
        `;
        elements.startScreen.appendChild(elements.playButton);
        elements.playButton.textContent = 'PLAY GAME';
    }
    
    // Setup game over screen
    if (elements.gameOverScreen) {
        elements.gameOverScreen.innerHTML = `
            <h1>GAME OVER</h1>
            <p>Score: <span id="final-score">0</span></p>
            <p>Length: <span id="final-length">1</span></p>
        `;
        elements.gameOverScreen.appendChild(elements.playAgainButton);
        elements.playAgainButton.textContent = 'PLAY AGAIN';
    }
    
    // Setup HUD
    if (elements.hudContainer) {
        elements.hudContainer.innerHTML = '';
        elements.hudContainer.appendChild(elements.scoreDisplay);
        elements.hudContainer.appendChild(elements.lengthDisplay);
        
        elements.scoreDisplay.textContent = 'Score: 0';
        elements.lengthDisplay.textContent = 'Length: 1';
    }
} 
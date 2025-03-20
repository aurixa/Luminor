/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

/**
 * Setup and manage the game UI
 * @param {Object} gameState - The current game state
 * @param {Function} startGame - Function to start/restart the game
 */
export function setupUI(gameState, startGame) {
    // Add global CSS classes for visibility
    addCSS(`
        .hidden-element {
            display: none !important;
        }
        .visible-element {
            display: flex !important;
        }
    `);
    
    // Create UI elements if they don't exist
    createUIElements();
    
    // Get UI elements
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameUI = document.getElementById('game-ui');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const pauseButton = document.getElementById('pause-button');
    const restartGameButton = document.getElementById('restart-game-button');
    const scoreDisplay = document.getElementById('score-display');
    
    // Handle start button click
    if (startButton) {
        console.log("Setting up start button click handler");
        startButton.addEventListener('click', () => {
            console.log("Start button clicked!");
            startGame();
        });
    } else {
        console.log("Start button not found when setting up listeners");
    }
    
    // Handle restart button click (from game over screen)
    if (restartButton) {
        console.log("Setting up restart button click handler");
        restartButton.addEventListener('click', () => {
            console.log("Restart button clicked!");
            startGame();
        });
    } else {
        console.log("Restart button not found when setting up listeners");
    }
    
    // Handle pause button click
    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            console.log("Pause button clicked");
            gameState.isPaused = !gameState.isPaused;
            pauseButton.textContent = gameState.isPaused ? 'RESUME' : 'PAUSE';
        });
    }
    
    // Handle restart game button click (from in-game UI)
    if (restartGameButton) {
        restartGameButton.addEventListener('click', () => {
            console.log("In-game restart button clicked");
            startGame();
        });
    }
    
    // Create terrain panel
    createTerrainPanel();
    
    // Initialize UI state
    updateUI();
    
    // Function to update the UI based on game state
    function updateUI() {
        // Update score
        if (scoreDisplay) {
            scoreDisplay.textContent = gameState.playerLength.toString();
        }
        
        // Update screens with classList instead of inline styles
        if (startScreen) {
            console.log("Updating start screen display:", gameState.isPlaying ? 'none' : 'flex');
            if (gameState.isPlaying) {
                startScreen.classList.add('hidden-element');
                startScreen.classList.remove('visible-element');
            } else {
                startScreen.classList.add('visible-element');
                startScreen.classList.remove('hidden-element');
            }
        }
        
        if (gameOverScreen) {
            if (gameState.gameHasEnded) {
                gameOverScreen.classList.add('visible-element');
                gameOverScreen.classList.remove('hidden-element');
            } else {
                gameOverScreen.classList.add('hidden-element');
                gameOverScreen.classList.remove('visible-element');
            }
        }
        
        if (gameUI) {
            console.log("Updating game UI display:", gameState.isPlaying && !gameState.gameHasEnded ? 'flex' : 'none');
            if (gameState.isPlaying && !gameState.gameHasEnded) {
                gameUI.classList.add('visible-element');
                gameUI.classList.remove('hidden-element');
            } else {
                gameUI.classList.add('hidden-element');
                gameUI.classList.remove('visible-element');
            }
        }
        
        // Update final score
        const finalScore = document.getElementById('final-score');
        if (finalScore) {
            finalScore.textContent = gameState.playerLength.toString();
        }
    }
    
    // Create UI elements if they don't exist
    function createUIElements() {
        createElementIfMissing('ui-overlay', 'div', document.body, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        });
        
        const uiOverlay = document.getElementById('ui-overlay');
        
        // Start screen
        createElementIfMissing('start-screen', 'div', uiOverlay, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            pointerEvents: 'auto'
        });
        
        const startScreen = document.getElementById('start-screen');
        
        // Start screen content
        createElementIfMissing('start-title', 'h1', startScreen, {
            fontSize: '4rem',
            marginBottom: '2rem',
            color: '#00ffaa'
        }, 'LUMINOR');
        
        createElementIfMissing('start-subtitle', 'p', startScreen, {
            fontSize: '1.5rem',
            marginBottom: '3rem'
        }, 'Navigate your hover bike across the planet and collect energy');
        
        createElementIfMissing('start-button', 'button', startScreen, {
            padding: '1rem 2rem',
            fontSize: '1.5rem',
            backgroundColor: '#00ffaa',
            color: '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
        }, 'START GAME');
        
        // Game UI
        createElementIfMissing('game-ui', 'div', uiOverlay, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            pointerEvents: 'none'
        });
        
        const gameUI = document.getElementById('game-ui');
        
        // Left side (empty for balance)
        createElementIfMissing('game-ui-left', 'div', gameUI, {
            flex: '1',
            display: 'flex',
            justifyContent: 'flex-start'
        });
        
        // Center - Score display
        createElementIfMissing('score-container', 'div', gameUI, {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '0.5rem 1rem',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '1',
            pointerEvents: 'none'
        });
        
        const scoreContainer = document.getElementById('score-container');
        
        createElementIfMissing('score-label', 'span', scoreContainer, {
            color: 'white',
            marginRight: '0.5rem',
            fontSize: '1.2rem'
        }, 'SCORE:');
        
        createElementIfMissing('score-display', 'span', scoreContainer, {
            color: '#00ffaa',
            fontSize: '1.2rem',
            fontWeight: 'bold'
        }, '0');
        
        // Right side - Game controls
        createElementIfMissing('game-ui-right', 'div', gameUI, {
            flex: '1',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem'
        });
        
        const gameUIRight = document.getElementById('game-ui-right');
        
        // Pause button
        createElementIfMissing('pause-button', 'button', gameUIRight, {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
            pointerEvents: 'auto'
        }, 'PAUSE');
        
        // Restart button
        createElementIfMissing('restart-game-button', 'button', gameUIRight, {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
            pointerEvents: 'auto'
        }, 'RESTART');
        
        // Game over screen
        createElementIfMissing('game-over-screen', 'div', uiOverlay, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            pointerEvents: 'auto'
        });
        
        const gameOverScreen = document.getElementById('game-over-screen');
        
        // Game over content
        createElementIfMissing('game-over-title', 'h1', gameOverScreen, {
            fontSize: '3.5rem',
            marginBottom: '1rem',
            color: '#ff5555'
        }, 'GAME OVER');
        
        createElementIfMissing('score-text', 'p', gameOverScreen, {
            fontSize: '1.5rem',
            marginBottom: '0.5rem'
        }, 'Your score:');
        
        createElementIfMissing('final-score', 'div', gameOverScreen, {
            fontSize: '3rem',
            marginBottom: '2rem',
            color: '#00ffaa'
        }, '0');
        
        createElementIfMissing('restart-button', 'button', gameOverScreen, {
            padding: '1rem 2rem',
            fontSize: '1.5rem',
            backgroundColor: '#00ffaa',
            color: '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
        }, 'PLAY AGAIN');
    }
    
    // Create terrain panel
    function createTerrainPanel() {
        createElementIfMissing('terrain-panel', 'div', document.body, {
            position: 'absolute',
            top: '5rem',
            left: '0',
            width: '300px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            borderTopRightRadius: '10px',
            borderBottomRightRadius: '10px',
            transform: 'translateX(-290px)',
            transition: 'transform 0.3s ease',
            pointerEvents: 'auto',
            zIndex: '1000'
        });
        
        const terrainPanel = document.getElementById('terrain-panel');
        terrainPanel.classList.add('terrain-panel');
        
        // Add CSS for the terrain panel
        addCSS(`
            .terrain-panel.expanded {
                transform: translateX(0);
            }
            .terrain-panel-header {
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            .terrain-panel-content {
                padding: 1rem;
            }
            .terrain-panel-toggle {
                position: absolute;
                right: -30px;
                top: 10px;
                width: 30px;
                height: 60px;
                background-color: rgba(0, 0, 0, 0.7);
                border-top-right-radius: 10px;
                border-bottom-right-radius: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
            }
            .terrain-panel-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
            }
            .slider-container {
                margin-bottom: 1rem;
            }
            .slider-container label {
                display: block;
                margin-bottom: 0.5rem;
            }
            .slider-container input {
                width: 100%;
            }
        `);
        
        // Add header
        createElementIfMissing('terrain-panel-header', 'div', terrainPanel, {});
        const header = document.getElementById('terrain-panel-header');
        header.classList.add('terrain-panel-header');
        
        createElementIfMissing('terrain-panel-title', 'h3', header, {
            margin: '0'
        }, 'Terrain Settings');
        
        createElementIfMissing('terrain-panel-close', 'button', header, {});
        const closeButton = document.getElementById('terrain-panel-close');
        closeButton.classList.add('terrain-panel-close');
        closeButton.innerHTML = '&times;';
        
        // Add content
        createElementIfMissing('terrain-panel-content', 'div', terrainPanel, {});
        const content = document.getElementById('terrain-panel-content');
        content.classList.add('terrain-panel-content');
        
        // Add toggle button
        createElementIfMissing('terrain-panel-toggle', 'div', terrainPanel, {});
        const toggle = document.getElementById('terrain-panel-toggle');
        toggle.classList.add('terrain-panel-toggle');
        toggle.innerHTML = '&rsaquo;';
        toggle.id = 'terrain-toggle';
    }
    
    // Helper function to create an element if it doesn't exist
    function createElementIfMissing(id, tagName, parent, styles = {}, text = '') {
        let element = document.getElementById(id);
        if (!element) {
            element = document.createElement(tagName);
            element.id = id;
            
            // Apply styles
            for (const [property, value] of Object.entries(styles)) {
                element.style[property] = value;
            }
            
            // Set text if provided
            if (text) {
                element.textContent = text;
            }
            
            // Append to parent
            if (parent) {
                parent.appendChild(element);
            }
        }
        return element;
    }
    
    // Helper function to add CSS to the document
    function addCSS(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    // Return UI management functions
    return {
        updateUI
    };
} 
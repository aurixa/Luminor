/**
 * Luminor
 * Game UI system - consolidated UI management
 * Code written by a mixture of AI (2025)
 */

import { GameState, GameUI } from '../types';

// UI element references
interface UIElements {
  loadingScreen: HTMLElement | null;
  startButton: HTMLButtonElement | null;
  gameOverScreen: HTMLElement;
  hudContainer: HTMLElement;
  scoreDisplay: HTMLElement;
  lengthDisplay: HTMLElement;
  pauseButton: HTMLButtonElement;
  restartButton: HTMLButtonElement;
  mainMenuButton: HTMLButtonElement;
  finalLength: HTMLElement;
  [key: string]: HTMLElement | null;
}

/**
 * Setup the game UI
 * @param {GameState} gameState - The game state object
 * @param {() => void} startGame - Function to start/restart the game
 * @returns {GameUI} UI controller object
 */
export function setupUI(gameState: GameState, startGame: () => void): GameUI {
  // Get UI elements or create them if they don't exist
  const uiElements: UIElements = {
    loadingScreen: document.getElementById('loading-screen'),
    startButton: document.getElementById('start-button') as HTMLButtonElement,
    gameOverScreen: getOrCreateElement('game-over-screen', 'div'),
    hudContainer: getOrCreateElement('hud-container', 'div'),
    scoreDisplay: getOrCreateElement('score-display', 'div'),
    lengthDisplay: getOrCreateElement('length-display', 'div'),
    pauseButton: getOrCreateElement('pause-button', 'button') as HTMLButtonElement,
    restartButton: getOrCreateElement('restart-button', 'button') as HTMLButtonElement,
    mainMenuButton: getOrCreateElement('main-menu-button', 'button') as HTMLButtonElement,
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
    if (
      uiElements[key] &&
      !document.body.contains(uiElements[key]) &&
      key !== 'loadingScreen' &&
      key !== 'startButton'
    ) {
      document.body.appendChild(uiElements[key] as HTMLElement);
    }
  }

  // Make sure the game over screen is hidden at start
  hideElement(uiElements.gameOverScreen);

  // Setup event listeners
  setupEventListeners(uiElements, gameState, startGame);

  // Return the UI controller interface
  return {
    updateUI: (state = gameState) => updateGameUI(uiElements, state),
    updateScore: (score: number) => updateScoreDisplay(uiElements, score),
    updateResourceCount: () => {}, // No-op function as we're removing resources display
    showGameOver: (finalScore?: number) => showGameOverScreen(uiElements, finalScore),
    dispose: () => {
      // Clean up event listeners
      if (uiElements.startButton) {
        uiElements.startButton.removeEventListener('click', () => {});
      }
      if (uiElements.mainMenuButton) {
        uiElements.mainMenuButton.removeEventListener('click', () => {});
      }
      if (uiElements.pauseButton) {
        uiElements.pauseButton.removeEventListener('click', () => {});
      }
      if (uiElements.restartButton) {
        uiElements.restartButton.removeEventListener('click', () => {});
      }

      // Remove UI elements from DOM
      for (const key in uiElements) {
        if (uiElements[key] && document.body.contains(uiElements[key])) {
          document.body.removeChild(uiElements[key] as HTMLElement);
        }
      }
    }
  };
}

/**
 * Get an element by ID or create it if it doesn't exist
 * @private
 */
function getOrCreateElement(id: string, tagName: string): HTMLElement {
  let element = document.getElementById(id);

  if (!element) {
    element = document.createElement(tagName);
    element.id = id;
  }

  return element;
}

/**
 * Setup event listeners for UI elements
 * @private
 */
function setupEventListeners(
  uiElements: UIElements,
  gameState: GameState,
  startGame: () => void
): void {
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
    uiElements.mainMenuButton.addEventListener('click', () => {
      console.log('Main menu button clicked, cleaning up resources and reloading page');

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
      hideElement(uiElements.gameOverScreen);
      startGame();
    });
  }
}

/**
 * Setup UI styles for elements
 * @private
 */
function setupUIStyles(uiElements: UIElements): void {
  // HUD Container
  setElementStyles(uiElements.hudContainer, {
    position: 'absolute',
    top: '20px',
    left: '20px',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    fontSize: '18px',
    textShadow: '0 0 5px #00ffaa, 0 0 10px #00ffaa',
    zIndex: '100'
  });

  // Score Display
  setElementStyles(uiElements.scoreDisplay, {
    marginBottom: '10px'
  });

  // Length Display (Player length)
  setElementStyles(uiElements.lengthDisplay, {
    marginBottom: '10px'
  });

  // Game Over Screen
  setElementStyles(uiElements.gameOverScreen, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: '40px',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    borderRadius: '10px',
    boxShadow: '0 0 20px #00ffaa',
    zIndex: '200'
  });

  // Create game over title if needed
  let gameOverTitle = uiElements.gameOverScreen.querySelector('h2');
  if (!gameOverTitle) {
    gameOverTitle = document.createElement('h2');
    gameOverTitle.textContent = 'GAME OVER';
    gameOverTitle.style.color = '#00ffaa';
    gameOverTitle.style.fontSize = '32px';
    gameOverTitle.style.marginBottom = '20px';
    uiElements.gameOverScreen.appendChild(gameOverTitle);
  }

  // Final score container
  let finalScoreDiv = uiElements.gameOverScreen.querySelector('.final-score');
  if (!finalScoreDiv) {
    finalScoreDiv = document.createElement('div');
    finalScoreDiv.classList.add('final-score');
    finalScoreDiv.innerHTML = 'Your final length: <span id="final-length">0</span>';
    (finalScoreDiv as HTMLElement).style.fontSize = '24px';
    (finalScoreDiv as HTMLElement).style.marginBottom = '30px';
    uiElements.gameOverScreen.appendChild(finalScoreDiv);
  }

  // Style buttons
  [uiElements.pauseButton, uiElements.restartButton, uiElements.mainMenuButton].forEach(button => {
    if (button) {
      setElementStyles(button, {
        padding: '10px 20px',
        margin: '10px',
        backgroundColor: '#00ffaa',
        color: 'black',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px'
      });
    }
  });

  // Add restart button to game over screen
  if (uiElements.restartButton && !uiElements.gameOverScreen.contains(uiElements.restartButton)) {
    uiElements.gameOverScreen.appendChild(uiElements.restartButton);
  }

  // Add main menu button to game over screen
  if (uiElements.mainMenuButton && !uiElements.gameOverScreen.contains(uiElements.mainMenuButton)) {
    uiElements.mainMenuButton.textContent = 'MAIN MENU';
    uiElements.gameOverScreen.appendChild(uiElements.mainMenuButton);
  }
}

/**
 * Set multiple styles on an element
 * @private
 */
function setElementStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  if (!element) return;

  for (const property in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, property)) {
      element.style[property] = styles[property] as string;
    }
  }
}

/**
 * Hide an element
 * @private
 */
function hideElement(element: HTMLElement | null): void {
  if (element) {
    element.style.display = 'none';
  }
}

/**
 * Show an element
 * @private
 */
function showElement(element: HTMLElement | null): void {
  if (element) {
    element.style.display = 'block';
  }
}

/**
 * Update game UI based on game state
 * @private
 */
function updateGameUI(uiElements: UIElements, gameState: GameState): void {
  // Update HUD visibility
  uiElements.hudContainer.style.display = gameState.isPlaying ? 'block' : 'none';

  // Update pause button text
  if (uiElements.pauseButton) {
    uiElements.pauseButton.textContent = gameState.isPaused ? 'RESUME' : 'PAUSE';
  }

  // Update score display
  if (gameState.playerLength !== undefined) {
    updateScoreDisplay(uiElements, gameState.playerLength);
  }

  // Handle game over state
  if (gameState.gameHasEnded) {
    showGameOverScreen(uiElements, gameState.playerLength);
  } else {
    hideElement(uiElements.gameOverScreen);
  }
}

/**
 * Update score display
 * @private
 */
function updateScoreDisplay(uiElements: UIElements, score: number): void {
  uiElements.scoreDisplay.textContent = `Length: ${score}`;
}

/**
 * Show game over screen
 * @private
 */
function showGameOverScreen(uiElements: UIElements, finalScore: number = 0): void {
  // Update final score
  if (uiElements.finalLength) {
    uiElements.finalLength.textContent = finalScore.toString();
  }

  // Show game over screen
  showElement(uiElements.gameOverScreen);
}

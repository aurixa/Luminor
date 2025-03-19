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
    // Get UI elements
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const playButton = document.getElementById('play-button');
    const playAgainButton = document.getElementById('play-again-button');
    
    // Handle play button click
    playButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        startGame();
    });
    
    // Handle play again button click
    playAgainButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        startGame();
    });
    
    // Function to show the appropriate screen based on game state
    function updateUI() {
        if (gameState.isPlaying) {
            startScreen.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
        } else {
            if (gameState.score > 0) {
                // Show game over screen with stats
                document.getElementById('final-score').textContent = gameState.score;
                document.getElementById('final-length').textContent = gameState.playerLength;
                startScreen.classList.add('hidden');
                gameOverScreen.classList.remove('hidden');
            } else {
                // First time playing or reset - show start screen
                startScreen.classList.remove('hidden');
                gameOverScreen.classList.add('hidden');
            }
        }
    }
    
    // Add score display for in-game UI
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score-display';
    scoreDisplay.innerHTML = 'Score: 0';
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.top = '20px';
    scoreDisplay.style.right = '20px';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.fontSize = '1.5rem';
    scoreDisplay.style.fontFamily = 'Arial, sans-serif';
    scoreDisplay.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';
    document.getElementById('ui-overlay').appendChild(scoreDisplay);
    
    // Add event listener for Escape key to pause/resume
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (gameState.isPlaying) {
                gameState.isPlaying = false;
                updateUI();
            } else {
                startGame();
            }
        }
    });
    
    // Function to update the in-game score display
    function updateScore() {
        scoreDisplay.innerHTML = `Score: ${gameState.score}`;
    }
    
    // Update the UI on initialization
    updateUI();
    
    // Return functions to update UI from outside
    return {
        updateUI,
        updateScore
    };
} 
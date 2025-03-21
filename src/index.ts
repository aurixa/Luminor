/**
 * Luminor
 * Main entry point for the game
 * Code written by a mixture of AI (2025)
 */

// Import core game systems
import { initializeGame } from './core/game';
import { initializeLoadingScreen } from './ui/loading';

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
  console.log('Initializing Luminor...');
  // Wait for loading screen and start button click
  await initializeLoadingScreen();
  // Initialize game after loading screen is complete
  initializeGame();
});

/**
 * Luminor
 * Main entry point for the game
 * Code written by a mixture of AI (2025)
 */

// Import core game systems
import { initializeGame } from './core/game.js';

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Luminor...');
    initializeGame();
}); 
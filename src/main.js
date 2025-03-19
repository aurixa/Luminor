/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createPlanet } from './planet.js';
import { setupPlayer } from './player.js';
import { setupResources } from './resources.js';
import { setupUI } from './ui.js';

// Main game state
const gameState = {
    isPlaying: false,
    score: 0,
    playerLength: 1,
};

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('game-container').appendChild(renderer.domElement);

// Setup camera position
camera.position.z = 15;

// Add ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// Add directional light (sun)
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(10, 5, 10);
scene.add(sunLight);

// Add a subtle point light at the camera for better visibility
const cameraLight = new THREE.PointLight(0x3333ff, 0.5);
camera.add(cameraLight);
scene.add(camera);

// Create controls for development purposes (will be limited or removed in final version)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Create the planet
const planet = createPlanet(scene);

// Initialize game elements
let player, energy;

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    
    if (gameState.isPlaying && player && energy) {
        player.update();
        energy.update();
        
        // Check collisions
        const collisions = energy.checkCollisions(player);
        if (collisions > 0) {
            gameState.score += collisions;
            gameState.playerLength += collisions;
            player.grow(collisions);
        }
        
        // Check self-collision (game over condition)
        if (player.checkSelfCollision()) {
            endGame();
        }
    }
    
    renderer.render(scene, camera);
}

// Start the game
function startGame() {
    // Reset game state
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.playerLength = 1;
    
    // Remove old player and energy if they exist
    if (player) player.remove();
    if (energy) energy.remove();
    
    // Create new player and energy
    player = setupPlayer(scene, planet, camera);
    energy = setupResources(scene, planet);
    
    // Hide start screen, show game
    setupUI(gameState, startGame);
}

// End the game
function endGame() {
    gameState.isPlaying = false;
    
    // Update UI to show game over screen with final stats
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-length').textContent = gameState.playerLength;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// Setup event listeners and UI
document.getElementById('play-button').addEventListener('click', startGame);
document.getElementById('play-again-button').addEventListener('click', startGame);

// Start animation loop
animate(); 
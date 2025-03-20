/**
 * Luminor
 * Camera setup and configuration
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Camera configuration constants
export const CAMERA_CONFIG = {
    DISTANCE: 40,         // Distance from the player
    HEIGHT: 60,           // Height above the ground
    SMOOTHNESS: 0.08,     // Camera movement smoothing factor
    FORWARD_OFFSET: 20,   // How far ahead of the player to look
    FOV: 75,              // Field of view
    NEAR: 0.1,            // Near clipping plane
    FAR: 1000             // Far clipping plane
};

/**
 * Setup the game camera
 * @returns {THREE.PerspectiveCamera} The configured camera
 */
export function setupCamera() {
    const camera = new THREE.PerspectiveCamera(
        CAMERA_CONFIG.FOV, 
        window.innerWidth / window.innerHeight, 
        CAMERA_CONFIG.NEAR, 
        CAMERA_CONFIG.FAR
    );
    
    // Initial camera position
    camera.position.set(0, CAMERA_CONFIG.HEIGHT, CAMERA_CONFIG.DISTANCE);
    
    return camera;
} 
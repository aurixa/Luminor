/**
 * Luminor
 * Camera setup and configuration
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { CAMERA_CONFIG } from '../utils/constants.js';

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
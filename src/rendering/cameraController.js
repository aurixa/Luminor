/**
 * Luminor
 * Camera controller for following the player
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { CAMERA_CONFIG } from '../utils/constants.js';

/**
 * Update camera position to follow the player
 * @param {Object} playerState - Current player state
 * @param {THREE.Camera} camera - The camera to update
 * @param {Object} planet - The planet object for terrain checks
 */
export function updateCameraPosition(playerState, camera, planet) {
    if (!playerState) return;
    
    const playerPos = playerState.position;
    const playerDir = playerState.direction;
    const up = playerPos.clone().normalize();
    
    // Calculate camera offset
    const cameraOffset = new THREE.Vector3();
    cameraOffset.set(0, CAMERA_CONFIG.HEIGHT, CAMERA_CONFIG.DISTANCE);
    
    // Calculate target position
    const targetPosition = playerPos.clone()
        .add(up.clone().multiplyScalar(CAMERA_CONFIG.HEIGHT))
        .sub(playerDir.clone().multiplyScalar(CAMERA_CONFIG.DISTANCE));
    
    // Look at point ahead of player
    const lookTarget = playerPos.clone().add(
        playerDir.clone().multiplyScalar(CAMERA_CONFIG.FORWARD_OFFSET)
    );
    
    // Update camera
    camera.position.lerp(targetPosition, CAMERA_CONFIG.SMOOTHNESS);
    camera.lookAt(lookTarget);
    camera.up.copy(up);
} 
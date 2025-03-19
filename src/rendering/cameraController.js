/**
 * Luminor
 * Camera controller for dynamic camera positioning
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { CAMERA_CONFIG } from './camera.js';

// Reusable vector for calculations
const tempVector = new THREE.Vector3();
const upVector = new THREE.Vector3();
const targetPosition = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();

/**
 * Update the camera position to follow the player
 * @param {Object} playerState - The current player state
 * @param {THREE.Camera} camera - The game camera
 * @param {Object} planet - The planet object
 */
export function updateCameraPosition(playerState, camera, planet) {
    const { position, direction, up } = playerState;
    
    // Calculate the target position for the camera
    // Start from the player's position
    targetPosition.copy(position);
    
    // Calculate the camera offset based on player direction and up vector
    cameraOffset.set(0, CAMERA_CONFIG.HEIGHT, CAMERA_CONFIG.DISTANCE);
    
    // Rotate the offset to align with player orientation
    tempVector.copy(direction).negate().normalize();
    upVector.copy(up).normalize();
    
    // Transform the camera offset using the player's orientation vectors
    const right = new THREE.Vector3().crossVectors(upVector, tempVector).normalize();
    
    // Apply the offset in the player's coordinate system
    targetPosition.add(
        tempVector.clone().multiplyScalar(cameraOffset.z)
    ).add(
        upVector.clone().multiplyScalar(cameraOffset.y)
    ).add(
        right.clone().multiplyScalar(cameraOffset.x)
    );
    
    // Look ahead of the player based on forward offset
    const lookTarget = position.clone().add(
        direction.clone().multiplyScalar(CAMERA_CONFIG.FORWARD_OFFSET)
    );
    
    // Smooth camera movement
    camera.position.lerp(targetPosition, CAMERA_CONFIG.SMOOTHNESS);
    
    // Make the camera look at the player plus some forward offset
    camera.lookAt(lookTarget);
    
    // Optional: Adjust camera for terrain height
    // If the player is on a high point, adjust camera height accordingly
    if (planet && planet.getElevationAtPoint) {
        const elevation = planet.getElevationAtPoint(position);
        if (elevation > 10) {
            // Adjust camera height based on terrain elevation
            camera.position.y += elevation * 0.3;
        }
    }
} 
/**
 * Luminor
 * Camera setup and management
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { CAMERA_CONFIG } from '../utils/constants';
import { Player } from '../types';
import { PLANET_CONFIG } from '../utils/constants';

/**
 * Setup the camera for the game
 */
export function setupCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_CONFIG.NEAR,
    CAMERA_CONFIG.FAR
  );

  // Set initial position
  camera.position.set(
    CAMERA_CONFIG.INITIAL_POSITION.x,
    CAMERA_CONFIG.INITIAL_POSITION.y,
    CAMERA_CONFIG.INITIAL_POSITION.z
  );

  // Look at origin
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Add resize listener
  window.addEventListener('resize', () => handleResize(camera));

  return camera;
}

/**
 * Handle window resize
 */
function handleResize(camera: THREE.PerspectiveCamera): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

/**
 * Update camera position to follow player
 */
export function updateCameraPosition(camera: THREE.PerspectiveCamera, player: Player): void {
  // Get player position and direction
  const playerPos = player.getPosition();
  const playerDir = player.getDirection();

  // Calculate up vector from planet center to player
  const upVector = playerPos.clone().normalize();

  // Calculate right vector
  const right = new THREE.Vector3().crossVectors(playerDir, upVector).normalize();

  // Calculate forward vector (this is the direction the player is moving)
  const forward = new THREE.Vector3().crossVectors(upVector, right).normalize();

  // Calculate camera target position
  const cameraOffset = new THREE.Vector3();

  // Position camera behind and slightly above player
  cameraOffset.copy(forward).multiplyScalar(-CAMERA_CONFIG.FOLLOW_DISTANCE); // Negative to go behind
  cameraOffset.add(upVector.multiplyScalar(CAMERA_CONFIG.HEIGHT_OFFSET));

  // Calculate desired camera position
  const targetPosition = playerPos.clone().add(cameraOffset);

  // Ensure minimum height from planet surface
  const distanceFromCenter = targetPosition.length();
  const minHeight = PLANET_CONFIG.RADIUS * 1.1; // Keep camera at least 10% above planet radius
  if (distanceFromCenter < minHeight) {
    targetPosition.normalize().multiplyScalar(minHeight);
  }

  // Update camera position with smoother interpolation
  camera.position.lerp(targetPosition, 0.1);

  // Look at a point slightly ahead of the player
  const lookAtPoint = playerPos.clone().add(forward.multiplyScalar(50));
  camera.lookAt(lookAtPoint);

  // Ensure camera up vector is aligned with planet surface normal
  camera.up.copy(upVector);
}

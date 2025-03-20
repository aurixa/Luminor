/**
 * Luminor
 * Camera setup and management
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { CAMERA_CONFIG } from '../utils/constants';
import { Player, Planet } from '../types';

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
export function updateCameraPosition(
  camera: THREE.PerspectiveCamera,
  player: Player,
  _planet: Planet,
  _deltaTime: number
): void {
  // Get player position and direction
  const playerPos = player.getPosition();
  const playerDir = player.getDirection();

  // Calculate camera offset based on player direction
  const cameraOffset = playerDir
    .clone()
    .multiplyScalar(-CAMERA_CONFIG.FOLLOW_DISTANCE)
    .add(new THREE.Vector3(0, CAMERA_CONFIG.HEIGHT_OFFSET, 0));

  // Set camera position
  camera.position.copy(playerPos).add(cameraOffset);

  // Look at player
  camera.lookAt(playerPos);
}

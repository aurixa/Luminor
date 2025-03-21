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
  const planet = player.getPlanet();

  // Calculate up vector from planet center to player
  const upVector = playerPos.clone().normalize();

  // Calculate right vector
  const right = new THREE.Vector3().crossVectors(playerDir, upVector).normalize();

  // Calculate forward vector (this is the direction the player is moving)
  const forward = new THREE.Vector3().crossVectors(upVector, right).normalize();

  // Calculate terrain angle for height adjustment
  const terrainAngle = Math.acos(
    Math.max(0, Math.min(1, upVector.dot(new THREE.Vector3(0, 1, 0))))
  );
  const heightAdjustment = Math.cos(terrainAngle) * CAMERA_CONFIG.HEIGHT_OFFSET;

  // Adjust camera distance based on terrain angle
  const distanceAdjustment = CAMERA_CONFIG.FOLLOW_DISTANCE * (1 + Math.sin(terrainAngle) * 0.2);

  // Calculate ideal camera position (where we want the camera to be)
  const idealOffset = new THREE.Vector3();
  idealOffset.copy(forward).multiplyScalar(-distanceAdjustment);
  idealOffset.add(upVector.multiplyScalar(heightAdjustment));
  const idealPosition = playerPos.clone().add(idealOffset);

  // Raycast to check for terrain between camera and player
  const raycaster = new THREE.Raycaster();
  raycaster.set(playerPos, idealPosition.clone().sub(playerPos).normalize());
  const intersects = planet.raycast(raycaster);

  let targetPosition = idealPosition.clone();

  if (intersects.length > 0) {
    // Terrain is blocking view, adjust camera position
    const intersection = intersects[0];
    const distanceToIntersection = intersection.distance;
    const minDistance = CAMERA_CONFIG.FOLLOW_DISTANCE * 0.3; // Minimum 30% of normal distance

    if (distanceToIntersection < CAMERA_CONFIG.FOLLOW_DISTANCE) {
      // Move camera closer to player, but maintain relative angle
      const adjustedDistance = Math.max(minDistance, distanceToIntersection * 0.8);
      targetPosition = playerPos
        .clone()
        .add(idealOffset.normalize().multiplyScalar(adjustedDistance));

      // Ensure minimum height from surface
      const surfacePoint = planet.getNearestPointOnSurface(targetPosition);
      const surfaceNormal = surfacePoint.clone().normalize();
      const minHeightOffset = PLANET_CONFIG.RADIUS * 0.05; // 5% of planet radius
      targetPosition.copy(surfacePoint).add(surfaceNormal.multiplyScalar(minHeightOffset));
    }
  }

  // Apply different smoothing rates for position and rotation
  const positionLerpFactor = 0.2; // Fast position following
  const rotationLerpFactor = 0.05; // Slower rotation following

  // Calculate current camera direction relative to player
  const currentCameraDir = camera.position.clone().sub(playerPos).normalize();

  // Interpolate camera direction
  const newCameraDir = new THREE.Vector3();
  newCameraDir
    .copy(currentCameraDir)
    .lerp(targetPosition.clone().sub(playerPos).normalize(), rotationLerpFactor);

  // Apply position smoothing while maintaining the interpolated direction
  const smoothedPosition = playerPos
    .clone()
    .add(newCameraDir.multiplyScalar(targetPosition.clone().sub(playerPos).length()));
  camera.position.lerp(smoothedPosition, positionLerpFactor);

  // Look at a point slightly ahead of the player
  const lookAheadDistance = Math.min(30, distanceAdjustment * 0.2);
  const lookAtOffset = forward.multiplyScalar(lookAheadDistance);
  const lookAtPoint = playerPos.clone().add(lookAtOffset);
  camera.lookAt(lookAtPoint);

  // Ensure camera up vector is aligned with planet surface normal
  camera.up.copy(upVector);
}

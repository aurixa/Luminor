/**
 * Luminor
 * Player core setup and management
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { PLAYER_CONFIG } from '../utils/constants';
import { setupSegments } from './segments';
import { createAlignmentIndicators, createTrailEffect } from './playerEffects';
import { Player, Planet, InputKeys } from '../types';

/**
 * Setup player and return player object
 */
export function setupPlayer(
  scene: THREE.Scene,
  planet: Planet,
  _camera: THREE.PerspectiveCamera,
  keys: InputKeys | null = null
): Player {
  // Create player head - a simple cube
  const headGeometry = new THREE.BoxGeometry(
    PLAYER_CONFIG.SEGMENT_SIZE,
    PLAYER_CONFIG.SEGMENT_SIZE,
    PLAYER_CONFIG.SEGMENT_SIZE
  );

  // Use a standard MeshLambertMaterial with no special effects
  const headMaterial = new THREE.MeshLambertMaterial({
    color: 0x00ffaa,
    emissive: 0x00aa77,
    emissiveIntensity: 0.5
  });

  const headMesh = new THREE.Mesh(headGeometry, headMaterial);

  // Set initial position on the planet surface
  const initialDirection = new THREE.Vector3(0, 1, 0); // Start at top of planet
  const surfacePoint = planet.getNearestPointOnSurface(initialDirection);
  const surfaceNormal = surfacePoint.clone().normalize();
  const initialPosition = surfacePoint
    .clone()
    .add(surfaceNormal.multiplyScalar(PLAYER_CONFIG.HOVER_HEIGHT));

  console.log('Spawning player at position:', initialPosition);
  headMesh.position.copy(initialPosition);

  // Initial movement direction - tangent to the planet surface
  let currentDirection = new THREE.Vector3(1, 0, 0).normalize(); // Start moving east
  const up = initialPosition.clone().normalize();

  // Ensure direction is perpendicular to up vector (tangent to surface)
  currentDirection = new THREE.Vector3().crossVectors(up, currentDirection).normalize();

  // Set initial orientation
  orientPlayerToSurface(headMesh, surfaceNormal, currentDirection);

  scene.add(headMesh);

  // Player state
  let isAlive = true;

  // Setup alignment indicators (debug visuals)
  const { surfaceNormalLine, directionLine, rightLine } = createAlignmentIndicators(scene);

  // Setup segments system
  const segmentsSystem = setupSegments(scene, planet, headMesh);

  // Setup trail system
  const trailSystem = createTrailEffect(scene, segmentsSystem.segments);

  /**
   * Orient player mesh to face the direction of travel while conforming to the surface
   */
  function orientPlayerToSurface(
    mesh: THREE.Mesh,
    surfaceNormal: THREE.Vector3,
    movementDirection: THREE.Vector3
  ): void {
    // The up vector points away from the planet center
    const up = surfaceNormal.clone().normalize();

    // Project movement direction onto the tangent plane
    const forward = movementDirection
      .clone()
      .sub(up.clone().multiplyScalar(up.dot(movementDirection)))
      .normalize();

    // Get the right vector to complete the orthogonal basis
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    // Create rotation matrix from these three orthogonal vectors
    const rotMatrix = new THREE.Matrix4().makeBasis(
      right, // X axis (right)
      up, // Y axis (up)
      forward // Z axis (forward)
    );

    // Apply the rotation without any scaling
    mesh.quaternion.setFromRotationMatrix(rotMatrix);

    // Ensure no scaling is applied that might deform the mesh
    mesh.scale.set(1, 1, 1);
  }

  // Return the player interface
  const player = {
    mesh: headMesh,
    segments: segmentsSystem.segments,
    updateSegments: segmentsSystem.updateSegments,
    growTail: segmentsSystem.growTail,
    getCount: segmentsSystem.getCount,
    checkCollisions: segmentsSystem.checkCollisions,
    trail: trailSystem,
    dispose: (scene: THREE.Scene) => {
      // Remove head
      scene.remove(headMesh);
      headMesh.geometry.dispose();
      if (headMesh.material instanceof THREE.Material) {
        headMesh.material.dispose();
      }

      // Remove segments
      segmentsSystem.dispose(scene);

      // Remove debug visuals
      if (PLAYER_CONFIG.DEBUG_ALIGNMENT) {
        scene.remove(surfaceNormalLine);
        scene.remove(directionLine);
        scene.remove(rightLine);

        surfaceNormalLine.geometry.dispose();
        directionLine.geometry.dispose();
        rightLine.geometry.dispose();
      }
    },
    getPosition: () => headMesh.position.clone(),
    getDirection: () => currentDirection.clone(),
    grow: (count: number) => segmentsSystem.growTail(count),
    getSegmentCount: () => segmentsSystem.getCount(),
    getHeadPosition: () => headMesh.position.clone(),
    die: () => {
      isAlive = false;
    },
    update: (deltaTime: number) => {
      if (!isAlive) return;

      // Only move if player has control keys
      if (keys) {
        // Get current up vector (from planet center to player)
        const up = headMesh.position.clone().normalize();

        // Handle player rotation (turning left/right)
        if (keys.left) {
          currentDirection.applyAxisAngle(up, PLAYER_CONFIG.TURN_SPEED);
        }
        if (keys.right) {
          currentDirection.applyAxisAngle(up, -PLAYER_CONFIG.TURN_SPEED);
        }

        // Ensure direction is perpendicular to up vector (tangent to surface)
        const right = new THREE.Vector3().crossVectors(currentDirection, up);
        currentDirection.crossVectors(up, right).normalize();

        // Calculate new position based on current direction and speed
        const movement = currentDirection.clone().multiplyScalar(PLAYER_CONFIG.SPEED * deltaTime);
        const newPosition = headMesh.position.clone().add(movement);

        // Project to planet surface and add hover height
        const surfacePoint = planet.getNearestPointOnSurface(newPosition);
        const surfaceNormal = surfacePoint.clone().normalize();
        const hoverPosition = surfacePoint
          .clone()
          .add(surfaceNormal.multiplyScalar(PLAYER_CONFIG.HOVER_HEIGHT));

        // Update player position
        headMesh.position.copy(hoverPosition);

        // Orient the player to face the current direction and align with the surface
        orientPlayerToSurface(headMesh, surfaceNormal, currentDirection);

        // Update debug alignment indicators if enabled
        if (PLAYER_CONFIG.DEBUG_ALIGNMENT) {
          surfaceNormalLine.position.copy(hoverPosition);
          directionLine.position.copy(hoverPosition);
          rightLine.position.copy(hoverPosition);

          // Surface normal visualization (green)
          const normalPoints = [
            new THREE.Vector3(0, 0, 0),
            surfaceNormal.clone().multiplyScalar(PLAYER_CONFIG.ALIGNMENT_LINE_LENGTH * 1.5)
          ];
          surfaceNormalLine.geometry.setFromPoints(normalPoints);

          // Current direction visualization (blue)
          const dirPoints = [
            new THREE.Vector3(0, 0, 0),
            currentDirection.clone().multiplyScalar(PLAYER_CONFIG.ALIGNMENT_LINE_LENGTH * 1.2)
          ];
          directionLine.geometry.setFromPoints(dirPoints);

          // Right vector visualization (red)
          const rightPoints = [
            new THREE.Vector3(0, 0, 0),
            right.clone().multiplyScalar(PLAYER_CONFIG.ALIGNMENT_LINE_LENGTH)
          ];
          rightLine.geometry.setFromPoints(rightPoints);
        }
      }

      // Update segments to follow the head
      segmentsSystem.updateSegments(deltaTime);
    },
    getPlanet: (): Planet => planet
  } satisfies Player;

  return player;
}

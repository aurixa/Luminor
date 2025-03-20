/**
 * Luminor
 * Player core setup and management
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { PLAYER_CONFIG } from '../utils/constants';
import { createGlowingMaterial } from '../utils/materials';
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
  keys: InputKeys
): Player {
  // Create player head
  const headGeometry = new THREE.SphereGeometry(PLAYER_CONFIG.SEGMENT_SIZE, 16, 16);
  const headMaterial = createGlowingMaterial(0x00ffaa, PLAYER_CONFIG.GLOW_INTENSITY);
  const headMesh = new THREE.Mesh(headGeometry, headMaterial);

  // Set initial position on the light side of the planet
  const initialPosition = new THREE.Vector3(planet.radius + PLAYER_CONFIG.HOVER_HEIGHT, 0, 0);
  headMesh.position.copy(initialPosition);
  scene.add(headMesh);

  // Tracking variables
  let currentDirection = new THREE.Vector3(0, 0, 1).normalize();
  let isAlive = true;

  // Setup alignment indicators (debug visuals)
  const { surfaceNormalLine, directionLine, rightLine } = createAlignmentIndicators(scene);

  // Setup segments system
  const segmentsSystem = setupSegments(scene, planet, headMesh);

  // Setup trail system
  const trailSystem = createTrailEffect(scene, segmentsSystem.segments);

  // Make sure head segment has access to direction for proper tail following
  if (segmentsSystem.segments.length > 0) {
    segmentsSystem.segments[0].direction = currentDirection.clone();
  }

  // Public methods for the player
  const player: Player = {
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
      headMesh.material.dispose();

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

      const oldPosition = headMesh.position.clone();

      // Only move if player has control keys
      if (keys) {
        // Handle player rotation
        if (keys.left) {
          // Rotate currentDirection around the up vector
          const up = headMesh.position.clone().normalize();
          currentDirection.applyAxisAngle(up, PLAYER_CONFIG.TURN_SPEED);
          currentDirection.normalize();
        }

        if (keys.right) {
          // Rotate currentDirection around the up vector
          const up = headMesh.position.clone().normalize();
          currentDirection.applyAxisAngle(up, -PLAYER_CONFIG.TURN_SPEED);
          currentDirection.normalize();
        }

        // Move head in the current direction
        const newPosition = headMesh.position
          .clone()
          .add(currentDirection.clone().multiplyScalar(PLAYER_CONFIG.SPEED));

        // Project to planet surface and add hover height
        const surfacePoint = planet.getNearestPointOnSurface(newPosition);
        const surfaceNormal = surfacePoint.clone().normalize();
        const hoverPosition = surfacePoint
          .clone()
          .add(surfaceNormal.multiplyScalar(PLAYER_CONFIG.HOVER_HEIGHT));

        // Update head position
        headMesh.position.copy(hoverPosition);

        // Log position change for debugging
        const displacement = oldPosition.distanceTo(headMesh.position);
        console.log(
          `Player moved: ${displacement.toFixed(2)} units, New position: X:${headMesh.position.x.toFixed(2)}, Y:${headMesh.position.y.toFixed(2)}, Z:${headMesh.position.z.toFixed(2)}`
        );

        // Calculate player orientation
        const up = hoverPosition.clone().normalize();
        const right = new THREE.Vector3().crossVectors(currentDirection, up).normalize();
        const forward = new THREE.Vector3().crossVectors(up, right).normalize();

        // Update player direction
        currentDirection = forward.clone();

        // Update direction in head segment for proper tail following
        if (segmentsSystem.segments.length > 0) {
          segmentsSystem.segments[0].direction = currentDirection.clone();

          // Ensure head segment position is synchronized with head mesh position
          segmentsSystem.segments[0].position = headMesh.position.clone();
          segmentsSystem.segments[0].mesh.position.copy(headMesh.position);
        }

        // Update debug alignment indicators if enabled
        if (PLAYER_CONFIG.DEBUG_ALIGNMENT) {
          // Update position
          surfaceNormalLine.position.copy(hoverPosition);
          directionLine.position.copy(hoverPosition);
          rightLine.position.copy(hoverPosition);

          // Update alignment lines
          const normalPoints = [
            new THREE.Vector3(0, 0, 0),
            surfaceNormal.clone().multiplyScalar(PLAYER_CONFIG.ALIGNMENT_LINE_LENGTH)
          ];
          surfaceNormalLine.geometry.setFromPoints(normalPoints);

          const dirPoints = [
            new THREE.Vector3(0, 0, 0),
            currentDirection.clone().multiplyScalar(PLAYER_CONFIG.ALIGNMENT_LINE_LENGTH)
          ];
          directionLine.geometry.setFromPoints(dirPoints);

          const rightPoints = [
            new THREE.Vector3(0, 0, 0),
            right.clone().multiplyScalar(PLAYER_CONFIG.ALIGNMENT_LINE_LENGTH)
          ];
          rightLine.geometry.setFromPoints(rightPoints);
        }
      }

      // Update segments to follow the head
      segmentsSystem.updateSegments(deltaTime);
    }
  };

  // We don't need to add initial segments here, as player starts with length 3
  // and the head is already counted as one segment.

  return player;
}

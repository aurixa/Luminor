/**
 * Luminor
 * Player segments system
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { PLAYER_CONFIG } from '../utils/constants';
import { createGlowingMaterial } from '../utils/materials';
import { Planet, Segment } from '../types';

interface SegmentsSystem {
  segments: Segment[];
  updateSegments: (deltaTime: number) => void;
  growTail: (count: number) => void;
  getCount: () => number;
  checkCollisions: () => boolean;
  dispose: (scene: THREE.Scene) => void;
}

/**
 * Setup the segments system for the player
 */
export function setupSegments(
  scene: THREE.Scene,
  planet: Planet,
  headMesh: THREE.Mesh<THREE.SphereGeometry, THREE.Material>
): SegmentsSystem {
  // Store segments as simple objects with mesh and target index
  // Each segment follows a specific position in the path
  const segments: Segment[] = [];

  // Add the head as the first segment
  segments.push({
    mesh: headMesh,
    isHead: true,
    index: 0
  });

  // Path array stores positions the head has traveled through
  const path: THREE.Vector3[] = [];
  const MAX_PATH_LENGTH = 200; // Store a large path to ensure smooth following

  // Add initial position
  path.push(headMesh.position.clone());

  // Add 2 more segments to start with length 3
  for (let i = 0; i < 2; i++) {
    addSegment();
  }

  /**
   * Update all segments to follow the path
   */
  function updateSegments(deltaTime: number): void {
    // First update the path with the head's current position
    const currentHeadPos = segments[0].mesh.position.clone();
    path.unshift(currentHeadPos);

    // Trim path if too long
    if (path.length > MAX_PATH_LENGTH) {
      path.pop();
    }

    // Update each segment except the head (which is controlled by the player)
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];

      // Calculate the index in the path array
      // Reduce spacing between segments by changing multiplier from 10 to 5
      const pathIndex = Math.min(i * 5, path.length - 1);

      if (pathIndex < path.length) {
        // Get position from the path
        const targetPosition = path[pathIndex];

        // Project onto planet surface to ensure correct height
        const surfacePoint = planet.getNearestPointOnSurface(targetPosition);
        const surfaceNormal = surfacePoint.clone().normalize();

        // Apply some bobbing effect
        segment.hoverPhase = (segment.hoverPhase || 0) + deltaTime * 3;
        const hoverWobble = Math.sin(segment.hoverPhase) * PLAYER_CONFIG.HOVER_WOBBLE;
        const hoverHeight = PLAYER_CONFIG.HOVER_HEIGHT + hoverWobble;

        // Set final position
        const finalPosition = surfacePoint.clone().add(surfaceNormal.multiplyScalar(hoverHeight));

        // Update mesh position directly
        segment.mesh.position.copy(finalPosition);
      }
    }
  }

  /**
   * Add segments to the tail
   */
  function growTail(count: number): void {
    // Only log once when growing multiple segments
    console.log(`Growing player tail by ${count}`);

    for (let i = 0; i < count; i++) {
      addSegment();
    }
  }

  /**
   * Add a single new segment
   */
  function addSegment(): void {
    // Create new segment geometry
    const segmentGeometry = new THREE.SphereGeometry(PLAYER_CONFIG.SEGMENT_SIZE, 16, 16);
    const segmentMaterial = createGlowingMaterial(0x00ffaa, PLAYER_CONFIG.GLOW_INTENSITY * 0.8);
    const segmentMesh = new THREE.Mesh(segmentGeometry, segmentMaterial);

    // Get position for the new segment from the path
    let position: THREE.Vector3;

    if (path.length > 0 && segments.length > 0) {
      // Position at the end of the current path
      // Reduce spacing for new segments by changing multiplier from 10 to 5
      const pathIndex = Math.min(segments.length * 5, path.length - 1);
      position = path[pathIndex].clone();
    } else {
      // Fallback - should never happen
      position = headMesh.position.clone();
      console.warn('Using fallback position for new segment');
    }

    // Project onto planet surface
    const surfacePoint = planet.getNearestPointOnSurface(position);
    const surfaceNormal = surfacePoint.clone().normalize();
    const hoverPosition = surfacePoint
      .clone()
      .add(surfaceNormal.multiplyScalar(PLAYER_CONFIG.HOVER_HEIGHT));

    // Set initial position
    segmentMesh.position.copy(hoverPosition);

    // Add to scene
    scene.add(segmentMesh);

    // Store segment data
    segments.push({
      mesh: segmentMesh,
      isHead: false,
      index: segments.length,
      hoverPhase: (Math.PI * segments.length) / 2
    });
  }

  /**
   * Check collisions between head and segments
   */
  function checkCollisions(): boolean {
    // Disable collisions for now
    return false;
  }

  /**
   * Remove all segments from the scene
   */
  function dispose(scene: THREE.Scene): void {
    // Skip the head (index 0) as it's handled by playerCore.js
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      scene.remove(segment.mesh);
      if (segment.mesh.geometry) {
        segment.mesh.geometry.dispose();
      }
      if (segment.mesh.material) {
        if (Array.isArray(segment.mesh.material)) {
          segment.mesh.material.forEach(m => m.dispose());
        } else {
          segment.mesh.material.dispose();
        }
      }
    }

    // Clear the arrays
    segments.splice(1);
    path.length = 0;

    // Re-add the current head position
    path.push(segments[0].mesh.position.clone());
  }

  // Return public interface
  return {
    segments,
    updateSegments,
    growTail,
    getCount: () => segments.length,
    checkCollisions,
    dispose
  };
}

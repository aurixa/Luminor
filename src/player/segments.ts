/**
 * Luminor
 * Player segments system
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { PLAYER_CONFIG } from '../utils/constants';
import { Planet, Segment } from '../types';

// Simple data structure for recording positions and orientations
interface PathPoint {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

/**
 * Segments system interface
 */
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
  _planet: Planet,
  headMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>
): SegmentsSystem {
  // Store all segments
  const segments: Segment[] = [];

  // Store historical positions and orientations
  // The path acts like a queue - new points are added at the front (index 0)
  // Each segment follows a point further back in the queue based on its index
  const path: PathPoint[] = [];

  // Distance between segments in terms of path points
  // Lower value = segments follow more closely
  const SEGMENT_SPACING = 3;

  // Maximum path length to keep in memory
  const MAX_PATH_LENGTH = 1000;

  // Add the head as the first segment
  segments.push({
    mesh: headMesh,
    isHead: true,
    index: 0,
    targetPosition: headMesh.position.clone(),
    targetQuaternion: headMesh.quaternion.clone()
  });

  // Initialize path with the head's starting position and orientation
  path.push({
    position: headMesh.position.clone(),
    quaternion: headMesh.quaternion.clone()
  });

  // Add initial tail segments
  for (let i = 0; i < 2; i++) {
    addSegment();
  }

  /**
   * Update all segments to follow the path
   */
  function updateSegments(deltaTime: number): void {
    // Track time between adding new path points
    if (!segments[0].lastPathTime) {
      segments[0].lastPathTime = 0;
    }

    segments[0].lastPathTime += deltaTime;

    // Add a new path point at fixed intervals (every 0.05 seconds)
    if (segments[0].lastPathTime >= 0.05) {
      // Reset the timer
      segments[0].lastPathTime = 0;

      // Record the head's current position and orientation without modification
      path.unshift({
        position: segments[0].mesh.position.clone(),
        quaternion: segments[0].mesh.quaternion.clone()
      });

      // Trim the path if it gets too long
      if (path.length > MAX_PATH_LENGTH) {
        path.pop();
      }
    }

    // Update each segment except the head
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];

      // Calculate which point in the path this segment should follow
      const pathIndex = Math.min(i * SEGMENT_SPACING, path.length - 1);

      if (pathIndex < path.length) {
        const pathPoint = path[pathIndex];

        // Ensure target vectors exist
        if (!segment.targetPosition) {
          segment.targetPosition = new THREE.Vector3();
        }
        if (!segment.targetQuaternion) {
          segment.targetQuaternion = new THREE.Quaternion();
        }

        // Update target position and orientation
        segment.targetPosition.copy(pathPoint.position);
        segment.targetQuaternion.copy(pathPoint.quaternion);

        // Smoothly interpolate position and rotation
        segment.mesh.position.lerp(segment.targetPosition, deltaTime * 10);
        segment.mesh.quaternion.slerp(segment.targetQuaternion, deltaTime * 10);
      }
    }
  }

  /**
   * Add a single new segment
   */
  function addSegment(): void {
    // Create new segment as a perfect cube with equal dimensions
    const segmentGeometry = new THREE.BoxGeometry(
      PLAYER_CONFIG.SEGMENT_SIZE,
      PLAYER_CONFIG.SEGMENT_SIZE,
      PLAYER_CONFIG.SEGMENT_SIZE
    );

    // Use a basic material for the segments
    const segmentMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ffaa,
      emissive: 0x00aa77,
      emissiveIntensity: 0.3
    });

    const segmentMesh = new THREE.Mesh(segmentGeometry, segmentMaterial);

    // Get the position for the new segment from the path
    const segmentIndex = segments.length;
    const pathIndex = Math.min(segmentIndex * SEGMENT_SPACING, path.length - 1);

    if (pathIndex >= 0 && pathIndex < path.length) {
      // Use exact values from the path with no modifications
      segmentMesh.position.copy(path[pathIndex].position);
      segmentMesh.quaternion.copy(path[pathIndex].quaternion);
    } else {
      // Fallback - use the last segment's position
      const lastSegment = segments[segments.length - 1];
      segmentMesh.position.copy(lastSegment.mesh.position);
      segmentMesh.quaternion.copy(lastSegment.mesh.quaternion);
    }

    scene.add(segmentMesh);

    // Store segment data with initialized target vectors
    segments.push({
      mesh: segmentMesh,
      isHead: false,
      index: segmentIndex,
      targetPosition: segmentMesh.position.clone(),
      targetQuaternion: segmentMesh.quaternion.clone()
    });
  }

  /**
   * Add segments to the tail
   */
  function growTail(count: number): void {
    for (let i = 0; i < count; i++) {
      addSegment();
    }
    console.log(`Added ${count} segments, total: ${segments.length}`);
  }

  /**
   * Check collisions between head and segments
   */
  function checkCollisions(): boolean {
    if (segments.length < 5) return false; // Need minimum segments for collision

    const headPosition = segments[0].mesh.position;
    const collisionThreshold = PLAYER_CONFIG.SEGMENT_SIZE * 0.8; // Slightly smaller than segment size

    // Check collision with each segment except the first few
    // (since they're always close to the head)
    for (let i = 4; i < segments.length; i++) {
      const segment = segments[i];
      const distance = headPosition.distanceTo(segment.mesh.position);

      if (distance < collisionThreshold) {
        console.log(`Collision detected with segment ${i}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Remove all segments from the scene
   */
  function dispose(scene: THREE.Scene): void {
    for (const segment of segments) {
      if (!segment.isHead) {
        // Don't remove the head, it's managed elsewhere
        scene.remove(segment.mesh);
        segment.mesh.geometry.dispose();
        if (segment.mesh.material instanceof THREE.Material) {
          segment.mesh.material.dispose();
        }
      }
    }

    // Keep the head, remove the rest
    const head = segments[0];
    segments.length = 0;
    segments.push(head);

    // Clear the path except for the current position
    const currentPos = path[0];
    path.length = 0;
    path.push(currentPos);
  }

  // Return the public interface
  return {
    segments,
    updateSegments,
    growTail,
    getCount: () => segments.length,
    checkCollisions,
    dispose
  };
}

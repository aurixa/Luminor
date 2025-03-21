/**
 * Luminor
 * Crater generation for planet terrain
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { PLANET_CONFIG } from '../utils/constants';
import { TERRAIN_CONFIG } from '../utils/constants';

export interface Crater {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  radius: number;
  size: number;
  depth: number;
  rimHeight: number;
  falloff: number;
}

/**
 * Generate craters on the planet
 */
export function generateCraters(): Crater[] {
  const craters: Crater[] = [];

  // Skip if craters are disabled
  if (!TERRAIN_CONFIG.CRATERS.ENABLED) {
    return craters;
  }

  // Create specified number of craters
  for (let i = 0; i < TERRAIN_CONFIG.CRATERS.COUNT; i++) {
    // Generate random position on sphere
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI;
    const direction = new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi),
      Math.sin(theta) * Math.sin(phi),
      Math.cos(theta)
    ).normalize();

    // Random size within range
    const size =
      TERRAIN_CONFIG.CRATERS.MIN_SIZE +
      Math.random() * (TERRAIN_CONFIG.CRATERS.MAX_SIZE - TERRAIN_CONFIG.CRATERS.MIN_SIZE);

    // Create crater
    const crater = createCrater(direction, size);
    craters.push(crater);
  }

  return craters;
}

/**
 * Get crater influence at a point
 */
export function getCraterInfluence(point: THREE.Vector3, craters: Crater[]): number {
  let totalInfluence = 0;

  for (const crater of craters) {
    const distance = point.distanceTo(crater.position);
    if (distance < crater.radius) {
      const normalizedDistance = distance / crater.radius;
      const craterProfile = getCraterProfile(normalizedDistance, crater);
      totalInfluence += craterProfile * crater.size;
    }
  }

  return totalInfluence;
}

/**
 * Get crater profile at a normalized distance
 */
function getCraterProfile(distance: number, crater: Crater): number {
  // No influence outside crater radius
  if (distance >= 1) return 0;

  // Crater profile function
  const x = distance * Math.PI;
  const profile = Math.cos(x) * crater.depth;

  // Add rim
  if (distance > 0.8) {
    const rimFactor = (distance - 0.8) / 0.2;
    const rimProfile = Math.sin(rimFactor * Math.PI) * crater.rimHeight;
    return profile + rimProfile;
  }

  return profile;
}

/**
 * Create a single crater
 */
function createCrater(direction: THREE.Vector3, size: number): Crater {
  const radius = size * PLANET_CONFIG.RADIUS * 0.1;
  const position = direction.clone().multiplyScalar(PLANET_CONFIG.RADIUS);

  return {
    position,
    direction,
    radius,
    size,
    depth: TERRAIN_CONFIG.CRATERS.DEPTH_FACTOR,
    rimHeight: TERRAIN_CONFIG.CRATERS.RIM_HEIGHT_FACTOR,
    falloff: 1.5 + Math.random() * 0.5
  };
}

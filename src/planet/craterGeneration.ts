/**
 * Luminor
 * Crater generation for planet terrain
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { PLANET_CONFIG } from '../utils/constants';

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
 * Generate craters for the planet surface
 */
export function generateCraters(): Crater[] {
  const craters: Crater[] = [];
  const craterCount = PLANET_CONFIG.CRATER_COUNT;

  for (let i = 0; i < craterCount; i++) {
    // Generate random direction on sphere surface
    const direction = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize();

    // Random crater size
    const size =
      PLANET_CONFIG.MIN_CRATER_SIZE +
      Math.random() * (PLANET_CONFIG.MAX_CRATER_SIZE - PLANET_CONFIG.MIN_CRATER_SIZE);

    // Create crater using the helper function
    craters.push(createCrater(direction, size));
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
    depth: 0.2 + Math.random() * 0.3,
    rimHeight: 0.1 + Math.random() * 0.2,
    falloff: 1.5 + Math.random() * 0.5
  };
}

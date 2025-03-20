/**
 * Luminor
 * Core planet creation module
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { PLANET_CONFIG, TERRAIN_CONFIG } from '../utils/constants';
import { generateCraters } from './craterGeneration';
import { createTerrainMaterial } from '../rendering/terrainMaterial';
import { generatePlanetGeometry } from './terrainGeneration';
import { Planet, Crater } from '../types';

function getTerrainNoise(x: number, y: number, z: number, noise: SimplexNoise): number {
  const scale = PLANET_CONFIG.TERRAIN_SCALE;
  const baseNoise = noise.noise3d(x * scale, y * scale, z * scale);
  const detailNoise = noise.noise3d(x * scale * 2, y * scale * 2, z * scale * 2) * 0.5;
  return baseNoise + detailNoise;
}

function getCraterInfluence(direction: THREE.Vector3, craters: Crater[]): number {
  let totalInfluence = 0;
  for (const crater of craters) {
    const distance = direction.distanceTo(crater.position);
    if (distance < crater.radius) {
      const influence = Math.cos((distance / crater.radius) * Math.PI) * crater.depth;
      totalInfluence += influence;
    }
  }
  return totalInfluence;
}

/**
 * Creates the planet and adds it to the scene
 * @param {THREE.Scene} scene - The Three.js scene to add the planet to
 * @returns {Planet} The created planet mesh with additional utilities
 */
export function createPlanet(scene: THREE.Scene): Planet {
  // Create noise generator
  const noise = new SimplexNoise();

  // Generate craters
  const craters = generateCraters();

  // Generate planet geometry
  const { geometry } = generatePlanetGeometry(noise, craters);

  // Create planet mesh
  const material = createTerrainMaterial();
  const planetMesh = new THREE.Mesh(geometry, material);

  // Add to scene
  scene.add(planetMesh);

  // Return planet interface
  return {
    mesh: planetMesh,
    radius: PLANET_CONFIG.RADIUS,
    getNearestPointOnSurface: (point: THREE.Vector3) => {
      const direction = point.clone().normalize();
      let elevation = getTerrainNoise(direction.x, direction.y, direction.z, noise);

      if (craters.length > 0) {
        elevation += getCraterInfluence(direction, craters);
      }

      return direction.multiplyScalar(PLANET_CONFIG.RADIUS * (1 + elevation));
    }
  };
}

/**
 * Gets the height at a specific direction from planet center
 * @param {THREE.Vector3} direction - The direction vector
 * @param {SimplexNoise} noise - The noise generator
 * @param {Crater[]} craters - Array of craters
 * @returns {number} The height at the given direction
 */
export function getHeightAt(
  direction: THREE.Vector3,
  noise: SimplexNoise,
  craters: Crater[]
): number {
  const normalizedDir = direction.clone().normalize();
  const elevation = getElevationAtDirection(normalizedDir, noise, craters);
  return PLANET_CONFIG.RADIUS + elevation;
}

/**
 * Gets the slope angle at a specific direction from planet center
 * @param {THREE.Vector3} direction - The direction vector
 * @param {SimplexNoise} noise - The noise generator
 * @param {Crater[]} craters - Array of craters
 * @returns {number} The slope at the given direction
 */
export function getSlopeAt(
  direction: THREE.Vector3,
  noise: SimplexNoise,
  craters: Crater[]
): number {
  return calculateSlopeAtDirection(direction.clone().normalize(), noise, craters);
}

/**
 * Gets elevation at a specific normalized direction
 * @param {THREE.Vector3} direction - The normalized direction vector
 * @param {SimplexNoise} noise - The noise generator
 * @param {Crater[]} craters - Array of craters
 * @returns {number} The elevation at the given direction
 */
export function getElevationAtDirection(
  direction: THREE.Vector3,
  noise: SimplexNoise,
  craters: Crater[]
): number {
  const { x, y, z } = direction;

  // Base noise value (large scale)
  let elevation = getTerrainNoise(x, y, z, noise);

  // Apply crater modifications
  if (craters && craters.length > 0) {
    elevation += getCraterInfluence(direction, craters);
  }

  return elevation * TERRAIN_CONFIG.HEIGHT_SCALE * PLANET_CONFIG.RADIUS;
}

/**
 * Calculate the slope at a specific direction
 * @param {THREE.Vector3} dir - The normalized direction vector
 * @param {SimplexNoise} noise - The noise generator
 * @param {Crater[]} craters - Array of craters
 * @returns {number} The slope as a ratio (rise/run)
 */
export function calculateSlopeAtDirection(
  dir: THREE.Vector3,
  noise: SimplexNoise,
  craters: Crater[]
): number {
  const p1 = dir.clone();
  const step = 0.01;

  // Create a point slightly offset from the original
  const p2 = new THREE.Vector3(p1.x + step, p1.y + step, p1.z).normalize();

  // Compare elevations to get slope
  const e1 = getElevationAtDirection(p1, noise, craters);
  const e2 = getElevationAtDirection(p2, noise, craters);

  // Return slope as a ratio (rise/run)
  const slope = Math.abs(e2 - e1) / step;
  return slope;
}

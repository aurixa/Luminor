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
import { Crater, Planet } from '../types';

/**
 * Gets terrain noise at a specific position
 */
function getTerrainNoise(x: number, y: number, z: number, noise: SimplexNoise): number {
  const scale = PLANET_CONFIG.TERRAIN_SCALE;

  // Normalize the input coordinates
  const length = Math.sqrt(x * x + y * y + z * z);
  const nx = x / length;
  const ny = y / length;
  const nz = z / length;

  let totalNoise = 0;
  let amplitude = 1.0;
  let frequency = scale;
  let maxValue = 0;

  // Reduced to 3 octaves for better performance while maintaining detail
  for (let i = 0; i < 3; i++) {
    const noiseValue = noise.noise3d(nx * frequency, ny * frequency, nz * frequency);
    totalNoise += noiseValue * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  // Normalize the combined noise
  totalNoise /= maxValue;

  // Simplified ridge noise calculation
  const ridgeNoise = Math.abs(noise.noise3d(nx * scale * 1.5, ny * scale * 1.5, nz * scale * 1.5));
  const sharpRidge = ridgeNoise * ridgeNoise * 0.5;

  // Use pre-calculated blend factor
  const blendFactor = 0.3;
  const finalNoise = totalNoise * (1 - blendFactor) + sharpRidge * blendFactor;

  // Clamp to reasonable range (-1 to 1)
  return Math.max(-1, Math.min(1, finalNoise));
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
 * Create a planet with terrain and craters
 */
export function createPlanet(scene: THREE.Scene): Planet {
  console.log('Creating planet with radius:', PLANET_CONFIG.RADIUS);

  // Create noise generator
  const noise = new SimplexNoise();

  // Generate craters
  const craters = generateCraters();

  // Generate planet geometry
  console.log('Generating planet geometry...');
  const { geometry } = generatePlanetGeometry(noise, craters);

  // Create planet mesh with material
  console.log('Creating planet mesh with material...');
  const material = createTerrainMaterial();

  // Ensure material is visible
  material.visible = true;
  material.needsUpdate = true;

  // Create the planet mesh
  const planetMesh = new THREE.Mesh(geometry, material);
  planetMesh.castShadow = true;
  planetMesh.receiveShadow = true;

  // Verify scale and position
  planetMesh.scale.set(1, 1, 1); // Ensure no accidental scaling
  planetMesh.position.set(0, 0, 0); // Ensure centered at origin

  // Debug properties
  planetMesh.userData = {
    isLuminorPlanet: true,
    radius: PLANET_CONFIG.RADIUS,
    resolution: PLANET_CONFIG.RESOLUTION,
    vertexCount: geometry.attributes.position.count
  };

  // Add to scene - explicitly specified
  console.log('Adding planet to scene with properties:', {
    position: planetMesh.position,
    scale: planetMesh.scale,
    radius: PLANET_CONFIG.RADIUS,
    vertexCount: geometry.attributes.position.count,
    boundingSphere: geometry.boundingSphere
  });
  scene.add(planetMesh);

  // Add debug sphere to visualize coordinate system
  const debugSphereGeometry = new THREE.SphereGeometry(50, 16, 16);
  const debugSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  const debugSphere = new THREE.Mesh(debugSphereGeometry, debugSphereMaterial);
  debugSphere.position.set(0, 2000, 0); // Place it at a known position
  scene.add(debugSphere);
  console.log('Added debug sphere at Y=2000');

  // Add coordinate axes for debugging
  const axesHelper = new THREE.AxesHelper(2000);
  scene.add(axesHelper);
  console.log('Added axes helper');

  // Return planet interface
  return {
    mesh: planetMesh,
    radius: PLANET_CONFIG.RADIUS,
    getNearestPointOnSurface: (point: THREE.Vector3) => {
      if (!point || !(point instanceof THREE.Vector3)) {
        console.error('Invalid point provided to getNearestPointOnSurface:', point);
        return new THREE.Vector3(0, PLANET_CONFIG.RADIUS, 0);
      }

      const direction = point.clone().normalize();
      if (isNaN(direction.length())) {
        console.error('Invalid direction vector in getNearestPointOnSurface:', direction);
        return new THREE.Vector3(0, PLANET_CONFIG.RADIUS, 0);
      }

      // Get the surface point from the geometry using raycasting
      const raycaster = new THREE.Raycaster();
      raycaster.set(new THREE.Vector3(0, 0, 0), direction);

      try {
        const intersects = raycaster.intersectObject(planetMesh);

        if (intersects.length > 0) {
          const intersectionPoint = intersects[0].point;

          // Validate the intersection point
          if (isNaN(intersectionPoint.length())) {
            console.error('Invalid intersection point:', intersectionPoint);
            return direction.multiplyScalar(PLANET_CONFIG.RADIUS);
          }

          // Ensure point is not too far from expected radius
          const distance = intersectionPoint.length();
          const maxRadius = PLANET_CONFIG.RADIUS * (1 + TERRAIN_CONFIG.HEIGHT_SCALE);
          const minRadius = PLANET_CONFIG.RADIUS * (1 - TERRAIN_CONFIG.HEIGHT_SCALE);

          if (distance > maxRadius || distance < minRadius) {
            console.warn(
              `Surface point distance (${distance.toFixed(2)}) outside expected range [${minRadius.toFixed(2)}, ${maxRadius.toFixed(2)}]`
            );
            return direction.multiplyScalar(PLANET_CONFIG.RADIUS);
          }

          return intersectionPoint;
        }
      } catch (error) {
        console.error('Error in raycasting:', error);
      }

      // Fallback to base radius if no valid intersection
      console.warn('Using fallback radius for surface point');
      return direction.multiplyScalar(PLANET_CONFIG.RADIUS);
    },
    raycast: (raycaster: THREE.Raycaster) => {
      // Return the actual intersections from the planet mesh
      return raycaster.intersectObject(planetMesh);
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

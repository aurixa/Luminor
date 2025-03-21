/**
 * Luminor
 * Planet terrain generation module
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { PLANET_CONFIG, TERRAIN_CONFIG } from '../utils/constants';
import { getCraterInfluence, Crater } from './craterGeneration';

interface PlanetGeometry {
  geometry: THREE.BufferGeometry;
  positions: THREE.Float32BufferAttribute;
}

/**
 * Generate the planet geometry with terrain features
 * @param {SimplexNoise} noise - The noise generator
 * @param {Crater[]} craters - Array of craters to apply
 * @returns {PlanetGeometry} Object containing the geometry and positions
 */
export function generatePlanetGeometry(noise: SimplexNoise, craters: Crater[]): PlanetGeometry {
  console.log(
    'Generating planet geometry with radius:',
    PLANET_CONFIG.RADIUS,
    'and resolution:',
    PLANET_CONFIG.RESOLUTION
  );

  // Validate configuration
  if (PLANET_CONFIG.RADIUS <= 0) {
    throw new Error(`Invalid planet radius: ${PLANET_CONFIG.RADIUS}`);
  }
  if (PLANET_CONFIG.RESOLUTION < 32) {
    throw new Error(`Resolution too low: ${PLANET_CONFIG.RESOLUTION}, minimum is 32`);
  }

  // Create basic sphere geometry with higher resolution
  const geometry = new THREE.SphereGeometry(
    PLANET_CONFIG.RADIUS,
    PLANET_CONFIG.RESOLUTION,
    PLANET_CONFIG.RESOLUTION,
    0, // phiStart
    Math.PI * 2, // phiLength
    0, // thetaStart
    Math.PI // thetaLength
  );

  // Get position attribute for manipulation
  const positions = geometry.attributes.position as THREE.Float32BufferAttribute;
  const normals = geometry.attributes.normal as THREE.Float32BufferAttribute;

  console.log('Applying terrain features to', positions.count, 'vertices');

  // Track modifications for validation
  let maxElevation = 0;
  let minElevation = 0;

  // Apply terrain features to each vertex
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Skip invalid vertices
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      console.error(`Invalid vertex ${i}: (${x}, ${y}, ${z})`);
      continue;
    }

    // Calculate normalized direction from center
    const direction = new THREE.Vector3(x, y, z).normalize();
    if (isNaN(direction.length())) {
      console.error(`Invalid direction for vertex ${i}`);
      continue;
    }

    // Get base elevation from noise
    const elevation = getTerrainNoise(direction.x, direction.y, direction.z, noise);

    // Apply crater modifications if applicable
    let totalElevation = elevation;
    if (craters && craters.length > 0) {
      const craterInfluence = getCraterInfluence(direction, craters) / PLANET_CONFIG.RADIUS;
      totalElevation = Math.max(-0.5, Math.min(0.5, elevation + craterInfluence));
    }

    // Scale the elevation and apply to the vertex
    const scaledElevation = totalElevation * TERRAIN_CONFIG.HEIGHT_SCALE * PLANET_CONFIG.RADIUS;
    const finalRadius = PLANET_CONFIG.RADIUS + scaledElevation;

    // Track elevation range
    maxElevation = Math.max(maxElevation, scaledElevation);
    minElevation = Math.min(minElevation, scaledElevation);

    // Set the new position
    const newPos = direction.multiplyScalar(finalRadius);
    if (isNaN(newPos.length())) {
      console.error(`Invalid new position for vertex ${i}`);
      continue;
    }
    positions.setXYZ(i, newPos.x, newPos.y, newPos.z);

    // Update normal to point outward from center
    normals.setXYZ(i, direction.x, direction.y, direction.z);
  }

  // Validate elevation range
  const expectedMaxElevation = PLANET_CONFIG.RADIUS * TERRAIN_CONFIG.HEIGHT_SCALE;
  if (
    Math.abs(maxElevation) > expectedMaxElevation ||
    Math.abs(minElevation) > expectedMaxElevation
  ) {
    console.warn(
      `Elevation range [${minElevation.toFixed(2)}, ${maxElevation.toFixed(2)}] exceeds expected range [${-expectedMaxElevation.toFixed(2)}, ${expectedMaxElevation.toFixed(2)}]`
    );
  }

  // Ensure geometry is properly updated
  positions.needsUpdate = true;
  normals.needsUpdate = true;

  // Compute vertex normals for smooth shading
  geometry.computeVertexNormals();

  // Add texture coordinates based on position
  generateTextureCoordinates(geometry, positions);

  // Mark geometry for update
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  // Validate final geometry
  if (!geometry.boundingSphere) {
    console.error('Failed to compute bounding sphere');
  } else {
    const sphereRadius = geometry.boundingSphere.radius;
    const expectedMaxRadius = PLANET_CONFIG.RADIUS * (1 + TERRAIN_CONFIG.HEIGHT_SCALE);
    if (sphereRadius > expectedMaxRadius) {
      console.warn(
        `Bounding sphere radius (${sphereRadius.toFixed(2)}) exceeds expected maximum (${expectedMaxRadius.toFixed(2)})`
      );
    }
  }

  console.log('Planet geometry generated successfully');
  return { geometry, positions };
}

/**
 * Generate texture coordinates for the planet
 * @param {THREE.BufferGeometry} geometry - The planet geometry
 * @param {THREE.Float32BufferAttribute} positions - The position attribute
 */
function generateTextureCoordinates(
  geometry: THREE.BufferGeometry,
  positions: THREE.Float32BufferAttribute
): void {
  const uvs = new Float32Array(positions.count * 2);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Calculate normalized direction
    const direction = new THREE.Vector3(x, y, z).normalize();

    // Convert direction to spherical coordinates
    const phi = Math.atan2(direction.z, direction.x);
    const theta = Math.acos(direction.y);

    // Map spherical coordinates to UV space
    const u = phi / (2 * Math.PI) + 0.5;
    const v = theta / Math.PI;

    // Set UVs
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }

  // Add UV attribute to geometry
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
}

/**
 * Calculate terrain noise at a given position
 */
export function getTerrainNoise(x: number, y: number, z: number, noise: SimplexNoise): number {
  const scale = PLANET_CONFIG.TERRAIN_SCALE;

  // Normalize the input coordinates
  const length = Math.sqrt(x * x + y * y + z * z);
  const nx = x / length;
  const ny = y / length;
  const nz = z / length;

  // Get base noise
  const baseNoise = noise.noise3d(nx * scale, ny * scale, nz * scale);

  // Get detail noise at double frequency but half amplitude
  const detailNoise = noise.noise3d(nx * scale * 2, ny * scale * 2, nz * scale * 2) * 0.5;

  // Combine and clamp to reasonable range (-1 to 1)
  const combinedNoise = (baseNoise + detailNoise) * 0.5;
  return Math.max(-1, Math.min(1, combinedNoise));
}

/**
 * Calculate octave noise at a given position and frequency
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @param {number} frequency - The noise frequency
 * @param {SimplexNoise} noise - The noise generator
 * @returns {number} The octave noise value
 */
function getOctaveNoise(
  x: number,
  y: number,
  z: number,
  frequency: number,
  noise: SimplexNoise
): number {
  // Basic 3D simplex noise
  const noiseValue = noise.noise3d(x * frequency, y * frequency, z * frequency);

  // Transformations to make the terrain more interesting
  return noiseValue;
}

/**
 * Helper function to smooth step a value between edge0 and edge1
 * @param {number} edge0 - Lower edge of the transition
 * @param {number} edge1 - Upper edge of the transition
 * @param {number} x - The value to smooth step
 * @returns {number} The smoothed value
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

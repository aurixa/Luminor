/**
 * Luminor
 * Core planet creation module
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { PLANET_CONFIG, TERRAIN_CONFIG } from '../utils/constants.js';
import { generatePlanetGeometry, getTerrainNoise } from './terrainGeneration.js';
import { generateCraters, getCraterInfluence } from './craterGeneration.js';
import { generatePlanetTextures } from './textureGeneration.js';

/**
 * Creates the planet and adds it to the scene
 */
export function createPlanet(scene) {
    // Create planet geometry with terrain features
    const noise = new SimplexNoise();
    const craters = generateCraters();
    const { geometry, positions } = generatePlanetGeometry(noise, craters);
    
    // Generate textures
    const { diffuseMap, normalMap } = generatePlanetTextures(noise);
    
    // Create material with textures
    const material = new THREE.MeshStandardMaterial({
        map: diffuseMap,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.85,
        metalness: 0.0,
    });
    
    // Create mesh and add to scene
    const planet = new THREE.Mesh(geometry, material);
    scene.add(planet);
    
    // Add utilities to planet object
    planet.radius = PLANET_CONFIG.RADIUS;
    planet.getHeightAt = (direction) => getHeightAt(direction, noise, craters);
    planet.getSlopeAt = (direction) => getSlopeAt(direction, noise, craters);
    
    // Add getNearestPointOnSurface function
    planet.getNearestPointOnSurface = (point) => {
        // Get direction from planet center to point
        const direction = point.clone().normalize();
        
        // Get height at this direction
        const height = getHeightAt(direction, noise, craters);
        
        // Return position on surface
        return direction.multiplyScalar(height);
    };
    
    return planet;
}

/**
 * Gets the height at a specific direction from planet center
 */
export function getHeightAt(direction, noise, craters) {
    const normalizedDir = direction.clone().normalize();
    const elevation = getElevationAtDirection(normalizedDir, noise, craters);
    return PLANET_CONFIG.RADIUS + elevation;
}

/**
 * Gets the slope angle at a specific direction from planet center
 */
export function getSlopeAt(direction, noise, craters) {
    return calculateSlopeAtDirection(direction.clone().normalize(), noise, craters);
}

/**
 * Gets elevation at a specific normalized direction
 */
export function getElevationAtDirection(direction, noise, craters) {
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
 */
export function calculateSlopeAtDirection(dir, noise, craters) {
    const p1 = dir.clone();
    const step = 0.01;
    
    // Create a point slightly offset from the original
    const p2 = new THREE.Vector3(
        p1.x + step,
        p1.y + step,
        p1.z
    ).normalize();
    
    // Compare elevations to get slope
    const e1 = getElevationAtDirection(p1, noise, craters);
    const e2 = getElevationAtDirection(p2, noise, craters);
    
    // Return slope as a ratio (rise/run)
    const slope = Math.abs(e2 - e1) / step;
    return slope;
} 
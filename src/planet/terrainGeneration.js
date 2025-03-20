/**
 * Luminor
 * Planet terrain generation module
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { PLANET_CONFIG, TERRAIN_CONFIG } from '../utils/constants.js';
import { getCraterInfluence } from './craterGeneration.js';

/**
 * Generate the planet geometry with terrain features
 */
export function generatePlanetGeometry(noise, craters) {
    // Create basic sphere geometry
    const geometry = new THREE.SphereGeometry(
        PLANET_CONFIG.RADIUS, 
        PLANET_CONFIG.RESOLUTION, 
        PLANET_CONFIG.RESOLUTION
    );
    
    // Get position attribute for manipulation
    const positions = geometry.attributes.position;
    
    // Apply terrain features to each vertex
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Calculate normalized direction from center
        const direction = new THREE.Vector3(x, y, z).normalize();
        
        // Get elevation at this direction
        const elevation = getTerrainNoise(direction.x, direction.y, direction.z, noise);
        
        // Apply crater modifications if applicable
        let totalElevation = elevation;
        if (craters && craters.length > 0) {
            totalElevation += getCraterInfluence(direction, craters) / PLANET_CONFIG.RADIUS;
        }
        
        // Scale the elevation and apply to the vertex
        const scaledElevation = totalElevation * TERRAIN_CONFIG.HEIGHT_SCALE * PLANET_CONFIG.RADIUS;
        const scaleFactor = (PLANET_CONFIG.RADIUS + scaledElevation) / PLANET_CONFIG.RADIUS;
        
        // Set the new position
        positions.setX(i, x * scaleFactor);
        positions.setY(i, y * scaleFactor);
        positions.setZ(i, z * scaleFactor);
    }
    
    // Update normals
    geometry.computeVertexNormals();
    
    // Add texture coordinates based on position
    generateTextureCoordinates(geometry, positions);
    
    return { geometry, positions };
}

/**
 * Generate texture coordinates for the planet
 */
function generateTextureCoordinates(geometry, positions) {
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
        const u = (phi / (2 * Math.PI)) + 0.5;
        const v = theta / Math.PI;
        
        // Set UVs
        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
    }
    
    // Add UV attribute to geometry
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

/**
 * Calculate terrain noise at a given position
 */
export function getTerrainNoise(x, y, z, noise) {
    // Apply multiple octaves of noise with different frequencies and influences
    let totalNoise = 0;
    
    // Large scale features (major terrain undulations)
    totalNoise += getOctaveNoise(
        x, y, z, 
        TERRAIN_CONFIG.LARGE_SCALE.FREQUENCY, 
        noise
    ) * TERRAIN_CONFIG.LARGE_SCALE.INFLUENCE;
    
    // Medium scale features
    totalNoise += getOctaveNoise(
        x, y, z, 
        TERRAIN_CONFIG.MEDIUM_SCALE.FREQUENCY, 
        noise
    ) * TERRAIN_CONFIG.MEDIUM_SCALE.INFLUENCE;
    
    // Small scale features
    totalNoise += getOctaveNoise(
        x, y, z, 
        TERRAIN_CONFIG.SMALL_SCALE.FREQUENCY, 
        noise
    ) * TERRAIN_CONFIG.SMALL_SCALE.INFLUENCE;
    
    return totalNoise;
}

/**
 * Calculate octave noise at a given position and frequency
 */
function getOctaveNoise(x, y, z, frequency, noise) {
    // Basic 3D simplex noise
    const noiseValue = noise.noise3d(
        x * frequency, 
        y * frequency, 
        z * frequency
    );
    
    // Transformations to make the terrain more interesting
    return noiseValue;
}

/**
 * Helper function to smooth step a value between edge0 and edge1
 */
export function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
} 
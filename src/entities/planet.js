/**
 * Luminor
 * Planet generation and terrain system
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { createTerrainMaterial } from '../rendering/terrainMaterial.js';
import { PLANET_CONFIG } from '../utils/constants.js';

// Cache for elevation lookup
const elevationCache = new Map();
let noise = null;
let craters = null;

/**
 * Create the planet with procedural terrain
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} The planet object with methods for terrain access
 */
export function createPlanet(scene) {
    // Create a new SimplexNoise instance for terrain generation
    noise = new SimplexNoise();
    
    // Generate random craters
    craters = generateCraters(PLANET_CONFIG.CRATER_COUNT);
    
    // Create the planet geometry
    const geometry = new THREE.SphereGeometry(
        PLANET_CONFIG.RADIUS, 
        PLANET_CONFIG.RESOLUTION, 
        PLANET_CONFIG.RESOLUTION
    );
    
    // Apply terrain displacement to the geometry
    applyTerrainDisplacement(geometry, noise, craters);
    
    // Create the planet material
    const material = createTerrainMaterial();
    
    // Create the planet mesh
    const planetMesh = new THREE.Mesh(geometry, material);
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    scene.add(planetMesh);
    
    // Return the planet object with useful methods
    return {
        mesh: planetMesh,
        radius: PLANET_CONFIG.RADIUS,
        
        // Get surface position at a given direction
        getNearestPointOnSurface(direction) {
            // Normalize the direction vector
            const normalizedDir = direction.clone().normalize();
            
            // Get the elevation at this point
            const elevation = getElevationAtDirection(normalizedDir, noise, craters);
            
            // Return position on terrain surface
            return normalizedDir.multiplyScalar(PLANET_CONFIG.RADIUS + elevation);
        },
        
        // Get elevation at a specific point
        getElevationAtPoint(point) {
            // Convert point to direction from center
            const direction = point.clone().normalize();
            
            // Get the elevation
            return getElevationAtDirection(direction, noise, craters);
        },
        
        // Get normal vector at a specific point
        getNormalAtPoint(point) {
            // Convert point to direction from center
            const direction = point.clone().normalize();
            
            // Calculate normal using central differences
            const epsilon = 0.001;
            const tangentU = new THREE.Vector3(
                -direction.z, 
                0, 
                direction.x
            ).normalize();
            
            const tangentV = new THREE.Vector3().crossVectors(direction, tangentU);
            
            const posU = direction.clone().add(tangentU.clone().multiplyScalar(epsilon));
            const negU = direction.clone().sub(tangentU.clone().multiplyScalar(epsilon));
            const posV = direction.clone().add(tangentV.clone().multiplyScalar(epsilon));
            const negV = direction.clone().sub(tangentV.clone().multiplyScalar(epsilon));
            
            const elevCenter = getElevationAtDirection(direction, noise, craters);
            const elevPosU = getElevationAtDirection(posU, noise, craters);
            const elevNegU = getElevationAtDirection(negU, noise, craters);
            const elevPosV = getElevationAtDirection(posV, noise, craters);
            const elevNegV = getElevationAtDirection(negV, noise, craters);
            
            const gradU = (elevPosU - elevNegU) / (2 * epsilon);
            const gradV = (elevPosV - elevNegV) / (2 * epsilon);
            
            // Calculate normal using cross product of tangent vectors
            const surfaceNormal = new THREE.Vector3().crossVectors(
                tangentU.clone().multiplyScalar(gradU),
                tangentV.clone().multiplyScalar(gradV)
            );
            
            // The normal should point outward from the planet center
            surfaceNormal.add(direction);
            surfaceNormal.normalize();
            
            return surfaceNormal;
        }
    };
}

/**
 * Apply terrain displacement to the geometry
 * @param {THREE.BufferGeometry} geometry - The sphere geometry
 * @param {SimplexNoise} noise - The noise generator
 * @param {Array} craters - The crater definitions
 */
function applyTerrainDisplacement(geometry, noise, craters) {
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal.array;
    const uvs = geometry.attributes.uv.array;
    
    // For storing new vertex data
    const newPositions = new Float32Array(positions.length);
    const newNormals = new Float32Array(normals.length);
    
    // Process each vertex
    for (let i = 0; i < positions.length; i += 3) {
        // Get the vertex position
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        // Create a direction vector from the center to this vertex
        const direction = new THREE.Vector3(x, y, z).normalize();
        
        // Get the elevation at this point
        const elevation = getElevationAtDirection(direction, noise, craters);
        
        // Apply the elevation to the vertex
        const newPosition = direction.multiplyScalar(PLANET_CONFIG.RADIUS + elevation);
        newPositions[i] = newPosition.x;
        newPositions[i + 1] = newPosition.y;
        newPositions[i + 2] = newPosition.z;
        
        // Update the normal - will be recalculated by Three.js
        newNormals[i] = direction.x;
        newNormals[i + 1] = direction.y;
        newNormals[i + 2] = direction.z;
    }
    
    // Update the geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(newNormals, 3));
    
    // Compute vertex normals to smooth the terrain
    geometry.computeVertexNormals();
}

/**
 * Calculate the elevation at a specific direction on the planet
 * @param {THREE.Vector3} direction - Normalized direction from planet center
 * @param {SimplexNoise} noise - The noise generator
 * @param {Array} craters - The crater definitions
 * @returns {number} The elevation value
 */
function getElevationAtDirection(direction, noise, craters) {
    // Create a cache key
    const cacheKey = `${direction.x.toFixed(4)},${direction.y.toFixed(4)},${direction.z.toFixed(4)}`;
    
    // Check if we've already calculated this elevation
    if (elevationCache.has(cacheKey)) {
        return elevationCache.get(cacheKey);
    }
    
    // Calculate the noise value at this point
    const noiseValue = calculateTerrainNoise(direction, noise);
    
    // Apply crater effects
    let craterDepth = 0;
    for (const crater of craters) {
        // Calculate the distance from the crater center to this point
        const dotProduct = direction.dot(crater.position);
        
        // If this point is within the crater's affected area
        if (dotProduct > crater.cosRadius) {
            // Calculate a normalized distance from center to rim (0 at center, 1 at rim)
            const t = (dotProduct - crater.cosRadius) / (1 - crater.cosRadius);
            
            // Create a crater shape (deeper at center, rising toward rim)
            // Using a modified cosine function for smooth transition
            const craterShape = (1 - Math.cos(t * Math.PI)) * 0.5;
            
            // Apply crater depth based on size
            craterDepth = Math.max(craterDepth, craterShape * crater.depth);
        }
    }
    
    // Combine noise and crater effects
    let elevation = noiseValue * PLANET_CONFIG.TERRAIN.heightScale - craterDepth;
    
    // Apply smoothstep for more rounded hills
    elevation = elevation < 0 ? elevation : elevation * (0.5 + 0.5 * smoothstep(elevation / 20));
    
    // Store in cache for future lookups
    elevationCache.set(cacheKey, elevation);
    
    return elevation;
}

/**
 * Calculate multi-layer noise for terrain
 * @param {THREE.Vector3} direction - The direction from planet center
 * @param {SimplexNoise} noise - The noise generator
 * @returns {number} Combined noise value
 */
function calculateTerrainNoise(direction, noise) {
    const terrain = PLANET_CONFIG.TERRAIN;
    const { x, y, z } = direction;
    
    // Base noise layer
    let noiseSum = noise.noise3d(
        x * terrain.baseFrequency, 
        y * terrain.baseFrequency, 
        z * terrain.baseFrequency
    );
    
    // Large scale undulations
    if (terrain.largeScale) {
        const largeNoise = noise.noise3d(
            x * terrain.largeScale.frequency, 
            y * terrain.largeScale.frequency, 
            z * terrain.largeScale.frequency
        );
        noiseSum += largeNoise * terrain.largeScale.influence;
    }
    
    // Medium scale features
    if (terrain.mediumScale) {
        const medNoise = noise.noise3d(
            x * terrain.mediumScale.frequency, 
            y * terrain.mediumScale.frequency, 
            z * terrain.mediumScale.frequency
        );
        noiseSum += medNoise * terrain.mediumScale.influence;
    }
    
    // Small scale details using multiple octaves
    if (terrain.smallScale) {
        let smallDetails = 0;
        let amplitude = 1.0;
        let frequency = terrain.smallScale.frequency;
        
        for (let i = 0; i < terrain.smallScale.octaves; i++) {
            smallDetails += amplitude * noise.noise3d(
                x * frequency, 
                y * frequency, 
                z * frequency
            );
            
            amplitude *= terrain.smallScale.persistence;
            frequency *= 2;
        }
        
        noiseSum += smallDetails * terrain.smallScale.influence;
    }
    
    // Ridge noise for ridges and valleys
    if (terrain.ridges && terrain.ridges.enabled) {
        const ridgeNoise = 1.0 - Math.abs(noise.noise3d(
            x * terrain.ridges.frequency, 
            y * terrain.ridges.frequency, 
            z * terrain.ridges.frequency
        ));
        
        // Apply power to create sharper ridges
        const ridgeValue = Math.pow(ridgeNoise, terrain.ridges.sharpness);
        noiseSum += ridgeValue * terrain.ridges.influence;
    }
    
    // Valley noise
    if (terrain.valleys && terrain.valleys.enabled) {
        const valleyNoise = noise.noise3d(
            x * terrain.valleys.frequency, 
            y * terrain.valleys.frequency, 
            z * terrain.valleys.frequency
        );
        
        // Only add valleys where noise is negative
        if (valleyNoise < 0) {
            noiseSum += valleyNoise * valleyNoise * terrain.valleys.influence;
        }
    }
    
    return noiseSum;
}

/**
 * Smoothstep function for smoother terrain
 * @param {number} x - Input value
 * @returns {number} Smoothed value
 */
function smoothstep(x) {
    // Clamp input to 0..1 range
    x = Math.max(0, Math.min(1, x));
    // Apply smoothstep formula: 3x^2 - 2x^3
    return x * x * (3 - 2 * x);
}

/**
 * Generate random craters on the planet
 * @param {number} count - Number of craters to generate
 * @returns {Array} Array of crater objects
 */
function generateCraters(count) {
    const craters = [];
    
    for (let i = 0; i < count; i++) {
        // Random position on sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(Math.random() * 2 - 1);
        
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(theta);
        
        // Random crater size and depth
        const size = PLANET_CONFIG.CRATER_MIN_SIZE + 
            Math.random() * (PLANET_CONFIG.CRATER_MAX_SIZE - PLANET_CONFIG.CRATER_MIN_SIZE);
        
        const depth = size * (0.1 + Math.random() * 0.2);
        
        // Calculate the cosine of the crater radius angle for efficient comparison
        const craterAngle = size / PLANET_CONFIG.RADIUS;
        const cosRadius = Math.cos(craterAngle);
        
        craters.push({
            position: new THREE.Vector3(x, y, z),
            size,
            depth,
            cosRadius
        });
    }
    
    return craters;
} 
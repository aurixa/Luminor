/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

// Planet configuration
const PLANET_RADIUS = 10;
const PLANET_RESOLUTION = 64; // Higher resolution for better looking terrain
const TERRAIN_ROUGHNESS = 0.15; // Controls height of terrain features
const SEA_LEVEL = 0.3; // Determines sea level height

/**
 * Create the planet geometry, material, and mesh
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} The planet object with properties and methods
 */
export function createPlanet(scene) {
    // Create a simplex noise generator for our terrain
    const noise = new SimplexNoise();
    
    // Create a sphere geometry with high resolution
    const geometry = new THREE.SphereGeometry(PLANET_RADIUS, PLANET_RESOLUTION, PLANET_RESOLUTION);
    
    // Apply terrain displacement to the geometry
    applyTerrainDisplacement(geometry, noise);
    
    // Create the planet material
    const material = createPlanetMaterial();
    
    // Create the planet mesh
    const planetMesh = new THREE.Mesh(geometry, material);
    scene.add(planetMesh);
    
    // Add atmosphere effect
    const atmosphere = createAtmosphere();
    scene.add(atmosphere);
    
    // Return the planet object
    return {
        mesh: planetMesh,
        radius: PLANET_RADIUS,
        
        // Get the nearest point on the planet's surface from a given point
        getNearestPointOnSurface: function(point) {
            // Get the direction from the center to the point
            const direction = point.clone().normalize();
            
            // Get elevation at this point on the planet
            const elevation = getElevationAtDirection(direction, noise);
            
            // Calculate the final radius including terrain displacement
            const finalRadius = PLANET_RADIUS + elevation;
            
            // Return the point on the surface
            return direction.multiplyScalar(finalRadius);
        }
    };
}

/**
 * Apply terrain displacement to the sphere geometry
 */
function applyTerrainDisplacement(geometry, noise) {
    // Get the vertices from the geometry
    const positions = geometry.attributes.position;
    
    // Create a new array for storing colors
    const colorArray = new Float32Array(positions.count * 3);
    const colorAttribute = new THREE.BufferAttribute(colorArray, 3);
    
    // Iterate through all vertices
    for (let i = 0; i < positions.count; i++) {
        // Get the vertex position
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Normalize to get the direction
        const direction = new THREE.Vector3(x, y, z).normalize();
        
        // Get elevation at this point
        const elevation = getElevationAtDirection(direction, noise);
        
        // Apply displacement to the vertex
        const displacedPosition = direction.multiplyScalar(PLANET_RADIUS + elevation);
        positions.setXYZ(i, displacedPosition.x, displacedPosition.y, displacedPosition.z);
        
        // Determine color based on elevation
        if (elevation < -SEA_LEVEL * 0.8) {
            // Deep ocean
            colorArray[i * 3] = 0.0;
            colorArray[i * 3 + 1] = 0.0;
            colorArray[i * 3 + 2] = 0.5;
        } else if (elevation < -SEA_LEVEL * 0.3) {
            // Shallow ocean
            colorArray[i * 3] = 0.0;
            colorArray[i * 3 + 1] = 0.2;
            colorArray[i * 3 + 2] = 0.6;
        } else if (elevation < SEA_LEVEL * 0.1) {
            // Beaches
            colorArray[i * 3] = 0.9;
            colorArray[i * 3 + 1] = 0.8;
            colorArray[i * 3 + 2] = 0.5;
        } else if (elevation < SEA_LEVEL * 0.5) {
            // Lowlands/grasslands
            colorArray[i * 3] = 0.0;
            colorArray[i * 3 + 1] = 0.5;
            colorArray[i * 3 + 2] = 0.0;
        } else if (elevation < SEA_LEVEL * 0.8) {
            // Hills
            colorArray[i * 3] = 0.2;
            colorArray[i * 3 + 1] = 0.4;
            colorArray[i * 3 + 2] = 0.0;
        } else {
            // Mountains
            const t = (elevation - SEA_LEVEL * 0.8) / (TERRAIN_ROUGHNESS - SEA_LEVEL * 0.8);
            colorArray[i * 3] = 0.5 + 0.5 * t;  // More white as height increases (snow)
            colorArray[i * 3 + 1] = 0.5 + 0.5 * t;
            colorArray[i * 3 + 2] = 0.5 + 0.5 * t;
        }
    }
    
    // Add the color attribute to the geometry
    geometry.setAttribute('color', colorAttribute);
    
    // Calculate normals for proper lighting
    geometry.computeVertexNormals();
}

/**
 * Get the terrain elevation at a specific direction from the planet center
 */
function getElevationAtDirection(direction, noise) {
    // Extract coordinates
    const { x, y, z } = direction;
    
    // Apply multiple octaves of noise for more interesting terrain
    let elevation = 0;
    let frequency = 1;
    let amplitude = 1;
    const octaves = 4;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
        // Get noise value at this frequency
        const noiseValue = noise.noise3d(x * frequency, y * frequency, z * frequency);
        
        // Add to elevation
        elevation += noiseValue * amplitude;
        
        // Keep track of max possible value for normalization
        maxValue += amplitude;
        
        // Prepare for next octave
        amplitude *= 0.5;
        frequency *= 2;
    }
    
    // Normalize elevation to range [-1, 1]
    elevation /= maxValue;
    
    // Apply terrain roughness
    return elevation * TERRAIN_ROUGHNESS;
}

/**
 * Create the material for the planet
 */
function createPlanetMaterial() {
    // Create a material that uses vertex colors
    return new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: false,  // Smooth shading
        roughness: 0.8,
        metalness: 0.1,
    });
}

/**
 * Create a simple atmosphere effect around the planet
 */
function createAtmosphere() {
    // Slightly larger than the planet
    const atmosphereGeometry = new THREE.SphereGeometry(PLANET_RADIUS * 1.025, 32, 32);
    
    // Semi-transparent blue material
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide  // Render inside of the sphere
    });
    
    return new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
} 
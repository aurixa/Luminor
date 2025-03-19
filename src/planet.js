/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

// Planet configuration
const PLANET_RADIUS = 800; // Doubled from 200 to 400
const PLANET_RESOLUTION = 164; // Higher resolution for smoother terrain features
const TERRAIN_ROUGHNESS = 0.6; // Slightly reduced for smoother undulations
const CRATER_COUNT = 80; // Fewer but larger craters
const CRATER_MIN_SIZE = 8; // Larger minimum crater size
const CRATER_MAX_SIZE = 25; // Larger maximum crater size
const BASE_FREQUENCY = 0.4; // Lower frequency for wider undulations

/**
 * Create the planet geometry, material, and mesh
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} The planet object with properties and methods
 */
export function createPlanet(scene) {
    // Create a simplex noise generator for terrain
    const noise = new SimplexNoise();
    
    // Create a sphere geometry with high resolution
    const geometry = new THREE.SphereGeometry(PLANET_RADIUS, PLANET_RESOLUTION, PLANET_RESOLUTION);
    
    // Generate craters and store them for later use
    const craters = generateCraters(CRATER_COUNT);
    
    // Apply terrain displacement to the geometry
    applyTerrainDisplacement(geometry, noise, craters);
    
    // Create the planet material
    const material = createPlanetMaterial();
    
    // Create the planet mesh
    const planetMesh = new THREE.Mesh(geometry, material);
    scene.add(planetMesh);
    
    // Return the planet object
    return {
        mesh: planetMesh,
        radius: PLANET_RADIUS,
        craters: craters,
        
        // Get the nearest point on the planet's surface from a given point
        getNearestPointOnSurface: function(point) {
            // Get the direction from the center to the point
            const direction = point.clone().normalize();
            
            // Get elevation at this point on the planet
            const elevation = getElevationAtDirection(direction, noise, craters);
            
            // Calculate the final radius including terrain displacement
            const finalRadius = PLANET_RADIUS + elevation;
            
            // Return the point on the surface
            return direction.multiplyScalar(finalRadius);
        },
        
        // Update method (for future animations if needed)
        update: function(deltaTime) {
            // No animations needed for now
        }
    };
}

/**
 * Generate random craters across the planet
 */
function generateCraters(count) {
    const craters = [];
    
    for (let i = 0; i < count; i++) {
        // Random position on unit sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(theta);
        
        // Random crater size with better distribution
        const size = CRATER_MIN_SIZE + Math.pow(Math.random(), 0.7) * (CRATER_MAX_SIZE - CRATER_MIN_SIZE);
        
        // Random crater depth (deeper for larger craters)
        const depth = size * (0.07 + Math.random() * 0.15);
        
        // Random rim height
        const rimHeight = depth * (0.4 + Math.random() * 0.6);
        
        // Add crater to list
        craters.push({
            position: new THREE.Vector3(x, y, z),
            size: size,
            depth: depth,
            rimHeight: rimHeight,
            rimWidth: size * (0.15 + Math.random() * 0.1), // Variable rim width
            falloff: 1.5 + Math.random() * 1.5, // Controls crater shape (higher = sharper)
        });
    }
    
    return craters;
}

/**
 * Apply terrain displacement to the sphere geometry
 */
function applyTerrainDisplacement(geometry, noise, craters) {
    // Get the vertices from the geometry
    const positions = geometry.attributes.position;
    
    // Create a new array for storing colors
    const colorArray = new Float32Array(positions.count * 3);
    const colorAttribute = new THREE.BufferAttribute(colorArray, 3);
    
    // Calculate elevation range for color mapping
    let minElevation = Infinity;
    let maxElevation = -Infinity;
    const elevations = [];
    
    // First pass - calculate all elevations for normalization
    for (let i = 0; i < positions.count; i++) {
        // Get the vertex position
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Normalize to get the direction
        const direction = new THREE.Vector3(x, y, z).normalize();
        
        // Get elevation at this point
        const elevation = getElevationAtDirection(direction, noise, craters);
        elevations[i] = elevation;
        
        // Track min/max elevation
        minElevation = Math.min(minElevation, elevation);
        maxElevation = Math.max(maxElevation, elevation);
    }
    
    // Second pass - apply displacements and colors
    for (let i = 0; i < positions.count; i++) {
        // Get the vertex position
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Normalize to get the direction
        const direction = new THREE.Vector3(x, y, z).normalize();
        
        // Get elevation and normalize it
        const elevation = elevations[i];
        const normalizedElevation = (elevation - minElevation) / (maxElevation - minElevation);
        
        // Apply displacement to the vertex
        const displacedPosition = direction.multiplyScalar(PLANET_RADIUS + elevation);
        positions.setXYZ(i, displacedPosition.x, displacedPosition.y, displacedPosition.z);
        
        // Calculate slope for shading (steeper = darker)
        const slopeShading = getSlopeShading(direction, noise, craters);
        
        // Apply enhanced lunar-like coloring with more variety
        // Base color adjusted for elevation
        let r, g, b;
        
        if (normalizedElevation < 0.3) {
            // Darker lowlands - slightly bluish gray
            r = 0.65 + slopeShading * 0.15 - normalizedElevation * 0.1;
            g = 0.65 + slopeShading * 0.15 - normalizedElevation * 0.1;
            b = 0.7 + slopeShading * 0.15 - normalizedElevation * 0.05;
        } else if (normalizedElevation < 0.6) {
            // Mid-elevations - neutral gray
            r = 0.7 + slopeShading * 0.15;
            g = 0.7 + slopeShading * 0.15;
            b = 0.75 + slopeShading * 0.15;
        } else {
            // Highlands - slightly warmer/brighter
            r = 0.75 + slopeShading * 0.15 + (normalizedElevation - 0.6) * 0.15;
            g = 0.75 + slopeShading * 0.15 + (normalizedElevation - 0.6) * 0.12;
            b = 0.78 + slopeShading * 0.15 + (normalizedElevation - 0.6) * 0.08;
        }
        
        // Apply some subtle color variation based on position
        const variation = noise.noise3d(direction.x * 5, direction.y * 5, direction.z * 5) * 0.05;
        
        // Set final colors
        colorArray[i * 3] = Math.max(0, Math.min(1, r + variation));
        colorArray[i * 3 + 1] = Math.max(0, Math.min(1, g + variation));
        colorArray[i * 3 + 2] = Math.max(0, Math.min(1, b + variation));
    }
    
    // Add the color attribute to the geometry
    geometry.setAttribute('color', colorAttribute);
    
    // Calculate normals for proper lighting
    geometry.computeVertexNormals();
}

/**
 * Calculate how much to darken/lighten a vertex based on slope
 */
function getSlopeShading(direction, noise, craters) {
    // Sample elevation at nearby points to estimate slope
    const step = 0.01;
    const p1 = direction.clone();
    const p2 = new THREE.Vector3(
        direction.x + step, 
        direction.y, 
        direction.z
    ).normalize();
    
    const e1 = getElevationAtDirection(p1, noise, craters);
    const e2 = getElevationAtDirection(p2, noise, craters);
    
    // Estimate slope - higher absolute value means steeper slope
    const slope = Math.abs(e2 - e1) / step;
    
    // Map slope to shading (steeper slopes are darker)
    return Math.max(-0.3, Math.min(0.3, 0.2 - slope * 3.0));
}

/**
 * Get the terrain elevation at a specific direction from the planet center
 */
function getElevationAtDirection(direction, noise, craters) {
    // Extract coordinates
    const { x, y, z } = direction;
    
    // Apply multiple octaves of noise for base terrain
    let baseElevation = 0;
    let frequency = BASE_FREQUENCY; // Lower frequency for broader features
    let amplitude = 1.0;
    const octaves = 5;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
        // Get noise value at this frequency
        const noiseValue = noise.noise3d(x * frequency, y * frequency, z * frequency);
        
        // Add to elevation with adjusted curve to create more plateaus and valleys
        const adjustedNoise = i === 0 
            ? noiseValue // First octave uses raw noise
            : Math.pow(Math.abs(noiseValue), 1.2) * Math.sign(noiseValue); // Higher octaves use curve
        
        baseElevation += adjustedNoise * amplitude;
        
        // Keep track of max possible value for normalization
        maxValue += amplitude;
        
        // Prepare for next octave
        amplitude *= 0.45; // Slower amplitude falloff for more detail
        frequency *= 2.2;  // Higher frequency ratio for more distinction between levels
    }
    
    // Normalize elevation to range [-1, 1]
    baseElevation /= maxValue;
    
    // Add large-scale gentle undulation for wide valleys and hills
    const largeScaleNoise = noise.noise3d(x * 0.2, y * 0.2, z * 0.2);
    baseElevation = baseElevation * 0.7 + largeScaleNoise * 0.3;
    
    // Scale base elevation by terrain roughness
    baseElevation *= TERRAIN_ROUGHNESS;
    
    // Scale to actual size
    const scaledElevation = baseElevation * (PLANET_RADIUS * 0.06);
    
    // Apply craters
    let craterEffect = 0;
    
    for (const crater of craters) {
        // Calculate distance from this point to crater center
        const distToCrater = direction.distanceTo(crater.position);
        
        // If point is within crater influence radius
        if (distToCrater < crater.size / PLANET_RADIUS) {
            // Normalized distance (0 at center, 1 at rim)
            const normalizedDist = distToCrater / (crater.size / PLANET_RADIUS);
            
            // Calculate crater profile
            if (normalizedDist < 0.8) {
                // Inside crater
                const craterDepth = Math.pow(Math.cos(normalizedDist * Math.PI * 0.625), crater.falloff) * crater.depth;
                craterEffect -= craterDepth;
            } else if (normalizedDist < 1.0) {
                // Crater rim
                const rimFactor = (normalizedDist - 0.8) / 0.2; // 0 at inner rim, 1 at outer rim
                const rimProfile = Math.sin(rimFactor * Math.PI);
                craterEffect += rimProfile * crater.rimHeight;
            }
        }
    }
    
    // Combine base elevation with crater effect
    return scaledElevation + craterEffect;
}

/**
 * Create the material for the planet
 */
function createPlanetMaterial() {
    // Create enhanced lunar-like material
    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.92, // Very rough surface like the moon
        metalness: 0.05, // Slight metalness for subtle reflections
        flatShading: false, // Use smooth shading for better appearance
    });
    
    // Create a bump map for additional small-scale detail
    const bumpTexture = new THREE.DataTexture(
        generateNoiseTexture(256, 256),
        256, 256,
        THREE.RedFormat,
        THREE.FloatType
    );
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.needsUpdate = true;
    
    material.bumpMap = bumpTexture;
    material.bumpScale = 0.5;
    
    return material;
}

/**
 * Generate a noise texture for the bump map
 */
function generateNoiseTexture(width, height) {
    const size = width * height;
    const data = new Float32Array(size);
    const noise = new SimplexNoise();
    
    // Multiple octaves of noise for richer texture
    for (let i = 0; i < size; i++) {
        const x = i % width;
        const y = Math.floor(i / width);
        
        let value = 0;
        let amplitude = 1.0;
        let frequency = 1.0;
        let maxValue = 0;
        
        // Add multiple octaves
        for (let octave = 0; octave < 4; octave++) {
            const nx = x / width * frequency;
            const ny = y / height * frequency;
            
            value += (noise.noise(nx, ny) * 0.5 + 0.5) * amplitude;
            maxValue += amplitude;
            
            amplitude *= 0.5;
            frequency *= 2.0;
        }
        
        // Normalize
        data[i] = value / maxValue;
    }
    
    return data;
} 
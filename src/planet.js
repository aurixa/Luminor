/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

// Planet configuration
const PLANET_RADIUS = 800; // Base planet radius

// Terrain parameters - these can be adjusted for testing
const TERRAIN_PARAMS = {
    // Main terrain scale factor (higher = more dramatic terrain)
    heightScale: 0.8,  // SIGNIFICANTLY INCREASED for dramatic hills
    
    // Base noise settings
    baseFrequency: 0.08, // LOWERED for wider, more dramatic undulations
    roughness: 0.85,     // ADJUSTED for balance between smoothness and detail
    
    // Large scale undulation settings (main dramatic hills)
    largeScale: {
        frequency: 0.025, // LOWERED for much wider features
        influence: 1.2,   // SIGNIFICANTLY INCREASED for more dramatic terrain
    },
    
    // Medium scale features (smaller hills, valleys)
    mediumScale: {
        frequency: 0.08,  // ADJUSTED for better hill shapes
        influence: 0.5,   // INCREASED for more definition
    },
    
    // Small scale details
    smallScale: {
        frequency: 0.4,   // ADJUSTED for better detail scale
        influence: 0.08,  // SLIGHTLY INCREASED for more visible detail
        octaves: 2,       // KEPT LOW for performance
        persistence: 0.5, // SLIGHTLY INCREASED for more detail variation
    },
    
    // Ridge settings - MODIFIED for more pronounced ridges
    ridges: {
        enabled: true,
        frequency: 0.05,  // ADJUSTED for better ridge spacing
        influence: 0.7,   // INCREASED for more dramatic ridges
        sharpness: 1.5,   // SLIGHTLY INCREASED for more defined ridges
    },
    
    // Valley settings - MODIFIED for more pronounced valleys
    valleys: {
        enabled: true,
        frequency: 0.04,  // ADJUSTED for better valley spacing
        influence: 0.8,   // INCREASED for more pronounced valleys
        depth: 1.5,       // INCREASED for deeper valleys
    },
    
    // Crater settings - REDUCED importance for Motocross style
    craters: {
        count: 8,        // REDUCED crater count
        minSize: 15,     // REDUCED for less impact
        maxSize: 45,     // REDUCED for less impact
        depthFactor: 0.12, // REDUCED for smoother craters
        rimHeightFactor: 0.5, // REDUCED for smoother rims
    },
    
    // Texture settings
    texture: {
        enabled: true,
        detailScale: 20,   // Scale of the detail texture
        normalStrength: 1.2, // Strength of normal mapping
    }
};

/**
 * Create the planet geometry, material, and mesh
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} The planet object with properties and methods
 */
export function createPlanet(scene) {
    // Create a simplex noise generator for terrain
    const noise = new SimplexNoise();
    
    // Create a sphere geometry with high resolution
    const geometry = new THREE.SphereGeometry(PLANET_RADIUS, 196, 196); // Increased resolution
    
    // Generate craters and store them for later use
    const craters = generateCraters(TERRAIN_PARAMS.craters.count);
    
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
        },
        
        // Method to update terrain parameters (could be connected to UI controls)
        updateTerrainParams: function(newParams) {
            // Copy new parameters to TERRAIN_PARAMS
            for (const key in newParams) {
                if (typeof newParams[key] === 'object' && newParams[key] !== null) {
                    // Deep merge for nested objects
                    for (const subKey in newParams[key]) {
                        TERRAIN_PARAMS[key][subKey] = newParams[key][subKey];
                    }
                } else {
                    TERRAIN_PARAMS[key] = newParams[key];
                }
            }
            
            // Regenerate the planet with new parameters
            // (This would need a complete rebuild of the geometry)
            console.log("Terrain parameters updated:", TERRAIN_PARAMS);
            
            // Note: A full implementation would clear and rebuild the mesh here
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
        const size = TERRAIN_PARAMS.craters.minSize + 
            Math.pow(Math.random(), 0.7) * (TERRAIN_PARAMS.craters.maxSize - TERRAIN_PARAMS.craters.minSize);
        
        // Random crater depth (deeper for larger craters)
        const depth = size * (0.07 + Math.random() * TERRAIN_PARAMS.craters.depthFactor);
        
        // Random rim height
        const rimHeight = depth * (0.4 + Math.random() * TERRAIN_PARAMS.craters.rimHeightFactor);
        
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
    
    // Create arrays for texture coordinates
    const uvs = new Float32Array(positions.count * 2);
    
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
        
        // Calculate texture coordinates (spherical mapping)
        // These will be used to apply the detailed texture
        const phi = Math.atan2(direction.z, direction.x);
        const theta = Math.asin(direction.y);
        
        uvs[i * 2] = (phi / (2 * Math.PI) + 0.5); // U: 0-1 based on longitude
        uvs[i * 2 + 1] = (theta / Math.PI + 0.5);  // V: 0-1 based on latitude
    }
    
    console.log(`Terrain height range: ${minElevation.toFixed(2)} to ${maxElevation.toFixed(2)} (${(maxElevation - minElevation).toFixed(2)} units)`);
    
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
        
        // Apply color tinting based on elevation and slope
        // We're using vertex colors to tint the texture
        let r, g, b;
        
        if (normalizedElevation < 0.3) {
            // Lower areas - slightly darker tint
            r = 0.92 + slopeShading * 0.15;
            g = 0.92 + slopeShading * 0.15;
            b = 0.90 + slopeShading * 0.1;
        } else if (normalizedElevation < 0.65) {
            // Mid elevations - neutral tint
            r = 1.0 + slopeShading * 0.15;
            g = 1.0 + slopeShading * 0.15;
            b = 0.98 + slopeShading * 0.1;
        } else {
            // Higher elevations - slightly lighter tint
            r = 1.05 + slopeShading * 0.15;
            g = 1.05 + slopeShading * 0.15;
            b = 1.02 + slopeShading * 0.1;
        }
        
        // Add some reddish tint to very steep areas (cliff faces)
        if (slopeShading < -0.15) {
            r += Math.abs(slopeShading) * 0.2;
            g -= Math.abs(slopeShading) * 0.1;
            b -= Math.abs(slopeShading) * 0.1;
        }
        
        // Set final vertex colors (these will modulate the texture)
        colorArray[i * 3] = Math.max(0, Math.min(1, r));
        colorArray[i * 3 + 1] = Math.max(0, Math.min(1, g));
        colorArray[i * 3 + 2] = Math.max(0, Math.min(1, b));
    }
    
    // Add the color attribute to the geometry
    geometry.setAttribute('color', colorAttribute);
    
    // Add the uv attribute for texturing
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    
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
    
    // 1. Generate large-scale undulations (the main dramatic hills)
    const largeScaleFreq = TERRAIN_PARAMS.largeScale.frequency;
    let largeScaleNoise = noise.noise3d(
        x * largeScaleFreq, 
        y * largeScaleFreq, 
        z * largeScaleFreq
    );
    
    // Enhance large undulations with power curve for more dramatic terrain
    // This creates more flat areas with steeper transitions between them
    largeScaleNoise = Math.pow(Math.abs(largeScaleNoise), 0.8) * Math.sign(largeScaleNoise);
    
    // 2. Generate medium-scale terrain (hills and valleys)
    const medScaleFreq = TERRAIN_PARAMS.mediumScale.frequency;
    let medScaleNoise = noise.noise3d(
        x * medScaleFreq, 
        y * medScaleFreq, 
        z * medScaleFreq
    );
    
    // Enhance medium undulations with modified curve
    medScaleNoise = Math.pow(Math.abs(medScaleNoise), 0.9) * Math.sign(medScaleNoise);
    
    // 3. Generate small-scale details using multiple noise octaves
    let smallScaleNoise = 0;
    let amplitude = 1.0;
    let frequency = TERRAIN_PARAMS.smallScale.frequency;
    let maxValue = 0;
    
    for (let i = 0; i < TERRAIN_PARAMS.smallScale.octaves; i++) {
        const noiseValue = noise.noise3d(x * frequency, y * frequency, z * frequency);
        smallScaleNoise += noiseValue * amplitude;
        maxValue += amplitude;
        
        amplitude *= TERRAIN_PARAMS.smallScale.persistence;
        frequency *= 2.0;
    }
    
    // Normalize small-scale noise
    smallScaleNoise = smallScaleNoise / maxValue;
    
    // 4. Generate ridge features with better shaping for motocross-style terrain
    let ridgeNoise = 0;
    if (TERRAIN_PARAMS.ridges.enabled) {
        const ridgeFreq = TERRAIN_PARAMS.ridges.frequency;
        // Get raw noise
        const rawNoise = noise.noise3d(
            x * ridgeFreq, 
            y * ridgeFreq, 
            z * ridgeFreq
        );
        
        // Transform noise to create ridges (1 - abs(noise))
        const transformedNoise = 1.0 - Math.abs(rawNoise);
        
        // Apply power function for sharper ridge definition
        ridgeNoise = Math.pow(transformedNoise, TERRAIN_PARAMS.ridges.sharpness);
    }
    
    // 5. Generate valleys with better definition
    let valleyNoise = 0;
    if (TERRAIN_PARAMS.valleys.enabled) {
        const valleyFreq = TERRAIN_PARAMS.valleys.frequency;
        // Get raw noise with offset to ensure different pattern from ridges
        const rawNoise = noise.noise3d(
            x * valleyFreq + 100, 
            y * valleyFreq + 100,
            z * valleyFreq + 100
        );
        
        // Transform noise for better valley definition
        // Using a technique that creates more flat valley bottoms
        valleyNoise = Math.pow(Math.max(0, rawNoise), 1.2) * -TERRAIN_PARAMS.valleys.depth;
    }
    
    // 6. Combine all noise layers with their influence factors
    // Create more dramatic terrain reminiscent of Motocross Madness
    let baseElevation = 
        largeScaleNoise * TERRAIN_PARAMS.largeScale.influence + 
        medScaleNoise * TERRAIN_PARAMS.mediumScale.influence + 
        smallScaleNoise * TERRAIN_PARAMS.smallScale.influence;
    
    // Add ridge and valley effects
    if (TERRAIN_PARAMS.ridges.enabled) {
        baseElevation += ridgeNoise * TERRAIN_PARAMS.ridges.influence;
    }
    
    if (TERRAIN_PARAMS.valleys.enabled) {
        baseElevation += valleyNoise * TERRAIN_PARAMS.valleys.influence;
    }
    
    // 7. Apply overall roughness
    baseElevation *= TERRAIN_PARAMS.roughness;
    
    // 8. Apply more dramatic terrain shaping 
    // This creates the characteristic look of motocross terrain with 
    // more flat areas separated by steeper transitions
    baseElevation = (baseElevation > 0) 
        ? Math.pow(baseElevation, 0.7) 
        : -Math.pow(Math.abs(baseElevation), 0.7);
    
    // 9. Scale to actual size
    const scaledElevation = baseElevation * (PLANET_RADIUS * TERRAIN_PARAMS.heightScale);
    
    // 10. Apply smoothed craters (reduced influence for Motocross style)
    let craterEffect = 0;
    
    for (const crater of craters) {
        // Calculate distance from this point to crater center
        const distToCrater = direction.distanceTo(crater.position);
        
        // If point is within crater influence radius
        if (distToCrater < crater.size / PLANET_RADIUS) {
            // Normalized distance (0 at center, 1 at rim)
            const normalizedDist = distToCrater / (crater.size / PLANET_RADIUS);
            
            // Calculate crater profile with smoother transitions
            if (normalizedDist < 0.8) {
                // Inside crater
                const craterDepth = Math.pow(Math.cos(normalizedDist * Math.PI * 0.6), crater.falloff) * crater.depth;
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
 * Smoothstep function for creating smoother transitions
 * This is a cubic interpolation that smooths the values
 */
function smoothstep(x) {
    // Clamp input to 0-1 range
    x = Math.max(0, Math.min(1, (x + 1) / 2));
    // Apply smoothstep formula: 3x^2 - 2x^3
    return x * x * (3 - 2 * x) * 2 - 1;
}

/**
 * Create the material for the planet
 */
function createPlanetMaterial() {
    // Generate textures for more realistic terrain
    const { diffuseMap, normalMap } = generateTerrainTextures();
    
    // Create material with textures
    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.88,
        metalness: 0.02,
        flatShading: false,
        map: diffuseMap,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(TERRAIN_PARAMS.texture.normalStrength, TERRAIN_PARAMS.texture.normalStrength),
    });
    
    return material;
}

/**
 * Generate textures for terrain
 */
function generateTerrainTextures() {
    // Create a diffuse (color) texture
    const textureSize = 1024;
    const diffuseData = new Uint8Array(textureSize * textureSize * 4);
    const normalData = new Uint8Array(textureSize * textureSize * 4);
    
    // Use simplex noise for texture generation
    const noise = new SimplexNoise();
    
    // Generate the texture data
    for (let y = 0; y < textureSize; y++) {
        for (let x = 0; x < textureSize; x++) {
            const i = (y * textureSize + x) * 4;
            
            // Create base coordinates
            const nx = x / textureSize;
            const ny = y / textureSize;
            
            // Multi-layer noise for diffuse texture
            let sandNoise = 0;
            let rockNoise = 0;
            let detailNoise = 0;
            
            // Sand texture (fine details)
            for (let oct = 0; oct < 3; oct++) {
                const freq = Math.pow(2, oct + 4);
                sandNoise += (noise.noise(nx * freq, ny * freq) * 0.5 + 0.5) * Math.pow(0.5, oct);
            }
            
            // Rock texture (medium details)
            for (let oct = 0; oct < 2; oct++) {
                const freq = Math.pow(2, oct + 3);
                rockNoise += (noise.noise(nx * freq + 100, ny * freq + 100) * 0.5 + 0.5) * Math.pow(0.5, oct);
            }
            
            // Fine detail (high frequency)
            detailNoise = (noise.noise(nx * 64, ny * 64) * 0.5 + 0.5);
            
            // Mix the layers
            const mixFactor = (noise.noise(nx * 2, ny * 2) * 0.5 + 0.5);
            const finalNoise = sandNoise * (1 - mixFactor) + rockNoise * mixFactor;
            
            // Add some variation for visual interest
            const variation = (noise.noise(nx * 8, ny * 8) * 0.5 + 0.5) * 0.1;
            
            // Set base sand/dirt color
            let r = 210 + variation * 30;
            let g = 180 + finalNoise * 20 - variation * 20;
            let b = 140 + finalNoise * 15 - variation * 30;
            
            // Occasionally add some rock patches
            if (rockNoise > 0.7) {
                r = 160 + rockNoise * 20;
                g = 150 + rockNoise * 15;
                b = 140 + rockNoise * 10;
            }
            
            // Add some darker patches in low areas
            if (sandNoise < 0.4) {
                r *= 0.9;
                g *= 0.9;
                b *= 0.85;
            }
            
            // Set the diffuse color
            diffuseData[i] = r;
            diffuseData[i+1] = g;
            diffuseData[i+2] = b;
            diffuseData[i+3] = 255; // Alpha
            
            // Calculate normal map values
            // Sample height at neighboring points
            const size = 1.0 / textureSize;
            const heightC = finalNoise;
            const heightL = sampleNoiseHeight(nx - size, ny, noise);
            const heightR = sampleNoiseHeight(nx + size, ny, noise);
            const heightU = sampleNoiseHeight(nx, ny - size, noise);
            const heightD = sampleNoiseHeight(nx, ny + size, noise);
            
            // Calculate normal vector using central differences
            const strength = 2.0; // Normal strength
            let nx1 = (heightL - heightR) * strength;
            let ny1 = (heightU - heightD) * strength;
            let nz = 1.0;
            
            // Normalize
            const length = Math.sqrt(nx1 * nx1 + ny1 * ny1 + nz * nz);
            nx1 /= length;
            ny1 /= length;
            nz /= length;
            
            // Convert from [-1, 1] to [0, 255]
            normalData[i] = Math.floor((nx1 * 0.5 + 0.5) * 255);
            normalData[i+1] = Math.floor((ny1 * 0.5 + 0.5) * 255);
            normalData[i+2] = Math.floor((nz * 0.5 + 0.5) * 255);
            normalData[i+3] = 255; // Alpha
        }
    }
    
    // Create the diffuse texture
    const diffuseMap = new THREE.DataTexture(
        diffuseData,
        textureSize,
        textureSize,
        THREE.RGBAFormat
    );
    diffuseMap.wrapS = THREE.RepeatWrapping;
    diffuseMap.wrapT = THREE.RepeatWrapping;
    diffuseMap.repeat.set(TERRAIN_PARAMS.texture.detailScale, TERRAIN_PARAMS.texture.detailScale);
    diffuseMap.needsUpdate = true;
    
    // Create the normal map
    const normalMap = new THREE.DataTexture(
        normalData,
        textureSize,
        textureSize,
        THREE.RGBAFormat
    );
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(TERRAIN_PARAMS.texture.detailScale, TERRAIN_PARAMS.texture.detailScale);
    normalMap.needsUpdate = true;
    
    return { diffuseMap, normalMap };
}

/**
 * Sample noise at a point for normal map generation
 */
function sampleNoiseHeight(x, y, noise) {
    // Multi-layer noise just like in the main texture generation
    let sandNoise = 0;
    let rockNoise = 0;
    
    // Sand texture (fine details)
    for (let oct = 0; oct < 3; oct++) {
        const freq = Math.pow(2, oct + 4);
        sandNoise += (noise.noise(x * freq, y * freq) * 0.5 + 0.5) * Math.pow(0.5, oct);
    }
    
    // Rock texture (medium details)
    for (let oct = 0; oct < 2; oct++) {
        const freq = Math.pow(2, oct + 3);
        rockNoise += (noise.noise(x * freq + 100, y * freq + 100) * 0.5 + 0.5) * Math.pow(0.5, oct);
    }
    
    // Mix the layers
    const mixFactor = (noise.noise(x * 2, y * 2) * 0.5 + 0.5);
    return sandNoise * (1 - mixFactor) + rockNoise * mixFactor;
} 
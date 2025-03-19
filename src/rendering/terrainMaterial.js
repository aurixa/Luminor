/**
 * Luminor
 * Terrain material generator
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

// Material configuration
const MATERIAL_CONFIG = {
    baseColor: new THREE.Color(0x47803a),   // Earth-like green
    highElevationColor: new THREE.Color(0x8a7152), // Mountain brown
    lowElevationColor: new THREE.Color(0x2d5a2d),  // Valley dark green
    textureResolution: 1024,                // Texture resolution
    normalMapStrength: 1.2,                 // Normal map influence
    roughness: 0.7,                         // Surface roughness
    metalness: 0.1,                         // Surface metalness
    detailScale: 20                         // Detail texture scale
};

/**
 * Create material for the planet terrain
 * @returns {THREE.Material} The configured material
 */
export function createTerrainMaterial() {
    // Generate texture data
    const { diffuseMap, normalMap } = generateTerrainTextures();
    
    // Create physical material with textures
    const material = new THREE.MeshStandardMaterial({
        map: diffuseMap,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(MATERIAL_CONFIG.normalMapStrength, MATERIAL_CONFIG.normalMapStrength),
        roughness: MATERIAL_CONFIG.roughness,
        metalness: MATERIAL_CONFIG.metalness,
        side: THREE.FrontSide,
        flatShading: false
    });
    
    return material;
}

/**
 * Generate terrain textures (diffuse and normal maps)
 * @returns {Object} Object containing the generated textures
 */
function generateTerrainTextures() {
    const resolution = MATERIAL_CONFIG.textureResolution;
    const noise = new SimplexNoise();
    
    // Create data arrays for textures
    const diffuseData = new Uint8Array(resolution * resolution * 4);
    const normalData = new Uint8Array(resolution * resolution * 4);
    
    // Generate the texture data
    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            const index = (y * resolution + x) * 4;
            
            // Normalized coordinates
            const nx = x / resolution;
            const ny = y / resolution;
            
            // Calculate noise
            const elevation = sampleNoiseForTexture(nx, ny, noise);
            const moistureNoise = sampleNoiseForTexture(nx + 0.5, ny + 0.5, noise, 2.5);
            
            // Generate color based on elevation and moisture
            const color = calculateTerrainColor(elevation, moistureNoise);
            
            // Set diffuse color
            diffuseData[index] = color.r * 255;
            diffuseData[index + 1] = color.g * 255;
            diffuseData[index + 2] = color.b * 255;
            diffuseData[index + 3] = 255; // Alpha
            
            // Calculate normal for this point using central differences
            if (x > 0 && x < resolution - 1 && y > 0 && y < resolution - 1) {
                const elevL = sampleNoiseForTexture((x - 1) / resolution, ny, noise);
                const elevR = sampleNoiseForTexture((x + 1) / resolution, ny, noise);
                const elevT = sampleNoiseForTexture(nx, (y - 1) / resolution, noise);
                const elevB = sampleNoiseForTexture(nx, (y + 1) / resolution, noise);
                
                // Calculate derivatives
                const dX = (elevR - elevL) / 2.0;
                const dY = (elevB - elevT) / 2.0;
                
                // Generate normal map
                normalData[index] = Math.floor(128 + dX * 128);
                normalData[index + 1] = Math.floor(128 + dY * 128);
                normalData[index + 2] = 255; // Z component (up)
                normalData[index + 3] = 255; // Alpha
            } else {
                // Default normal for edges
                normalData[index] = 128;
                normalData[index + 1] = 128;
                normalData[index + 2] = 255;
                normalData[index + 3] = 255;
            }
        }
    }
    
    // Create the textures from data
    const diffuseMap = new THREE.DataTexture(
        diffuseData, 
        resolution, 
        resolution, 
        THREE.RGBAFormat
    );
    diffuseMap.wrapS = THREE.RepeatWrapping;
    diffuseMap.wrapT = THREE.RepeatWrapping;
    diffuseMap.repeat.set(4, 2);
    diffuseMap.needsUpdate = true;
    
    const normalMap = new THREE.DataTexture(
        normalData, 
        resolution, 
        resolution, 
        THREE.RGBAFormat
    );
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(4, 2);
    normalMap.needsUpdate = true;
    
    return { diffuseMap, normalMap };
}

/**
 * Sample noise for texture generation
 * @param {number} x - X coordinate (0-1)
 * @param {number} y - Y coordinate (0-1)
 * @param {SimplexNoise} noise - Noise generator
 * @param {number} scale - Noise scale multiplier
 * @returns {number} Noise value
 */
function sampleNoiseForTexture(x, y, noise, scale = 1.0) {
    const baseScale = MATERIAL_CONFIG.detailScale * scale;
    
    // Multi-octave noise for more interesting textures
    const n1 = noise.noise(x * baseScale, y * baseScale);
    const n2 = noise.noise(x * baseScale * 2, y * baseScale * 2) * 0.5;
    const n3 = noise.noise(x * baseScale * 4, y * baseScale * 4) * 0.25;
    
    return (n1 + n2 + n3) / 1.75; // Normalize to approximately -1 to 1 range
}

/**
 * Calculate terrain color based on elevation and moisture
 * @param {number} elevation - Elevation value (-1 to 1)
 * @param {number} moisture - Moisture value (-1 to 1)
 * @returns {THREE.Color} The calculated color
 */
function calculateTerrainColor(elevation, moisture) {
    const color = new THREE.Color();
    
    // Start with base color
    color.copy(MATERIAL_CONFIG.baseColor);
    
    // Blend with elevation colors
    if (elevation > 0.2) {
        // Higher elevations - blend with mountain color
        const blendFactor = (elevation - 0.2) / 0.8;
        color.lerp(MATERIAL_CONFIG.highElevationColor, blendFactor);
    } else if (elevation < -0.2) {
        // Lower elevations - blend with valley color
        const blendFactor = (-elevation - 0.2) / 0.8;
        color.lerp(MATERIAL_CONFIG.lowElevationColor, blendFactor);
    }
    
    // Add moisture influence
    if (moisture > 0.3) {
        // More moisture = darker and slightly more green
        const darkenFactor = 0.2 * (moisture - 0.3) / 0.7;
        color.multiplyScalar(1.0 - darkenFactor);
        color.g += 0.05 * (moisture - 0.3) / 0.7;
    } else if (moisture < -0.3) {
        // Less moisture = brighter and slightly more yellow/brown
        const brightenFactor = 0.1 * (-moisture - 0.3) / 0.7;
        color.multiplyScalar(1.0 + brightenFactor);
        color.r += 0.1 * (-moisture - 0.3) / 0.7;
    }
    
    // Add slight random variation for more natural look
    const variation = 0.05;
    color.r += (Math.random() - 0.5) * variation;
    color.g += (Math.random() - 0.5) * variation;
    color.b += (Math.random() - 0.5) * variation;
    
    return color;
} 
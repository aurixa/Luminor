/**
 * Luminor
 * Terrain material configuration and setup
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { TERRAIN_MATERIAL_CONFIG } from '../utils/constants.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

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
        normalScale: new THREE.Vector2(
            TERRAIN_MATERIAL_CONFIG.NORMAL_MAP_STRENGTH, 
            TERRAIN_MATERIAL_CONFIG.NORMAL_MAP_STRENGTH
        ),
        roughness: TERRAIN_MATERIAL_CONFIG.ROUGHNESS,
        metalness: TERRAIN_MATERIAL_CONFIG.METALNESS,
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
    // Create a noise generator
    const noise = new SimplexNoise();
    
    // Generate texture data
    const textureSize = TERRAIN_MATERIAL_CONFIG.TEXTURE_RESOLUTION;
    const diffuseData = new Uint8Array(textureSize * textureSize * 4);
    const normalData = new Uint8Array(textureSize * textureSize * 4);
    
    // Generate texture data
    for (let y = 0; y < textureSize; y++) {
        for (let x = 0; x < textureSize; x++) {
            // Normalize coordinates
            const nx = x / textureSize;
            const ny = y / textureSize;
            
            // Calculate pixel index
            const i = (y * textureSize + x) * 4;
            
            // Generate terrain data for this pixel
            const elevation = sampleNoiseForTexture(nx, ny, noise);
            const moisture = sampleNoiseForTexture(nx + 0.5, ny + 0.5, noise, 0.5);
            
            // Calculate color based on elevation and moisture
            const color = calculateTerrainColor(elevation, moisture);
            
            // Set diffuse pixel
            diffuseData[i] = color.r;
            diffuseData[i + 1] = color.g;
            diffuseData[i + 2] = color.b;
            diffuseData[i + 3] = 255; // Alpha
            
            // Calculate normal
            if (x > 0 && x < textureSize - 1 && y > 0 && y < textureSize - 1) {
                const elevL = sampleNoiseForTexture((x - 1) / textureSize, ny, noise);
                const elevR = sampleNoiseForTexture((x + 1) / textureSize, ny, noise);
                const elevT = sampleNoiseForTexture(nx, (y - 1) / textureSize, noise);
                const elevB = sampleNoiseForTexture(nx, (y + 1) / textureSize, noise);
                
                // Calculate derivatives
                const dX = (elevR - elevL) / 2.0;
                const dY = (elevB - elevT) / 2.0;
                
                // Generate normal map
                normalData[i] = Math.floor(128 + dX * 128);
                normalData[i + 1] = Math.floor(128 + dY * 128);
                normalData[i + 2] = 255; // Z component (up)
                normalData[i + 3] = 255; // Alpha
            } else {
                // Default normal for edges
                normalData[i] = 128;
                normalData[i + 1] = 128;
                normalData[i + 2] = 255;
                normalData[i + 3] = 255;
            }
        }
    }
    
    // Create textures
    const diffuseMap = new THREE.DataTexture(
        diffuseData, 
        textureSize, 
        textureSize, 
        THREE.RGBAFormat
    );
    diffuseMap.wrapS = THREE.RepeatWrapping;
    diffuseMap.wrapT = THREE.RepeatWrapping;
    diffuseMap.needsUpdate = true;
    
    const normalMap = new THREE.DataTexture(
        normalData, 
        textureSize, 
        textureSize, 
        THREE.RGBAFormat
    );
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
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
    const baseScale = TERRAIN_MATERIAL_CONFIG.DETAIL_SCALE * scale;
    
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
    color.copy(TERRAIN_MATERIAL_CONFIG.BASE_COLOR);
    
    // Blend with elevation colors
    if (elevation > 0.2) {
        // Higher elevations - blend with mountain color
        const blendFactor = (elevation - 0.2) / 0.8;
        color.lerp(TERRAIN_MATERIAL_CONFIG.HIGH_ELEVATION_COLOR, blendFactor);
    } else if (elevation < -0.2) {
        // Lower elevations - blend with valley color
        const blendFactor = (-elevation - 0.2) / 0.8;
        color.lerp(TERRAIN_MATERIAL_CONFIG.LOW_ELEVATION_COLOR, blendFactor);
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
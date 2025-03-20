/**
 * Luminor
 * Terrain material generation and management
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { TERRAIN_MATERIAL_CONFIG } from '../utils/constants';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

/**
 * Create the terrain material with all necessary textures and maps
 */
export function createTerrainMaterial(): THREE.MeshStandardMaterial {
    // Create base material
    const material = new THREE.MeshStandardMaterial({
        roughness: TERRAIN_MATERIAL_CONFIG.ROUGHNESS,
        metalness: TERRAIN_MATERIAL_CONFIG.METALNESS,
        side: THREE.FrontSide,
        flatShading: true
    });
    
    // Create textures
    const textureSize = TERRAIN_MATERIAL_CONFIG.TEXTURE_SIZE;
    const noise = new SimplexNoise();
    
    // Generate textures
    material.map = generateDiffuseMap(textureSize, noise);
    material.normalMap = generateNormalMap(textureSize, noise);
    material.roughnessMap = generateRoughnessMap(textureSize, noise);
    
    return material;
}

/**
 * Generate the diffuse color map
 */
function generateDiffuseMap(size: number, noise: SimplexNoise): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            
            // Generate noise values
            const nx = x / size;
            const ny = y / size;
            const noiseValue = (noise.noise(nx * 4, ny * 4) + 1) / 2;
            
            // Get color based on elevation
            const color = getTerrainColor(noiseValue);
            
            // Set pixel data
            data[i] = color.r * 255;
            data[i + 1] = color.g * 255;
            data[i + 2] = color.b * 255;
            data[i + 3] = 255; // Alpha
        }
    }
    
    // Create texture
    const texture = new THREE.DataTexture(
        data,
        size,
        size,
        THREE.RGBAFormat,
        THREE.UnsignedByteType
    );
    
    texture.needsUpdate = true;
    return texture;
}

/**
 * Generate the normal map
 */
function generateNormalMap(size: number, noise: SimplexNoise): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            
            // Sample height at neighboring points
            const s = 1 / size;
            const hL = noise.noise((x - 1) * s * 4, y * s * 4);
            const hR = noise.noise((x + 1) * s * 4, y * s * 4);
            const hD = noise.noise(x * s * 4, (y - 1) * s * 4);
            const hU = noise.noise(x * s * 4, (y + 1) * s * 4);
            
            // Calculate normal
            const normal = new THREE.Vector3(
                (hL - hR) * TERRAIN_MATERIAL_CONFIG.NORMAL_STRENGTH,
                (hD - hU) * TERRAIN_MATERIAL_CONFIG.NORMAL_STRENGTH,
                2
            ).normalize();
            
            // Convert to RGB format
            data[i] = (normal.x * 0.5 + 0.5) * 255;
            data[i + 1] = (normal.y * 0.5 + 0.5) * 255;
            data[i + 2] = normal.z * 255;
            data[i + 3] = 255;
        }
    }
    
    // Create texture
    const texture = new THREE.DataTexture(
        data,
        size,
        size,
        THREE.RGBAFormat,
        THREE.UnsignedByteType
    );
    
    texture.needsUpdate = true;
    return texture;
}

/**
 * Generate the roughness map
 */
function generateRoughnessMap(size: number, noise: SimplexNoise): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            
            // Generate detail noise
            const nx = x / size;
            const ny = y / size;
            const noiseValue = (noise.noise(nx * 8, ny * 8) + 1) / 2;
            
            // Set roughness value
            const roughness = TERRAIN_MATERIAL_CONFIG.BASE_ROUGHNESS +
                noiseValue * TERRAIN_MATERIAL_CONFIG.ROUGHNESS_VARIATION;
            
            // Set all channels to same value for grayscale
            data[i] = roughness * 255;
            data[i + 1] = roughness * 255;
            data[i + 2] = roughness * 255;
            data[i + 3] = 255;
        }
    }
    
    // Create texture
    const texture = new THREE.DataTexture(
        data,
        size,
        size,
        THREE.RGBAFormat,
        THREE.UnsignedByteType
    );
    
    texture.needsUpdate = true;
    return texture;
}

/**
 * Get terrain color based on elevation
 */
function getTerrainColor(elevation: number): THREE.Color {
    const color = new THREE.Color();
    
    // Start with base color
    color.setHex(TERRAIN_MATERIAL_CONFIG.BASE_COLOR);
    
    // Blend with elevation-based colors
    if (elevation > TERRAIN_MATERIAL_CONFIG.HIGH_ELEVATION_THRESHOLD) {
        const blendFactor = (elevation - TERRAIN_MATERIAL_CONFIG.HIGH_ELEVATION_THRESHOLD) /
            (1 - TERRAIN_MATERIAL_CONFIG.HIGH_ELEVATION_THRESHOLD);
        const highColor = new THREE.Color(TERRAIN_MATERIAL_CONFIG.HIGH_ELEVATION_COLOR);
        color.lerp(highColor, blendFactor);
    } else if (elevation < TERRAIN_MATERIAL_CONFIG.LOW_ELEVATION_THRESHOLD) {
        const blendFactor = (TERRAIN_MATERIAL_CONFIG.LOW_ELEVATION_THRESHOLD - elevation) /
            TERRAIN_MATERIAL_CONFIG.LOW_ELEVATION_THRESHOLD;
        const lowColor = new THREE.Color(TERRAIN_MATERIAL_CONFIG.LOW_ELEVATION_COLOR);
        color.lerp(lowColor, blendFactor);
    }
    
    return color;
} 
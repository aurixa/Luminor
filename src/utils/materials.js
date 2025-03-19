/**
 * Luminor
 * Materials utility functions
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

/**
 * Create a glowing material for entities
 * @param {number} color - The material color
 * @param {number} intensity - The glow intensity
 * @returns {THREE.Material} The created material
 */
export function createGlowingMaterial(color, intensity = 1.0) {
    // Create a base material that will look bright even without direct light
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: intensity,
        roughness: 0.2,
        metalness: 0.0,
        transparent: true,
        opacity: 0.9
    });
    
    return material;
}

/**
 * Create a terrain material with multiple layers
 * @param {Object} options - Material options
 * @returns {THREE.Material} The created material
 */
export function createLayeredTerrainMaterial(options = {}) {
    const defaults = {
        baseColor: 0x47803a,
        roughness: 0.8,
        metalness: 0.1,
        normalScale: 1.0
    };
    
    const config = { ...defaults, ...options };
    
    // Create a standard material
    const material = new THREE.MeshStandardMaterial({
        color: config.baseColor,
        roughness: config.roughness,
        metalness: config.metalness,
        flatShading: false
    });
    
    // Add normal map if provided
    if (options.normalMap) {
        material.normalMap = options.normalMap;
        material.normalScale = new THREE.Vector2(config.normalScale, config.normalScale);
    }
    
    // Add displacement map if provided
    if (options.displacementMap) {
        material.displacementMap = options.displacementMap;
        material.displacementScale = options.displacementScale || 1.0;
    }
    
    return material;
}

/**
 * Create a sky/atmosphere material
 * @param {number} color - The material color
 * @param {number} opacity - The material opacity
 * @returns {THREE.Material} The created material
 */
export function createAtmosphereMaterial(color = 0x88ddff, opacity = 0.2) {
    // Create a transparent material for atmosphere
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        side: THREE.BackSide
    });
    
    return material;
}

/**
 * Create a water material for oceans
 * @param {Object} options - Material options
 * @returns {THREE.Material} The created material
 */
export function createWaterMaterial(options = {}) {
    const defaults = {
        color: 0x0077be,
        roughness: 0.1,
        metalness: 0.9,
        opacity: 0.8
    };
    
    const config = { ...defaults, ...options };
    
    // Create a water material
    const material = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: config.roughness,
        metalness: config.metalness,
        transparent: true,
        opacity: config.opacity
    });
    
    return material;
} 
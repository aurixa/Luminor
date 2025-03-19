/**
 * Luminor
 * Lighting setup
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Lighting configuration
const LIGHTING_CONFIG = {
    ambient: {
        color: 0x666666,
        intensity: 0.7
    },
    sun: {
        color: 0xffffdd,
        intensity: 1.4,
        position: new THREE.Vector3(200, 100, 200),
        shadowMapSize: 4096
    }
};

/**
 * Setup scene lighting
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} References to the created lights
 */
export function setupLighting(scene) {
    // Create ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(
        LIGHTING_CONFIG.ambient.color, 
        LIGHTING_CONFIG.ambient.intensity
    );
    scene.add(ambientLight);
    
    // Create directional light (sun)
    const sunLight = new THREE.DirectionalLight(
        LIGHTING_CONFIG.sun.color, 
        LIGHTING_CONFIG.sun.intensity
    );
    
    // Configure sun position
    sunLight.position.copy(LIGHTING_CONFIG.sun.position);
    
    // Configure shadows
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = LIGHTING_CONFIG.sun.shadowMapSize;
    sunLight.shadow.mapSize.height = LIGHTING_CONFIG.sun.shadowMapSize;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 1000;
    
    // Adjust shadow camera to fit the planet
    const shadowSize = 900;
    sunLight.shadow.camera.left = -shadowSize;
    sunLight.shadow.camera.right = shadowSize;
    sunLight.shadow.camera.top = shadowSize;
    sunLight.shadow.camera.bottom = -shadowSize;
    
    scene.add(sunLight);
    
    // Return references to lights for potential later adjustments
    return {
        ambientLight,
        sunLight
    };
} 
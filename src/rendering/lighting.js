/**
 * Luminor
 * Lighting system setup and management
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { LIGHTING_CONFIG } from '../utils/constants.js';

/**
 * Setup all lighting for the scene
 */
export function setupLighting(scene) {
    // Set scene background color
    scene.background = new THREE.Color(LIGHTING_CONFIG.BACKGROUND_COLOR);
    
    // Add ambient light for base illumination
    const ambientLight = createAmbientLight();
    scene.add(ambientLight);
    
    // Add main directional light (sun)
    const sunLight = createSunLight();
    scene.add(sunLight);
    
    // Add fill light from opposite side
    const fillLight = createFillLight();
    scene.add(fillLight);
    
    return {
        ambientLight,
        sunLight,
        fillLight
    };
}

/**
 * Create ambient light
 */
function createAmbientLight() {
    const light = new THREE.AmbientLight(
        LIGHTING_CONFIG.AMBIENT_LIGHT.COLOR, 
        LIGHTING_CONFIG.AMBIENT_LIGHT.INTENSITY
    );
    
    return light;
}

/**
 * Create directional sun light
 */
function createSunLight() {
    const light = new THREE.DirectionalLight(
        LIGHTING_CONFIG.SUN_LIGHT.COLOR, 
        LIGHTING_CONFIG.SUN_LIGHT.INTENSITY
    );
    
    // Set position
    light.position.set(
        LIGHTING_CONFIG.SUN_LIGHT.POSITION.x,
        LIGHTING_CONFIG.SUN_LIGHT.POSITION.y,
        LIGHTING_CONFIG.SUN_LIGHT.POSITION.z
    );
    
    // Configure shadows
    light.castShadow = true;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 1000;
    
    // Set shadow camera size
    const shadowSize = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_SIZE;
    light.shadow.camera.left = -shadowSize;
    light.shadow.camera.right = shadowSize;
    light.shadow.camera.top = shadowSize;
    light.shadow.camera.bottom = -shadowSize;
    
    return light;
}

/**
 * Create fill light (opposite to sun)
 */
function createFillLight() {
    const light = new THREE.DirectionalLight(
        LIGHTING_CONFIG.FILL_LIGHT.COLOR,
        LIGHTING_CONFIG.FILL_LIGHT.INTENSITY
    );
    
    // Set position
    light.position.set(
        LIGHTING_CONFIG.FILL_LIGHT.POSITION.x,
        LIGHTING_CONFIG.FILL_LIGHT.POSITION.y,
        LIGHTING_CONFIG.FILL_LIGHT.POSITION.z
    );
    
    return light;
} 
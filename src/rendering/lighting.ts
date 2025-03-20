/**
 * Luminor
 * Lighting system setup and management
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { LIGHTING_CONFIG } from '../utils/constants';

interface LightingSetup {
    ambientLight: THREE.AmbientLight;
    sunLight: THREE.DirectionalLight;
    fillLight: THREE.DirectionalLight;
}

/**
 * Setup all lighting for the scene
 * @param {THREE.Scene} scene - The Three.js scene to add lights to
 * @returns {LightingSetup} Object containing all created lights
 */
export function setupLighting(scene: THREE.Scene): LightingSetup {
    // Set scene background color
    scene.background = new THREE.Color(LIGHTING_CONFIG.BACKGROUND_COLOR);
    
    // Add ambient light for base illumination
    const ambientLight = createAmbientLight();
    scene.add(ambientLight);
    
    // Create sun light
    const sunLight = createSunLight();
    scene.add(sunLight);
    
    // Create fill light
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
 * @returns {THREE.AmbientLight} The created ambient light
 */
function createAmbientLight(): THREE.AmbientLight {
    const light = new THREE.AmbientLight(
        LIGHTING_CONFIG.AMBIENT_LIGHT.COLOR, 
        LIGHTING_CONFIG.AMBIENT_LIGHT.INTENSITY
    );
    
    return light;
}

/**
 * Create the main sun light
 */
function createSunLight(): THREE.DirectionalLight {
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
    light.shadow.mapSize.width = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_MAP_SIZE;
    light.shadow.mapSize.height = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_MAP_SIZE;
    
    // Configure shadow camera
    light.shadow.camera.near = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_NEAR;
    light.shadow.camera.far = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_FAR;
    
    const shadowSize = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_SIZE;
    light.shadow.camera.left = -shadowSize;
    light.shadow.camera.right = shadowSize;
    light.shadow.camera.top = shadowSize;
    light.shadow.camera.bottom = -shadowSize;
    
    return light;
}

/**
 * Create the fill light for softer shadows
 */
function createFillLight(): THREE.DirectionalLight {
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
    
    // Fill light doesn't cast shadows
    light.castShadow = false;
    
    return light;
} 
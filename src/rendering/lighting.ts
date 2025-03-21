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
  console.log('Setting up scene lighting...');

  // Set scene background color
  scene.background = new THREE.Color(LIGHTING_CONFIG.BACKGROUND_COLOR);

  // Add ambient light
  console.log('Adding ambient light with intensity:', LIGHTING_CONFIG.AMBIENT_LIGHT.INTENSITY);
  const ambientLight = new THREE.AmbientLight(
    LIGHTING_CONFIG.AMBIENT_LIGHT.COLOR,
    LIGHTING_CONFIG.AMBIENT_LIGHT.INTENSITY
  );
  scene.add(ambientLight);

  // Add main directional light (sun)
  console.log('Adding sun light with intensity:', LIGHTING_CONFIG.SUN_LIGHT.INTENSITY);
  const sunLight = new THREE.DirectionalLight(
    LIGHTING_CONFIG.SUN_LIGHT.COLOR,
    LIGHTING_CONFIG.SUN_LIGHT.INTENSITY
  );
  sunLight.position.set(
    LIGHTING_CONFIG.SUN_LIGHT.POSITION.x,
    LIGHTING_CONFIG.SUN_LIGHT.POSITION.y,
    LIGHTING_CONFIG.SUN_LIGHT.POSITION.z
  );

  // Configure shadows for the main light
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_MAP_SIZE;
  sunLight.shadow.mapSize.height = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_MAP_SIZE;
  sunLight.shadow.camera.near = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_NEAR;
  sunLight.shadow.camera.far = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_FAR;
  sunLight.shadow.camera.left = -LIGHTING_CONFIG.SUN_LIGHT.SHADOW_SIZE;
  sunLight.shadow.camera.right = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_SIZE;
  sunLight.shadow.camera.top = LIGHTING_CONFIG.SUN_LIGHT.SHADOW_SIZE;
  sunLight.shadow.camera.bottom = -LIGHTING_CONFIG.SUN_LIGHT.SHADOW_SIZE;

  scene.add(sunLight);

  // Add a fill light from the opposite direction
  console.log('Adding fill light with intensity:', LIGHTING_CONFIG.FILL_LIGHT.INTENSITY);
  const fillLight = new THREE.DirectionalLight(
    LIGHTING_CONFIG.FILL_LIGHT.COLOR,
    LIGHTING_CONFIG.FILL_LIGHT.INTENSITY
  );
  fillLight.position.set(
    LIGHTING_CONFIG.FILL_LIGHT.POSITION.x,
    LIGHTING_CONFIG.FILL_LIGHT.POSITION.y,
    LIGHTING_CONFIG.FILL_LIGHT.POSITION.z
  );
  scene.add(fillLight);

  // Add a hemisphere light for better ambient lighting
  const hemisphereLight = new THREE.HemisphereLight(
    0xffffff, // Sky color
    0x444444, // Ground color
    0.3 // Intensity
  );
  scene.add(hemisphereLight);

  console.log('Scene lighting setup complete');

  return {
    ambientLight,
    sunLight,
    fillLight
  };
}

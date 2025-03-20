/**
 * Luminor
 * Material utilities for game objects
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

/**
 * Creates a glowing material with the specified color and intensity
 */
export function createGlowingMaterial(
  color: number,
  intensity: number
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.5,
    metalness: 0.5
  });

  return material;
}

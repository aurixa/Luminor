/**
 * Luminor
 * Planet texture generation module
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

interface TextureNoiseValues {
  base: number;
  variation: number;
  mix: number;
  nx: number;
  ny: number;
  noise?: SimplexNoise;
}

interface PlanetTextures {
  diffuseMap: THREE.DataTexture;
  normalMap: THREE.DataTexture;
}

/**
 * Generate textures for the planet
 * @param {SimplexNoise} noise - The noise generator
 * @returns {PlanetTextures} Object containing the generated textures
 */
export function generatePlanetTextures(noise: SimplexNoise): PlanetTextures {
  // Create texture data
  const textureSize = 1024;
  const diffuseData = new Uint8Array(textureSize * textureSize * 4);
  const normalData = new Uint8Array(textureSize * textureSize * 4);

  // Generate texture data
  for (let y = 0; y < textureSize; y++) {
    for (let x = 0; x < textureSize; x++) {
      // Normalize pixel coordinates
      const nx = x / textureSize;
      const ny = y / textureSize;

      // Calculate index in pixel array
      const i = (y * textureSize + x) * 4;

      // Generate different kinds of noise for different terrain types
      const noiseValues = generateTextureNoiseValues(nx, ny, noise);
      noiseValues.noise = noise; // Add the noise generator to the values object

      // Set diffuse (color) texture
      setDiffusePixel(diffuseData, i, noiseValues);

      // Set normal map texture
      setNormalPixel(normalData, i, x, y, textureSize, noiseValues);
    }
  }

  // Create textures from pixel data
  const diffuseMap = createThreeTexture(diffuseData, textureSize);
  const normalMap = createThreeTexture(normalData, textureSize);

  return { diffuseMap, normalMap };
}

/**
 * Generate noise values for texture generation
 * @param {number} nx - Normalized x coordinate
 * @param {number} ny - Normalized y coordinate
 * @param {SimplexNoise} noise - The noise generator
 * @returns {TextureNoiseValues} Object containing noise values
 */
function generateTextureNoiseValues(
  nx: number,
  ny: number,
  noise: SimplexNoise
): TextureNoiseValues {
  // Use consistent z coordinate for 3D noise
  const nz = nx * 0.5 + ny * 0.5;

  // Sand/base terrain noise (high frequency)
  let sandNoise = 0;
  for (let oct = 0; oct < 4; oct++) {
    const freq = Math.pow(2, oct + 3);
    sandNoise += (noise.noise3d(nx * freq, ny * freq, nz * freq) * 0.5 + 0.5) / Math.pow(2, oct);
  }
  sandNoise /= 1.5;

  // Rock/mountain noise (lower frequency, sharper)
  let rockNoise = 0;
  for (let oct = 0; oct < 3; oct++) {
    const freq = Math.pow(2, oct + 2);
    rockNoise +=
      (noise.noise3d(nx * freq + 100, ny * freq + 100, nz * freq) * 0.5 + 0.5) / Math.pow(2, oct);
  }
  rockNoise /= 1.5;

  // Blend between sand and rock noise based on another noise function
  const mixFactor = Math.pow(noise.noise3d(nx * 1.5, ny * 1.5, nz) * 0.5 + 0.5, 1.2);
  const finalNoise = sandNoise * (1 - mixFactor) + rockNoise * mixFactor;

  // Add subtle variation
  const variation = (noise.noise3d(nx * 10, ny * 10, nz) * 0.5 + 0.5) * 0.2;

  return {
    base: finalNoise,
    variation: variation,
    mix: mixFactor,
    nx: nx,
    ny: ny
  };
}

/**
 * Set diffuse texture pixel color
 * @param {Uint8Array} data - The pixel data array
 * @param {number} index - The index in the array
 * @param {TextureNoiseValues} noise - The noise values
 */
function setDiffusePixel(data: Uint8Array, index: number, noise: TextureNoiseValues): void {
  // Enhanced terrain color palette with better contrast
  let r = 80 + noise.base * 40 + noise.variation * 30;
  let g = 135 + noise.base * 30 - noise.mix * 40;
  let b = 65 + noise.base * 20 - noise.mix * 25;

  // Adjust color based on mixing factor (rock vs sand)
  if (noise.mix > 0.5) {
    // More rocky - add reddish tint
    r += (45 * (noise.mix - 0.5)) / 0.5;
    g += (5 * (noise.mix - 0.5)) / 0.5;
    b += (10 * (noise.mix - 0.5)) / 0.5;
  } else {
    // More sandy - add yellowish tint
    r += (20 * (0.5 - noise.mix)) / 0.5;
    g += (25 * (0.5 - noise.mix)) / 0.5;
  }

  // Set pixel data
  data[index] = Math.min(255, Math.max(0, Math.floor(r)));
  data[index + 1] = Math.min(255, Math.max(0, Math.floor(g)));
  data[index + 2] = Math.min(255, Math.max(0, Math.floor(b)));
  data[index + 3] = 255; // Alpha channel
}

/**
 * Set normal map pixel color
 * @param {Uint8Array} data - The pixel data array
 * @param {number} index - The index in the array
 * @param {number} _x - X coordinate (unused)
 * @param {number} _y - Y coordinate (unused)
 * @param {number} textureSize - Size of the texture
 * @param {TextureNoiseValues} noiseValues - The noise values
 */
function setNormalPixel(
  data: Uint8Array,
  index: number,
  _x: number,
  _y: number,
  textureSize: number,
  noiseValues: TextureNoiseValues
): void {
  // Retrieve original coordinates
  const nx = noiseValues.nx;
  const ny = noiseValues.ny;

  // Sample neighboring pixels with smaller step size for more detail
  const step = 1.0 / textureSize;
  const nxl = nx - step;
  const nxr = nx + step;
  const nyt = ny - step;
  const nyb = ny + step;

  // Calculate height differences with stronger effect
  const strength = 3.0; // Increased normal strength for more detailed terrain
  const noise = noiseValues.noise;

  if (!noise) {
    // Default normal if noise is not available
    data[index] = 128;
    data[index + 1] = 128;
    data[index + 2] = 255;
    data[index + 3] = 255;
    return;
  }

  // Use noise function for sample points
  const hl = generateTextureNoiseValues(nxl, ny, noise).base;
  const hr = generateTextureNoiseValues(nxr, ny, noise).base;
  const ht = generateTextureNoiseValues(nx, nyt, noise).base;
  const hb = generateTextureNoiseValues(nx, nyb, noise).base;

  // Calculate normal vector with stronger height differences
  const nx1 = (hl - hr) * strength;
  const ny1 = (ht - hb) * strength;
  const nz = 1.0;

  // Normalize vector
  const length = Math.sqrt(nx1 * nx1 + ny1 * ny1 + nz * nz);
  const nxNorm = nx1 / length;
  const nyNorm = ny1 / length;

  // Convert to normal map format (ranges 0-255)
  data[index] = Math.floor((nxNorm * 0.5 + 0.5) * 255);
  data[index + 1] = Math.floor((nyNorm * 0.5 + 0.5) * 255);
  data[index + 2] = Math.floor((nz / length) * 255);
  data[index + 3] = 255; // Alpha channel
}

/**
 * Create a Three.js texture from pixel data
 * @param {Uint8Array} data - The pixel data array
 * @param {number} size - Size of the texture
 * @returns {THREE.DataTexture} The created texture
 */
function createThreeTexture(data: Uint8Array, size: number): THREE.DataTexture {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

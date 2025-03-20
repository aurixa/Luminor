/**
 * Luminor
 * Planet crater generation module
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { TERRAIN_CONFIG } from '../utils/constants.js';
import { smoothstep } from './terrainGeneration.js';

/**
 * Generate crater array for the planet
 */
export function generateCraters() {
    const craters = [];
    
    // Skip crater generation if disabled
    if (!TERRAIN_CONFIG.CRATERS.ENABLED) {
        return craters;
    }
    
    // Generate random craters
    for (let i = 0; i < TERRAIN_CONFIG.CRATERS.COUNT; i++) {
        // Random position on the sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        
        // Convert to Cartesian coordinates
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(theta);
        
        // Direction vector from center to crater
        const direction = new THREE.Vector3(x, y, z).normalize();
        
        // Random crater size
        const size = TERRAIN_CONFIG.CRATERS.MIN_SIZE + 
            Math.random() * (TERRAIN_CONFIG.CRATERS.MAX_SIZE - TERRAIN_CONFIG.CRATERS.MIN_SIZE);
        
        // Calculate crater depth based on size
        const depth = size * (0.07 + Math.random() * TERRAIN_CONFIG.CRATERS.DEPTH_FACTOR);
        
        // Calculate rim height based on depth
        const rimHeight = depth * (0.4 + Math.random() * TERRAIN_CONFIG.CRATERS.RIM_HEIGHT_FACTOR);
        
        // Add crater to array
        craters.push({
            direction,
            size,
            depth,
            rimHeight,
            falloff: 1.5 + Math.random() * 0.5 // Random falloff factor
        });
    }
    
    return craters;
}

/**
 * Calculate the crater influence at a specific direction
 */
export function getCraterInfluence(direction, craters) {
    let totalCraterEffect = 0;
    
    // Check each crater's influence
    for (const crater of craters) {
        // Calculate angle between direction and crater center
        const dotProduct = direction.dot(crater.direction);
        const angle = Math.acos(Math.min(Math.max(dotProduct, -1), 1));
        
        // Calculate distance from center of crater (0-1 range where 1 is the crater edge)
        const dist = angle / (crater.size / 1000);
        
        // Skip if outside the crater's influence area
        if (dist > 1.0) continue;
        
        // Calculate crater floor and rim
        const craterEffect = calculateCraterShape(dist, crater);
        totalCraterEffect += craterEffect;
    }
    
    return totalCraterEffect;
}

/**
 * Calculate the crater shape based on distance and crater parameters
 */
function calculateCraterShape(normalizedDist, crater) {
    // Crater floor (inner part)
    if (normalizedDist < 0.8) {
        // Deeper towards center, gradually rising towards the rim
        const craterDepth = Math.pow(Math.cos(normalizedDist * Math.PI * 0.6), crater.falloff) * crater.depth;
        return -craterDepth;
    } 
    // Crater rim (outer edge)
    else if (normalizedDist <= 1.0) {
        // Calculate rim factor (0 at inner rim, 1 at outer rim)
        const rimFactor = (normalizedDist - 0.8) / 0.2;
        
        // Shape of the rim (rises then falls)
        const rimShape = Math.sin(rimFactor * Math.PI);
        return crater.rimHeight * rimShape;
    }
    
    // Outside crater influence
    return 0;
} 
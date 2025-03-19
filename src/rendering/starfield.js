/**
 * Luminor
 * Starfield background generation
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Starfield configuration
const STARFIELD_CONFIG = {
    starCount: 4000,        // Number of stars
    minRadius: 300,         // Minimum distance from center
    maxRadius: 900,         // Maximum distance from center
    minSize: 0.1,           // Minimum star size
    maxSize: 1.2,           // Maximum star size
    colors: [               // Star colors
        0xffffff,  // White
        0xffffaa,  // Warm white
        0xaaaaff,  // Bluish
        0xffaaaa   // Reddish
    ]
};

/**
 * Create a starfield background
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {THREE.Points} The created starfield object
 */
export function createStarField(scene) {
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    const starColors = [];
    const starSizes = [];
    
    // Generate random stars
    for (let i = 0; i < STARFIELD_CONFIG.starCount; i++) {
        // Generate a random position on a sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(Math.random() * 2 - 1);
        
        // Calculate radius with some variation to create depth
        const radius = STARFIELD_CONFIG.minRadius + 
            Math.random() * (STARFIELD_CONFIG.maxRadius - STARFIELD_CONFIG.minRadius);
        
        // Convert spherical to cartesian coordinates
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(theta);
        
        starPositions.push(x, y, z);
        
        // Random star color
        const colorIndex = Math.floor(Math.random() * STARFIELD_CONFIG.colors.length);
        const color = new THREE.Color(STARFIELD_CONFIG.colors[colorIndex]);
        
        // Add some brightness variation
        const brightness = 0.7 + Math.random() * 0.3;
        color.multiplyScalar(brightness);
        
        starColors.push(color.r, color.g, color.b);
        
        // Random star size
        const size = STARFIELD_CONFIG.minSize + 
            Math.random() * (STARFIELD_CONFIG.maxSize - STARFIELD_CONFIG.minSize);
        starSizes.push(size);
    }
    
    // Create buffer attributes
    starsGeometry.setAttribute(
        'position', 
        new THREE.Float32BufferAttribute(starPositions, 3)
    );
    starsGeometry.setAttribute(
        'color', 
        new THREE.Float32BufferAttribute(starColors, 3)
    );
    starsGeometry.setAttribute(
        'size', 
        new THREE.Float32BufferAttribute(starSizes, 1)
    );
    
    // Create star material
    const starsMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true, 
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    // Create points object
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
    
    return starField;
} 
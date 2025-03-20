/**
 * Luminor
 * Starfield background generation
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { STARFIELD_CONFIG } from '../utils/constants.js';

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
    for (let i = 0; i < STARFIELD_CONFIG.STAR_COUNT; i++) {
        // Generate a random position on a sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(Math.random() * 2 - 1);
        
        // Calculate radius with some variation to create depth
        const radius = THREE.MathUtils.randFloat(
            STARFIELD_CONFIG.MIN_RADIUS, 
            STARFIELD_CONFIG.MAX_RADIUS
        );
        
        // Convert spherical to cartesian coordinates
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(theta);
        
        starPositions.push(x, y, z);
        
        // Random star color based on type (predominantly white/blue but some variation)
        let color;
        const starType = Math.random();
        
        if (starType < 0.7) {
            // White/blue stars (most common)
            color = new THREE.Color(0xffffff);
            if (Math.random() > 0.5) {
                color.setRGB(0.9, 0.9, 1.0);
            }
        } else if (starType < 0.85) {
            // Yellow/orange stars
            color = new THREE.Color(0xffffaa);
        } else if (starType < 0.95) {
            // Red stars
            color = new THREE.Color(0xffaaaa);
        } else {
            // A few bright blue stars
            color = new THREE.Color(0xaaaaff);
        }
        
        // Add some brightness variation
        const brightness = 0.7 + Math.random() * 0.3;
        color.multiplyScalar(brightness);
        
        starColors.push(color.r, color.g, color.b);
        
        // Random star size
        const size = THREE.MathUtils.randFloat(
            STARFIELD_CONFIG.MIN_SIZE, 
            STARFIELD_CONFIG.MAX_SIZE
        );
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
    
    // Add update method for rotation
    starField.update = (deltaTime) => {
        starField.rotation.y += 0.00001 * deltaTime;
    };
    
    return starField;
} 
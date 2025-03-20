/**
 * Luminor
 * Starfield background generation and management
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { STARFIELD_CONFIG } from '../utils/constants';

interface StarField extends THREE.Points {
    update: (deltaTime: number) => void;
}

/**
 * Create a starfield background
 */
export function createStarfield(scene: THREE.Scene): StarField {
    // Create geometry for stars
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions: number[] = [];
    const starSizes: number[] = [];
    const starColors: number[] = [];
    
    // Generate random stars
    for (let i = 0; i < STARFIELD_CONFIG.STAR_COUNT; i++) {
        // Random position on sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = STARFIELD_CONFIG.RADIUS;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        starPositions.push(x, y, z);
        
        // Random size
        const size = STARFIELD_CONFIG.MIN_SIZE +
            Math.random() * (STARFIELD_CONFIG.MAX_SIZE - STARFIELD_CONFIG.MIN_SIZE);
        starSizes.push(size);
        
        // Random color (white to blue-ish)
        const r = 0.8 + Math.random() * 0.2;
        const g = 0.8 + Math.random() * 0.2;
        const b = 1.0;
        starColors.push(r, g, b);
    }
    
    // Add attributes to geometry
    starsGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(starPositions, 3)
    );
    starsGeometry.setAttribute(
        'size',
        new THREE.Float32BufferAttribute(starSizes, 1)
    );
    starsGeometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(starColors, 3)
    );
    
    // Create material for stars
    const starsMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    // Create points system
    const starField = Object.assign(new THREE.Points(starsGeometry, starsMaterial), {
        update: (deltaTime: number) => {
            starField.rotation.y += deltaTime * STARFIELD_CONFIG.ROTATION_SPEED;
        }
    }) as StarField;
    
    scene.add(starField);
    
    return starField;
} 
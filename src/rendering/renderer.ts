/**
 * Luminor
 * Renderer setup
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

/**
 * Setup the WebGL renderer
 * @returns {THREE.WebGLRenderer} The configured renderer
 */
export function setupRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    
    // Configure renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Append to document
    document.body.appendChild(renderer.domElement);
    
    return renderer;
} 
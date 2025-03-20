/**
 * Luminor
 * Scene setup and initialization
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { CAMERA_CONFIG } from '../utils/constants.js';
import { setupLighting } from '../rendering/lighting.js';
import { createStarField } from '../rendering/starfield.js';

/**
 * Initialize the scene, camera, and renderer
 * @returns {Object} Object with scene, camera, and renderer
 */
export function initializeScene() {
    // Create scene
    const scene = new THREE.Scene();
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
        CAMERA_CONFIG.FOV,
        window.innerWidth / window.innerHeight,
        CAMERA_CONFIG.NEAR,
        CAMERA_CONFIG.FAR
    );
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // Setup resize handler
    setupResizeHandler(camera, renderer);
    
    return { scene, camera, renderer };
}

/**
 * Setup resize handler for responsive rendering
 * @private
 */
function setupResizeHandler(camera, renderer) {
    const handleResize = () => {
        // Update camera aspect ratio
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        // Update renderer size
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    // Set initial size
    handleResize();
    
    // Add window resize listener
    window.addEventListener('resize', handleResize);
    
    return handleResize;
}

/**
 * Initialize the complete game scene with all visual elements
 * @param {THREE.Scene} scene - Three.js scene
 * @param {THREE.Camera} camera - Three.js camera
 * @returns {Object} Updated scene and camera
 */
export function setupGameScene(scene, camera) {
    // Setup lighting (includes setting background color)
    setupLighting(scene);
    
    // Create starfield
    createStarField(scene);
    
    // Set initial camera position
    camera.position.set(
        CAMERA_CONFIG.INITIAL_POSITION.x, 
        CAMERA_CONFIG.INITIAL_POSITION.y, 
        CAMERA_CONFIG.INITIAL_POSITION.z
    );
    camera.lookAt(0, 0, 0);
    
    return { scene, camera };
} 
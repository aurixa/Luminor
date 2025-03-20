/**
 * Luminor
 * Camera system - setup and control
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { CAMERA_CONFIG } from '../utils/constants.js';

/**
 * Setup the game camera
 * @returns {THREE.PerspectiveCamera} The configured camera
 */
export function setupCamera() {
    const camera = new THREE.PerspectiveCamera(
        CAMERA_CONFIG.FOV, 
        window.innerWidth / window.innerHeight, 
        CAMERA_CONFIG.NEAR, 
        CAMERA_CONFIG.FAR
    );
    
    // Initial camera position
    camera.position.set(
        CAMERA_CONFIG.INITIAL_POSITION.x,
        CAMERA_CONFIG.INITIAL_POSITION.y,
        CAMERA_CONFIG.INITIAL_POSITION.z
    );
    
    // Setup resize handler
    setupResizeHandler(camera);
    
    return camera;
}

/**
 * Setup window resize handler for the camera
 * @param {THREE.Camera} camera - The camera to update on resize
 */
function setupResizeHandler(camera) {
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };
    
    window.addEventListener('resize', handleResize);
    
    return handleResize;
}

/**
 * Update camera position to follow the player
 * @param {THREE.Camera} camera - The camera to update
 * @param {Object} player - Player object
 * @param {Object} planet - The planet object for terrain checks
 * @param {Number} deltaTime - Time since last frame
 */
export function updateCameraPosition(camera, player, planet, deltaTime) {
    if (!player || !player.getHeadPosition || !player.getHeadDirection) return;
    
    // Get player data
    const playerPos = player.getHeadPosition();
    const playerDir = player.getHeadDirection();
    const up = playerPos.clone().normalize();
    
    // Calculate the right vector
    const right = new THREE.Vector3().crossVectors(playerDir, up).normalize();
    
    // Recalculate forward to ensure orthogonality with up
    const forward = new THREE.Vector3().crossVectors(up, right).normalize();
    
    // Calculate terrain slope
    const forwardCheckDist = 20;
    const forwardPoint = playerPos.clone().add(forward.clone().multiplyScalar(forwardCheckDist));
    const forwardSurfacePoint = planet.getNearestPointOnSurface(forwardPoint);
    
    const surfaceTangent = forward.clone()
        .sub(up.clone().multiplyScalar(forward.dot(up)))
        .normalize();
    
    const surfaceToForward = forwardSurfacePoint.clone().sub(
        playerPos.clone().add(surfaceTangent.clone().multiplyScalar(forwardCheckDist))
    );
    
    const slopeDot = surfaceTangent.dot(surfaceToForward.normalize());
    const slopeAngle = Math.asin(Math.min(1, Math.max(-1, slopeDot)));
    const normalizedSlope = (slopeAngle / (Math.PI/4)) + 0.5;
    
    // Adjust camera based on slope
    let dynamicHeight = CAMERA_CONFIG.HEIGHT;
    let dynamicDistance = CAMERA_CONFIG.DISTANCE;
    
    if (normalizedSlope > CAMERA_CONFIG.SLOPE.THRESHOLD.UPHILL) {
        // Going uphill - lower the camera
        const slopeFactor = normalizedSlope - CAMERA_CONFIG.SLOPE.THRESHOLD.UPHILL;
        dynamicHeight = CAMERA_CONFIG.HEIGHT * (1 - slopeFactor * CAMERA_CONFIG.SLOPE.UPHILL_HEIGHT_FACTOR);
        dynamicDistance = CAMERA_CONFIG.DISTANCE * (1 + slopeFactor * CAMERA_CONFIG.SLOPE.UPHILL_DISTANCE_FACTOR);
    } else if (normalizedSlope < CAMERA_CONFIG.SLOPE.THRESHOLD.DOWNHILL) {
        // Going downhill - raise the camera and move it back
        const slopeFactor = CAMERA_CONFIG.SLOPE.THRESHOLD.DOWNHILL - normalizedSlope;
        dynamicHeight = CAMERA_CONFIG.HEIGHT * (1 + slopeFactor * CAMERA_CONFIG.SLOPE.DOWNHILL_HEIGHT_FACTOR);
        dynamicDistance = CAMERA_CONFIG.DISTANCE * (1 + slopeFactor * CAMERA_CONFIG.SLOPE.DOWNHILL_DISTANCE_FACTOR);
    }
    
    // Calculate camera position
    const cameraDirection = playerDir.clone().negate();
    const idealPosition = playerPos.clone()
        .add(cameraDirection.multiplyScalar(dynamicDistance))
        .add(up.multiplyScalar(dynamicHeight));
    
    // Smooth camera movement
    camera.position.lerp(idealPosition, CAMERA_CONFIG.SMOOTHNESS);
    
    // Calculate look target with dynamic forward offset
    let forwardOffset = CAMERA_CONFIG.FORWARD_OFFSET;
    if (normalizedSlope < 0.5) {
        forwardOffset *= (1 + (0.5 - normalizedSlope) * 2);
    }
    
    const lookTarget = playerPos.clone().add(
        playerDir.clone().multiplyScalar(forwardOffset)
    );
    
    camera.lookAt(lookTarget);
    camera.up.copy(up);
} 
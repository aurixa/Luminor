/**
 * Luminor
 * Bike player controller - based on the original player controller but with motorbike mechanics
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Player configuration - simplified for stability
const BIKE_CONFIG = {
    // Movement settings
    speed: 1.5,             // Constant forward speed
    turnSpeed: 0.022,       // Turn speed
    
    // Hover settings
    hoverHeight: 20.0,      // Height above terrain - increased for visibility
    hoverWobble: 0.6,       // Hovering wobble effect
    
    // Visual settings
    glowIntensity: 1.8,     // Bike glow intensity
    bikeLength: 8,          // Length of the bike (Z-axis)
    bikeWidth: 3,           // Width of the bike (X-axis)
    bikeHeight: 4,          // Height of the bike (Y-axis) - increased for better visibility
    
    // Lean settings
    maxLeanAngle: 0.3,      // Maximum lean angle when turning (radians)
    leanSpeed: 0.1,         // How quickly the bike leans into turns
    
    // Debug visualization
    debugAlignment: true,   // Enable debug alignment indicators
    alignmentLineLength: 15 // Length of the alignment indicator lines
};

/**
 * Create and setup the bike player entity
 */
export function createBikePlayer(scene, planet, camera) {
    // Create the bike model
    const bikeGroup = new THREE.Group();
    
    // Main bike body - rotated 90 degrees so it stands upright
    const bikeGeometry = new THREE.BoxGeometry(
        BIKE_CONFIG.bikeWidth,
        BIKE_CONFIG.bikeHeight,
        BIKE_CONFIG.bikeLength
    );
    
    // Glowing material
    const bikeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffaa,
        emissive: 0x00ffaa,
        emissiveIntensity: BIKE_CONFIG.glowIntensity,
        metalness: 0.5,
        roughness: 0.5
    });
    
    const bikeMesh = new THREE.Mesh(bikeGeometry, bikeMaterial);
    bikeGroup.add(bikeMesh);
    
    // Add wheels - positioned vertically
    const wheelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        emissive: 0x222222
    });
    
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.x = Math.PI * 0.5;  // Rotate to align with forward direction
    frontWheel.position.set(0, -BIKE_CONFIG.bikeHeight/2, BIKE_CONFIG.bikeLength/2);
    bikeGroup.add(frontWheel);
    
    const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearWheel.rotation.x = Math.PI * 0.5;   // Rotate to align with forward direction
    rearWheel.position.set(0, -BIKE_CONFIG.bikeHeight/2, -BIKE_CONFIG.bikeLength/2);
    bikeGroup.add(rearWheel);
    
    // Add to scene
    scene.add(bikeGroup);
    
    // Player state
    const state = {
        position: new THREE.Vector3(planet.radius + BIKE_CONFIG.hoverHeight, 0, 0),
        direction: new THREE.Vector3(0, 0, 1),  // Forward direction (tangent to surface)
        up: new THREE.Vector3(1, 0, 0),         // Up direction (away from planet center)
        right: new THREE.Vector3(0, 1, 0),      // Right direction
        hoverPhase: Math.random() * Math.PI * 2,
        currentLeanAngle: 0,                    // Current lean angle for turning
        targetLeanAngle: 0                      // Target lean angle based on input
    };
    
    // Initialize position and orientation
    bikeGroup.position.copy(state.position);
    
    // Setup debug visualization
    let surfaceNormalLine, directionLine, rightLine;
    if (BIKE_CONFIG.debugAlignment) {
        const normalMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const normalGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, BIKE_CONFIG.alignmentLineLength, 0)
        ]);
        surfaceNormalLine = new THREE.Line(normalGeometry, normalMaterial);
        scene.add(surfaceNormalLine);
        
        const directionMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const directionGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, BIKE_CONFIG.alignmentLineLength)
        ]);
        directionLine = new THREE.Line(directionGeometry, directionMaterial);
        scene.add(directionLine);
        
        const rightMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        const rightGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(BIKE_CONFIG.alignmentLineLength, 0, 0)
        ]);
        rightLine = new THREE.Line(rightGeometry, rightMaterial);
        scene.add(rightLine);
    }
    
    // Keyboard controls
    const keys = {
        left: false,
        right: false
    };
    
    window.addEventListener('keydown', (event) => {
        switch(event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = true;
                break;
        }
    });
    
    window.addEventListener('keyup', (event) => {
        switch(event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = false;
                break;
        }
    });
    
    // Update function - based on original player.js but with proper bike orientation
    function update(deltaTime) {
        // Get current up vector (away from planet center)
        state.up = state.position.clone().normalize();
        
        // Handle steering and leaning
        if (keys.left) {
            state.direction.applyAxisAngle(state.up, BIKE_CONFIG.turnSpeed);
            state.targetLeanAngle = -BIKE_CONFIG.maxLeanAngle;
        } else if (keys.right) {
            state.direction.applyAxisAngle(state.up, -BIKE_CONFIG.turnSpeed);
            state.targetLeanAngle = BIKE_CONFIG.maxLeanAngle;
        } else {
            state.targetLeanAngle = 0;  // Return to upright when not turning
        }
        
        // Smoothly interpolate lean angle
        state.currentLeanAngle += (state.targetLeanAngle - state.currentLeanAngle) * BIKE_CONFIG.leanSpeed;
        
        // Ensure direction is perpendicular to up vector
        state.right.crossVectors(state.direction, state.up).normalize();
        state.direction.crossVectors(state.up, state.right).normalize();
        
        // Move forward
        const newPosition = state.position.clone().add(
            state.direction.clone().multiplyScalar(BIKE_CONFIG.speed)
        );
        
        // Project to surface
        const surfacePoint = planet.getNearestPointOnSurface(newPosition.normalize());
        const surfaceNormal = surfacePoint.clone().normalize();
        
        // Apply hover height
        state.hoverPhase += deltaTime * 0.001;
        const hoverWobble = Math.sin(state.hoverPhase) * BIKE_CONFIG.hoverWobble;
        const hoverDist = BIKE_CONFIG.hoverHeight + hoverWobble;
        
        state.position = surfacePoint.clone().add(
            surfaceNormal.multiplyScalar(hoverDist)
        );
        
        // Update visual position
        bikeGroup.position.copy(state.position);
        
        // Create base rotation matrix from orientation vectors
        const baseRotMatrix = new THREE.Matrix4().makeBasis(
            state.right,
            state.up,
            state.direction
        );
        
        // Apply lean rotation around forward axis
        const leanQuat = new THREE.Quaternion().setFromAxisAngle(
            state.direction,
            state.currentLeanAngle
        );
        
        // Combine base orientation with lean
        const finalQuat = new THREE.Quaternion().setFromRotationMatrix(baseRotMatrix);
        finalQuat.multiply(leanQuat);
        
        // Apply final orientation
        bikeGroup.quaternion.copy(finalQuat);
        
        // Update debug visualization
        if (BIKE_CONFIG.debugAlignment) {
            surfaceNormalLine.position.copy(state.position);
            directionLine.position.copy(state.position);
            rightLine.position.copy(state.position);
            
            surfaceNormalLine.geometry.setFromPoints([
                new THREE.Vector3(0, 0, 0),
                state.up.clone().multiplyScalar(BIKE_CONFIG.alignmentLineLength)
            ]);
            
            directionLine.geometry.setFromPoints([
                new THREE.Vector3(0, 0, 0),
                state.direction.clone().multiplyScalar(BIKE_CONFIG.alignmentLineLength)
            ]);
            
            rightLine.geometry.setFromPoints([
                new THREE.Vector3(0, 0, 0),
                state.right.clone().multiplyScalar(BIKE_CONFIG.alignmentLineLength)
            ]);
        }
        
        // Animate wheels
        frontWheel.rotation.x += BIKE_CONFIG.speed * deltaTime;
        rearWheel.rotation.x += BIKE_CONFIG.speed * deltaTime;
        
        return {
            position: state.position.clone(),
            direction: state.direction.clone(),
            up: state.up.clone()
        };
    }
    
    // Public API
    return {
        update,
        getPosition: () => state.position.clone(),
        getForwardDirection: () => state.direction.clone(),
        getUpDirection: () => state.up.clone(),
        getRightDirection: () => state.right.clone(),
        
        dispose: () => {
            scene.remove(bikeGroup);
            bikeMesh.geometry.dispose();
            bikeMesh.material.dispose();
            frontWheel.geometry.dispose();
            frontWheel.material.dispose();
            rearWheel.geometry.dispose();
            rearWheel.material.dispose();
            
            if (BIKE_CONFIG.debugAlignment) {
                scene.remove(surfaceNormalLine);
                scene.remove(directionLine);
                scene.remove(rightLine);
                surfaceNormalLine.geometry.dispose();
                surfaceNormalLine.material.dispose();
                directionLine.geometry.dispose();
                directionLine.material.dispose();
                rightLine.geometry.dispose();
                rightLine.material.dispose();
            }
        }
    };
} 
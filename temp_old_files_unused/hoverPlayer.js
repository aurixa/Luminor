/**
 * Luminor - Hover Player
 * Simplified version for stability
 */

import * as THREE from 'three';
import { createPlayerController } from './playerController.js';
import { createPhysicsWorld } from './physicsWorld.js';

/**
 * Creates the hovering player with physics
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} planet - The planet object
 * @param {THREE.Camera} camera - The camera for tracking
 * @returns {Object} The player object with update and control methods
 */
export function createHoverPlayer(scene, planet, camera) {
    console.log("Creating hover player with planet:", planet);
    
    // Create the physics world
    const physicsWorld = createPhysicsWorld(planet);
    
    // Create the player controller (physics)
    const playerController = createPlayerController(physicsWorld, scene);
    
    // Camera configuration - for a better third-person view
    const CAMERA_CONFIG = {
        distance: 100,        // Distance behind player (increased)
        height: 200,           // Height above player (increased)
        lookAheadDistance: 0, // Don't look ahead initially
        lerpFactor: 0.05,     // Smoother camera movement
        planetViewDistance: planet.radius * 2.5 // Distance for viewing whole planet
    };
    
    // Create player position on the positive X axis
    const initialRadius = physicsWorld.getHeightAt() + 20; // 20 units above surface
    const initialPosition = new THREE.Vector3(initialRadius, 0, 0);
    console.log("Setting initial player position:", initialPosition);
    playerController.setPosition(initialPosition);
    
    // Add debug visualization for player position - make it bigger and brighter
    const debugGeometry = new THREE.SphereGeometry(15, 16, 16);
    const debugMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 });
    const debugSphere = new THREE.Mesh(debugGeometry, debugMaterial);
    scene.add(debugSphere);
    debugSphere.position.copy(initialPosition);
    
    // Create debug axes to show player orientation
    const axesHelper = new THREE.AxesHelper(50); // Red = X, Green = Y, Blue = Z
    scene.add(axesHelper);
    
    // Add text labels for the axes
    const createLabel = (text, color) => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        context.fillStyle = color;
        context.font = '48px Arial';
        context.fillText(text, 0, 48);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        return new THREE.Sprite(material);
    };
    
    const xAxisLabel = createLabel('X', '#ff0000');
    const yAxisLabel = createLabel('Y', '#00ff00');
    const zAxisLabel = createLabel('Z', '#0000ff');
    
    xAxisLabel.scale.set(20, 10, 1);
    yAxisLabel.scale.set(20, 10, 1);
    zAxisLabel.scale.set(20, 10, 1);
    
    scene.add(xAxisLabel);
    scene.add(yAxisLabel);
    scene.add(zAxisLabel);
    
    // Create a wireframe sphere to represent the planet surface
    const planetSurfaceGeometry = new THREE.SphereGeometry(planet.radius, 32, 32);
    const planetSurfaceMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true,
        transparent: true,
        opacity: 0.1
    });
    const planetSurfaceWireframe = new THREE.Mesh(planetSurfaceGeometry, planetSurfaceMaterial);
    scene.add(planetSurfaceWireframe);
    
    // Set camera to a fixed position that shows both player and planet
    setCameraToShowPlanet();
    
    return {
        controller: playerController,
        
        update: function(deltaTime) {
            try {
                // Update the player
                playerController.update(deltaTime);
                
                // Update physics
                physicsWorld.update(deltaTime);
                
                // Update debug sphere and axes
                const pos = playerController.getThreePosition();
                if (pos && !isNaN(pos.x) && !isNaN(pos.y) && !isNaN(pos.z)) {
                    debugSphere.position.copy(pos);
                    
                    // Update axes helper position and orientation
                    axesHelper.position.copy(pos);
                    
                    // Get orientation vectors
                    const upDir = playerController.getUpDirection();
                    const forwardDir = playerController.getForwardDirection();
                    const rightDir = playerController.getRightDirection();
                    
                    if (upDir && forwardDir && rightDir) {
                        // Create rotation matrix from player's orientation vectors
                        const rotMatrix = new THREE.Matrix4().makeBasis(
                            rightDir,
                            upDir,
                            forwardDir
                        );
                        
                        // Apply to axes helper
                        axesHelper.quaternion.setFromRotationMatrix(rotMatrix);
                        
                        // Update axis labels
                        xAxisLabel.position.copy(pos).add(rightDir.clone().multiplyScalar(60));
                        yAxisLabel.position.copy(pos).add(upDir.clone().multiplyScalar(60));
                        zAxisLabel.position.copy(pos).add(forwardDir.clone().multiplyScalar(60));
                    }
                    
                    // Update camera to follow player
                    updateCamera(deltaTime);
                }
            } catch (error) {
                console.error("Error in hover player update:", error);
            }
        },
        
        reset: function() {
            console.log("Resetting player position");
            playerController.setPosition(initialPosition);
            debugSphere.position.copy(initialPosition);
            setCameraToShowPlanet();
        },
        
        getPosition: function() {
            return playerController.getThreePosition();
        },
        
        getForwardDirection: function() {
            return playerController.getForwardDirection();
        },
        
        getUpDirection: function() {
            return playerController.getUpDirection();
        },
        
        dispose: function() {
            playerController.dispose();
            scene.remove(debugSphere);
            scene.remove(axesHelper);
            scene.remove(xAxisLabel);
            scene.remove(yAxisLabel);
            scene.remove(zAxisLabel);
            scene.remove(planetSurfaceWireframe);
        }
    };
    
    // Set camera to show the whole planet
    function setCameraToShowPlanet() {
        const planetRadius = planet.radius || 800;
        
        // Position camera to get a nice view of both the planet and player
        // Use a wider angle to see more
        camera.position.set(initialPosition.x * 0.5, planetRadius, planetRadius * 1.2);
        camera.lookAt(0, 0, 0);
        
        console.log("Camera positioned to show planet:", camera.position);
    }
    
    // Update camera to follow player in third-person view
    function updateCamera(deltaTime) {
        try {
            const playerPos = playerController.getThreePosition();
            if (!playerPos) return;
            
            // Get player's up direction (away from planet center)
            const upDir = playerController.getUpDirection();
            if (!upDir) return;
            
            // Get player's forward direction
            const forwardDir = playerController.getForwardDirection();
            if (!forwardDir) return;
            
            // Get player's right direction
            const rightDir = playerController.getRightDirection();
            if (!rightDir) return;
            
            // Position camera above and behind player with a better angle to see the planet
            const cameraPosition = new THREE.Vector3();
            cameraPosition.copy(playerPos)                                           // Start at player position
                .add(upDir.clone().multiplyScalar(CAMERA_CONFIG.height))             // Move up in local space
                .add(forwardDir.clone().multiplyScalar(-CAMERA_CONFIG.distance))     // Move back in local space
                .add(rightDir.clone().multiplyScalar(CAMERA_CONFIG.distance * 0.5)); // Offset to the side a bit
            
            // Calculate look target: the player position with slight forward offset
            const lookTarget = new THREE.Vector3();
            lookTarget.copy(playerPos)
                .add(forwardDir.clone().multiplyScalar(CAMERA_CONFIG.lookAheadDistance));
            
            // Smoothly move camera
            camera.position.lerp(cameraPosition, CAMERA_CONFIG.lerpFactor);
            
            // Look at target
            camera.lookAt(lookTarget);
            
            // Set camera's up vector to match player's up direction
            camera.up.copy(upDir);
            
            // Debug log camera position occasionally
            if (Math.random() < 0.01) {
                console.log("Camera position:", camera.position);
                console.log("Camera lookAt:", lookTarget);
                console.log("Player position:", playerPos);
                console.log("Player up direction:", upDir);
                console.log("Player forward direction:", forwardDir);
            }
        } catch (error) {
            console.error("Error updating camera:", error);
        }
    }
} 
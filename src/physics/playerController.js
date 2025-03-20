/**
 * Luminor - Hover Player Controller
 * Simplified physics-based hover controller for stability
 */

import * as CANNON from 'cannon-es';
import * as THREE from 'three';

// Player physics configuration - simplified for stability
export const PLAYER_CONFIG = {
    // Basic physics properties
    mass: 10,
    
    // Dimensions for the player's collision shape
    dimensions: {
        radius: 10 // Simplified to just a sphere
    },
    
    // Simplified movement properties
    movement: {
        speed: 40,        // Reduced speed for stability
        turnSpeed: 2.0    // Turn speed
    },
    
    // Hover properties simplified
    hover: {
        height: 20,       // Increased hover height for better visibility
        springStrength: 50,
        damping: 5
    }
};

/**
 * Creates the player physics controller
 * @param {Object} physicsWorld - The physics world object
 * @param {THREE.Scene} scene - The Three.js scene for visualization
 * @returns {Object} The player controller
 */
export function createPlayerController(physicsWorld, scene) {
    console.log("Creating player controller");
    
    // Create a stable physics body (sphere for simplicity)
    const playerBody = new CANNON.Body({
        mass: PLAYER_CONFIG.mass,
        position: new CANNON.Vec3(0, 0, 0),
        shape: new CANNON.Sphere(PLAYER_CONFIG.dimensions.radius),
        linearDamping: 0.1,    // Add damping to prevent excessive movement
        angularDamping: 0.1    // Dampen rotation
    });
    
    // Add the body to the physics world
    physicsWorld.addBody(playerBody);
    
    // Create storage for last good positions and directions
    const lastGoodPosition = new THREE.Vector3(physicsWorld.getHeightAt() + 20, 0, 0);
    const lastGoodForward = new THREE.Vector3(1, 0, 0);
    const lastGoodUp = new THREE.Vector3(0, 1, 0);
    
    // Input state for controls
    const input = {
        left: false,
        right: false,
        accelerate: false,
        brake: false
    };
    
    // Setup keyboard controls
    document.addEventListener('keydown', (event) => {
        switch(event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                input.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                input.right = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
                input.accelerate = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                input.brake = true;
                break;
        }
    });
    
    document.addEventListener('keyup', (event) => {
        switch(event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                input.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                input.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                input.accelerate = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                input.brake = false;
                break;
        }
    });
    
    // Public API
    return {
        // Get the player's position as a THREE.Vector3
        getThreePosition: function() {
            try {
                const pos = playerBody.position;
                
                // Safety check for NaN
                if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
                    console.warn("Invalid physics position detected, using last known good position");
                    return lastGoodPosition.clone();
                }
                
                // Update last good position
                lastGoodPosition.set(pos.x, pos.y, pos.z);
                return lastGoodPosition.clone();
            } catch (error) {
                console.error("Error getting player position:", error);
                return lastGoodPosition.clone();
            }
        },
        
        // Get the player's forward direction
        getForwardDirection: function() {
            try {
                // Get the quaternion
                const q = playerBody.quaternion;
                
                // Check for NaN
                if (isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w)) {
                    return lastGoodForward.clone();
                }
                
                // Convert to THREE quaternion and get forward vector
                const threeQuat = new THREE.Quaternion(q.x, q.y, q.z, q.w);
                const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(threeQuat);
                
                // Update last good forward
                lastGoodForward.copy(forward);
                return forward;
            } catch (error) {
                console.error("Error getting forward direction:", error);
                return lastGoodForward.clone();
            }
        },
        
        // Get the player's up direction (direction away from planet center)
        getUpDirection: function() {
            try {
                const pos = playerBody.position;
                
                // Check for NaN
                if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
                    return lastGoodUp.clone();
                }
                
                // Up is same as position direction (away from planet center)
                const len = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
                if (len < 0.001) {
                    return lastGoodUp.clone();
                }
                
                const up = new THREE.Vector3(pos.x / len, pos.y / len, pos.z / len);
                
                // Update last good up
                lastGoodUp.copy(up);
                return up;
            } catch (error) {
                console.error("Error getting up direction:", error);
                return lastGoodUp.clone();
            }
        },
        
        // Set the player's position and orient it to stand upright on the planet
        setPosition: function(position) {
            try {
                if (!position || isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
                    console.warn("Attempted to set invalid position:", position);
                    return;
                }
                
                // Set position
                playerBody.position.set(position.x, position.y, position.z);
                
                // Reset velocities
                playerBody.velocity.set(0, 0, 0);
                playerBody.angularVelocity.set(0, 0, 0);
                
                // Orient the player to stand properly on the planet surface
                // The "up" direction for the player should be away from the planet center
                // (opposite direction of gravity)
                alignWithPlanetSurface();
                
                // Update last good position
                lastGoodPosition.copy(position);
                
                console.log("Player position set to:", position);
            } catch (error) {
                console.error("Error setting player position:", error);
            }
        },
        
        // Update the player
        update: function(deltaTime) {
            try {
                // Apply hover force first to maintain correct height above terrain
                applyHoverForce();
                
                // Always align with planet surface BEFORE applying thrust and steering
                // This ensures the player is always oriented correctly
                alignWithPlanetSurface();
                
                // Handle steering (left/right input)
                handleSteering();
                
                // Apply constant forward thrust AFTER alignment and steering
                applyThrust();
                
                // Apply alignment one more time to ensure player stays perfectly upright
                // even after physics forces are applied
                alignWithPlanetSurface();
                
                // Force angular velocity to zero to prevent any unintended rotation from physics
                playerBody.angularVelocity.set(0, 0, 0);
            } catch (error) {
                console.error("Error updating player:", error);
            }
        },
        
        // Get the right direction
        getRightDirection: function() {
            try {
                const forward = this.getForwardDirection();
                const up = this.getUpDirection();
                return new THREE.Vector3().crossVectors(forward, up).normalize();
            } catch (error) {
                console.error("Error getting right direction:", error);
                return new THREE.Vector3(1, 0, 0);
            }
        },
        
        // Clean up resources
        dispose: function() {
            physicsWorld.removeBody(playerBody);
        }
    };
    
    // Handle steering input (turning left/right)
    function handleSteering() {
        try {
            // Calculate steering amount from input
            let steeringAmount = 0;
            if (input.left) steeringAmount -= 1;
            if (input.right) steeringAmount += 1;
            
            if (steeringAmount === 0) return;
            
            // Calculate up direction (away from planet center)
            const pos = playerBody.position;
            if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) return;
            
            const distFromCenter = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
            if (distFromCenter < 0.001) return;
            
            const upDir = new THREE.Vector3(
                pos.x / distFromCenter, 
                pos.y / distFromCenter, 
                pos.z / distFromCenter
            );
            
            // Simply rotate around the up vector by a fixed amount
            // This is the cleanest way to handle steering without physics interference
            const turnAngle = steeringAmount * PLAYER_CONFIG.movement.turnSpeed * 0.05;
            const steeringRotation = new THREE.Quaternion().setFromAxisAngle(upDir, turnAngle);
            
            // Apply rotation directly to quaternion
            const currentQ = playerBody.quaternion;
            const playerQuat = new THREE.Quaternion(currentQ.x, currentQ.y, currentQ.z, currentQ.w);
            playerQuat.premultiply(steeringRotation);
            
            // Set the new quaternion
            playerBody.quaternion.set(
                playerQuat.x,
                playerQuat.y,
                playerQuat.z,
                playerQuat.w
            );
            
            // Clear any angular velocity to prevent physics interference
            playerBody.angularVelocity.set(0, 0, 0);
        } catch (error) {
            console.error("Error handling steering:", error);
        }
    }
    
    // Apply thrust force to move player along the planet surface
    function applyThrust() {
        try {
            // Get the player's position
            const pos = playerBody.position;
            
            // Safety checks for valid position
            if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
                console.warn("Invalid position for thrust");
                return;
            }
            
            // Get the quaternion
            const q = playerBody.quaternion;
            
            // Check for NaN quaternion
            if (isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w)) {
                console.warn("Invalid quaternion for thrust");
                return;
            }
            
            // Forward vector - only use the Z direction from the model's local space
            // This ensures we move in the direction the player is facing
            const forwardLocal = new CANNON.Vec3(0, 0, 1);
            const forwardWorld = q.vmult(forwardLocal);
            
            // Check for NaN
            if (isNaN(forwardWorld.x) || isNaN(forwardWorld.y) || isNaN(forwardWorld.z)) {
                console.warn("Invalid forward direction for thrust");
                return;
            }
            
            // Calculate up vector (radial from planet center)
            const distFromCenter = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
            if (distFromCenter < 0.001) return;
            
            const radialDir = new CANNON.Vec3(pos.x / distFromCenter, pos.y / distFromCenter, pos.z / distFromCenter);
            
            // Ensure forward vector is perpendicular to up vector (tangent to surface)
            // by removing any radial component
            const radialComponent = forwardWorld.dot(radialDir);
            const tangentForward = new CANNON.Vec3(
                forwardWorld.x - radialDir.x * radialComponent,
                forwardWorld.y - radialDir.y * radialComponent,
                forwardWorld.z - radialDir.z * radialComponent
            );
            
            // Normalize the tangent forward vector
            const tangentLength = Math.sqrt(
                tangentForward.x * tangentForward.x + 
                tangentForward.y * tangentForward.y + 
                tangentForward.z * tangentForward.z
            );
            
            if (tangentLength < 0.001) {
                console.warn("Invalid tangent forward for thrust");
                return;
            }
            
            tangentForward.x /= tangentLength;
            tangentForward.y /= tangentLength;
            tangentForward.z /= tangentLength;
            
            // Use a fixed thrust magnitude for constant forward movement
            const thrustMagnitude = PLAYER_CONFIG.movement.speed;
            
            // Apply the thrust force directly along the tangent
            const thrustForce = new CANNON.Vec3(
                tangentForward.x * thrustMagnitude,
                tangentForward.y * thrustMagnitude,
                tangentForward.z * thrustMagnitude
            );
            
            // Apply the force
            playerBody.applyForce(thrustForce);
            
            // Debug occasionally
            if (Math.random() < 0.001) {
                console.log("Applied thrust:", thrustForce);
                console.log("Thrust direction:", tangentForward);
                console.log("Player velocity:", playerBody.velocity);
            }
        } catch (error) {
            console.error("Error applying thrust:", error);
        }
    }
    
    // Apply hover force to keep player above the planet's actual terrain
    function applyHoverForce() {
        try {
            // Get player position
            const pos = playerBody.position;
            
            // Safety check for NaN
            if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
                return;
            }
            
            // Calculate distance from center and direction
            const distFromCenter = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
            
            // Skip if distance is too small (avoid division by zero)
            if (distFromCenter < 0.001) {
                return;
            }
            
            // Calculate unit direction from center to player (up vector)
            const upDirection = new THREE.Vector3(
                pos.x / distFromCenter,
                pos.y / distFromCenter,
                pos.z / distFromCenter
            );
            
            // Get actual terrain height at this direction
            let terrainHeight;
            
            // Try to get terrain height from planet
            if (physicsWorld.planet && physicsWorld.planet.getNearestPointOnSurface) {
                try {
                    // Convert THREE vector to position suitable for planet function
                    const position = new THREE.Vector3(pos.x, pos.y, pos.z);
                    const surfacePoint = physicsWorld.planet.getNearestPointOnSurface(position);
                    
                    // Check if we got a valid surface point
                    if (surfacePoint && 
                        !isNaN(surfacePoint.x) && 
                        !isNaN(surfacePoint.y) && 
                        !isNaN(surfacePoint.z)) {
                        
                        terrainHeight = surfacePoint.length();
                    } else {
                        // Fallback to basic height
                        terrainHeight = physicsWorld.getHeightAt();
                    }
                } catch (error) {
                    console.warn("Error getting surface point:", error);
                    terrainHeight = physicsWorld.getHeightAt();
                }
            } else {
                // Fallback to basic radius
                terrainHeight = physicsWorld.getHeightAt();
            }
            
            // Ensure we have a valid terrain height
            if (isNaN(terrainHeight) || terrainHeight <= 0) {
                terrainHeight = physicsWorld.getHeightAt();
            }
            
            // Calculate the hover error (how far from ideal hover height)
            const targetDistance = terrainHeight + PLAYER_CONFIG.hover.height;
            const hoverError = targetDistance - distFromCenter;
            
            // Apply hover force (stronger when below target height, gentler when above)
            const hoverStrength = hoverError < 0 
                ? PLAYER_CONFIG.hover.springStrength * 1.5 // Stronger when too low (prevent falling through)
                : PLAYER_CONFIG.hover.springStrength;      // Normal strength when too high
            
            // Directional hover force
            const hoverForce = new CANNON.Vec3(
                upDirection.x * hoverError * hoverStrength,
                upDirection.y * hoverError * hoverStrength,
                upDirection.z * hoverError * hoverStrength
            );
            
            // Apply hover force
            playerBody.applyForce(hoverForce);
            
            // Apply radial damping to prevent bouncing
            const vel = playerBody.velocity;
            
            // Project velocity onto radial direction to get radial velocity component
            const radialVel = upDirection.x * vel.x + upDirection.y * vel.y + upDirection.z * vel.z;
            
            // Create damping force - apply extra damping when moving toward the planet
            const dampingStrength = radialVel < 0 
                ? PLAYER_CONFIG.hover.damping * 2.0 // Stronger damping when falling (prevent oscillation)
                : PLAYER_CONFIG.hover.damping;       // Normal damping when rising
                
            const dampingForce = new CANNON.Vec3(
                -upDirection.x * radialVel * dampingStrength,
                -upDirection.y * radialVel * dampingStrength,
                -upDirection.z * radialVel * dampingStrength
            );
            
            // Apply damping force
            playerBody.applyForce(dampingForce);
            
            // Debug visualization (uncomment if needed)
            // if (Math.random() < 0.01) {
            //     console.log("Hover: distance=", distFromCenter, 
            //                 "target=", targetDistance, 
            //                 "error=", hoverError,
            //                 "radialVel=", radialVel);
            // }
            
        } catch (error) {
            console.error("Error applying hover force:", error);
        }
    }
    
    // Orient the player to stand properly on the planet surface
    function alignWithPlanetSurface() {
        try {
            // Get the player's position
            const pos = playerBody.position;
            
            // Safety check for NaN
            if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
                return;
            }
            
            // Calculate distance from center and radial direction (up vector)
            const distFromCenter = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
            
            // Skip if distance is too small (avoid division by zero)
            if (distFromCenter < 0.001) {
                return;
            }
            
            // Get the radial up direction
            const up = new THREE.Vector3(pos.x / distFromCenter, pos.y / distFromCenter, pos.z / distFromCenter);
            
            // Store current yaw angle
            // We need to extract the current rotation around the up axis (yaw)
            // so we can preserve only this component
            const currentYaw = extractYawAngle(playerBody.quaternion, up);
            
            // Create the rotation to align the player with the up direction
            // This makes the player's Y-axis align with the up vector (radial direction)
            const alignUpQuat = new THREE.Quaternion();
            alignUpQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
            
            // Now create a rotation around the up vector to preserve the yaw
            const yawQuat = new THREE.Quaternion();
            yawQuat.setFromAxisAngle(up, currentYaw);
            
            // Combine the alignUp and yaw rotations
            // First align with up, then apply the yaw rotation
            const finalQuat = new THREE.Quaternion();
            finalQuat.multiplyQuaternions(yawQuat, alignUpQuat);
            
            // Set the player's orientation directly (no damping)
            // This ensures the player is ALWAYS perfectly aligned
            playerBody.quaternion.copy(finalQuat);
            
            // Zero out angular velocity to prevent any physics-based rotation
            playerBody.angularVelocity.set(0, 0, 0);
        } catch (error) {
            console.error("Error aligning player with planet surface:", error);
        }
        
        // Helper function to extract the yaw angle from current orientation
        function extractYawAngle(quaternion, upDirection) {
            // Create THREE quaternion from CANNON quaternion
            const quat = new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
            
            // Get the current forward direction in world space
            const worldForward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
            
            // Project forward onto tangent plane (perpendicular to up)
            const forwardDotUp = worldForward.dot(upDirection);
            const tangentForward = new THREE.Vector3(
                worldForward.x - upDirection.x * forwardDotUp,
                worldForward.y - upDirection.y * forwardDotUp,
                worldForward.z - upDirection.z * forwardDotUp
            );
            
            // If tangent forward is too small, return 0 (no yaw)
            if (tangentForward.lengthSq() < 0.001) {
                return 0;
            }
            
            tangentForward.normalize();
            
            // Create a reference forward vector (tangent to surface)
            // We'll use this to calculate the yaw angle
            const referenceForward = new THREE.Vector3(1, 0, 0);
            // Make sure it's perpendicular to up
            const refDotUp = referenceForward.dot(upDirection);
            referenceForward.set(
                referenceForward.x - upDirection.x * refDotUp,
                referenceForward.y - upDirection.y * refDotUp,
                referenceForward.z - upDirection.z * refDotUp
            ).normalize();
            
            // Calculate the right vector for both directions
            const tangentRight = new THREE.Vector3().crossVectors(upDirection, tangentForward).normalize();
            const referenceRight = new THREE.Vector3().crossVectors(upDirection, referenceForward).normalize();
            
            // Calculate the angle between the two forward vectors
            let angle = Math.atan2(
                tangentForward.dot(referenceRight),
                tangentForward.dot(referenceForward)
            );
            
            return angle;
        }
    }
} 
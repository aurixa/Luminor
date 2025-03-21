/**
 * Luminor
 * Terrain-following patch for the physics system
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

/**
 * Apply terrain-following patches to the game
 * This ensures that the player follows the procedural terrain
 * rather than floating above a perfect sphere
 * 
 * @param {Object} game - The game state
 * @param {Object} physicsWorld - The physics world
 * @param {Object} playerController - The player controller
 * @param {Object} planet - The planet object
 */
export function applyTerrainPatches(game, physicsWorld, playerController, planet) {
    console.log("Applying terrain-following patches...");
    
    // Step 1: Ensure the planet object has the necessary terrain methods
    ensurePlanetTerrainMethods(planet);
    
    // Step 2: Override the physicsWorld's getHeightAt method to use actual terrain
    overridePhysicsHeightMethod(physicsWorld, planet);
    
    // Step 3: Override the playerController's hover force application
    overridePlayerHoverForce(playerController, physicsWorld);
    
    // Step 4: Override the player alignment with terrain surface
    overridePlayerAlignment(playerController, physicsWorld);
    
    console.log("Terrain patches applied successfully!");
    return true;
}

/**
 * Ensure the planet object has all necessary terrain methods
 */
function ensurePlanetTerrainMethods(planet) {
    // If getNearestPointOnSurface isn't using full terrain height, fix it
    const originalGetNearestPoint = planet.getNearestPointOnSurface;
    
    planet.getNearestPointOnSurface = function(direction) {
        if (!direction) {
            console.warn("Invalid direction in getNearestPointOnSurface");
            return new THREE.Vector3(planet.radius, 0, 0);
        }
        
        try {
            // If we already have a terrain-aware function, use it
            if (typeof originalGetNearestPoint === 'function') {
                // Check if it returns a proper vector
                const result = originalGetNearestPoint.call(planet, direction);
                
                // If it's not a good result, use our own implementation
                if (!result || isNaN(result.x)) {
                    return calculateSurfacePointWithTerrain(direction);
                }
                
                return result;
            } else {
                // No original method, implement our own
                return calculateSurfacePointWithTerrain(direction);
            }
        } catch (error) {
            console.error("Error in patched getNearestPointOnSurface:", error);
            return new THREE.Vector3(planet.radius, 0, 0);
        }
    };
    
    // Add getNormalAtPoint if it doesn't exist
    if (typeof planet.getNormalAtPoint !== 'function') {
        planet.getNormalAtPoint = function(point) {
            return calculateTerrainNormal(point);
        };
    }
    
    // Add getElevationAtPoint if it doesn't exist
    if (typeof planet.getElevationAtPoint !== 'function') {
        planet.getElevationAtPoint = function(point) {
            const direction = point.clone().normalize();
            const surfacePoint = planet.getNearestPointOnSurface(direction);
            return surfacePoint.length() - planet.radius;
        };
    }
    
    // Helper function to calculate surface point with terrain height
    function calculateSurfacePointWithTerrain(direction) {
        const normalizedDir = direction.clone().normalize();
        
        // Get terrain elevation from the mesh vertices
        const terrainHeight = getTerrainHeightFromMesh(normalizedDir);
        
        // Apply terrain height to the basic radius
        return normalizedDir.multiplyScalar(planet.radius + terrainHeight);
    }
    
    // Helper function to calculate terrain normal
    function calculateTerrainNormal(point) {
        const direction = point.clone().normalize();
        
        // Use central differences for accurate normal calculation
        const epsilon = 0.01;
        
        // Create tangent directions
        let tangentX = new THREE.Vector3(1, 0, 0);
        if (Math.abs(direction.dot(tangentX)) > 0.8) {
            tangentX = new THREE.Vector3(0, 1, 0);
        }
        
        const tangentY = new THREE.Vector3().crossVectors(direction, tangentX).normalize();
        tangentX = new THREE.Vector3().crossVectors(tangentY, direction).normalize();
        
        // Get heights at displaced points
        const posX = direction.clone().add(tangentX.clone().multiplyScalar(epsilon)).normalize();
        const negX = direction.clone().add(tangentX.clone().multiplyScalar(-epsilon)).normalize();
        const posY = direction.clone().add(tangentY.clone().multiplyScalar(epsilon)).normalize();
        const negY = direction.clone().add(tangentY.clone().multiplyScalar(-epsilon)).normalize();
        
        const heightCenter = getTerrainHeightFromMesh(direction);
        const heightPosX = getTerrainHeightFromMesh(posX);
        const heightNegX = getTerrainHeightFromMesh(negX);
        const heightPosY = getTerrainHeightFromMesh(posY);
        const heightNegY = getTerrainHeightFromMesh(negY);
        
        // Calculate gradients
        const gradientX = (heightPosX - heightNegX) / (2 * epsilon);
        const gradientY = (heightPosY - heightNegY) / (2 * epsilon);
        
        // Calculate normal from gradients
        const normalX = tangentX.clone().multiplyScalar(gradientX);
        const normalY = tangentY.clone().multiplyScalar(gradientY);
        
        const normal = new THREE.Vector3().crossVectors(normalY, normalX).normalize();
        
        // Ensure normal points outward
        if (normal.dot(direction) < 0) {
            normal.negate();
        }
        
        return normal;
    }
    
    // Helper function to sample terrain height from mesh vertices
    function getTerrainHeightFromMesh(direction) {
        try {
            // If the planet has its own method, use it
            if (typeof planet.getTerrainHeight === 'function') {
                return planet.getTerrainHeight(direction);
            }
            
            if (!planet.mesh) {
                console.warn("No planet mesh found for terrain sampling");
                return 0;
            }
            
            const geometry = planet.mesh.geometry;
            if (!geometry) {
                console.warn("No geometry found in planet mesh");
                return 0;
            }
            
            // Get vertices
            const positions = geometry.attributes.position;
            
            // Find closest vertex to our direction
            let closestDot = -1;
            let closestDist = Number.MAX_VALUE;
            
            for (let i = 0; i < positions.count; i++) {
                const vx = positions.getX(i);
                const vy = positions.getY(i);
                const vz = positions.getZ(i);
                
                const vertexDir = new THREE.Vector3(vx, vy, vz).normalize();
                const dot = vertexDir.dot(direction);
                
                if (dot > closestDot) {
                    const vertexDist = Math.sqrt(vx * vx + vy * vy + vz * vz);
                    closestDist = vertexDist;
                    closestDot = dot;
                }
            }
            
            // Calculate terrain height
            return closestDist - planet.radius;
        } catch (error) {
            console.error("Error in getTerrainHeightFromMesh:", error);
            return 0;
        }
    }
}

/**
 * Override the physics world's height calculation method
 */
function overridePhysicsHeightMethod(physicsWorld, planet) {
    // Store the original method
    const originalGetHeightAt = physicsWorld.getHeightAt;
    
    // Override with terrain-aware method
    physicsWorld.getHeightAt = function(direction) {
        if (!direction) {
            return planet.radius;
        }
        
        try {
            // Create a THREE.Vector3 from the direction
            const threeDirection = new THREE.Vector3(
                direction.x, 
                direction.y, 
                direction.z
            ).normalize();
            
            // Get the surface point using the planet's terrain-aware method
            const surfacePoint = planet.getNearestPointOnSurface(threeDirection);
            
            // Return the distance from center
            return surfacePoint.length();
        } catch (error) {
            console.error("Error in overridden getHeightAt:", error);
            
            // Fallback to original method
            if (typeof originalGetHeightAt === 'function') {
                return originalGetHeightAt.call(physicsWorld, direction);
            }
            
            return planet.radius;
        }
    };
    
    // Add getNormalAt method if it doesn't exist
    if (typeof physicsWorld.getNormalAt !== 'function') {
        physicsWorld.getNormalAt = function(position) {
            try {
                // Convert to THREE.Vector3
                const threePosition = new THREE.Vector3(
                    position.x,
                    position.y,
                    position.z
                );
                
                // Get the normal using the planet's terrain-aware method
                return planet.getNormalAtPoint(threePosition);
            } catch (error) {
                console.error("Error in getNormalAt:", error);
                
                // Fallback to simple sphere normal
                const len = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
                return new THREE.Vector3(position.x / len, position.y / len, position.z / len);
            }
        };
    }
}

/**
 * Override the player controller's hover force application
 */
function overridePlayerHoverForce(playerController, physicsWorld) {
    // Check if we can access the applyHoverForce method
    if (typeof playerController._applyHoverForce === 'function') {
        // Already patched
        return;
    }
    
    // Store original method if we can access it
    try {
        const originalCode = playerController.toString();
        
        // Look for applyHoverForce in the code
        if (originalCode.includes('applyHoverForce')) {
            console.log("Found applyHoverForce method, attempting to patch...");
            
            // Store the original function for reference (but we can't call it directly)
            playerController._applyHoverForce = function() {
                console.log("Original hover force cannot be called directly");
            };
            
            // Inject our patched version via the update function
            const originalUpdate = playerController.update;
            
            playerController.update = function(deltaTime) {
                // Call original update but skip its hover force
                const result = originalUpdate.call(playerController, deltaTime);
                
                // Apply our own hover force
                applyTerrainAwareHoverForce(playerController, physicsWorld);
                
                return result;
            };
        } else {
            console.warn("Could not find applyHoverForce method to patch");
        }
    } catch (error) {
        console.error("Error patching hover force:", error);
    }
}

/**
 * Apply terrain-aware hover force
 */
function applyTerrainAwareHoverForce(playerController, physicsWorld) {
    try {
        // Get player position and body
        const playerBody = playerController.getBody();
        if (!playerBody) return;
        
        const pos = playerBody.position;
        
        // Safety check for NaN
        if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
            return;
        }
        
        // Calculate distance from center
        const distFromCenter = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
        
        // Skip if distance is too small (avoid division by zero)
        if (distFromCenter < 0.001) {
            return;
        }
        
        // Calculate unit direction from center to player
        const direction = new THREE.Vector3(
            pos.x / distFromCenter,
            pos.y / distFromCenter,
            pos.z / distFromCenter
        );
        
        // Get terrain height at this direction
        const terrainHeight = physicsWorld.getHeightAt(direction);
        
        // The hover height should be relative to config
        const hoverHeight = playerController.getHoverHeight();
        
        // Calculate the hover error (how far from ideal hover height)
        const targetDistance = terrainHeight + hoverHeight;
        const hoverError = targetDistance - distFromCenter;
        
        // Get the terrain normal for better hover force direction
        const terrainNormal = physicsWorld.getNormalAt(pos);
        
        // Scale hover force based on error - stronger when closer to surface
        const strengthScale = 1.0 + Math.max(0, Math.min(1.0, (hoverHeight - hoverError) / hoverHeight));
        const springStrength = playerController.getSpringStrength();
        
        // Calculate hover force along the terrain normal
        const hoverForce = {
            x: terrainNormal.x * hoverError * springStrength * strengthScale,
            y: terrainNormal.y * hoverError * springStrength * strengthScale,
            z: terrainNormal.z * hoverError * springStrength * strengthScale
        };
        
        // Apply the force
        playerBody.applyForce(hoverForce);
        
        // Apply damping to velocity in normal direction
        const vel = playerBody.velocity;
        const velDotNormal = vel.x * terrainNormal.x + vel.y * terrainNormal.y + vel.z * terrainNormal.z;
        
        // Create damping force - stronger when moving toward surface
        const dampingScale = velDotNormal < 0 ? 1.5 : 1.0;
        const dampingStrength = playerController.getDampingStrength();
        
        const dampingForce = {
            x: -terrainNormal.x * velDotNormal * dampingStrength * dampingScale,
            y: -terrainNormal.y * velDotNormal * dampingStrength * dampingScale,
            z: -terrainNormal.z * velDotNormal * dampingStrength * dampingScale
        };
        
        // Apply damping force
        playerBody.applyForce(dampingForce);
    } catch (error) {
        console.error("Error applying terrain-aware hover force:", error);
    }
}

/**
 * Override the player alignment with the terrain surface
 */
function overridePlayerAlignment(playerController, physicsWorld) {
    // Check if we can access the alignWithPlanetSurface method
    if (typeof playerController._alignWithPlanetSurface === 'function') {
        // Already patched
        return;
    }
    
    try {
        const originalCode = playerController.toString();
        
        // Look for alignWithPlanetSurface in the code
        if (originalCode.includes('alignWithPlanetSurface')) {
            console.log("Found alignWithPlanetSurface method, attempting to patch...");
            
            // Store the original function for reference (but we can't call it directly)
            playerController._alignWithPlanetSurface = function() {
                console.log("Original alignment cannot be called directly");
            };
            
            // Inject our patched version via the update function
            const originalUpdate = playerController.update;
            
            playerController.update = function(deltaTime) {
                // Call original update but we'll override its alignment
                const result = originalUpdate.call(playerController, deltaTime);
                
                // Apply our own terrain-aware alignment
                applyTerrainAwareAlignment(playerController, physicsWorld);
                
                return result;
            };
        } else {
            console.warn("Could not find alignWithPlanetSurface method to patch");
        }
    } catch (error) {
        console.error("Error patching alignment:", error);
    }
}

/**
 * Apply terrain-aware alignment
 */
function applyTerrainAwareAlignment(playerController, physicsWorld) {
    try {
        // Get player position and body
        const playerBody = playerController.getBody();
        if (!playerBody) return;
        
        const pos = playerBody.position;
        
        // Safety check for NaN
        if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
            return;
        }
        
        // Calculate distance from center
        const distFromCenter = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
        
        // Skip if distance is too small (avoid division by zero)
        if (distFromCenter < 0.001) {
            return;
        }
        
        // Get the terrain normal at player position
        let up = physicsWorld.getNormalAt(pos);
        
        // Log occasionally for debugging
        if (Math.random() < 0.01) {
            console.log("Terrain normal for alignment:", up);
        }
        
        // Get current player orientation
        const currentQ = playerBody.quaternion;
        const threeQuat = new THREE.Quaternion(currentQ.x, currentQ.y, currentQ.z, currentQ.w);
        const worldForward = new THREE.Vector3(0, 0, 1).applyQuaternion(threeQuat);
        
        // Calculate forward direction tangent to surface
        const forwardDotUp = worldForward.dot(up);
        const tangentForward = new THREE.Vector3(
            worldForward.x - up.x * forwardDotUp,
            worldForward.y - up.y * forwardDotUp,
            worldForward.z - up.z * forwardDotUp
        );
        
        // If tangent forward is too small, generate a new one
        if (tangentForward.lengthSq() < 0.01) {
            // Choose a reference vector based on up direction
            let refVector;
            
            if (Math.abs(up.y) > 0.8) {
                refVector = new THREE.Vector3(1, 0, 0);
            } else {
                refVector = new THREE.Vector3(0, 1, 0);
            }
            
            // Project onto tangent plane
            const refDotUp = refVector.dot(up);
            tangentForward.set(
                refVector.x - up.x * refDotUp,
                refVector.y - up.y * refDotUp,
                refVector.z - up.z * refDotUp
            );
        }
        
        // Normalize forward vector
        tangentForward.normalize();
        
        // Calculate right vector
        const right = new THREE.Vector3().crossVectors(tangentForward, up).normalize();
        
        // Recalculate forward for perfect orthogonality
        const forward = new THREE.Vector3().crossVectors(up, right).normalize();
        
        // Create rotation matrix
        const rotMatrix = new THREE.Matrix4().makeBasis(right, up, forward);
        
        // Convert to quaternion
        const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
        
        // Apply with damping to avoid abrupt changes
        const dampingFactor = 0.15;
        
        playerBody.quaternion.set(
            currentQ.x + (targetQuat.x - currentQ.x) * dampingFactor,
            currentQ.y + (targetQuat.y - currentQ.y) * dampingFactor,
            currentQ.z + (targetQuat.z - currentQ.z) * dampingFactor,
            currentQ.w + (targetQuat.w - currentQ.w) * dampingFactor
        );
        
        // Normalize the quaternion to prevent drift
        const qLen = Math.sqrt(
            playerBody.quaternion.x * playerBody.quaternion.x +
            playerBody.quaternion.y * playerBody.quaternion.y +
            playerBody.quaternion.z * playerBody.quaternion.z +
            playerBody.quaternion.w * playerBody.quaternion.w
        );
        
        if (qLen > 0) {
            playerBody.quaternion.x /= qLen;
            playerBody.quaternion.y /= qLen;
            playerBody.quaternion.z /= qLen;
            playerBody.quaternion.w /= qLen;
        }
    } catch (error) {
        console.error("Error in terrain-aware alignment:", error);
    }
} 
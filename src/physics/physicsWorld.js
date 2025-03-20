/**
 * Luminor - Physics World
 * Handles the Cannon.js physics world setup and planet gravity
 * Simplified version for stability
 */

import * as CANNON from 'cannon-es';
import * as THREE from 'three';

// Physics constants - simplified for stability
export const PHYSICS_CONFIG = {
    // Physics timestep (1/60 for 60 updates per second)
    timeStep: 1/60,
    
    // Number of iterations for contact solving
    solverIterations: 10,
    
    // Gravity strength towards planet center (lower for stability)
    gravityStrength: 20,
    
    // For optimization: only calculate collisions for objects that are potentially colliding
    broadphase: 'naive', // Simpler broadphase for stability
    
    // For optimization: sleep settings for bodies that are not moving
    sleepSpeedLimit: 0.1,
    sleepTimeLimit: 1
};

/**
 * Creates and configures the physics world
 * @param {Object} planet - The planet object with radius info
 * @returns {Object} The configured physics world and helper methods
 */
export function createPhysicsWorld(planet) {
    console.log("Creating physics world with planet:", planet);
    
    // Create a new physics world with basic settings
    const world = new CANNON.World();
    
    // Set gravity to zero (we'll handle it manually for spherical gravity)
    world.gravity.set(0, 0, 0);
    
    // Configure the world - basic settings for stability
    world.allowSleep = true;
    world.solver.iterations = PHYSICS_CONFIG.solverIterations;
    
    // Create the planet body (as a static body)
    const planetBody = new CANNON.Body({
        mass: 0,  // Static body (mass = 0)
        type: CANNON.Body.STATIC,
        position: new CANNON.Vec3(0, 0, 0)
    });
    
    // Add a sphere shape with the planet radius
    const radius = planet.radius || 800;
    console.log("Creating planet physics body with radius:", radius);
    planetBody.addShape(new CANNON.Sphere(radius));
    
    // Add the planet to the world
    world.addBody(planetBody);
    
    // Public API
    return {
        world: world,
        planetBody: planetBody,
        planet: planet, // Store reference to the planet object for terrain queries
        
        // Apply spherical gravity to all bodies
        applySphericalGravity: function() {
            // Iterate through all bodies, applying gravity towards planet center
            for (let i = 0; i < world.bodies.length; i++) {
                const body = world.bodies[i];
                
                // Skip applying gravity to the planet itself
                if (body === planetBody) continue;
                
                try {
                    // Get the body position
                    const position = body.position;
                    
                    // Safety check for valid position
                    if (!position || isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
                        console.warn("Invalid position for gravity calculation:", position);
                        continue;
                    }
                    
                    // Direction from body to planet center (normalized)
                    const directionToCenter = new CANNON.Vec3();
                    directionToCenter.set(-position.x, -position.y, -position.z);
                    
                    // Calculate length
                    const length = Math.sqrt(
                        directionToCenter.x * directionToCenter.x + 
                        directionToCenter.y * directionToCenter.y + 
                        directionToCenter.z * directionToCenter.z
                    );
                    
                    // Skip if distance is too small or NaN
                    if (length < 0.001 || isNaN(length)) {
                        console.warn("Skipping gravity: distance too small or NaN");
                        continue;
                    }
                    
                    // Normalize the direction vector
                    directionToCenter.x /= length;
                    directionToCenter.y /= length;
                    directionToCenter.z /= length;
                    
                    // Apply spherical gravity force (stronger for physics stability)
                    const gravity = PHYSICS_CONFIG.gravityStrength;
                    const mass = body.mass;
                    const gravityForce = new CANNON.Vec3(
                        directionToCenter.x * gravity * mass,
                        directionToCenter.y * gravity * mass,
                        directionToCenter.z * gravity * mass
                    );
                    
                    // Apply the force at the center of mass
                    body.applyForce(gravityForce);
                    
                } catch (error) {
                    console.error("Error applying gravity to body:", error);
                }
            }
        },
        
        // Update the physics world
        update: function(deltaTime) {
            try {
                // Apply spherical gravity to all bodies
                this.applySphericalGravity();
                
                // Step the physics simulation
                world.step(PHYSICS_CONFIG.timeStep);
            } catch (error) {
                console.error("Error updating physics world:", error);
            }
        },
        
        // Get the height at a point on the planet surface - fully terrain-aware version
        getHeightAt: function(direction) {
            // If called without parameters, just return the base radius without warnings
            if (!direction) {
                return radius;
            }
            
            try {
                // Safety check for NaN values in direction
                if (isNaN(direction.x) || isNaN(direction.y) || isNaN(direction.z)) {
                    console.warn("Invalid direction for getHeightAt:", direction);
                    return radius; // Return default radius as fallback
                }
                
                // If planet has terrain data, use it
                if (planet && planet.getNearestPointOnSurface) {
                    const threeDirection = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
                    const surfacePoint = planet.getNearestPointOnSurface(threeDirection);
                    
                    // Debug log to check terrain heights occasionally
                    if (Math.random() < 0.001) { // Only log 0.1% of the time to avoid spam
                        const terrainHeight = surfacePoint.length() - radius;
                        console.log(`Terrain height: ${terrainHeight.toFixed(2)} at direction: [${threeDirection.x.toFixed(2)}, ${threeDirection.y.toFixed(2)}, ${threeDirection.z.toFixed(2)}]`);
                    }
                    
                    return surfacePoint.length();
                }
                
                // Fallback to base radius if no terrain data available
                return radius;
            } catch (error) {
                console.error("Error in getHeightAt:", error);
                return radius; // Return default radius in case of error
            }
        },
        
        // Get the normal at a point on the planet surface
        getNormalAt: function(position) {
            try {
                // If planet has normal data, use it
                if (planet && planet.getNormalAtPoint) {
                    return planet.getNormalAtPoint(new THREE.Vector3(position.x, position.y, position.z));
                }
                
                // Fallback to simple sphere normal
                const len = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
                return new THREE.Vector3(position.x / len, position.y / len, position.z / len);
            } catch (error) {
                console.error("Error in getNormalAt:", error);
                // Fallback to simple sphere normal
                const len = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
                return new THREE.Vector3(position.x / len, position.y / len, position.z / len);
            }
        },
        
        // Add a body to the world
        addBody: function(body) {
            world.addBody(body);
        },
        
        // Remove a body from the world
        removeBody: function(body) {
            world.removeBody(body);
        }
    };
} 
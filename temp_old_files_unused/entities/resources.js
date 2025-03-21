/**
 * Luminor
 * Resource collection system
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { RESOURCE_CONFIG } from '../utils/constants.js';
import { createGlowingMaterial } from '../utils/materials.js';

/**
 * Setup collectible resources around the planet
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} planet - The planet object
 * @returns {Object} The resources object with properties and methods
 */
export function setupResources(scene, planet) {
    // Array to hold all resources
    const resources = [];
    
    // Track existing positions to prevent clustering
    const existingPositions = [];
    
    // Create resource geometry once for reuse
    const resourceGeometry = createResourceGeometry();
    
    // Main resources object
    const resourceSystem = {
        // Check if a resource can be collected by the player
        checkCollection(playerPosition) {
            // Check each resource
            for (let i = resources.length - 1; i >= 0; i--) {
                const resource = resources[i];
                
                // If resource is already collected, skip
                if (resource.collected) continue;
                
                // Calculate distance to player
                const distance = playerPosition.distanceTo(resource.position);
                
                // If close enough, collect it
                if (distance < RESOURCE_CONFIG.COLLECTION_DISTANCE) {
                    // Mark as collected
                    resource.collected = true;
                    
                    // Visual feedback: scale down and fade out
                    animateCollection(resource);
                    
                    // Return true to indicate collection
                    return true;
                }
            }
            
            // No resource collected
            return false;
        },
        
        // Reset all resources
        reset() {
            // Remove all existing resources
            for (const resource of resources) {
                scene.remove(resource.mesh);
            }
            
            // Clear arrays
            resources.length = 0;
            existingPositions.length = 0;
            
            // Create new resources
            createResources();
        }
    };
    
    // Create initial resources
    createResources();
    
    // Return the resource system
    return resourceSystem;
    
    /**
     * Create resources distributed around the planet
     */
    function createResources() {
        // Try to create resources with minimum spacing
        let attemptsRemaining = RESOURCE_CONFIG.COUNT * 3; // Allow multiple attempts per resource
        let resourcesCreated = 0;
        
        while (resourcesCreated < RESOURCE_CONFIG.COUNT && attemptsRemaining > 0) {
            attemptsRemaining--;
            
            // Generate a random position on the sphere
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(Math.random() * 2 - 1);
            
            const x = Math.sin(theta) * Math.cos(phi);
            const y = Math.sin(theta) * Math.sin(phi);
            const z = Math.cos(theta);
            
            // Create direction vector and scale to planet radius
            const direction = new THREE.Vector3(x, y, z).normalize();
            
            // Get position on actual planet surface with terrain
            const surfacePos = planet.getNearestPointOnSurface(direction);
            
            // Check distance to existing resources
            let tooClose = false;
            for (const pos of existingPositions) {
                if (surfacePos.distanceTo(pos) < RESOURCE_CONFIG.MIN_SPACING) {
                    tooClose = true;
                    break;
                }
            }
            
            // If not too close to existing resources, create a new one
            if (!tooClose) {
                // Calculate position with hover height
                const resourceDirection = surfacePos.clone().normalize();
                const resourcePosition = resourceDirection.multiplyScalar(
                    surfacePos.length() + RESOURCE_CONFIG.HOVER_HEIGHT
                );
                
                // Create resource material
                const resourceMaterial = createGlowingMaterial(
                    RESOURCE_CONFIG.COLOR, 
                    RESOURCE_CONFIG.GLOW_INTENSITY
                );
                
                // Create mesh
                const resourceMesh = new THREE.Mesh(resourceGeometry, resourceMaterial);
                resourceMesh.position.copy(resourcePosition);
                scene.add(resourceMesh);
                
                // Add to resources array
                resources.push({
                    position: resourcePosition,
                    mesh: resourceMesh,
                    collected: false,
                    rotationSpeed: RESOURCE_CONFIG.ROTATION_SPEED * (0.8 + Math.random() * 0.4),
                    rotationAxis: new THREE.Vector3(
                        Math.random() - 0.5,
                        Math.random() - 0.5,
                        Math.random() - 0.5
                    ).normalize()
                });
                
                // Add to positions array
                existingPositions.push(resourcePosition.clone());
                
                // Increment counter
                resourcesCreated++;
            }
        }
        
        // Start update loop for resource animations
        startAnimationLoop();
    }
    
    /**
     * Start animation loop for resources
     */
    function startAnimationLoop() {
        // Create update function
        const update = () => {
            // Update each resource
            const deltaTime = 1/60; // Fixed delta time
            
            for (const resource of resources) {
                // Skip if collected
                if (resource.collected) continue;
                
                // Rotate the resource
                resource.mesh.rotateOnAxis(
                    resource.rotationAxis,
                    resource.rotationSpeed * deltaTime
                );
            }
            
            // Request next frame
            requestAnimationFrame(update);
        };
        
        // Start the loop
        update();
    }
    
    /**
     * Animate resource collection
     * @param {Object} resource - The resource to animate
     */
    function animateCollection(resource) {
        // Create animation duration
        const duration = 0.5; // seconds
        let elapsed = 0;
        
        // Store original scale
        const originalScale = resource.mesh.scale.clone();
        
        // Animation function
        const animate = () => {
            // Update elapsed time
            const deltaTime = 1/60; // Fixed delta time
            elapsed += deltaTime;
            
            // Calculate progress (0 to 1)
            const progress = Math.min(elapsed / duration, 1);
            
            // Scale down
            const scale = 1 - progress;
            resource.mesh.scale.set(
                originalScale.x * scale,
                originalScale.y * scale,
                originalScale.z * scale
            );
            
            // Fade out
            if (resource.mesh.material.opacity !== undefined) {
                resource.mesh.material.opacity = 1 - progress;
            }
            
            // Continue until done
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove from scene when animation completes
                scene.remove(resource.mesh);
            }
        };
        
        // Start animation
        animate();
    }
}

/**
 * Create geometry for resources
 * @returns {THREE.BufferGeometry} The created geometry
 */
function createResourceGeometry() {
    // Complex shape - combination of shapes
    const baseGeometry = new THREE.OctahedronGeometry(RESOURCE_CONFIG.SIZE, 1);
    
    // Add some noise to the vertices for a more crystalline look
    const positions = baseGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const noise = (Math.random() - 0.5) * 0.3;
        positions[i] += noise;
        positions[i + 1] += noise;
        positions[i + 2] += noise;
    }
    
    // Update the geometry
    baseGeometry.computeVertexNormals();
    
    return baseGeometry;
} 
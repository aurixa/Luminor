/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Resource configuration
const RESOURCE_COUNT = 500;           // Significantly increased for better distribution
const RESOURCE_SIZE = 3;           // Larger resources to match player size
const RESOURCE_HOVER_HEIGHT = 2.5;   // Height above terrain
const RESOURCE_COLOR = 0xffdd00;     // Yellow color
const GLOW_INTENSITY = 1.5;          // Brighter glow for visibility
const RESOURCE_ROTATION_SPEED = 0.01; // Speed of rotation animation
const COLLECTION_DISTANCE = 8.0;      // Distance at which resources can be collected (increased from 5.0)
const MIN_RESOURCE_SPACING = 50;     // Minimum distance between resources to ensure distribution

/**
 * Setup collectible resources around the planet
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} planet - The planet object
 * @param {Object} gameState - The game state object for score tracking
 * @returns {Object} The resources object with properties and methods
 */
export function setupResources(scene, planet, gameState) {
    // Array to hold all resources
    const resources = [];
    
    // Track existing positions to prevent clustering
    const existingPositions = [];
    
    // Try to create resources with minimum spacing
    let attemptsRemaining = RESOURCE_COUNT * 3; // Allow multiple attempts per resource
    let resourcesCreated = 0;
    
    while (resourcesCreated < RESOURCE_COUNT && attemptsRemaining > 0) {
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
            if (surfacePos.distanceTo(pos) < MIN_RESOURCE_SPACING) {
                tooClose = true;
                break;
            }
        }
        
        if (!tooClose) {
            // Position slightly above terrain
            const finalPosition = surfacePos.clone().normalize().multiplyScalar(
                surfacePos.length() + RESOURCE_HOVER_HEIGHT
            );
            
            // Create the resource mesh
            const geometry = createResourceGeometry();
            const material = createGlowingMaterial(RESOURCE_COLOR, GLOW_INTENSITY);
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position the resource
            mesh.position.copy(finalPosition);
            
            // Orient the resource to face away from the planet center
            const normal = finalPosition.clone().normalize();
            const up = new THREE.Vector3(0, 1, 0);
            const axis = new THREE.Vector3().crossVectors(up, normal).normalize();
            const angle = Math.acos(up.dot(normal));
            mesh.quaternion.setFromAxisAngle(axis, angle);
            
            // Add a random initial rotation around the normal
            const randomRotation = new THREE.Quaternion().setFromAxisAngle(
                normal, 
                Math.random() * Math.PI * 2
            );
            mesh.quaternion.multiply(randomRotation);
            
            // Add to scene
            scene.add(mesh);
            
            // Add to resources array with tracking data
            resources.push({
                mesh: mesh,
                position: finalPosition.clone(),
                collected: false,
                rotationAxis: normal,
                rotationSpeed: RESOURCE_ROTATION_SPEED * (0.8 + Math.random() * 0.4), // Slightly randomize speed
                hoverPhase: Math.random() * Math.PI * 2, // Random starting phase for hover animation
                hoverSpeed: 0.5 + Math.random() * 0.5,   // Random hover speed
                hoverHeight: 0.3 + Math.random() * 0.2   // Random hover height
            });
            
            // Store position to check spacing
            existingPositions.push(finalPosition.clone());
            
            resourcesCreated++;
        }
    }
    
    console.log(`Created ${resourcesCreated} resources out of requested ${RESOURCE_COUNT}`);
    
    // Return the resources object with methods
    return {
        resources,
        
        // Update method to animate resources
        update: function(playerPosition) {
            for (const resource of resources) {
                if (resource.collected) continue;
                
                // Rotate the resource
                const rotationQuat = new THREE.Quaternion().setFromAxisAngle(
                    resource.rotationAxis, 
                    resource.rotationSpeed
                );
                resource.mesh.quaternion.multiply(rotationQuat);
                
                // Apply hover animation
                resource.hoverPhase += 0.05 * resource.hoverSpeed;
                const hoverOffset = Math.sin(resource.hoverPhase) * resource.hoverHeight;
                const hoverPosition = resource.position.clone().add(
                    resource.rotationAxis.clone().multiplyScalar(hoverOffset)
                );
                resource.mesh.position.copy(hoverPosition);
                
                // Check for collection if player position provided
                if (playerPosition && !resource.collected) {
                    const distToPlayer = playerPosition.distanceTo(resource.mesh.position);
                    if (distToPlayer < COLLECTION_DISTANCE) {
                        this.collectResource(resource);
                        
                        // Increment player length/score
                        gameState.playerLength++;
                    }
                }
            }
        },
        
        // Collect a resource
        collectResource: function(resource) {
            // Mark as collected
            resource.collected = true;
            
            // Create collection animation
            const duration = 0.5; // Animation duration in seconds
            const startScale = resource.mesh.scale.x;
            const startOpacity = 1.0;
            
            // Animation variables
            let elapsed = 0;
            let interval = setInterval(() => {
                elapsed += 1/60; // Assume 60fps
                const progress = Math.min(1.0, elapsed / duration);
                
                // Scale up and fade out
                const scale = startScale * (1 + progress * 2);
                const opacity = startOpacity * (1 - progress);
                
                resource.mesh.scale.set(scale, scale, scale);
                resource.mesh.material.opacity = opacity;
                
                // Animation complete
                if (progress >= 1.0) {
                    clearInterval(interval);
                    scene.remove(resource.mesh);
                    resource.mesh.geometry.dispose();
                    resource.mesh.material.dispose();
                }
            }, 16); // ~60fps
            
            // Return collection event
            return {
                position: resource.position.clone(),
                value: 1 // Each resource is worth 1 point
            };
        },
        
        // Check for collisions with the player segments
        checkCollisions: function(playerPosition) {
            if (!playerPosition) return 0;
            
            let collected = 0;
            
            for (const resource of resources) {
                if (!resource.collected) {
                    const distToPlayer = playerPosition.distanceTo(resource.mesh.position);
                    if (distToPlayer < COLLECTION_DISTANCE) {
                        this.collectResource(resource);
                        collected++;
                    }
                }
            }
            
            return collected;
        },
        
        // Set visibility of all resources
        setVisible: function(visible) {
            for (const resource of resources) {
                if (!resource.collected) {
                    resource.mesh.visible = visible;
                }
            }
        },
        
        // Clean up resources
        remove: function() {
            for (const resource of resources) {
                scene.remove(resource.mesh);
                if (resource.mesh.geometry) resource.mesh.geometry.dispose();
                if (resource.mesh.material) resource.mesh.material.dispose();
            }
            resources.length = 0;
        },
        
        // Reset resources
        reset: function() {
            this.remove();
            // Re-initialize would happen here, but we'll just
            // let the caller create a new instance
        }
    };
}

/**
 * Create the geometry for a resource (a crystal-like shape)
 * @returns {THREE.BufferGeometry} The resource geometry
 */
function createResourceGeometry() {
    // Create a crystal-like shape using a modified octahedron
    const baseGeometry = new THREE.OctahedronGeometry(RESOURCE_SIZE, 0);
    
    // Get vertices and modify them slightly for a more interesting shape
    const positions = baseGeometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
        // Add some random variation to each vertex
        positions[i] *= 0.8 + Math.random() * 0.4;
        positions[i + 1] *= 0.8 + Math.random() * 0.4;
        positions[i + 2] *= 0.8 + Math.random() * 0.4;
    }
    
    // Update normals for proper lighting
    baseGeometry.computeVertexNormals();
    
    return baseGeometry;
}

/**
 * Create a glowing material
 * @param {number} color - The color for the material
 * @param {number} intensity - The glow intensity
 * @returns {THREE.Material} The glowing material
 */
function createGlowingMaterial(color, intensity) {
    return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: intensity,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9
    });
} 
/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { RESOURCE_CONFIG } from './utils/constants.js';

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
        const surfacePos = planet.getNearestPointOnSurface(direction.multiplyScalar(planet.radius));
        
        // Position slightly above the surface
        const finalPos = surfacePos.clone().normalize().multiplyScalar(
            surfacePos.length() + RESOURCE_CONFIG.HOVER_HEIGHT
        );
        
        // Check distance from existing resources
        let tooClose = false;
        for (const pos of existingPositions) {
            if (finalPos.distanceTo(pos) < RESOURCE_CONFIG.MIN_SPACING) {
                tooClose = true;
                break;
            }
        }
        
        if (tooClose) continue; // Skip this position and try again
        
        // Create resource geometry (more complex than a simple sphere)
        const resourceGeometry = createResourceGeometry();
        const resourceMaterial = createGlowingMaterial(RESOURCE_CONFIG.COLOR, RESOURCE_CONFIG.GLOW_INTENSITY);
        const resourceMesh = new THREE.Mesh(resourceGeometry, resourceMaterial);
        
        // Set position
        resourceMesh.position.copy(finalPos);
        
        // Orient to face away from planet center
        resourceMesh.lookAt(new THREE.Vector3(0, 0, 0));
        resourceMesh.rotateX(Math.PI/2); // Adjust orientation
        
        // Add to scene
        scene.add(resourceMesh);
        
        // Add to resources array
        resources.push({
            mesh: resourceMesh,
            position: finalPos,
            collected: false,
            // Add rotation animation parameters
            rotationAxis: new THREE.Vector3(0, 1, 0).normalize(),
            rotationSpeed: RESOURCE_CONFIG.ROTATION_SPEED * (0.8 + Math.random() * 0.4),
            bobHeight: 0.2 + Math.random() * 0.3,
            bobSpeed: 0.005 + Math.random() * 0.003,
            bobPhase: Math.random() * Math.PI * 2,
            originalY: finalPos.y
        });
        
        // Remember this position to avoid clustering
        existingPositions.push(finalPos.clone());
        resourcesCreated++;
    }
    
    // If we couldn't create all resources with spacing, fill the rest with less spacing
    while (resourcesCreated < RESOURCE_CONFIG.COUNT) {
        // Generate a random position on the sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(Math.random() * 2 - 1);
        
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(theta);
        
        // Create direction vector and scale to planet radius
        const direction = new THREE.Vector3(x, y, z).normalize();
        
        // Get position on actual planet surface with terrain
        const surfacePos = planet.getNearestPointOnSurface(direction.multiplyScalar(planet.radius));
        
        // Position slightly above the surface
        const finalPos = surfacePos.clone().normalize().multiplyScalar(
            surfacePos.length() + RESOURCE_CONFIG.HOVER_HEIGHT
        );
        
        // Create resource geometry (more complex than a simple sphere)
        const resourceGeometry = createResourceGeometry();
        const resourceMaterial = createGlowingMaterial(RESOURCE_CONFIG.COLOR, RESOURCE_CONFIG.GLOW_INTENSITY);
        const resourceMesh = new THREE.Mesh(resourceGeometry, resourceMaterial);
        
        // Set position
        resourceMesh.position.copy(finalPos);
        
        // Orient to face away from planet center
        resourceMesh.lookAt(new THREE.Vector3(0, 0, 0));
        resourceMesh.rotateX(Math.PI/2); // Adjust orientation
        
        // Add to scene
        scene.add(resourceMesh);
        
        // Add to resources array
        resources.push({
            mesh: resourceMesh,
            position: finalPos,
            collected: false,
            // Add rotation animation parameters
            rotationAxis: new THREE.Vector3(0, 1, 0).normalize(),
            rotationSpeed: RESOURCE_CONFIG.ROTATION_SPEED * (0.8 + Math.random() * 0.4),
            bobHeight: 0.2 + Math.random() * 0.3,
            bobSpeed: 0.005 + Math.random() * 0.003,
            bobPhase: Math.random() * Math.PI * 2,
            originalY: finalPos.y
        });
        
        resourcesCreated++;
    }
    
    console.log(`Created ${resources.length} resources on the planet`);
    
    // Add respawn functionality for collected resources
    let respawnTimer = 0;
    const MAX_ACTIVE_RESOURCES = Math.min(80, RESOURCE_CONFIG.COUNT * RESOURCE_CONFIG.MAX_ACTIVE_RATIO);
    
    return {
        resources,
        
        // Set visibility of all resources
        setVisible: function(visible) {
            for (const resource of resources) {
                resource.mesh.visible = visible;
            }
        },
        
        // Update resources (animations, etc.)
        update: function() {
            // Update respawn timer
            respawnTimer += 16.67; // Approximately 60fps
            
            // Check for resource respawn
            if (respawnTimer >= RESOURCE_CONFIG.RESPAWN_INTERVAL) {
                respawnTimer = 0;
                
                // Count active (non-collected) resources
                const activeCount = resources.filter(r => !r.collected).length;
                
                // If we're below the active resource limit, respawn some
                if (activeCount < MAX_ACTIVE_RESOURCES) {
                    // Find collected resources that can be respawned
                    const collectedResources = resources.filter(r => r.collected);
                    
                    // Respawn up to 5 resources at a time
                    const toRespawn = Math.min(5, collectedResources.length, MAX_ACTIVE_RESOURCES - activeCount);
                    
                    for (let i = 0; i < toRespawn; i++) {
                        // Get a random collected resource
                        const resourceIndex = Math.floor(Math.random() * collectedResources.length);
                        const resource = collectedResources[resourceIndex];
                        
                        // Respawn it at a new position
                        const phi = Math.random() * Math.PI * 2;
                        const theta = Math.acos(Math.random() * 2 - 1);
                        
                        const x = Math.sin(theta) * Math.cos(phi);
                        const y = Math.sin(theta) * Math.sin(phi);
                        const z = Math.cos(theta);
                        
                        // Create new position on planet surface
                        const direction = new THREE.Vector3(x, y, z).normalize();
                        const surfacePos = planet.getNearestPointOnSurface(direction.multiplyScalar(planet.radius));
                        const finalPos = surfacePos.clone().normalize().multiplyScalar(
                            surfacePos.length() + RESOURCE_CONFIG.HOVER_HEIGHT
                        );
                        
                        // Update resource
                        resource.position.copy(finalPos);
                        resource.mesh.position.copy(finalPos);
                        resource.mesh.visible = true;
                        resource.collected = false;
                        resource.bobPhase = Math.random() * Math.PI * 2;
                        
                        // Remove from collected array
                        collectedResources.splice(resourceIndex, 1);
                    }
                }
            }
            
            // Update resource animations
            for (const resource of resources) {
                if (!resource.collected) {
                    // Apply rotation animation around local up axis
                    resource.mesh.rotateOnAxis(resource.rotationAxis, resource.rotationSpeed);
                    
                    // Apply bobbing animation
                    resource.bobPhase += resource.bobSpeed;
                    const bobOffset = Math.sin(resource.bobPhase) * resource.bobHeight;
                    const upVector = resource.position.clone().normalize();
                    
                    // Add bobbing movement
                    const newPosition = resource.position.clone().add(
                        upVector.multiplyScalar(bobOffset)
                    );
                    resource.mesh.position.copy(newPosition);
                }
            }
        },
        
        // Check for collisions with player
        checkCollisions: function(player) {
            let collectedCount = 0;
            const playerPosition = player.getHeadPosition();
            
            for (const resource of resources) {
                if (!resource.collected && 
                    resource.position.distanceTo(playerPosition) < RESOURCE_CONFIG.COLLECTION_DISTANCE) {
                    
                    // Mark as collected
                    resource.collected = true;
                    
                    // Hide the mesh
                    resource.mesh.visible = false;
                    
                    // Count collection
                    collectedCount++;
                }
            }
            
            return collectedCount;
        },
        
        // Remove resources from scene
        remove: function() {
            for (const resource of resources) {
                scene.remove(resource.mesh);
                resource.mesh.geometry.dispose();
                resource.mesh.material.dispose();
            }
            resources.length = 0;
        }
    };
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

/**
 * Create glowing material for resources
 * @param {number} color - The color of the resource
 * @param {number} intensity - The glow intensity
 * @returns {THREE.Material} The created material
 */
function createGlowingMaterial(color, intensity) {
    return new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: intensity,
        shininess: 100,
        transparent: true,
        opacity: 0.9
    });
} 
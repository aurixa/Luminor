/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Resource configuration
const RESOURCE_COUNT = 60;           // Significantly increased for better distribution
const RESOURCE_SIZE = 2.5;           // Larger resources to match player size
const RESOURCE_HOVER_HEIGHT = 2.5;   // Height above terrain
const RESOURCE_COLOR = 0xffdd00;     // Yellow color
const GLOW_INTENSITY = 1.5;          // Brighter glow for visibility
const RESOURCE_ROTATION_SPEED = 0.01; // Speed of rotation animation
const COLLECTION_DISTANCE = 5.0;      // Distance at which resources can be collected
const MIN_RESOURCE_SPACING = 50;     // Minimum distance between resources to ensure distribution

/**
 * Setup collectible resources around the planet
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} planet - The planet object
 * @returns {Object} The resources object with properties and methods
 */
export function setupResources(scene, planet) {
    // Array to hold all resources
    const items = [];
    
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
        const surfacePos = planet.getNearestPointOnSurface(direction.multiplyScalar(planet.radius));
        
        // Position slightly above the surface
        const finalPos = surfacePos.clone().normalize().multiplyScalar(
            surfacePos.length() + RESOURCE_HOVER_HEIGHT
        );
        
        // Check distance from existing resources
        let tooClose = false;
        for (const pos of existingPositions) {
            if (finalPos.distanceTo(pos) < MIN_RESOURCE_SPACING) {
                tooClose = true;
                break;
            }
        }
        
        if (tooClose) continue; // Skip this position and try again
        
        // Create resource and add to array
        const resource = createResource(scene, finalPos);
        items.push(resource);
        
        // Remember this position to avoid clustering
        existingPositions.push(finalPos.clone());
        resourcesCreated++;
    }
    
    // If we couldn't create all resources with spacing, fill the rest with less spacing
    while (resourcesCreated < RESOURCE_COUNT) {
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
            surfacePos.length() + RESOURCE_HOVER_HEIGHT
        );
        
        // Create resource and add to array
        const resource = createResource(scene, finalPos);
        items.push(resource);
        
        resourcesCreated++;
    }
    
    console.log(`Created ${items.length} resources on the planet`);
    
    // Add respawn functionality for collected resources
    let respawnTimer = 0;
    const RESPAWN_INTERVAL = 5000; // ms
    const MAX_ACTIVE_RESOURCES = Math.min(80, RESOURCE_COUNT * 1.5); // Cap the number of active resources
    
    return {
        items,
        
        // Update resources (animations, etc.)
        update: function(deltaTime) {
            // Update respawn timer
            respawnTimer += deltaTime || 16.67; // Approximately 60fps if no deltaTime provided
            
            // Check for resource respawn
            if (respawnTimer >= RESPAWN_INTERVAL) {
                respawnTimer = 0;
                
                // Count active (non-collected) resources
                const activeCount = items.filter(r => r.active).length;
                
                // If we're below the active resource limit, respawn some
                if (activeCount < MAX_ACTIVE_RESOURCES) {
                    // Find collected resources that can be respawned
                    const collectedResources = items.filter(r => !r.active);
                    
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
                            surfacePos.length() + RESOURCE_HOVER_HEIGHT
                        );
                        
                        // Update resource
                        resource.position.copy(finalPos);
                        resource.mesh.position.copy(finalPos);
                        resource.mesh.visible = true;
                        resource.active = true;
                        resource.bobPhase = Math.random() * Math.PI * 2;
                        
                        // Remove from collected array
                        collectedResources.splice(resourceIndex, 1);
                    }
                }
            }
            
            // Update resource animations
            for (const resource of items) {
                if (resource.active) {
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
        
        // Reset all resources (e.g., when starting a new game)
        reset: function() {
            for (const resource of items) {
                // Make all resources active again
                resource.active = true;
                resource.mesh.visible = true;
            }
        }
    };
}

/**
 * Create a single resource
 * @param {THREE.Scene} scene - The scene to add the resource to
 * @param {THREE.Vector3} position - The position for the resource
 * @returns {Object} The resource object
 */
function createResource(scene, position) {
    // Create resource geometry
    const resourceGeometry = createResourceGeometry();
    const resourceMaterial = createGlowingMaterial(RESOURCE_COLOR, GLOW_INTENSITY);
    const resourceMesh = new THREE.Mesh(resourceGeometry, resourceMaterial);
    
    // Set position
    resourceMesh.position.copy(position);
    
    // Orient to face away from planet center
    resourceMesh.lookAt(new THREE.Vector3(0, 0, 0));
    resourceMesh.rotateX(Math.PI/2); // Adjust orientation
    
    // Add to scene
    scene.add(resourceMesh);
    
    // Create and return resource object
    return {
        mesh: resourceMesh,
        position: position.clone(),
        radius: RESOURCE_SIZE,
        active: true,
        
        // Animation parameters
        rotationAxis: new THREE.Vector3(0, 1, 0).normalize(),
        rotationSpeed: RESOURCE_ROTATION_SPEED * (0.8 + Math.random() * 0.4),
        bobHeight: 0.2 + Math.random() * 0.3,
        bobSpeed: 0.005 + Math.random() * 0.003,
        bobPhase: Math.random() * Math.PI * 2,
        originalY: position.y,
        
        // Method to collect this resource
        collect: function() {
            this.active = false;
            this.mesh.visible = false;
        }
    };
}

/**
 * Create resource geometry (a gem-like shape)
 */
function createResourceGeometry() {
    // Use a more interesting shape for resources - an octahedron
    return new THREE.OctahedronGeometry(RESOURCE_SIZE, 0);
}

/**
 * Create a glowing material for resources
 */
function createGlowingMaterial(color, intensity) {
    return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: intensity,
        roughness: 0.3,
        metalness: 0.7
    });
} 
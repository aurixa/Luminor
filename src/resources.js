/**
 * Luminor
 * Resources and collectibles system
 */

import * as THREE from 'three';

const MAX_RESOURCES = 20;
const RESOURCE_SIZE = 0.3;
const RESOURCE_GLOW = 2.0;
const COLLECTION_DISTANCE = 0.8;
const SPAWN_INTERVAL = 2000; // ms
const MIN_SPAWN_DISTANCE = 5;

/**
 * Setup the resources system for collectible energy
 * @param {THREE.Scene} scene 
 * @param {Object} planet 
 * @returns {Object} Resources controller
 */
export function setupResources(scene, planet) {
    const resources = [];
    let lastSpawnTime = 0;
    
    /**
     * Create a glowing energy resource
     */
    function createResource() {
        // Create a random position on the planet surface
        const randomDir = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        ).normalize();
        
        const position = planet.getNearestPointOnSurface(randomDir.multiplyScalar(planet.radius));
        
        // Create resource geometry and material
        const geometry = new THREE.SphereGeometry(RESOURCE_SIZE, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xffaa00,
            emissiveIntensity: RESOURCE_GLOW,
            metalness: 0.3,
            roughness: 0.2,
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        scene.add(mesh);
        
        // Add pulse animation
        const pulse = {
            intensity: RESOURCE_GLOW,
            phase: Math.random() * Math.PI * 2, // Random starting phase
            speed: 1.5 + Math.random() * 1.5    // Random speed
        };
        
        // Add to resources array
        resources.push({
            mesh,
            position,
            pulse,
            collected: false
        });
    }
    
    /**
     * Update all resources
     */
    function update() {
        const currentTime = Date.now();
        
        // Spawn new resources if needed
        if (currentTime - lastSpawnTime > SPAWN_INTERVAL && resources.length < MAX_RESOURCES) {
            createResource();
            lastSpawnTime = currentTime;
        }
        
        // Update existing resources (pulse animation)
        for (const resource of resources) {
            if (!resource.collected) {
                // Update pulse effect
                resource.pulse.phase += 0.05 * resource.pulse.speed;
                const pulseValue = 0.5 + Math.sin(resource.pulse.phase) * 0.5;
                
                // Apply pulse to material
                resource.mesh.material.emissiveIntensity = resource.pulse.intensity * pulseValue;
                
                // Slight floating motion
                const time = currentTime * 0.001;
                const floatY = Math.sin(time * resource.pulse.speed) * 0.05;
                
                // Calculate up direction (from planet center to resource)
                const up = resource.position.clone().normalize();
                
                // Apply floating motion in up direction
                const floatPos = resource.position.clone().add(up.multiplyScalar(floatY));
                resource.mesh.position.copy(floatPos);
            }
        }
    }
    
    /**
     * Check for collisions with the player
     * @param {Object} player 
     * @returns {Number} Number of resources collected
     */
    function checkCollisions(player) {
        let collectedCount = 0;
        const playerHead = player.getHeadPosition();
        
        for (let i = resources.length - 1; i >= 0; i--) {
            const resource = resources[i];
            
            // Skip already collected resources
            if (resource.collected) continue;
            
            // Check distance between player head and resource
            const distance = playerHead.distanceTo(resource.position);
            
            if (distance < COLLECTION_DISTANCE) {
                // Mark as collected
                resource.collected = true;
                collectedCount++;
                
                // Remove from scene
                scene.remove(resource.mesh);
                
                // Remove from array
                resources.splice(i, 1);
            }
        }
        
        return collectedCount;
    }
    
    /**
     * Remove all resources from scene
     */
    function remove() {
        for (const resource of resources) {
            scene.remove(resource.mesh);
            resource.mesh.geometry.dispose();
            resource.mesh.material.dispose();
        }
        resources.length = 0;
    }
    
    // Create initial resources
    for (let i = 0; i < MAX_RESOURCES / 2; i++) {
        createResource();
    }
    
    return {
        update,
        checkCollisions,
        remove
    };
} 
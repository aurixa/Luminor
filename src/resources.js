/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Energy configuration
const MAX_ENERGY_POINTS = 50;
const ENERGY_SIZE = 0.2;
const SPAWN_INTERVAL = 1000; // ms
const COLLISION_DISTANCE = 0.5;
const DARK_SIDE_SPAWN_CHANCE = 0.3; // 30% chance on dark side
const LIGHT_SIDE_SPAWN_CHANCE = 0.7; // 70% chance on light side

/**
 * Setup and manage energy collectibles for the game
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} planet - The planet object
 * @returns {Object} Energy manager with properties and methods
 */
export function setupResources(scene, planet) {
    // Store active energy points
    const resources = [];
    
    // Last spawn time
    let lastSpawnTime = 0;
    
    // Create energy geometry (reused for all energy points)
    const resourceGeometry = new THREE.IcosahedronGeometry(ENERGY_SIZE, 1);
    
    /**
     * Create a new energy point at a random position on the planet
     */
    function spawnResource() {
        if (resources.length >= MAX_ENERGY_POINTS) return;
        
        // Generate random point on unit sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(theta);
        
        // Create position vector and project to planet surface
        const position = new THREE.Vector3(x, y, z);
        const isLightSide = planet.isInLight(position);
        
        // Apply spawn chance based on light/dark side
        const spawnChance = isLightSide ? LIGHT_SIDE_SPAWN_CHANCE : DARK_SIDE_SPAWN_CHANCE;
        if (Math.random() > spawnChance) return;
        
        // Project to planet surface
        const surfacePosition = planet.getPositionOnSurface(position);
        
        // Create energy with different color based on light/dark side
        const color = isLightSide ? 0x33ffff : 0xff3366;
        const intensity = isLightSide ? 1.0 : 1.5; // Darker side energy glows more
        
        // Create material
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: intensity,
            transparent: true,
            opacity: 0.8,
            metalness: 0.5,
            roughness: 0.2,
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(resourceGeometry, material);
        mesh.position.copy(surfacePosition);
        scene.add(mesh);
        
        // Add to resources array
        resources.push({
            position: surfacePosition,
            mesh: mesh,
            value: isLightSide ? 1 : 2, // Dark side energy worth more
            isLightSide: isLightSide,
            age: 0
        });
    }
    
    /**
     * Check for collisions between the player and energy
     * @param {Object} player - The player object
     * @returns {Number} Number of energy points collected
     */
    function checkCollisions(player) {
        if (!player) return 0;
        
        const headPosition = player.getHeadPosition();
        let collectedCount = 0;
        
        // Check each energy point for collision with player head
        for (let i = resources.length - 1; i >= 0; i--) {
            const resource = resources[i];
            const distance = headPosition.distanceTo(resource.position);
            
            if (distance < COLLISION_DISTANCE) {
                // Remove energy
                scene.remove(resource.mesh);
                resource.mesh.geometry.dispose();
                resource.mesh.material.dispose();
                
                // Track collected value
                collectedCount += resource.value;
                
                // Remove from array
                resources.splice(i, 1);
            }
        }
        
        return collectedCount;
    }
    
    /**
     * Update energy (spawn new points, animate existing)
     */
    function update() {
        const currentTime = Date.now();
        
        // Spawn new energy at interval
        if (currentTime - lastSpawnTime > SPAWN_INTERVAL) {
            spawnResource();
            lastSpawnTime = currentTime;
        }
        
        // Animate existing energy
        for (const resource of resources) {
            resource.age += 0.01;
            
            // Pulse scale
            const scale = 1 + Math.sin(resource.age * 2) * 0.1;
            resource.mesh.scale.set(scale, scale, scale);
            
            // Slowly rotate
            resource.mesh.rotation.x += 0.01;
            resource.mesh.rotation.y += 0.01;
        }
    }
    
    /**
     * Remove all energy from the scene
     */
    function removeAll() {
        for (const resource of resources) {
            scene.remove(resource.mesh);
            resource.mesh.geometry.dispose();
            resource.mesh.material.dispose();
        }
        resources.length = 0;
    }
    
    // Initial energy spawning
    for (let i = 0; i < MAX_ENERGY_POINTS / 2; i++) {
        spawnResource();
    }
    
    // Return the resource manager
    return {
        update,
        checkCollisions,
        remove: removeAll
    };
} 
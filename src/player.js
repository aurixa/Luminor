/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Player configuration
const PLAYER_SEGMENT_SIZE = 0.3;
const PLAYER_SPEED = 0.1;
const MIN_SEGMENT_DISTANCE = 0.4;
const GLOW_INTENSITY = 1.5;
const MAX_TURN_ANGLE = Math.PI / 30; // Max angle for smooth turning

/**
 * Create and setup the player entity
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} planet - The planet object
 * @param {THREE.Camera} camera - The camera for tracking mouse position
 * @returns {Object} The player object with properties and methods
 */
export function setupPlayer(scene, planet, camera) {
    // Array to hold all segments of the player
    const segments = [];
    const segmentMeshes = [];
    
    // Create the head of the player
    const headGeometry = new THREE.SphereGeometry(PLAYER_SEGMENT_SIZE, 16, 16);
    const headMaterial = createGlowingMaterial(0x00ffaa, GLOW_INTENSITY);
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    
    // Set initial position on the light side of the planet
    const initialPosition = new THREE.Vector3(planet.radius, 0, 0);
    headMesh.position.copy(initialPosition);
    scene.add(headMesh);
    
    // Add the head as the first segment
    segments.push({
        position: initialPosition.clone(),
        mesh: headMesh
    });
    segmentMeshes.push(headMesh);
    
    // Target for the player to move towards (will be set by mouse movement)
    let targetPosition = initialPosition.clone();
    
    // Direction the player is moving
    let currentDirection = new THREE.Vector3(0, 0, 1).normalize();
    
    // Setup mouse movement tracking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    window.addEventListener('mousemove', (event) => {
        // Convert mouse position to normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObject(planet.mesh);
        
        // If we intersected with the planet, set that as the target
        if (intersects.length > 0) {
            targetPosition = intersects[0].point;
        }
    });
    
    // Handle touch events for mobile
    window.addEventListener('touchmove', (event) => {
        event.preventDefault();
        
        // Convert touch position to normalized device coordinates
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObject(planet.mesh);
        
        // If we intersected with the planet, set that as the target
        if (intersects.length > 0) {
            targetPosition = intersects[0].point;
        }
    }, { passive: false });
    
    // Player object with properties and methods
    return {
        segments,
        segmentMeshes,
        length: 1,
        
        // Update the player's position and segments
        update: function() {
            // Calculate direction to target
            const head = segments[0];
            const dirToTarget = targetPosition.clone().sub(head.position).normalize();
            
            // Limit turning angle for smooth movement
            const angle = currentDirection.angleTo(dirToTarget);
            if (angle > MAX_TURN_ANGLE) {
                // Lerp direction for smoother turning
                const t = MAX_TURN_ANGLE / angle;
                currentDirection.lerp(dirToTarget, t).normalize();
            } else {
                currentDirection.copy(dirToTarget);
            }
            
            // Move head in the current direction
            const newPosition = head.position.clone().add(
                currentDirection.clone().multiplyScalar(PLAYER_SPEED)
            );
            
            // Project onto planet surface
            const surfacePosition = planet.getNearestPointOnSurface(newPosition);
            head.position.copy(surfacePosition);
            head.mesh.position.copy(surfacePosition);
            
            // Update segment positions (follow the leader)
            for (let i = 1; i < segments.length; i++) {
                const segment = segments[i];
                const prevSegment = segments[i - 1];
                
                // Direction from this segment to the one in front
                const dirToNext = prevSegment.position.clone().sub(segment.position).normalize();
                
                // Distance to the segment in front
                const distToNext = segment.position.distanceTo(prevSegment.position);
                
                // If the segment is too close, don't move it
                if (distToNext < MIN_SEGMENT_DISTANCE) continue;
                
                // Move segment toward the one in front
                const moveAmount = Math.min(PLAYER_SPEED * 0.9, distToNext - MIN_SEGMENT_DISTANCE);
                segment.position.add(dirToNext.multiplyScalar(moveAmount));
                
                // Project onto planet surface
                const segmentSurfacePosition = planet.getNearestPointOnSurface(segment.position);
                segment.position.copy(segmentSurfacePosition);
                segment.mesh.position.copy(segmentSurfacePosition);
            }
            
            // Update head orientation to face direction of movement
            if (segments.length > 1) {
                const lookDir = segments[0].position.clone().sub(segments[1].position).normalize();
                const up = segments[0].position.clone().normalize(); // Up is toward planet center
                headMesh.lookAt(segments[0].position.clone().add(lookDir));
                headMesh.up.copy(up);
            }
        },
        
        // Grow the player by adding segments
        grow: function(amount = 1) {
            for (let i = 0; i < amount; i++) {
                // Get the position of the last segment
                const lastSegment = segments[segments.length - 1];
                const newPosition = lastSegment.position.clone();
                
                // Create a new segment slightly behind the last one
                const segmentGeometry = new THREE.SphereGeometry(PLAYER_SEGMENT_SIZE, 16, 16);
                const segmentMaterial = createGlowingMaterial(0x00ffaa, GLOW_INTENSITY * 0.8);
                const segmentMesh = new THREE.Mesh(segmentGeometry, segmentMaterial);
                segmentMesh.position.copy(newPosition);
                scene.add(segmentMesh);
                
                // Add the new segment
                segments.push({
                    position: newPosition.clone(),
                    mesh: segmentMesh
                });
                segmentMeshes.push(segmentMesh);
            }
            
            this.length += amount;
        },
        
        // Check if the player has collided with itself
        checkSelfCollision: function() {
            if (segments.length < 5) return false; // Need at least 5 segments for self-collision
            
            const head = segments[0];
            const headPosition = head.position;
            
            // Check against all segments except the closest ones
            for (let i = 4; i < segments.length; i++) {
                const segment = segments[i];
                const distance = headPosition.distanceTo(segment.position);
                
                // If the head is too close to any segment, it's a collision
                if (distance < PLAYER_SEGMENT_SIZE * 1.5) {
                    return true;
                }
            }
            
            return false;
        },
        
        // Get the head position
        getHeadPosition: function() {
            return segments[0].position.clone();
        },
        
        // Remove the player from the scene
        remove: function() {
            for (const mesh of segmentMeshes) {
                scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
            segments.length = 0;
            segmentMeshes.length = 0;
        }
    };
}

/**
 * Create a glowing material for the player segments
 */
function createGlowingMaterial(color, intensity) {
    return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: intensity,
        transparent: true,
        opacity: 0.9,
        metalness: 0.5,
        roughness: 0.5,
    });
} 
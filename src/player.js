/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Player configuration
const PLAYER_SEGMENT_SIZE = 0.3;
const PLAYER_SPEED = 0.08;        // Slightly slower for better control
const PLAYER_TURN_SPEED = 0.03;   // Smoother turning
const MIN_SEGMENT_DISTANCE = 0.3; // Slightly closer segments for better visuals
const GLOW_INTENSITY = 1.8;       // Increase glow for better visibility

/**
 * Create and setup the player entity
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} planet - The planet object
 * @param {THREE.Camera} camera - The camera for tracking
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
    
    // Direction the player is moving
    let currentDirection = new THREE.Vector3(0, 0, 1).normalize();
    
    // Keyboard state
    const keys = {
        left: false,
        right: false
    };
    
    // Setup keyboard controls
    window.addEventListener('keydown', (event) => {
        switch(event.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = true;
                break;
        }
    });
    
    window.addEventListener('keyup', (event) => {
        switch(event.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = false;
                break;
        }
    });
    
    // Add a trail effect for the player
    function addTrailEffect() {
        // Create a trail that follows the player's path
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffaa,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        // We'll create small discs that fade over time
        return {
            particles: [],
            update: function() {
                // Add new trail particles occasionally
                if (segments.length > 0 && Math.random() > 0.7) {
                    const lastSegment = segments[segments.length - 1];
                    
                    const discGeometry = new THREE.CircleGeometry(PLAYER_SEGMENT_SIZE * 0.8, 8);
                    const discMesh = new THREE.Mesh(discGeometry, trailMaterial.clone());
                    
                    // Position and orient disc
                    discMesh.position.copy(lastSegment.position);
                    const normal = lastSegment.position.clone().normalize();
                    discMesh.lookAt(new THREE.Vector3(0, 0, 0));
                    
                    scene.add(discMesh);
                    
                    this.particles.push({
                        mesh: discMesh,
                        life: 1.0  // Life decreases over time
                    });
                }
                
                // Update existing particles
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    const particle = this.particles[i];
                    
                    // Decrease life and opacity
                    particle.life -= 0.02;
                    particle.mesh.material.opacity = particle.life * 0.2;
                    
                    // Remove dead particles
                    if (particle.life <= 0) {
                        scene.remove(particle.mesh);
                        particle.mesh.geometry.dispose();
                        particle.mesh.material.dispose();
                        this.particles.splice(i, 1);
                    }
                }
            },
            
            clear: function() {
                // Remove all trail particles
                for (const particle of this.particles) {
                    scene.remove(particle.mesh);
                    particle.mesh.geometry.dispose();
                    particle.mesh.material.dispose();
                }
                this.particles = [];
            }
        };
    }
    
    // Create trail effect
    const trail = addTrailEffect();
    
    // Player object with properties and methods
    return {
        segments,
        segmentMeshes,
        length: 1,
        
        // Update the player's position and segments
        update: function() {
            // Get the head segment
            const head = segments[0];
            
            // Apply steering based on keyboard input
            if (keys.left) {
                // Calculate right vector for steering left
                const up = head.position.clone().normalize(); // Up is toward planet center
                const right = new THREE.Vector3().crossVectors(currentDirection, up);
                
                // Rotate currentDirection around the up vector
                currentDirection.applyAxisAngle(up, -PLAYER_TURN_SPEED);
                currentDirection.normalize();
            }
            
            if (keys.right) {
                // Calculate right vector for steering right
                const up = head.position.clone().normalize(); // Up is toward planet center
                const right = new THREE.Vector3().crossVectors(currentDirection, up);
                
                // Rotate currentDirection around the up vector
                currentDirection.applyAxisAngle(up, PLAYER_TURN_SPEED);
                currentDirection.normalize();
            }
            
            // Calculate the up vector (normal to planet surface at player position)
            const up = head.position.clone().normalize();
            
            // Calculate right vector
            const right = new THREE.Vector3().crossVectors(currentDirection, up).normalize();
            
            // Recalculate forward direction to ensure it's orthogonal to up
            currentDirection = new THREE.Vector3().crossVectors(up, right).normalize();
            
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
            // Create a lookAt matrix based on current direction and up vector
            const lookTarget = head.position.clone().add(currentDirection);
            headMesh.lookAt(lookTarget);
            headMesh.up.copy(up);
            
            // Update trail effect
            trail.update();
            
            // Return current direction and position for camera positioning
            return {
                position: head.position.clone(),
                direction: currentDirection.clone(),
                up: up
            };
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
            trail.clear();
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
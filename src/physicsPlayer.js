/**
 * Luminor
 * Physics-based player implementation with hover bike mechanics
 */

import * as THREE from 'three';
import { HoverBike } from './physics/HoverBike.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';

// Player configuration
const PLAYER_SEGMENT_SIZE = 2.0;
const GLOW_INTENSITY = 1.8;
const MAX_SEGMENTS = 20;

// Debug visualization settings
const DEBUG_PHYSICS = false;

/**
 * Create and setup the physics-based player entity
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} planet - The planet object
 * @param {THREE.Camera} camera - The camera for tracking
 * @param {PhysicsWorld} [existingPhysicsWorld] - Optional existing physics world
 * @returns {Object} The player object with properties and methods
 */
export function setupPhysicsPlayer(scene, planet, camera, existingPhysicsWorld = null) {
    console.log("Setting up physics player with planet:", planet ? "Found" : "Not found");
    if (planet) {
        console.log("Planet radius:", planet.radius);
    }
    
    // Initialize physics world or use existing one
    const physicsWorld = existingPhysicsWorld || new PhysicsWorld();
    console.log("Physics world initialized");
    
    // Create the head of the player
    const headGeometry = new THREE.SphereGeometry(PLAYER_SEGMENT_SIZE, 16, 16);
    const headMaterial = createGlowingMaterial(0x00ffaa, GLOW_INTENSITY);
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    
    // Set a temporary initial position off-screen
    headMesh.position.set(0, -1000, 0);
    scene.add(headMesh);
    console.log("Head mesh added to scene");
    
    // Create the hover bike physics first
    console.log("Creating hover bike...");
    const hoverBike = new HoverBike(physicsWorld, planet, headMesh);
    hoverBike.debug.enabled = DEBUG_PHYSICS;
    
    // Now update the head mesh position to match the hover bike's position
    if (hoverBike.body) {
        const pos = hoverBike.body.position;
        headMesh.position.set(pos.x, pos.y, pos.z);
        console.log("Head mesh position updated to match hover bike:", headMesh.position);
    }
    
    // Create segments array for tail
    const segments = [];
    const segmentMeshes = [];
    
    // Add the head as the first segment
    segments.push({
        position: headMesh.position.clone(),
        mesh: headMesh,
        hoverPhase: Math.random() * Math.PI * 2,
        hoverSpeed: 0.5 + Math.random() * 0.5
    });
    segmentMeshes.push(headMesh);
    
    // Setup debug visualization objects if enabled
    let surfaceNormalLine, directionLine, rightLine;
    
    if (DEBUG_PHYSICS) {
        // Create line showing normal (up) direction - RED
        const normalMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
        const normalGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 10, 0)
        ]);
        surfaceNormalLine = new THREE.Line(normalGeometry, normalMaterial);
        scene.add(surfaceNormalLine);
        
        // Create line showing forward direction - GREEN
        const directionMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
        const directionGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 10)
        ]);
        directionLine = new THREE.Line(directionGeometry, directionMaterial);
        scene.add(directionLine);
        
        // Create line showing right direction - BLUE
        const rightMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });
        const rightGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(10, 0, 0)
        ]);
        rightLine = new THREE.Line(rightGeometry, rightMaterial);
        scene.add(rightLine);
    }
    
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
        
        // Update hover bike control state
        hoverBike.setControlState(keys);
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
        
        // Update hover bike control state
        hoverBike.setControlState(keys);
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
    
    // Store previous positions for each segment to create a smoother following effect
    const positionHistory = [];
    const HISTORY_LENGTH = 10; // Number of positions to remember per segment
    
    // Player object with properties and methods
    return {
        segments,
        segmentMeshes,
        length: 1,
        hoverBike,
        physicsWorld,
        
        // Update the player's position and segments
        update: function(deltaTime) {
            // Step the physics world
            physicsWorld.update(deltaTime);
            
            // Update hover bike physics
            hoverBike.update(deltaTime);
            
            // Get the head segment
            const head = segments[0];
            
            // Record position history for trailing segments
            if (!positionHistory[0]) {
                positionHistory[0] = [];
            }
            
            positionHistory[0].unshift(head.mesh.position.clone());
            if (positionHistory[0].length > HISTORY_LENGTH) {
                positionHistory[0].pop();
            }
            
            // Update trailing segments
            for (let i = 1; i < segments.length; i++) {
                const segment = segments[i];
                
                // Create position history array for this segment if it doesn't exist
                if (!positionHistory[i]) {
                    positionHistory[i] = [];
                }
                
                // Follow the position of the segment ahead with a delay
                const targetPosition = positionHistory[i - 1][Math.min(3, positionHistory[i - 1].length - 1)];
                
                if (targetPosition) {
                    // Move toward target position
                    const newPosition = segment.position.clone().lerp(targetPosition, 0.2);
                    segment.position.copy(newPosition);
                    segment.mesh.position.copy(newPosition);
                    
                    // Orient segment to face the direction of movement
                    const normal = segment.position.clone().normalize();
                    const up = normal;
                    
                    // Look at next segment, or if this is the last segment, look away from previous segment
                    const lookTarget = i < segments.length - 1 
                        ? segments[i + 1].position.clone() 
                        : segment.position.clone().add(segment.position.clone().sub(segments[i - 1].position));
                    
                    const matrix = new THREE.Matrix4();
                    matrix.lookAt(segment.position, lookTarget, up);
                    segment.mesh.quaternion.setFromRotationMatrix(matrix);
                    
                    // Record position history for this segment
                    positionHistory[i].unshift(segment.position.clone());
                    if (positionHistory[i].length > HISTORY_LENGTH) {
                        positionHistory[i].pop();
                    }
                }
            }
            
            // Update debug visualization
            if (DEBUG_PHYSICS && surfaceNormalLine && directionLine && rightLine) {
                const up = head.mesh.position.clone().normalize();
                const forward = hoverBike.currentDirection;
                const right = new THREE.Vector3().crossVectors(up, forward).normalize();
                
                // Update normal line
                surfaceNormalLine.position.copy(head.mesh.position);
                surfaceNormalLine.geometry.dispose();
                surfaceNormalLine.geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    up.clone().multiplyScalar(10)
                ]);
                
                // Update direction line
                directionLine.position.copy(head.mesh.position);
                directionLine.geometry.dispose();
                directionLine.geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    forward.clone().multiplyScalar(10)
                ]);
                
                // Update right line
                rightLine.position.copy(head.mesh.position);
                rightLine.geometry.dispose();
                rightLine.geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    right.clone().multiplyScalar(10)
                ]);
            }
            
            // Update the trail effect
            trail.update();
            
            // Return the current player state for the camera to follow
            return {
                position: head.mesh.position.clone(),
                direction: hoverBike.currentDirection.clone(),
                up: head.mesh.position.clone().normalize()
            };
        },
        
        /**
         * Add a new segment to the player
         */
        addSegment: function() {
            if (segments.length >= MAX_SEGMENTS) {
                return; // Limit the maximum number of segments
            }
            
            // Create a new segment
            const segmentGeometry = new THREE.SphereGeometry(PLAYER_SEGMENT_SIZE * 0.9, 16, 16);
            const segmentMaterial = createGlowingMaterial(0x00ffaa, GLOW_INTENSITY * 0.8);
            const segmentMesh = new THREE.Mesh(segmentGeometry, segmentMaterial);
            
            // Start at the same position as the last segment
            const lastSegment = segments[segments.length - 1];
            segmentMesh.position.copy(lastSegment.position);
            scene.add(segmentMesh);
            
            // Add the new segment
            segments.push({
                position: lastSegment.position.clone(),
                mesh: segmentMesh,
                hoverPhase: Math.random() * Math.PI * 2,
                hoverSpeed: 0.5 + Math.random() * 0.5
            });
            segmentMeshes.push(segmentMesh);
            
            // Update player length
            this.length = segments.length;
            
            return segmentMesh;
        },
        
        /**
         * Check if the player collides with a position in the world
         */
        checkCollision: function(position, radius) {
            // Just check with the head for now
            const head = segments[0];
            const distance = head.mesh.position.distanceTo(position);
            return distance < (PLAYER_SEGMENT_SIZE + radius);
        },
        
        /**
         * Reset the player
         */
        reset: function() {
            // Remove all but the head segment
            for (let i = segments.length - 1; i > 0; i--) {
                const segment = segments[i];
                scene.remove(segment.mesh);
                segment.mesh.geometry.dispose();
                segment.mesh.material.dispose();
                segments.pop();
                segmentMeshes.pop();
            }
            
            // Reset head position
            const initialPosition = new THREE.Vector3(planet.radius + 7.0, 0, 0);
            const head = segments[0];
            head.position.copy(initialPosition);
            head.mesh.position.copy(initialPosition);
            
            // Reset physics
            hoverBike.body.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
            hoverBike.body.velocity.set(0, 0, 0);
            hoverBike.body.angularVelocity.set(0, 0, 0);
            hoverBike.currentDirection.set(0, 0, 1).normalize();
            
            // Reset player length
            this.length = 1;
            
            // Clear the trail
            trail.clear();
            
            // Clear position history
            for (let i = 0; i < positionHistory.length; i++) {
                positionHistory[i] = [];
            }
        }
    };
}

/**
 * Create a glowing material for player segments
 */
function createGlowingMaterial(color, intensity) {
    return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: intensity,
        roughness: 0.3,
        metalness: 0.8
    });
} 
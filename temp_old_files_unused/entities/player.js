/**
 * Luminor
 * Player entity and movement system
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { PLAYER_CONFIG } from '../utils/constants.js';
import { createGlowingMaterial } from '../utils/materials.js';

/**
 * Setup the player entity
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} planet - The planet object
 * @param {THREE.Camera} camera - The camera for tracking
 * @returns {Object} The player object with properties and methods
 */
export function setupPlayer(scene, planet, camera) {
    // Array to hold all segments of the player
    const segments = [];
    const segmentMeshes = [];
    
    // Control state
    let controlState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        boost: false
    };
    
    // Create the head of the player
    const headGeometry = new THREE.SphereGeometry(PLAYER_CONFIG.SEGMENT_SIZE, 16, 16);
    const headMaterial = createGlowingMaterial(0x00ffaa, PLAYER_CONFIG.GLOW_INTENSITY);
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    
    // Set initial position on the planet
    const initialPosition = new THREE.Vector3(
        planet.radius + PLAYER_CONFIG.HOVER_HEIGHT, 
        0, 
        0
    );
    headMesh.position.copy(initialPosition);
    scene.add(headMesh);
    
    // Add the head as the first segment
    segments.push({
        position: initialPosition.clone(),
        mesh: headMesh,
        hoverPhase: Math.random() * Math.PI * 2,  // Random starting phase for hover wobble
        hoverSpeed: 0.5 + Math.random() * 0.5     // Random hover speed
    });
    
    // Setup debug visualization if enabled
    const debugHelpers = [];
    if (PLAYER_CONFIG.DEBUG_ALIGNMENT) {
        setupDebugIndicators(scene);
    }
    
    // Add trail effect if enabled
    let trailEffect = null;
    if (PLAYER_CONFIG.TRAIL_ENABLED) {
        trailEffect = addTrailEffect();
    }
    
    // Player direction (initially pointing along X-axis)
    const direction = new THREE.Vector3(1, 0, 0);
    
    // Up vector (initially pointing along Y-axis)
    const upVector = new THREE.Vector3(0, 1, 0);
    
    // Return the player object with methods
    return {
        // Get the player's head position
        getHeadPosition() {
            return segments[0].position.clone();
        },
        
        // Get player state (for camera tracking)
        getState() {
            return {
                position: segments[0].position.clone(),
                direction: direction.clone(),
                up: upVector.clone(),
                segments: segments.map(s => s.position.clone())
            };
        },
        
        // Update control state (from input system)
        setControlState(state) {
            controlState = {...state};
        },
        
        // Add a new segment to the player
        addSegment() {
            if (segments.length === 0) return;
            
            // Get the position of the last segment
            const lastSegment = segments[segments.length - 1];
            
            // Create a new segment slightly behind the last one
            const segmentGeometry = new THREE.SphereGeometry(
                PLAYER_CONFIG.SEGMENT_SIZE * 0.9, 16, 16
            );
            const segmentMaterial = createGlowingMaterial(
                0x00ffaa, 
                PLAYER_CONFIG.GLOW_INTENSITY * 0.8
            );
            const segmentMesh = new THREE.Mesh(segmentGeometry, segmentMaterial);
            
            // Position the new segment behind the last one
            const offset = direction.clone().negate().multiplyScalar(
                PLAYER_CONFIG.MIN_SEGMENT_DISTANCE
            );
            const newPosition = lastSegment.position.clone().add(offset);
            segmentMesh.position.copy(newPosition);
            
            // Add to scene and segments array
            scene.add(segmentMesh);
            segments.push({
                position: newPosition,
                mesh: segmentMesh,
                hoverPhase: Math.random() * Math.PI * 2,
                hoverSpeed: 0.5 + Math.random() * 0.5
            });
        },
        
        // Check collision with self
        checkCollision() {
            // Only check if we have enough segments
            if (segments.length < 5) return false;
            
            const headPosition = segments[0].position;
            const headSize = PLAYER_CONFIG.SEGMENT_SIZE;
            
            // Check collision with other segments (skip the first few)
            for (let i = 4; i < segments.length; i++) {
                const distance = headPosition.distanceTo(segments[i].position);
                if (distance < headSize + PLAYER_CONFIG.SEGMENT_SIZE * 0.5) {
                    return true; // Collision detected
                }
            }
            
            return false;
        },
        
        // Reset the player
        reset() {
            // Remove all segments except the head
            for (let i = segments.length - 1; i > 0; i--) {
                scene.remove(segments[i].mesh);
                segments.pop();
            }
            
            // Reset head position
            const resetPosition = new THREE.Vector3(
                planet.radius + PLAYER_CONFIG.HOVER_HEIGHT, 
                0, 
                0
            );
            segments[0].position.copy(resetPosition);
            segments[0].mesh.position.copy(resetPosition);
            
            // Reset direction
            direction.set(1, 0, 0);
            upVector.set(0, 1, 0);
        },
        
        // Update player state
        update(deltaTime) {
            // Apply controls to change direction
            if (controlState.left) {
                // Calculate the rotation axis (up vector)
                const rotationAxis = upVector.clone();
                
                // Create rotation quaternion
                const rotationAngle = PLAYER_CONFIG.TURN_SPEED;
                const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
                    rotationAxis, 
                    rotationAngle
                );
                
                // Apply rotation to direction vector
                direction.applyQuaternion(rotationQuaternion);
            }
            
            if (controlState.right) {
                // Calculate the rotation axis (up vector)
                const rotationAxis = upVector.clone();
                
                // Create rotation quaternion (negative angle for right turn)
                const rotationAngle = -PLAYER_CONFIG.TURN_SPEED;
                const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
                    rotationAxis, 
                    rotationAngle
                );
                
                // Apply rotation to direction vector
                direction.applyQuaternion(rotationQuaternion);
            }
            
            // Calculate movement speed
            let speed = PLAYER_CONFIG.SPEED;
            if (controlState.forward) {
                speed *= 1.5; // Faster forward
            }
            if (controlState.backward) {
                speed *= 0.5; // Slower backward
            }
            if (controlState.boost) {
                speed *= 2.0; // Boost multiplier
            }
            
            // Update head position
            const headSegment = segments[0];
            const displacement = direction.clone().multiplyScalar(speed * deltaTime);
            
            // Update position
            headSegment.position.add(displacement);
            
            // Get nearest point on planet surface
            const surfacePoint = planet.getNearestPointOnSurface(
                headSegment.position.clone().normalize()
            );
            
            // Get normal at this point (for up vector)
            const normal = headSegment.position.clone().normalize();
            
            // Update up vector to align with planet normal
            upVector.lerp(normal, 0.1);
            upVector.normalize();
            
            // Adjust height above terrain
            const surfaceHeight = surfacePoint.length();
            const targetHeight = surfaceHeight + PLAYER_CONFIG.HOVER_HEIGHT;
            
            // Get direction from center to player
            const centerToPlayer = headSegment.position.clone().normalize();
            
            // Set player at correct height along the normal
            headSegment.position.copy(centerToPlayer.multiplyScalar(targetHeight));
            
            // Update hover effect
            applyHoverEffect(headSegment.position.clone(), headSegment, deltaTime);
            
            // Update head mesh position
            headSegment.mesh.position.copy(headSegment.position);
            
            // Update debug visualization
            if (PLAYER_CONFIG.DEBUG_ALIGNMENT) {
                updateDebugIndicators();
            }
            
            // Update trail effect
            if (trailEffect) {
                trailEffect.update(deltaTime);
            }
            
            // Update remaining segments with follow behavior
            updateSegments(deltaTime);
        }
    };
    
    /**
     * Apply hover effect to a segment
     * @param {THREE.Vector3} basePosition - Base position on the terrain
     * @param {Object} segment - The segment to update
     * @param {number} deltaTime - Time since last frame
     */
    function applyHoverEffect(basePosition, segment, deltaTime) {
        // Update hover phase
        segment.hoverPhase += deltaTime * segment.hoverSpeed;
        
        // Calculate hover offset
        const hoverOffset = Math.sin(segment.hoverPhase) * PLAYER_CONFIG.HOVER_WOBBLE;
        
        // Apply hover offset along the up vector
        const hoverVector = upVector.clone().multiplyScalar(hoverOffset);
        segment.position.copy(basePosition.clone().add(hoverVector));
    }
    
    /**
     * Update all segments to follow the head
     * @param {number} deltaTime - Time since last frame
     */
    function updateSegments(deltaTime) {
        // Skip if only head exists
        if (segments.length <= 1) return;
        
        // Update each segment to follow the one in front
        for (let i = 1; i < segments.length; i++) {
            const segment = segments[i];
            const targetSegment = segments[i - 1];
            
            // Get direction from this segment to the target
            const toTarget = new THREE.Vector3().subVectors(
                targetSegment.position, 
                segment.position
            );
            const distance = toTarget.length();
            
            // Only move if beyond minimum distance
            if (distance > PLAYER_CONFIG.MIN_SEGMENT_DISTANCE) {
                // Calculate how much to move (more if farther away)
                const moveDistance = Math.min(
                    distance - PLAYER_CONFIG.MIN_SEGMENT_DISTANCE,
                    PLAYER_CONFIG.SPEED * deltaTime * 2
                );
                
                // Move towards target
                if (moveDistance > 0) {
                    const moveDirection = toTarget.normalize();
                    segment.position.add(
                        moveDirection.multiplyScalar(moveDistance)
                    );
                }
            }
            
            // Apply hover effect
            applyHoverEffect(segment.position, segment, deltaTime);
            
            // Update mesh position
            segment.mesh.position.copy(segment.position);
        }
    }
    
    /**
     * Setup debug alignment indicators
     * @param {THREE.Scene} scene - The Three.js scene
     */
    function setupDebugIndicators(scene) {
        // Create up vector indicator (green)
        const upLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 1, 0)
            ]),
            new THREE.LineBasicMaterial({ color: 0x00ff00 })
        );
        
        // Create direction indicator (red)
        const dirLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(1, 0, 0)
            ]),
            new THREE.LineBasicMaterial({ color: 0xff0000 })
        );
        
        // Add to scene and store
        scene.add(upLine);
        scene.add(dirLine);
        debugHelpers.push(upLine, dirLine);
    }
    
    /**
     * Update debug indicators
     */
    function updateDebugIndicators() {
        if (debugHelpers.length < 2) return;
        
        const [upLine, dirLine] = debugHelpers;
        const headPosition = segments[0].position.clone();
        
        // Update up vector indicator
        const upEnd = upVector.clone().multiplyScalar(10).add(headPosition);
        upLine.geometry.setFromPoints([headPosition, upEnd]);
        
        // Update direction indicator
        const dirEnd = direction.clone().multiplyScalar(10).add(headPosition);
        dirLine.geometry.setFromPoints([headPosition, dirEnd]);
        
        // Update geometries
        upLine.geometry.verticesNeedUpdate = true;
        dirLine.geometry.verticesNeedUpdate = true;
    }
    
    /**
     * Add trail effect to the player
     * @returns {Object} Trail effect controller
     */
    function addTrailEffect() {
        // Create particles for trail
        const trailParticles = [];
        const particleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const particleMaterial = createGlowingMaterial(0x00ffaa, 0.8);
        
        // Return trail controller
        return {
            // Update trail particles
            update(deltaTime) {
                // Add new particles at a steady rate
                const emitCount = Math.floor(PLAYER_CONFIG.TRAIL_EMISSION_RATE * deltaTime);
                for (let i = 0; i < emitCount; i++) {
                    if (segments.length > 0) {
                        // Create a new particle at the last segment's position
                        const lastSegment = segments[segments.length - 1];
                        const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial.clone());
                        particleMesh.position.copy(lastSegment.position);
                        particleMesh.scale.set(1, 1, 1);
                        scene.add(particleMesh);
                        
                        // Add to particles array
                        trailParticles.push({
                            mesh: particleMesh,
                            life: PLAYER_CONFIG.TRAIL_LIFETIME,
                            initialScale: 1.0
                        });
                    }
                }
                
                // Update existing particles
                for (let i = trailParticles.length - 1; i >= 0; i--) {
                    const particle = trailParticles[i];
                    
                    // Decrease lifetime
                    particle.life -= deltaTime;
                    
                    // Remove if expired
                    if (particle.life <= 0) {
                        scene.remove(particle.mesh);
                        trailParticles.splice(i, 1);
                        continue;
                    }
                    
                    // Update scale and opacity based on remaining life
                    const lifeRatio = particle.life / PLAYER_CONFIG.TRAIL_LIFETIME;
                    const scale = lifeRatio * particle.initialScale;
                    particle.mesh.scale.set(scale, scale, scale);
                    
                    // Update material opacity
                    if (particle.mesh.material.opacity !== undefined) {
                        particle.mesh.material.opacity = lifeRatio;
                    }
                }
            }
        };
    }
} 
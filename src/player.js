/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Player configuration
const PLAYER_SEGMENT_SIZE = 2.0;    // Increased segment size for visibility on much larger planet
const PLAYER_SPEED = 1.3;             // Speed for the larger planet
const PLAYER_TURN_SPEED = 0.017;     // Smoother turning
const MIN_SEGMENT_DISTANCE = 2.0;   // Minimum distance between segments
const MAX_SEGMENT_DISTANCE = 3.0;   // Maximum distance between segments (to prevent gaps)
const GLOW_INTENSITY = 1.8;         // Increase glow for better visibility
const HOVER_HEIGHT = 7.0;           // INCREASED to handle more dramatic terrain features
const HOVER_SMOOTHNESS = 0.08;      // DECREASED for smoother transitions over extreme terrain
const HOVER_WOBBLE = 0.6;           // INCREASED for more visible hovering movement

// Debug visualization settings
const DEBUG_ALIGNMENT = true;        // Enable debug alignment indicators
const ALIGNMENT_LINE_LENGTH = 10;    // Length of the alignment indicator lines

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
    const initialPosition = new THREE.Vector3(planet.radius + HOVER_HEIGHT, 0, 0);
    headMesh.position.copy(initialPosition);
    scene.add(headMesh);
    
    // Add the head as the first segment
    segments.push({
        position: initialPosition.clone(),
        mesh: headMesh,
        hoverPhase: Math.random() * Math.PI * 2,  // Random starting phase for hover wobble
        hoverSpeed: 0.5 + Math.random() * 0.5     // Random hover speed
    });
    segmentMeshes.push(headMesh);
    
    // Direction the player is moving
    let currentDirection = new THREE.Vector3(0, 0, 1).normalize();
    
    // Setup debug visualization objects
    let surfaceNormalLine, directionLine, rightLine;
    
    if (DEBUG_ALIGNMENT) {
        // Create line showing normal (up) direction - RED
        const normalMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
        const normalGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, ALIGNMENT_LINE_LENGTH, 0)
        ]);
        surfaceNormalLine = new THREE.Line(normalGeometry, normalMaterial);
        scene.add(surfaceNormalLine);
        
        // Create line showing forward direction - GREEN
        const directionMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
        const directionGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, ALIGNMENT_LINE_LENGTH)
        ]);
        directionLine = new THREE.Line(directionGeometry, directionMaterial);
        scene.add(directionLine);
        
        // Create line showing right direction - BLUE
        const rightMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });
        const rightGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(ALIGNMENT_LINE_LENGTH, 0, 0)
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
    
    // Store previous positions for each segment to create a smoother following effect
    const positionHistory = [];
    const HISTORY_LENGTH = 10; // Number of positions to remember per segment
    
    // Track time for hover effect
    let time = 0;
    
    // Apply hover effect to position - makes the player float above terrain
    function applyHoverEffect(basePosition, segment, deltaTime) {
        // Update hover phase
        segment.hoverPhase += deltaTime * 0.001 * segment.hoverSpeed;
        
        // Get the normal to the planet surface at this position
        const surfaceNormal = basePosition.clone().normalize();
        
        // Calculate hover position with minimal wobble
        const hoverWobble = Math.sin(segment.hoverPhase) * HOVER_WOBBLE;
        const hoverDist = HOVER_HEIGHT + hoverWobble;
        
        // Apply hover distance along normal
        const hoverPosition = basePosition.clone().add(
            surfaceNormal.multiplyScalar(hoverDist)
        );
        
        return hoverPosition;
    }
    
    // Player object with properties and methods
    return {
        segments,
        segmentMeshes,
        length: 1,
        
        // Set visibility of the player
        setVisible: function(visible) {
            for (const mesh of segmentMeshes) {
                mesh.visible = visible;
            }
        },
        
        // Update the player's position and segments
        update: function() {
            // Update time
            time += 1/60; // Assume 60fps
            
            // Get the head segment
            const head = segments[0];
            
            // Calculate the up vector (normal to planet surface at player position)
            const up = head.position.clone().normalize();
            
            // Apply steering based on keyboard input
            if (keys.left) {
                // Rotate currentDirection around the up vector
                currentDirection.applyAxisAngle(up, PLAYER_TURN_SPEED);
                currentDirection.normalize();
            }
            
            if (keys.right) {
                // Rotate currentDirection around the up vector
                currentDirection.applyAxisAngle(up, -PLAYER_TURN_SPEED);
                currentDirection.normalize();
            }
            
            // Calculate right vector
            const right = new THREE.Vector3().crossVectors(currentDirection, up).normalize();
            
            // Recalculate forward direction to ensure it's orthogonal to up
            currentDirection = new THREE.Vector3().crossVectors(up, right).normalize();
            
            // Move head in the current direction
            const newPosition = head.position.clone().add(
                currentDirection.clone().multiplyScalar(PLAYER_SPEED)
            );
            
            // Project to planet surface and add hover height
            const surfacePoint = planet.getNearestPointOnSurface(newPosition);
            const surfaceNormal = surfacePoint.clone().normalize();
            const hoverPosition = surfacePoint.clone().add(
                surfaceNormal.multiplyScalar(HOVER_HEIGHT)
            );
            
            // Update head position
            head.position.copy(hoverPosition);
            head.mesh.position.copy(hoverPosition);
            
            // Update debug visualization if enabled
            if (DEBUG_ALIGNMENT && surfaceNormalLine && directionLine && rightLine) {
                // Position all lines at player head
                surfaceNormalLine.position.copy(head.position);
                directionLine.position.copy(head.position);
                rightLine.position.copy(head.position);
                
                // Update line directions
                // Reset geometries
                const normalPoints = [
                    new THREE.Vector3(0, 0, 0),
                    surfaceNormal.clone().multiplyScalar(ALIGNMENT_LINE_LENGTH)
                ];
                surfaceNormalLine.geometry.setFromPoints(normalPoints);
                
                const dirPoints = [
                    new THREE.Vector3(0, 0, 0),
                    currentDirection.clone().multiplyScalar(ALIGNMENT_LINE_LENGTH)
                ];
                directionLine.geometry.setFromPoints(dirPoints);
                
                const rightPoints = [
                    new THREE.Vector3(0, 0, 0),
                    right.clone().multiplyScalar(ALIGNMENT_LINE_LENGTH)
                ];
                rightLine.geometry.setFromPoints(rightPoints);
            }
            
            // Update segment positions with simplified following
            for (let i = 1; i < segments.length; i++) {
                const segment = segments[i];
                const prevSegment = segments[i - 1];
                
                // Direction to previous segment
                const direction = prevSegment.position.clone().sub(segment.position).normalize();
                
                // Target position (at fixed distance from previous segment)
                const targetPosition = prevSegment.position.clone().sub(
                    direction.multiplyScalar(MIN_SEGMENT_DISTANCE * 1.2)
                );
                
                // Update position
                segment.position.lerp(targetPosition, 0.3);
                segment.mesh.position.copy(segment.position);
                
                // Orient segment to face next segment
                if (i < segments.length - 1) {
                    const nextSegment = segments[i + 1];
                    segment.mesh.lookAt(nextSegment.position);
                } else {
                    const prevSegment = segments[i - 1];
                    const lookDir = segment.position.clone().sub(prevSegment.position).normalize();
                    segment.mesh.lookAt(segment.position.clone().add(lookDir));
                }
                
                // Set up direction
                const segmentUp = segment.position.clone().normalize();
                segment.mesh.up.copy(segmentUp);
            }
            
            // Update head orientation to face direction of movement
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
                    mesh: segmentMesh,
                    hoverPhase: Math.random() * Math.PI * 2,  // Random starting phase
                    hoverSpeed: 0.5 + Math.random() * 0.5     // Random speed
                });
                segmentMeshes.push(segmentMesh);
                
                // Initialize position history for new segment
                const segmentIndex = segments.length - 1;
                positionHistory[segmentIndex] = [];
                
                // Fill with current position
                for (let j = 0; j < HISTORY_LENGTH; j++) {
                    positionHistory[segmentIndex].push(newPosition.clone());
                }
            }
            
            this.length += amount;
        },
        
        // Check if the player has collided with itself
        checkSelfCollision: function() {
            // Disable self-collision as requested
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
            
            // Clear position history
            positionHistory.length = 0;
            
            // Remove debug visualization if enabled
            if (DEBUG_ALIGNMENT) {
                if (surfaceNormalLine) {
                    scene.remove(surfaceNormalLine);
                    surfaceNormalLine.geometry.dispose();
                    surfaceNormalLine.material.dispose();
                }
                if (directionLine) {
                    scene.remove(directionLine);
                    directionLine.geometry.dispose();
                    directionLine.material.dispose();
                }
                if (rightLine) {
                    scene.remove(rightLine);
                    rightLine.geometry.dispose();
                    rightLine.material.dispose();
                }
            }
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
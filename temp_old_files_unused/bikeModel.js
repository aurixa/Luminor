/**
 * Luminor - Bike Visual Model
 * Creates the 3D visual representation of the hovering bike
 */

import * as THREE from 'three';

// Visual configuration
const BIKE_VISUAL_CONFIG = {
    // Colors
    colors: {
        main: 0x00ffaa,     // Main color (same as the existing player)
        accent: 0x0088cc,   // Accent color for details
        glow: 0x00ffdd,     // Color for glowing parts
        engine: 0xff8800    // Color for engine/thruster parts
    },
    
    // Glow effect
    glow: {
        intensity: 1.8,
        size: 1.2
    },
    
    // Hover effect
    hover: {
        glowColor: 0x00ffff,
        glowIntensity: 0.8,
        particleCount: 15,
        particleSize: 0.8,
        particleSpeed: 0.3
    }
};

/**
 * Creates the visual model for the hovering bike
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} The bike visual object
 */
export function createBikeVisual(scene) {
    // Create a group to hold all bike parts
    const bikeGroup = new THREE.Group();
    scene.add(bikeGroup);
    
    // Create the main body of the bike
    const mainBody = createBikeBody();
    bikeGroup.add(mainBody);
    
    // Create the front fork and wheel
    const frontFork = createFrontFork();
    bikeGroup.add(frontFork);
    
    // Create engine/thruster effects
    const thrusterEffects = createThrusterEffects();
    bikeGroup.add(thrusterEffects);
    
    // Create hover effects (particles, etc.)
    const hoverEffects = createHoverEffects();
    bikeGroup.add(hoverEffects);
    
    // Track time for animations
    let time = 0;
    
    return {
        model: bikeGroup,
        
        // Update the visual model's position and rotation to match physics
        update: function(position, quaternion, deltaTime) {
            // Update time for animations
            time += deltaTime;
            
            // Update position and rotation
            bikeGroup.position.copy(position);
            bikeGroup.quaternion.copy(quaternion);
            
            // Animate thruster effects
            animateThrusterEffects(time);
            
            // Animate hover effects
            animateHoverEffects(time);
        },
        
        // Clean up resources
        dispose: function() {
            scene.remove(bikeGroup);
            // Dispose of geometries and materials
            // (In a full implementation, we would iterate through all meshes and dispose properly)
        }
    };
    
    // Create the main body of the bike
    function createBikeBody() {
        const bodyGroup = new THREE.Group();
        
        // Create the main frame
        const frameGeometry = new THREE.BoxGeometry(1.0, 0.4, 2.0);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: BIKE_VISUAL_CONFIG.colors.main,
            roughness: 0.3,
            metalness: 0.7,
            emissive: BIKE_VISUAL_CONFIG.colors.main,
            emissiveIntensity: 0.2
        });
        const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
        frameMesh.position.y = 0.2;
        bodyGroup.add(frameMesh);
        
        // Create the seat
        const seatGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.8);
        const seatMaterial = new THREE.MeshStandardMaterial({
            color: BIKE_VISUAL_CONFIG.colors.accent,
            roughness: 0.2,
            metalness: 0.5
        });
        const seatMesh = new THREE.Mesh(seatGeometry, seatMaterial);
        seatMesh.position.set(0, 0.45, -0.4);
        bodyGroup.add(seatMesh);
        
        // Create the handlebars
        const handlebarGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.0);
        handlebarGeometry.rotateZ(Math.PI / 2);
        const handlebarMaterial = new THREE.MeshStandardMaterial({
            color: BIKE_VISUAL_CONFIG.colors.accent,
            roughness: 0.3,
            metalness: 0.7
        });
        const handlebarMesh = new THREE.Mesh(handlebarGeometry, handlebarMaterial);
        handlebarMesh.position.set(0, 0.5, 0.6);
        bodyGroup.add(handlebarMesh);
        
        // Add engine housings on the sides
        const engineHousingGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.5);
        engineHousingGeometry.rotateZ(Math.PI / 2);
        const engineHousingMaterial = new THREE.MeshStandardMaterial({
            color: BIKE_VISUAL_CONFIG.colors.accent,
            roughness: 0.2,
            metalness: 0.8
        });
        
        // Left engine housing
        const leftEngineHousing = new THREE.Mesh(engineHousingGeometry, engineHousingMaterial);
        leftEngineHousing.position.set(-0.6, 0.25, -0.5);
        bodyGroup.add(leftEngineHousing);
        
        // Right engine housing
        const rightEngineHousing = new THREE.Mesh(engineHousingGeometry, engineHousingMaterial);
        rightEngineHousing.position.set(0.6, 0.25, -0.5);
        bodyGroup.add(rightEngineHousing);
        
        // Add some glow to the bike
        addBikeGlow(bodyGroup);
        
        return bodyGroup;
    }
    
    // Create the front fork and wheel
    function createFrontFork() {
        const forkGroup = new THREE.Group();
        
        // Create the fork structure
        const forkGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6);
        const forkMaterial = new THREE.MeshStandardMaterial({
            color: BIKE_VISUAL_CONFIG.colors.accent,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Left fork
        const leftFork = new THREE.Mesh(forkGeometry, forkMaterial);
        leftFork.position.set(-0.4, 0.0, 0.8);
        forkGroup.add(leftFork);
        
        // Right fork
        const rightFork = new THREE.Mesh(forkGeometry, forkMaterial);
        rightFork.position.set(0.4, 0.0, 0.8);
        forkGroup.add(rightFork);
        
        // Create the front wheel (hover disc)
        const wheelGeometry = new THREE.TorusGeometry(0.4, 0.1, 16, 32);
        wheelGeometry.rotateX(Math.PI / 2);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: BIKE_VISUAL_CONFIG.colors.main,
            roughness: 0.2,
            metalness: 0.8,
            emissive: BIKE_VISUAL_CONFIG.colors.main,
            emissiveIntensity: 0.4
        });
        const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheelMesh.position.set(0, -0.2, 0.8);
        forkGroup.add(wheelMesh);
        
        return forkGroup;
    }
    
    // Create thruster/engine effects
    function createThrusterEffects() {
        const thrusterGroup = new THREE.Group();
        
        // Create glowing thruster outlets
        const thrusterGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1);
        thrusterGeometry.rotateZ(Math.PI / 2);
        const thrusterMaterial = new THREE.MeshStandardMaterial({
            color: BIKE_VISUAL_CONFIG.colors.engine,
            roughness: 0.1,
            metalness: 0.2,
            emissive: BIKE_VISUAL_CONFIG.colors.engine,
            emissiveIntensity: 1.0
        });
        
        // Left thruster
        const leftThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
        leftThruster.position.set(-0.85, 0.25, -0.5);
        thrusterGroup.add(leftThruster);
        
        // Right thruster
        const rightThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
        rightThruster.position.set(0.85, 0.25, -0.5);
        thrusterGroup.add(rightThruster);
        
        // Create thruster glow effect
        const glowGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.05);
        glowGeometry.rotateZ(Math.PI / 2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: BIKE_VISUAL_CONFIG.colors.engine,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        // Left glow
        const leftGlow = new THREE.Mesh(glowGeometry, glowMaterial.clone());
        leftGlow.position.set(-0.92, 0.25, -0.5);
        leftGlow.scale.set(1.2, 1.0, 1.2);
        thrusterGroup.add(leftGlow);
        
        // Right glow
        const rightGlow = new THREE.Mesh(glowGeometry, glowMaterial.clone());
        rightGlow.position.set(0.92, 0.25, -0.5);
        rightGlow.scale.set(1.2, 1.0, 1.2);
        thrusterGroup.add(rightGlow);
        
        // Store references for animation
        thrusterGroup.userData = {
            leftGlow: leftGlow,
            rightGlow: rightGlow
        };
        
        return thrusterGroup;
    }
    
    // Create hover effects (particles, glow)
    function createHoverEffects() {
        const hoverGroup = new THREE.Group();
        
        // Create a hover glow plane underneath the bike
        const hoverPlaneGeometry = new THREE.PlaneGeometry(2.0, 3.0);
        const hoverPlaneMaterial = new THREE.MeshBasicMaterial({
            color: BIKE_VISUAL_CONFIG.hover.glowColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const hoverPlane = new THREE.Mesh(hoverPlaneGeometry, hoverPlaneMaterial);
        hoverPlane.position.y = -0.5;
        hoverPlane.rotation.x = Math.PI / 2;
        hoverGroup.add(hoverPlane);
        
        // Create hover particles
        const particles = [];
        const particleGeometry = new THREE.SphereGeometry(BIKE_VISUAL_CONFIG.hover.particleSize, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: BIKE_VISUAL_CONFIG.hover.glowColor,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < BIKE_VISUAL_CONFIG.hover.particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            
            // Randomize initial positions
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.7;
            particle.position.x = Math.cos(angle) * radius;
            particle.position.z = Math.sin(angle) * radius;
            particle.position.y = -0.5 - Math.random() * 0.3;
            
            // Randomize scale
            const scale = 0.5 + Math.random() * 0.5;
            particle.scale.set(scale, scale, scale);
            
            // Store animation data
            particle.userData = {
                baseY: particle.position.y,
                angle: angle,
                radius: radius,
                speed: 0.5 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2
            };
            
            hoverGroup.add(particle);
            particles.push(particle);
        }
        
        // Store references for animation
        hoverGroup.userData = {
            hoverPlane: hoverPlane,
            particles: particles
        };
        
        return hoverGroup;
    }
    
    // Add glowing effect to the bike
    function addBikeGlow(bikeGroup) {
        // Add some glowing parts to highlight the bike
        const glowPoints = [
            { position: new THREE.Vector3(0, 0.5, 0.7), scale: 0.15 },
            { position: new THREE.Vector3(0, 0.3, -0.7), scale: 0.15 },
            { position: new THREE.Vector3(-0.5, 0.2, 0.0), scale: 0.1 },
            { position: new THREE.Vector3(0.5, 0.2, 0.0), scale: 0.1 }
        ];
        
        const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: BIKE_VISUAL_CONFIG.colors.glow,
            transparent: true,
            opacity: 0.8
        });
        
        for (const point of glowPoints) {
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial.clone());
            glowMesh.position.copy(point.position);
            glowMesh.scale.set(point.scale, point.scale, point.scale);
            bikeGroup.add(glowMesh);
        }
    }
    
    // Animate thruster effects
    function animateThrusterEffects(time) {
        const thrusterEffects = bikeGroup.children[2];
        
        if (thrusterEffects && thrusterEffects.userData) {
            const { leftGlow, rightGlow } = thrusterEffects.userData;
            
            // Pulse the thrusters
            const pulseIntensity = 0.7 + 0.3 * Math.sin(time * 10);
            
            if (leftGlow) {
                leftGlow.material.opacity = pulseIntensity * 0.8;
                leftGlow.scale.set(1.0 + pulseIntensity * 0.2, 1.0, 1.0 + pulseIntensity * 0.2);
            }
            
            if (rightGlow) {
                rightGlow.material.opacity = pulseIntensity * 0.8;
                rightGlow.scale.set(1.0 + pulseIntensity * 0.2, 1.0, 1.0 + pulseIntensity * 0.2);
            }
        }
    }
    
    // Animate hover effects
    function animateHoverEffects(time) {
        const hoverEffects = bikeGroup.children[3];
        
        if (hoverEffects && hoverEffects.userData) {
            const { hoverPlane, particles } = hoverEffects.userData;
            
            // Pulse the hover plane
            if (hoverPlane) {
                const pulseIntensity = 0.3 + 0.1 * Math.sin(time * 3);
                hoverPlane.material.opacity = pulseIntensity;
                hoverPlane.position.y = -0.5 + Math.sin(time * 2) * 0.05;
            }
            
            // Animate the particles
            if (particles) {
                for (let i = 0; i < particles.length; i++) {
                    const particle = particles[i];
                    const data = particle.userData;
                    
                    // Update particle position
                    data.angle += data.speed * 0.01;
                    particle.position.x = Math.cos(data.angle) * data.radius;
                    particle.position.z = Math.sin(data.angle) * data.radius;
                    particle.position.y = data.baseY + Math.sin(time * 3 + data.phase) * 0.1;
                    
                    // Pulse the opacity
                    particle.material.opacity = 0.5 + 0.5 * Math.sin(time * 2 + data.phase);
                }
            }
        }
    }
} 
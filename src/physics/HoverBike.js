/**
 * Luminor
 * Physics-based hover bike implementation
 */

import * as CANNON from 'cannon-es';
import * as THREE from 'three';

// Hover bike physics configuration
const HOVER_CONSTANTS = {
  // Mass and physical properties
  MASS: 5.0,
  SEGMENT_SIZE: 2.0,
  
  // Hover suspension properties
  HOVER_HEIGHT: 7.0,
  HOVER_STIFFNESS: 150.0,
  HOVER_DAMPING: 4.0,
  
  // Movement properties
  THRUST_MAGNITUDE: 250.0,
  STEER_TORQUE_MAGNITUDE: 80.0,
  
  // Physics tuning
  LINEAR_DAMPING: 0.4,
  ANGULAR_DAMPING: 0.6,
  
  // Safety parameters
  MAX_PLANET_DISTANCE: 500.0,    // Maximum distance from planet center
  MIN_PLANET_DISTANCE: 100.0,    // Minimum distance from planet center
  EMERGENCY_THRUST: 500.0        // Emergency thrust when too close to center
};

/**
 * Creates a physics-based hover bike that uses raycasts for hover suspension
 */
export class HoverBike {
  /**
   * Initialize the hover bike
   * @param {PhysicsWorld} physicsWorld - The physics world
   * @param {Object} planet - The planet object
   * @param {THREE.Object3D} visualModel - The visual 3D model for the bike
   */
  constructor(physicsWorld, planet, visualModel) {
    console.log("[HoverBike] Initializing...");
    this.physicsWorld = physicsWorld;
    this.planet = planet;
    this.visualModel = visualModel;
    
    // Print out planet details to debug
    console.log("[HoverBike] Planet:", this.planet ? "Found" : "Not found");
    if (this.planet) {
      console.log("[HoverBike] Planet radius:", this.planet.radius);
      console.log("[HoverBike] Planet getNearestPointOnSurface:", 
                 typeof this.planet.getNearestPointOnSurface === 'function' ? "Function exists" : "Missing");
    }
    
    // Create the physics body for the hover bike
    this.initPhysicsBody();
    
    // Keep track of current direction separately from body orientation
    this.currentDirection = new THREE.Vector3(0, 0, 1).normalize();
    
    // Controls state
    this.keys = {
      left: false,
      right: false
    };
    
    // Safety state
    this.lastSafePosition = null;
    this.insidePlanet = false;
    
    // Debug visualization
    this.debug = {
      enabled: false,
      hoverRays: []
    };
    
    // Attempt to spawn on surface
    if (this.body && this.planet) {
      try {
        this.spawnOnSurface();
        console.log("[HoverBike] Spawned on surface");
      } catch (e) {
        console.error("[HoverBike] Error spawning on surface:", e);
        // Set a default safe position if spawn fails
        const defaultPos = new CANNON.Vec3(0, planet.radius + HOVER_CONSTANTS.HOVER_HEIGHT * 2, 0);
        this.body.position.copy(defaultPos);
        this.lastSafePosition = defaultPos.clone();
      }
    } else {
      console.error("[HoverBike] Cannot spawn - missing body or planet");
    }
    console.log("[HoverBike] Initialization complete");
  }
  
  /**
   * Initialize the physics body
   */
  initPhysicsBody() {
    // Check if we have a physics world
    if (!this.physicsWorld) {
      console.error("[HoverBike] No physics world provided");
      return;
    }
    
    console.log("[HoverBike] Creating physics body at position:", 
      this.visualModel.position.x, 
      this.visualModel.position.y, 
      this.visualModel.position.z
    );
    
    // Create a sphere body for the hover bike
    this.body = this.physicsWorld.createSphereBody({
      mass: HOVER_CONSTANTS.MASS,
      radius: HOVER_CONSTANTS.SEGMENT_SIZE,
      position: new CANNON.Vec3(
        this.visualModel.position.x,
        this.visualModel.position.y,
        this.visualModel.position.z
      ),
      linearDamping: HOVER_CONSTANTS.LINEAR_DAMPING,
      angularDamping: HOVER_CONSTANTS.ANGULAR_DAMPING
    });
    
    // Add the body to the physics world
    this.physicsWorld.addBody(this.body, this);
    console.log("[HoverBike] Physics body created");
  }
  
  /**
   * Spawn the hover bike on the planet surface
   */
  spawnOnSurface() {
    if (!this.body || !this.planet) {
      console.error("[HoverBike] Cannot spawn - missing body or planet");
      return;
    }
    
    // Start at a position well outside the planet
    const startPoint = new THREE.Vector3(0, this.planet.radius * 1.5, 0);
    console.log("[HoverBike] Spawning from", startPoint);
    
    try {
      // Get surface point under this position
      console.log("[HoverBike] Getting nearest surface point...");
      const surfacePoint = this.planet.getNearestPointOnSurface(startPoint);
      console.log("[HoverBike] Surface point:", surfacePoint);
      
      if (!surfacePoint || typeof surfacePoint.clone !== 'function') {
        throw new Error("Invalid surface point returned");
      }
      
      // Position slightly above surface
      const spawnPos = surfacePoint.clone().normalize()
        .multiplyScalar(surfacePoint.length() + HOVER_CONSTANTS.HOVER_HEIGHT);
      console.log("[HoverBike] Spawn position:", spawnPos);
      
      // Set position
      this.body.position.x = spawnPos.x;
      this.body.position.y = spawnPos.y;
      this.body.position.z = spawnPos.z;
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
      
      // Save this as a safe position
      this.lastSafePosition = new CANNON.Vec3().copy(this.body.position);
      console.log("[HoverBike] Spawn complete");
    } catch (e) {
      console.error("[HoverBike] Spawn error:", e);
      // Fallback to a safe default position
      const defaultPos = new CANNON.Vec3(0, this.planet.radius + HOVER_CONSTANTS.HOVER_HEIGHT * 2, 0);
      this.body.position.copy(defaultPos);
      this.lastSafePosition = defaultPos.clone();
      console.log("[HoverBike] Using fallback position");
    }
  }
  
  /**
   * Update the hover bike physics and visuals
   * @param {number} deltaTime - Time step in seconds
   */
  update(deltaTime) {
    if (!this.body || !this.planet) {
      console.warn("[HoverBike] Cannot update - missing body or planet");
      return;
    }
    
    // Safety check to prevent going too far from or too close to planet
    this.enforceSafetyBounds();
    
    // Apply hover forces to stay above the terrain
    this.applyHoverForces();
    
    // Apply movement controls
    this.applyControls();
    
    // Update the visual model position and rotation based on physics body
    this.syncVisualsToPhysics();
    
    // Check for safe position to store
    this.updateSafePosition();
  }
  
  /**
   * Enforce safety bounds to prevent going too far from or through the planet
   */
  enforceSafetyBounds() {
    if (!this.body) return;
    
    // Get distance from planet center
    const distanceFromCenter = Math.sqrt(
      this.body.position.x * this.body.position.x +
      this.body.position.y * this.body.position.y +
      this.body.position.z * this.body.position.z
    );
    
    // Check if too far from planet
    if (distanceFromCenter > HOVER_CONSTANTS.MAX_PLANET_DISTANCE) {
      // Apply force toward planet center
      const dirToCenter = new CANNON.Vec3(
        -this.body.position.x,
        -this.body.position.y,
        -this.body.position.z
      );
      
      // Normalize returns a new vector, so we need to store it
      const normalizedDir = dirToCenter.normalize();
      // Then multiply by our force strength
      const pullForce = new CANNON.Vec3(
        normalizedDir.x * HOVER_CONSTANTS.HOVER_STIFFNESS * 5.0,
        normalizedDir.y * HOVER_CONSTANTS.HOVER_STIFFNESS * 5.0,
        normalizedDir.z * HOVER_CONSTANTS.HOVER_STIFFNESS * 5.0
      );
      
      this.body.applyForce(pullForce, this.body.position);
    }
    
    // Check if too close to planet center
    if (distanceFromCenter < HOVER_CONSTANTS.MIN_PLANET_DISTANCE) {
      // We're likely inside the planet - emergency recovery!
      this.insidePlanet = true;
      
      // Apply strong force away from center
      const dirFromCenter = new CANNON.Vec3(
        this.body.position.x,
        this.body.position.y,
        this.body.position.z
      );
      
      // Normalize returns a new vector, so we need to store it
      const normalizedDir = dirFromCenter.normalize();
      // Then multiply by our emergency thrust
      const emergencyForce = new CANNON.Vec3(
        normalizedDir.x * HOVER_CONSTANTS.EMERGENCY_THRUST,
        normalizedDir.y * HOVER_CONSTANTS.EMERGENCY_THRUST,
        normalizedDir.z * HOVER_CONSTANTS.EMERGENCY_THRUST
      );
      
      this.body.applyForce(emergencyForce, this.body.position);
      
      // Reset velocity to reduce erratic motion
      this.body.velocity.scale(0.8, this.body.velocity);
      this.body.angularVelocity.scale(0.8, this.body.angularVelocity);
      
      // If we have a last safe position and are really stuck, teleport there
      if (this.lastSafePosition && distanceFromCenter < HOVER_CONSTANTS.MIN_PLANET_DISTANCE * 0.5) {
        this.body.position.copy(this.lastSafePosition);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        console.log("[HoverBike] Emergency teleport to last safe position");
      }
    } else {
      this.insidePlanet = false;
    }
  }
  
  /**
   * Store the current position as safe if we're outside the planet and stable
   */
  updateSafePosition() {
    if (!this.body || this.insidePlanet) return;
    
    // Only update if we're relatively stable (low velocity)
    const speed = this.body.velocity.length();
    if (speed < 20) {
      this.lastSafePosition = new CANNON.Vec3().copy(this.body.position);
    }
  }
  
  /**
   * Apply hover forces using raycasts to simulate suspension
   */
  applyHoverForces() {
    // Skip if not properly initialized
    if (!this.body || !this.planet) return;
    
    try {
      // Get the current position as starting point for the raycast
      const rayOrigin = this.body.position.clone();
      
      // Calculate ray direction (from body to planet center = "down")
      const planetCenter = new CANNON.Vec3(0, 0, 0); // Assuming planet at origin
      const rayDirection = new CANNON.Vec3();
      planetCenter.vsub(rayOrigin, rayDirection);
      const normalizedRayDir = rayDirection.normalize();
      
      // Setup raycast
      const rayLength = HOVER_CONSTANTS.HOVER_HEIGHT * 3; // Increased for better detection
      const scaledRayDir = new CANNON.Vec3(
        normalizedRayDir.x * rayLength,
        normalizedRayDir.y * rayLength,
        normalizedRayDir.z * rayLength
      );
      const rayEndPoint = new CANNON.Vec3().copy(rayOrigin).vadd(scaledRayDir);
      
      // Convert to THREE.js vectors for the planet's getNearestPointOnSurface function
      const rayOriginThree = new THREE.Vector3(rayOrigin.x, rayOrigin.y, rayOrigin.z);
      
      // Get the nearest point on the planet surface
      const surfacePoint = this.planet.getNearestPointOnSurface(rayOriginThree);
      
      if (!surfacePoint) {
        console.error("[HoverBike] Surface point is null");
        return;
      }
      
      const surfacePointCannon = new CANNON.Vec3(surfacePoint.x, surfacePoint.y, surfacePoint.z);
      
      // Calculate distance to surface
      const distance = rayOrigin.distanceTo(surfacePointCannon);
      
      // Check if we're inside the planet (distance < 0)
      if (distance < HOVER_CONSTANTS.SEGMENT_SIZE) {
        // We're penetrating the surface, apply strong repulsion force
        const repulsionMagnitude = -HOVER_CONSTANTS.HOVER_STIFFNESS * 5.0;
        const repulsionForce = new CANNON.Vec3(
          normalizedRayDir.x * repulsionMagnitude,
          normalizedRayDir.y * repulsionMagnitude,
          normalizedRayDir.z * repulsionMagnitude
        );
        
        this.body.applyForce(repulsionForce, rayOrigin);
        
        // Dampen velocity to reduce bouncing
        this.body.velocity.scale(0.9, this.body.velocity);
        return;
      }
      
      // Normal hover forces when not penetrating
      // Calculate hover force
      const relativeVelocity = this.body.velocity.dot(normalizedRayDir);
      const distanceError = HOVER_CONSTANTS.HOVER_HEIGHT - distance;
      const dampingForce = -relativeVelocity * HOVER_CONSTANTS.HOVER_DAMPING;
      
      // Create a force that pushes away when too close and pulls in when too far
      let forceMagnitude = 0;
      
      if (Math.abs(distance - HOVER_CONSTANTS.HOVER_HEIGHT) > 0.1) {
        // If we're not at the target height (with small error margin)
        if (distance < HOVER_CONSTANTS.HOVER_HEIGHT) {
          // Too close to surface - push away (negative direction = away from planet)
          const pushForce = distanceError * HOVER_CONSTANTS.HOVER_STIFFNESS + dampingForce;
          forceMagnitude = -pushForce;
        }
        else if (distance < HOVER_CONSTANTS.HOVER_HEIGHT * 2) {
          // Too far from surface but within reasonable range - pull back (positive direction = toward planet)
          // Use higher stiffness for pulling back to ensure return to surface
          const pullForce = -distanceError * (HOVER_CONSTANTS.HOVER_STIFFNESS * 1.5) + dampingForce;
          forceMagnitude = pullForce;
        }
        else {
          // Way too far from surface - apply stronger attraction
          forceMagnitude = distance * 0.5; // Scaled based on distance
        }
        
        // Apply the force at the body position
        const hoverForce = new CANNON.Vec3(
          normalizedRayDir.x * forceMagnitude,
          normalizedRayDir.y * forceMagnitude,
          normalizedRayDir.z * forceMagnitude
        );
        this.body.applyForce(hoverForce, rayOrigin);
      }
      
      // Debug visualization
      if (this.debug.enabled) {
        this.visualizeHoverRay(rayOrigin, normalizedRayDir, distance);
      }
    } catch (e) {
      console.error("[HoverBike] Error in applyHoverForces:", e);
    }
  }
  
  /**
   * Apply steering and thrust controls
   */
  applyControls() {
    if (!this.body) return;
    
    // Skip controls if in emergency recovery
    if (this.insidePlanet) return;
    
    // Get the up vector (normal to planet surface at player position)
    const bodyPosition = new THREE.Vector3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    const up = bodyPosition.clone().normalize();
    
    // Calculate the orientation matrix relative to the planet surface
    // Here we need to create a matrix that aligns with the planet's surface
    const zAxis = this.currentDirection.clone();
    const xAxis = new THREE.Vector3().crossVectors(up, zAxis).normalize();
    zAxis.crossVectors(xAxis, up); // Re-compute to ensure orthogonality
    
    // Apply steering controls
    if (this.keys.left) {
      // Apply torque in the up direction
      const steeringTorque = new CANNON.Vec3(
        up.x * HOVER_CONSTANTS.STEER_TORQUE_MAGNITUDE,
        up.y * HOVER_CONSTANTS.STEER_TORQUE_MAGNITUDE,
        up.z * HOVER_CONSTANTS.STEER_TORQUE_MAGNITUDE
      );
      this.body.applyTorque(steeringTorque);
      
      // Update current direction more immediately for responsive controls
      this.currentDirection.applyAxisAngle(up, 0.03);
    }
    else if (this.keys.right) {
      // Apply torque in the down direction
      const steeringTorque = new CANNON.Vec3(
        -up.x * HOVER_CONSTANTS.STEER_TORQUE_MAGNITUDE,
        -up.y * HOVER_CONSTANTS.STEER_TORQUE_MAGNITUDE,
        -up.z * HOVER_CONSTANTS.STEER_TORQUE_MAGNITUDE
      );
      this.body.applyTorque(steeringTorque);
      
      // Update current direction more immediately for responsive controls
      this.currentDirection.applyAxisAngle(up, -0.03);
    }
    
    // Apply forward thrust
    const thrustVec = new CANNON.Vec3(
      this.currentDirection.x * HOVER_CONSTANTS.THRUST_MAGNITUDE,
      this.currentDirection.y * HOVER_CONSTANTS.THRUST_MAGNITUDE,
      this.currentDirection.z * HOVER_CONSTANTS.THRUST_MAGNITUDE
    );
    
    this.body.applyForce(thrustVec, this.body.position);
  }
  
  /**
   * Synchronize the visual model with the physics body
   */
  syncVisualsToPhysics() {
    if (!this.body || !this.visualModel) return;
    
    // Update position
    this.visualModel.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    
    // Get the up vector (normal to planet surface)
    const up = this.visualModel.position.clone().normalize();
    
    // Create a rotation matrix that aligns with the planet surface
    // and points in the current direction
    const zAxis = this.currentDirection.clone();
    const xAxis = new THREE.Vector3().crossVectors(up, zAxis).normalize();
    zAxis.crossVectors(xAxis, up); // Re-compute to ensure orthogonality
    
    // Create a rotation matrix from these axes
    const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, up, zAxis);
    
    // Apply the rotation to the visual model
    this.visualModel.quaternion.setFromRotationMatrix(rotMatrix);
  }
  
  /**
   * Set keyboard control state
   * @param {Object} keys - Key state object
   */
  setControlState(keys) {
    this.keys = keys;
  }
  
  /**
   * Visualize the hover ray for debugging
   */
  visualizeHoverRay(origin, direction, distance) {
    // This would be implemented with THREE.js Line objects
    // for a debug visualization of the suspension rays
  }
  
  /**
   * Reset the hover bike to its initial state
   */
  reset() {
    // Reset physics properties
    if (this.body) {
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
    }
    
    // Reset directional state
    this.currentDirection = new THREE.Vector3(0, 0, 1).normalize();
    
    // Try to spawn on the surface
    this.spawnOnSurface();
  }
} 
/**
 * Luminor
 * Physics-based hover bike implementation
 */

import * as CANNON from 'cannon-es';
import * as THREE from 'three';

// Hover bike physics configuration
const HOVER_CONSTANTS = {
  // Mass and physical properties
  MASS: 1.0,
  SEGMENT_SIZE: 2.0,
  
  // Hover suspension properties
  HOVER_HEIGHT: 20.0,         // Increased for better terrain clearance
  HOVER_STIFFNESS: 1200.0,    // Increased for stronger hover force
  HOVER_DAMPING: 35.0,        // Increased for better stability
  
  // Movement properties
  THRUST_MAGNITUDE: 250.0,
  STEER_TORQUE_MAGNITUDE: 80.0,
  
  // Physics tuning
  LINEAR_DAMPING: 0.2,
  ANGULAR_DAMPING: 0.2,
  
  // Safety parameters
  MAX_PLANET_DISTANCE: 500.0,    // Maximum distance from planet center
  MIN_PLANET_DISTANCE: 100.0,    // Minimum distance from planet center
  EMERGENCY_THRUST: 1500.0,    // Increased emergency thrust
  SPAWN_HEIGHT_OFFSET: 40.0,   // Increased spawn height
  MAX_FORCE: 4000.0,          // Increased max force
  RECOVERY_FORCE: 3000.0       // Increased recovery force
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
    
    // Validate required dependencies first
    if (!physicsWorld || !planet || !visualModel) {
        throw new Error("[HoverBike] Missing required dependencies");
    }
    
    this.physicsWorld = physicsWorld;
    this.planet = planet;
    this.visualModel = visualModel;
    
    // Initialize state
    this.initialized = false;
    this.body = null;
    this.currentDirection = new THREE.Vector3(0, 0, 1).normalize();
    this.lastSafePosition = null;
    this.insidePlanet = false;
    
    // Controls state
    this.keys = {
        left: false,
        right: false
    };
    
    // Debug visualization
    this.debug = {
        enabled: false,
        hoverRays: []
    };
    
    // Initialize physics in a controlled sequence
    try {
        this.initPhysicsBody();
        this.spawnOnSurface();
        this.initialized = true;
        console.log("[HoverBike] Initialization complete");
    } catch (e) {
        console.error("[HoverBike] Failed to initialize:", e);
        this.initialized = false;
    }
  }
  
  /**
   * Initialize the physics body
   */
  initPhysicsBody() {
    if (!this.physicsWorld || !this.planet) {
        throw new Error("[HoverBike] Cannot create physics body - missing dependencies");
    }
    
    try {
        // Create initial position vector
        const planetRadius = this.planet.radius || 800;
        const spawnHeight = HOVER_CONSTANTS.HOVER_HEIGHT * 2;
        const initialPos = new THREE.Vector3(planetRadius + spawnHeight, 0, 0);
        
        // Validate position before creating body
        if (!this.isValidPosition(initialPos)) {
            throw new Error("[HoverBike] Invalid initial position");
        }
        
        // Create the physics body
        this.body = this.physicsWorld.createSphereBody({
            mass: HOVER_CONSTANTS.MASS,
            radius: HOVER_CONSTANTS.SEGMENT_SIZE,
            position: new CANNON.Vec3(initialPos.x, initialPos.y, initialPos.z),
            linearDamping: HOVER_CONSTANTS.LINEAR_DAMPING,
            angularDamping: HOVER_CONSTANTS.ANGULAR_DAMPING
        });
        
        if (!this.body) {
            throw new Error("[HoverBike] Failed to create physics body");
        }
        
        // Store initial position as safe position
        this.lastSafePosition = new CANNON.Vec3().copy(this.body.position);
        
        // Add to physics world
        this.physicsWorld.addBody(this.body, this);
        
        // Update visual model position
        if (this.visualModel) {
            this.visualModel.position.copy(initialPos);
        }
        
        console.log("[HoverBike] Physics body created at position:", initialPos);
        return true;
    } catch (error) {
        console.error("[HoverBike] Error in initPhysicsBody:", error);
        return false;
    }
  }
  
  /**
   * Spawn the hover bike on the planet surface
   */
  spawnOnSurface() {
    if (!this.body || !this.planet) {
        throw new Error("[HoverBike] Cannot spawn - missing body or planet");
    }
    
    try {
        // Use a simple, guaranteed valid position first
        const safePos = new THREE.Vector3(
            this.planet.radius + HOVER_CONSTANTS.SPAWN_HEIGHT_OFFSET * 2,
            0,
            0
        );
        
        // Set initial position
        this.body.position.set(safePos.x, safePos.y, safePos.z);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        
        // Update visual model
        if (this.visualModel) {
            this.visualModel.position.copy(safePos);
        }
        
        // Set initial direction and store safe position
        this.currentDirection = new THREE.Vector3(0, 0, 1);
        this.lastSafePosition = new CANNON.Vec3().copy(this.body.position);
        
        console.log("[HoverBike] Spawn complete at position:", 
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
        );
        
        return true;
    } catch (error) {
        console.error("[HoverBike] Error in spawnOnSurface:", error);
        return false;
    }
  }
  
  // Add position validation helper
  isValidPosition(pos) {
    return pos && 
           typeof pos.x === 'number' && !isNaN(pos.x) &&
           typeof pos.y === 'number' && !isNaN(pos.y) &&
           typeof pos.z === 'number' && !isNaN(pos.z);
  }
  
  /**
   * Update the hover bike physics and visuals
   * @param {number} deltaTime - Time step in seconds
   */
  update(deltaTime) {
    // Skip update if not properly initialized
    if (!this.initialized || !this.body || !this.planet) {
        return;
    }
    
    try {
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
    } catch (e) {
        console.error("[HoverBike] Error in update:", e);
        // Attempt recovery by resetting to last safe state
        if (this.lastSafePosition) {
            this.recoverFromError();
        }
    }
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
    if (!this.initialized || !this.body || !this.planet) return;
    
    try {
        const rayOriginThree = new THREE.Vector3(
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
        );
        
        // Get the nearest point on the planet surface
        const surfacePoint = this.planet.getNearestPointOnSurface(rayOriginThree);
        if (!surfacePoint) {
            console.warn("[HoverBike] No surface point found");
            this.recoverFromError();
            return;
        }
        
        // Calculate distance and direction to surface
        const toSurface = new THREE.Vector3().subVectors(surfacePoint, rayOriginThree);
        const distanceToSurface = toSurface.length();
        const directionToSurface = toSurface.normalize();
        
        // Convert to CANNON vectors
        const normalizedDir = new CANNON.Vec3(
            directionToSurface.x,
            directionToSurface.y,
            directionToSurface.z
        );
        
        // Calculate relative velocity along surface normal
        const relativeVelocity = this.body.velocity.dot(normalizedDir);
        
        // Determine if we're inside the terrain
        const insideTerrain = distanceToSurface < HOVER_CONSTANTS.SEGMENT_SIZE;
        
        if (insideTerrain) {
            // Emergency recovery - strong upward force
            const recoveryForce = new CANNON.Vec3(
                -normalizedDir.x * HOVER_CONSTANTS.RECOVERY_FORCE,
                -normalizedDir.y * HOVER_CONSTANTS.RECOVERY_FORCE,
                -normalizedDir.z * HOVER_CONSTANTS.RECOVERY_FORCE
            );
            
            this.body.applyForce(recoveryForce, this.body.position);
            
            // Strong damping when recovering
            this.body.velocity.scale(0.8, this.body.velocity);
        } else {
            // Normal hover behavior
            const targetHeight = HOVER_CONSTANTS.HOVER_HEIGHT;
            const heightError = distanceToSurface - targetHeight;
            
            // Calculate hover force
            let forceMagnitude = -heightError * HOVER_CONSTANTS.HOVER_STIFFNESS;
            
            // Add damping based on vertical velocity
            forceMagnitude -= relativeVelocity * HOVER_CONSTANTS.HOVER_DAMPING;
            
            // Clamp force magnitude
            forceMagnitude = Math.max(
                -HOVER_CONSTANTS.MAX_FORCE,
                Math.min(HOVER_CONSTANTS.MAX_FORCE, forceMagnitude)
            );
            
            // Apply hover force
            const hoverForce = new CANNON.Vec3(
                normalizedDir.x * forceMagnitude,
                normalizedDir.y * forceMagnitude,
                normalizedDir.z * forceMagnitude
            );
            
            this.body.applyForce(hoverForce, this.body.position);
        }
        
        // Update last safe position if we're in a good state
        if (!insideTerrain && Math.abs(relativeVelocity) < 10) {
            this.lastSafePosition = new CANNON.Vec3().copy(this.body.position);
        }
        
    } catch (e) {
        console.error("[HoverBike] Error in applyHoverForces:", e);
        this.recoverFromError();
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
  
  // Add new error recovery method
  recoverFromError() {
    if (!this.lastSafePosition) return;
    
    console.log("[HoverBike] Attempting error recovery");
    this.body.position.copy(this.lastSafePosition);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.currentDirection = new THREE.Vector3(0, 0, 1).normalize();
  }
} 
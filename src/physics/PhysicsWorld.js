/**
 * Luminor
 * Physics system for spherical planet physics
 */

import * as CANNON from 'cannon-es';
import * as THREE from 'three';

// Physics constants
const GRAVITY_STRENGTH = 15.0;

/**
 * Creates and manages the physics world for the game
 */
export class PhysicsWorld {
  constructor(options = {}) {
    // Create the physics world
    this.world = new CANNON.World();
    
    // Store planet radius for gravity calculations
    this.planetRadius = options.planetRadius || 800;
    this.baseGravity = options.gravity || -9.81;
    
    // Disable default gravity since we'll apply it manually
    this.world.gravity.set(0, 0, 0);
    
    // Configure solver iterations
    this.world.solver.iterations = 10;
    this.world.broadphase = new CANNON.NaiveBroadphase();
    
    // Store bodies and their visual counterparts
    this.bodies = new Map();
    
    console.log("[PhysicsWorld] Initialized with planet radius:", this.planetRadius);
  }
  
  /**
   * Updates gravity for a physics body based on its position relative to planet center
   * @param {CANNON.Body} body - The physics body
   */
  updateBodyGravity(body) {
    if (!body || !body.position) {
        throw new Error("Invalid body in gravity update");
    }
    
    // Calculate gravity direction (from body to planet center)
    const gravityDir = new CANNON.Vec3();
    gravityDir.copy(this.planetCenter);
    gravityDir.vsub(body.position, gravityDir);
    
    const length = gravityDir.length();
    if (length < 0.0001) {
        // Body too close to center, apply small upward force
        body.gravity.set(0, GRAVITY_STRENGTH * 0.1, 0);
        return;
    }
    
    // Normalize and scale by gravity strength
    const normalizedDir = gravityDir.normalize();
    body.gravity.set(
        normalizedDir.x * GRAVITY_STRENGTH,
        normalizedDir.y * GRAVITY_STRENGTH,
        normalizedDir.z * GRAVITY_STRENGTH
    );
  }
  
  /**
   * Step the physics simulation
   * @param {number} deltaTime - Time step in seconds
   */
  update(deltaTime) {
    // Apply planet gravity to each body
    this.world.bodies.forEach(body => {
        if (body.mass > 0) { // Only apply to dynamic bodies
            // Get body position as THREE vector for easier math
            const pos = new THREE.Vector3(
                body.position.x,
                body.position.y,
                body.position.z
            );
            
            // Calculate distance from planet center
            const distanceFromCenter = pos.length();
            
            // Calculate gravity strength (inverse square law)
            const gravityStrength = this.baseGravity * 
                (this.planetRadius * this.planetRadius) / 
                (distanceFromCenter * distanceFromCenter);
            
            // Calculate gravity direction (towards planet center)
            const gravityDir = pos.normalize().multiplyScalar(-1);
            
            // Apply gravity force
            const gravityForce = new CANNON.Vec3(
                gravityDir.x * gravityStrength * body.mass,
                gravityDir.y * gravityStrength * body.mass,
                gravityDir.z * gravityStrength * body.mass
            );
            
            body.applyForce(gravityForce, body.position);
        }
    });
    
    // Step the physics simulation
    this.world.step(deltaTime);
    
    // Update visual models
    this.bodies.forEach((visualModel, body) => {
        if (visualModel) {
            visualModel.position.copy(body.position);
            visualModel.quaternion.copy(body.quaternion);
        }
    });
  }
  
  /**
   * Add a physics body to the world
   * @param {CANNON.Body} body - The physics body to add
   * @param {Object} owner - The owner object (for tracking)
   * @returns {CANNON.Body} The added body
   */
  addBody(body, visualModel = null) {
    if (!body) {
        console.error("Attempted to add invalid body to physics world");
        return null;
    }
    
    try {
        // Create per-body gravity
        body.gravity = new CANNON.Vec3(0, 0, 0);
        
        // Override the applyForce method to use local gravity
        const originalApplyForce = body.applyForce;
        body.applyForce = function(force, worldPoint) {
            if (!force || !worldPoint) return; // Skip invalid forces
            
            try {
                force.vadd(this.gravity, force);
                originalApplyForce.call(this, force, worldPoint);
            } catch (e) {
                console.error("Error applying force:", e);
            }
        };
        
        // Add to world
        this.world.addBody(body);
        
        // Track the body
        if (visualModel) {
            this.bodies.set(body, visualModel);
        }
        
        return body;
    } catch (e) {
        console.error("Error adding body to physics world:", e);
        return null;
    }
  }
  
  /**
   * Remove a physics body from the world
   * @param {CANNON.Body} body - The physics body to remove
   */
  removeBody(body) {
    this.world.removeBody(body);
    
    // Remove from tracking
    this.bodies.delete(body);
  }
  
  /**
   * Create a sphere body
   * @param {Object} options - Body options
   * @returns {CANNON.Body} The created body
   */
  createSphereBody(options = {}) {
    const shape = new CANNON.Sphere(options.radius || 1.0);
    const body = new CANNON.Body({
        mass: options.mass || 1,
        position: options.position || new CANNON.Vec3(0, 0, 0),
        shape: shape,
        linearDamping: options.linearDamping || 0.01,
        angularDamping: options.angularDamping || 0.01
    });
    
    return body;
  }
  
  /**
   * Create a physics body from a Three.js mesh
   * @param {THREE.Mesh} mesh - The mesh to create a body from
   * @param {Object} options - Body options
   * @returns {CANNON.Body} The created body
   */
  createBodyFromMesh(mesh, options = {}) {
    const defaults = {
      mass: 0, // Static by default
      position: new CANNON.Vec3().copy(mesh.position),
      material: new CANNON.Material({ friction: 0.3, restitution: 0.3 })
    };
    
    const opts = { ...defaults, ...options };
    
    // Create body
    const body = new CANNON.Body({
      mass: opts.mass,
      position: opts.position,
      material: opts.material
    });
    
    // Create shape based on geometry type
    if (mesh.geometry instanceof THREE.SphereGeometry) {
      // For sphere geometries
      const radius = mesh.geometry.parameters.radius * 
                    Math.max(mesh.scale.x, mesh.scale.y, mesh.scale.z);
      const shape = new CANNON.Sphere(radius);
      body.addShape(shape);
    } 
    else if (mesh.geometry instanceof THREE.BoxGeometry) {
      // For box geometries
      const sx = mesh.geometry.parameters.width * mesh.scale.x / 2;
      const sy = mesh.geometry.parameters.height * mesh.scale.y / 2;
      const sz = mesh.geometry.parameters.depth * mesh.scale.z / 2;
      const shape = new CANNON.Box(new CANNON.Vec3(sx, sy, sz));
      body.addShape(shape);
    }
    else {
      // For more complex geometries, use a trimesh (lower performance)
      // Note: This is simplified, a real implementation would need more work
      console.warn('Creating trimesh collision for complex geometry - performance may be affected');
      const vertices = mesh.geometry.attributes.position.array;
      const indices = [];
      
      // Generate indices if not available
      for (let i = 0; i < vertices.length / 3; i += 3) {
        indices.push(i, i + 1, i + 2);
      }
      
      const shape = new CANNON.Trimesh(vertices, indices);
      body.addShape(shape);
    }
    
    return body;
  }
  
  /**
   * Handle planet collision through raycasting and custom forces
   * This is an alternative to creating a full planet collision mesh
   */
  createPlanetBodyHandler(planet, options = {}) {
    // Create a virtual collision handler based on the planet's getNearestPointOnSurface function
    return {
      planet,
      options: {
        friction: options.friction || 0.3,
        restitution: options.restitution || 0.2
      },
      
      /**
       * Apply collision response for a body with the planet
       * @param {CANNON.Body} body - The physics body to check
       */
      handleCollision(body) {
        // Skip if no planet mesh with getNearestPointOnSurface
        if (!this.planet || !this.planet.getNearestPointOnSurface) {
          return;
        }
        
        try {
          // Get the position in Three.js format
          const position = new THREE.Vector3(
            body.position.x,
            body.position.y,
            body.position.z
          );
          
          // Validate position before proceeding
          if (!this.isValidPosition(position)) {
            console.warn("Invalid body position in collision handler:", position);
            return;
          }
          
          // Get nearest point on planet surface
          const surfacePoint = this.planet.getNearestPointOnSurface(position);
          
          // Validate surface point
          if (!this.isValidPosition(surfacePoint)) {
            console.warn("Invalid surface point returned from getNearestPointOnSurface");
            return;
          }
          
          // Calculate penetration depth
          const normal = surfacePoint.clone().normalize();
          const bodyToPlanetDir = position.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
          const distanceToSurface = position.distanceTo(surfacePoint);
          
          if (isNaN(distanceToSurface)) {
            console.warn("Invalid distance calculation in collision handler");
            return;
          }
          
          const bodyRadius = body.shapes[0] instanceof CANNON.Sphere ? body.shapes[0].radius : 1;
          const penetration = bodyRadius - distanceToSurface;
          
          // Apply collision response if penetrating
          if (penetration > 0) {
            // Convert normal to CANNON.Vec3
            const responseNormal = new CANNON.Vec3(normal.x, normal.y, normal.z);
            
            // Apply position correction
            body.position.vadd(
              responseNormal.scale(penetration * this.options.restitution),
              body.position
            );
            
            // Apply velocity correction
            const relativeVelocity = body.velocity.dot(responseNormal);
            if (relativeVelocity < 0) {
              const impulse = -relativeVelocity * (1 + this.options.restitution);
              body.velocity.vadd(
                responseNormal.scale(impulse),
                body.velocity
              );
            }
          }
        } catch (error) {
          console.error("Error in planet collision handler:", error);
        }
      }
    };
  }

  // Add position validation helper
  isValidPosition(pos) {
    return pos && 
           typeof pos.x === 'number' && !isNaN(pos.x) &&
           typeof pos.y === 'number' && !isNaN(pos.y) &&
           typeof pos.z === 'number' && !isNaN(pos.z);
  }

  // Add validation helper for Cannon vectors
  isValidCannonVector(vec) {
    return vec && 
           typeof vec.x === 'number' && !isNaN(vec.x) &&
           typeof vec.y === 'number' && !isNaN(vec.y) &&
           typeof vec.z === 'number' && !isNaN(vec.z);
  }

  reset() {
    // Remove all bodies
    this.bodies.forEach((_, body) => {
        this.world.removeBody(body);
    });
    this.bodies.clear();
    
    // Reset the world
    this.world.gravity.set(0, 0, 0);
    this.world.solver.reset();
  }
} 
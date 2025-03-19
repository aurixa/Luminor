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
  constructor() {
    // Create the physics world
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, 0, 0) // Zero gravity initially, we'll update per-body
    });
    
    // Performance settings
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;
    this.world.solver.iterations = 10;
    
    // Track all physics bodies
    this.bodies = new Map();
    
    // Planet center (assuming at origin)
    this.planetCenter = new CANNON.Vec3(0, 0, 0);
    
    // Debug settings
    this.debug = {
      showContacts: false,
      showAABBs: false,
      showVelocities: false
    };
  }
  
  /**
   * Updates gravity for a physics body based on its position relative to planet center
   * @param {CANNON.Body} body - The physics body
   */
  updateBodyGravity(body) {
    // Calculate gravity direction (from body to planet center)
    const gravityDir = new CANNON.Vec3();
    gravityDir.copy(this.planetCenter);
    gravityDir.vsub(body.position, gravityDir);
    
    // Normalize and scale by gravity strength
    if (gravityDir.length() > 0) {
      const normalizedDir = gravityDir.normalize();
      body.gravity.set(
        normalizedDir.x * GRAVITY_STRENGTH,
        normalizedDir.y * GRAVITY_STRENGTH,
        normalizedDir.z * GRAVITY_STRENGTH
      );
    }
  }
  
  /**
   * Step the physics simulation
   * @param {number} deltaTime - Time step in seconds
   */
  update(deltaTime) {
    // Cap delta time to avoid instability
    const dt = Math.min(deltaTime, 1/30);
    
    // Update gravity for each body
    this.bodies.forEach(body => {
      if (body.mass > 0) { // Only update gravity for dynamic bodies
        this.updateBodyGravity(body);
      }
    });
    
    // Step the physics world
    this.world.step(dt);
  }
  
  /**
   * Add a physics body to the world
   * @param {CANNON.Body} body - The physics body to add
   * @param {Object} owner - The owner object (for tracking)
   * @returns {CANNON.Body} The added body
   */
  addBody(body, owner = null) {
    // Create per-body gravity
    body.gravity = new CANNON.Vec3(0, 0, 0);
    
    // Override the applyForce method to use local gravity
    const originalApplyForce = body.applyForce;
    body.applyForce = function(force, worldPoint) {
      force.vadd(this.gravity, force);
      originalApplyForce.call(this, force, worldPoint);
    };
    
    // Add to world
    this.world.addBody(body);
    
    // Track the body
    if (owner) {
      this.bodies.set(owner, body);
    }
    
    return body;
  }
  
  /**
   * Remove a physics body from the world
   * @param {CANNON.Body} body - The physics body to remove
   */
  removeBody(body) {
    this.world.removeBody(body);
    
    // Remove from tracking
    this.bodies.forEach((value, key) => {
      if (value === body) {
        this.bodies.delete(key);
      }
    });
  }
  
  /**
   * Create a sphere body
   * @param {Object} options - Body options
   * @returns {CANNON.Body} The created body
   */
  createSphereBody(options = {}) {
    const defaults = {
      mass: 1,
      radius: 1,
      position: new CANNON.Vec3(0, 0, 0),
      material: new CANNON.Material({ friction: 0.3, restitution: 0.3 })
    };
    
    const opts = { ...defaults, ...options };
    
    const body = new CANNON.Body({
      mass: opts.mass,
      position: opts.position,
      material: opts.material,
      linearDamping: opts.linearDamping || 0.01,
      angularDamping: opts.angularDamping || 0.01
    });
    
    // Add sphere shape
    const shape = new CANNON.Sphere(opts.radius);
    body.addShape(shape);
    
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
        
        // Get the position in Three.js format
        const position = new THREE.Vector3(
          body.position.x,
          body.position.y,
          body.position.z
        );
        
        // Get nearest point on planet surface
        const surfacePoint = this.planet.getNearestPointOnSurface(position);
        
        // Calculate penetration depth
        const normal = surfacePoint.clone().normalize();
        const bodyToPlanetDir = position.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
        const distanceToSurface = position.distanceTo(surfacePoint);
        const bodyRadius = body.shapes[0] instanceof CANNON.Sphere ? body.shapes[0].radius : 1;
        const penetration = bodyRadius - distanceToSurface;
        
        // If body is penetrating the planet surface
        if (penetration > 0) {
          // Convert to Cannon vectors
          const worldNormal = new CANNON.Vec3(normal.x, normal.y, normal.z);
          
          // Calculate impulse strength based on penetration depth and restitution
          const impulseStrength = penetration * 10 * this.options.restitution;
          
          // Create impulse vector
          const impulse = new CANNON.Vec3(
            worldNormal.x * impulseStrength,
            worldNormal.y * impulseStrength,
            worldNormal.z * impulseStrength
          );
          
          // Apply impulse to resolve collision
          const worldPoint = new CANNON.Vec3(surfacePoint.x, surfacePoint.y, surfacePoint.z);
          body.applyImpulse(impulse, worldPoint);
          
          // Apply friction force
          const relativeVelocity = body.velocity.clone();
          const normalVelocity = worldNormal.dot(relativeVelocity);
          const normalComponent = new CANNON.Vec3(
            worldNormal.x * normalVelocity,
            worldNormal.y * normalVelocity,
            worldNormal.z * normalVelocity
          );
          
          const tangentialVelocity = new CANNON.Vec3();
          relativeVelocity.vsub(normalComponent, tangentialVelocity);
          
          // Only apply friction if there's significant tangential velocity
          if (tangentialVelocity.lengthSquared() > 0.1) {
            const frictionForce = tangentialVelocity.clone();
            const normalizedFriction = frictionForce.normalize();
            // Create a new vector with the scaled values
            const scaledFriction = new CANNON.Vec3(
              normalizedFriction.x * -this.options.friction * impulseStrength,
              normalizedFriction.y * -this.options.friction * impulseStrength,
              normalizedFriction.z * -this.options.friction * impulseStrength
            );
            body.applyForce(scaledFriction, body.position);
          }
        }
      }
    };
  }
} 
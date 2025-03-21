/**
 * Luminor
 * Resource management and collection system
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { RESOURCE_CONFIG, PLANET_CONFIG, TERRAIN_CONFIG } from '../utils/constants';
import { Resource, ResourceManager, Player, Planet } from '../types';
import { createGlowingMaterial } from '../utils/materials';

/**
 * Setup collectible resources around the planet
 * @param scene - The Three.js scene
 * @param planet - The planet object
 * @returns The resources manager object
 */
export function setupResources(scene: THREE.Scene, planet: Planet): ResourceManager {
  // Arrays to track resources
  const resources: Resource[] = [];
  const collectedResourcesList: Resource[] = [];
  let collectedResources = 0;
  let totalCollected = 0;

  // Track existing positions to prevent clustering
  const existingPositions: THREE.Vector3[] = [];

  // Try to create resources with minimum spacing
  let attemptsRemaining = RESOURCE_CONFIG.COUNT * 3; // Allow multiple attempts per resource
  let resourcesCreated = 0;
  let failedAttempts = 0;

  while (resourcesCreated < RESOURCE_CONFIG.COUNT && attemptsRemaining > 0) {
    attemptsRemaining--;

    // Generate a random position on the sphere
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(Math.random() * 2 - 1);

    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);

    // Create direction vector and normalize
    const direction = new THREE.Vector3(x, y, z).normalize();
    if (isNaN(direction.length())) {
      console.error('Invalid direction generated for resource');
      failedAttempts++;
      continue;
    }

    // Get position on actual planet surface with terrain
    const surfacePos = planet.getNearestPointOnSurface(direction);
    if (!surfacePos || isNaN(surfacePos.length())) {
      console.error('Invalid surface position for resource');
      failedAttempts++;
      continue;
    }

    // Validate surface position is within expected range
    const distance = surfacePos.length();
    const maxRadius = PLANET_CONFIG.RADIUS * (1 + TERRAIN_CONFIG.HEIGHT_SCALE);
    const minRadius = PLANET_CONFIG.RADIUS * (1 - TERRAIN_CONFIG.HEIGHT_SCALE);
    if (distance > maxRadius || distance < minRadius) {
      console.warn(
        `Resource surface position (${distance.toFixed(2)}) outside expected range [${minRadius.toFixed(2)}, ${maxRadius.toFixed(2)}]`
      );
      failedAttempts++;
      continue;
    }

    // Position slightly above the surface
    const finalPos = surfacePos
      .clone()
      .normalize()
      .multiplyScalar(surfacePos.length() + RESOURCE_CONFIG.HOVER_HEIGHT);

    // Check distance from existing resources
    let tooClose = false;
    for (const pos of existingPositions) {
      if (finalPos.distanceTo(pos) < RESOURCE_CONFIG.MIN_SPACING) {
        tooClose = true;
        break;
      }
    }

    if (tooClose) {
      failedAttempts++;
      continue;
    }

    try {
      // Create resource geometry
      const resourceGeometry = createResourceGeometry();
      const resourceMaterial = createGlowingMaterial(
        RESOURCE_CONFIG.COLOR,
        RESOURCE_CONFIG.GLOW_INTENSITY
      );
      const resourceMesh = new THREE.Mesh(resourceGeometry, resourceMaterial);

      // Set position
      resourceMesh.position.copy(finalPos);

      // Orient to face away from planet center
      resourceMesh.lookAt(new THREE.Vector3(0, 0, 0));
      resourceMesh.rotateX(Math.PI / 2); // Adjust orientation

      // Add to scene
      scene.add(resourceMesh);

      // Add to resources array
      resources.push({
        mesh: resourceMesh,
        position: finalPos,
        collected: false,
        rotationAxis: new THREE.Vector3(0, 1, 0).normalize(),
        rotationSpeed: RESOURCE_CONFIG.ROTATION_SPEED * (0.8 + Math.random() * 0.4),
        bobHeight: 0.2 + Math.random() * 0.3,
        bobSpeed: 0.005 + Math.random() * 0.003,
        bobPhase: Math.random() * Math.PI * 2,
        originalY: finalPos.y
      });

      // Remember this position to avoid clustering
      existingPositions.push(finalPos.clone());
      resourcesCreated++;
    } catch (error) {
      console.error('Error creating resource:', error);
      failedAttempts++;
    }
  }

  if (failedAttempts > 0) {
    console.warn(`Failed to create ${failedAttempts} resources after maximum attempts`);
  }

  console.log(`Created ${resources.length} resources on the planet`);

  // Add respawn functionality for collected resources
  let respawnTimer = 0;
  const MAX_ACTIVE_RESOURCES = Math.min(
    80,
    RESOURCE_CONFIG.COUNT * RESOURCE_CONFIG.MAX_ACTIVE_RATIO
  );

  // Return public interface
  return {
    resources,
    collectedResources,
    totalCollected,
    loadAll: async () => {
      // No-op for now as we're not loading any external resources
      return Promise.resolve();
    },
    setVisible: function (visible: boolean): void {
      for (const resource of resources) {
        resource.mesh.visible = visible;
      }
    },
    remove: function (resource: Resource): void {
      const index = resources.indexOf(resource);
      if (index !== -1) {
        resources.splice(index, 1);
        collectedResourcesList.push(resource);
        collectedResources++;
        totalCollected++;
      }
    },
    update: function (_player: Player, deltaTime: number): void {
      // Update respawn timer
      respawnTimer += deltaTime;

      // Check for resource respawn
      if (respawnTimer >= RESOURCE_CONFIG.RESPAWN_INTERVAL) {
        respawnTimer = 0;

        // Count active (non-collected) resources
        const activeCount = resources.filter(r => !r.collected).length;

        // If we're below the active resource limit, respawn some
        if (activeCount < MAX_ACTIVE_RESOURCES) {
          // Find collected resources that can be respawned
          const collectedResources = resources.filter(r => r.collected);

          // Respawn up to 5 resources at a time
          const toRespawn = Math.min(
            5,
            collectedResources.length,
            MAX_ACTIVE_RESOURCES - activeCount
          );

          for (let i = 0; i < toRespawn; i++) {
            // Get a random collected resource
            const resourceIndex = Math.floor(Math.random() * collectedResources.length);
            const resource = collectedResources[resourceIndex];

            // Respawn it at a new position
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(Math.random() * 2 - 1);

            const x = Math.sin(theta) * Math.cos(phi);
            const y = Math.sin(theta) * Math.sin(phi);
            const z = Math.cos(theta);

            // Create new position on planet surface
            const direction = new THREE.Vector3(x, y, z).normalize();
            const surfacePos = planet.getNearestPointOnSurface(
              direction.multiplyScalar(planet.radius)
            );
            const finalPos = surfacePos
              .clone()
              .normalize()
              .multiplyScalar(surfacePos.length() + RESOURCE_CONFIG.HOVER_HEIGHT);

            // Update resource
            resource.position.copy(finalPos);
            resource.mesh.position.copy(finalPos);
            resource.mesh.visible = true;
            resource.collected = false;
            resource.bobPhase = Math.random() * Math.PI * 2;

            // Remove from collected array
            collectedResources.splice(resourceIndex, 1);
          }
        }
      }

      // Update resource animations
      for (const resource of resources) {
        if (!resource.collected) {
          // Apply rotation animation around local up axis
          resource.mesh.rotateOnAxis(resource.rotationAxis, resource.rotationSpeed);

          // Apply bobbing animation
          resource.bobPhase += resource.bobSpeed;
          const bobOffset = Math.sin(resource.bobPhase) * resource.bobHeight;
          const upVector = resource.position.clone().normalize();

          // Add bobbing movement
          const newPosition = resource.position.clone().add(upVector.multiplyScalar(bobOffset));
          resource.mesh.position.copy(newPosition);
        }
      }
    },
    checkCollisions: function (player: Player): void {
      const playerPos = player.getPosition();
      const collisionRadius = RESOURCE_CONFIG.COLLISION_RADIUS;

      for (const resource of resources) {
        if (!resource.collected && resource.position.distanceTo(playerPos) < collisionRadius) {
          // Mark as collected
          resource.collected = true;
          resource.mesh.visible = false;

          // Update counters
          collectedResources++;
          totalCollected++;

          // Grow the player's tail by one segment
          player.grow(1);
        }
      }
    },
    dispose: function (scene: THREE.Scene): void {
      for (const resource of resources) {
        scene.remove(resource.mesh);
        resource.mesh.geometry.dispose();
        if (Array.isArray(resource.mesh.material)) {
          resource.mesh.material.forEach(m => m.dispose());
        } else {
          resource.mesh.material.dispose();
        }
      }
      resources.length = 0;
      collectedResourcesList.length = 0;
    }
  };
}

/**
 * Create the geometry for a resource
 * @private
 */
function createResourceGeometry(): THREE.BufferGeometry {
  // Create a more interesting shape than a simple sphere
  const geometry = new THREE.OctahedronGeometry(RESOURCE_CONFIG.SIZE, 1);

  // Add some random variation to vertices
  const positionAttribute = geometry.getAttribute('position');
  const positions = positionAttribute.array;

  for (let i = 0; i < positions.length; i += 3) {
    const offset = (Math.random() - 0.5) * 0.2;
    positions[i] *= 1 + offset;
    positions[i + 1] *= 1 + offset;
    positions[i + 2] *= 1 + offset;
  }

  // Update normals
  geometry.computeVertexNormals();

  return geometry;
}

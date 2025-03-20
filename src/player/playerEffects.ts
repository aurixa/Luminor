/**
 * Luminor
 * Player visual effects and indicators
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { PLAYER_CONFIG } from '../utils/constants';

interface AlignmentIndicators {
  surfaceNormalLine: THREE.Line;
  directionLine: THREE.Line;
  rightLine: THREE.Line;
}

/**
 * Create debug alignment indicators for the player
 */
export function createAlignmentIndicators(scene: THREE.Scene): AlignmentIndicators {
  // Create materials for alignment indicators
  const normalMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
  const directionMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
  const rightMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });

  // Create geometries for alignment indicators
  const normalGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, PLAYER_CONFIG.ALIGNMENT_LINE_LENGTH, 0)
  ]);

  const directionGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, PLAYER_CONFIG.ALIGNMENT_LINE_LENGTH)
  ]);

  const rightGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(PLAYER_CONFIG.ALIGNMENT_LINE_LENGTH, 0, 0)
  ]);

  // Create line objects
  const surfaceNormalLine = new THREE.Line(normalGeometry, normalMaterial);
  const directionLine = new THREE.Line(directionGeometry, directionMaterial);
  const rightLine = new THREE.Line(rightGeometry, rightMaterial);

  // Add to scene only if debug alignment is enabled
  if (PLAYER_CONFIG.DEBUG_ALIGNMENT) {
    scene.add(surfaceNormalLine);
    scene.add(directionLine);
    scene.add(rightLine);
  }

  // Return the created line objects
  return {
    surfaceNormalLine,
    directionLine,
    rightLine
  };
}

interface TrailParticle {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  lifetime: number;
}

/**
 * Create a trail effect behind the player
 */
export function createTrailEffect(
  scene: THREE.Scene,
  playerSegments: Array<{
    mesh: THREE.Mesh;
    position?: THREE.Vector3;
    isHead: boolean;
    index: number;
  }>
): {
  update: (deltaTime: number) => void;
  dispose: () => void;
} | null {
  // Implement trail effect system
  if (!PLAYER_CONFIG.TRAIL_ENABLED) {
    return null;
  }

  // Create particle system
  const particles: TrailParticle[] = [];
  const particleGeometry = new THREE.SphereGeometry(0.2, 4, 4);
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffaa,
    transparent: true,
    opacity: 0.7
  });

  // Trail system
  const trailSystem = {
    update: (deltaTime: number) => {
      // Spawn new particles
      if (playerSegments.length > 0) {
        const lastSegment = playerSegments[playerSegments.length - 1];
        if (lastSegment.position) {
          // Create new particle with properly typed material
          const material = particleMaterial.clone();
          const particle = new THREE.Mesh(particleGeometry, material);
          particle.position.copy(lastSegment.position);
          particle.scale.set(1, 1, 1);
          particle.userData.lifetime = PLAYER_CONFIG.TRAIL_LIFETIME;
          scene.add(particle);

          particles.push({
            mesh: particle,
            lifetime: PLAYER_CONFIG.TRAIL_LIFETIME
          });
        }
      }

      // Update existing particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        // Reduce lifetime
        particle.lifetime -= deltaTime;

        // Update opacity and scale based on lifetime
        const normalizedLife = particle.lifetime / PLAYER_CONFIG.TRAIL_LIFETIME;
        particle.mesh.material.opacity = normalizedLife * 0.7;
        particle.mesh.scale.set(normalizedLife * 0.5, normalizedLife * 0.5, normalizedLife * 0.5);

        // Remove if expired
        if (particle.lifetime <= 0) {
          scene.remove(particle.mesh);
          particle.mesh.geometry.dispose();
          particle.mesh.material.dispose();
          particles.splice(i, 1);
        }
      }
    },

    dispose: () => {
      // Remove all particles
      for (const particle of particles) {
        scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
      }
      particles.length = 0;
    }
  };

  return trailSystem;
}

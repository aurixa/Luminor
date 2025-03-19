/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

// Constants for planet generation
const PLANET_RADIUS = 10;
const TERRAIN_HEIGHT = 1;
const DETAIL_LEVEL = 5; // Determines the complexity of the sphere

/**
 * Create a procedurally generated planet using noise functions
 * @param {THREE.Scene} scene - The Three.js scene to add the planet to
 * @returns {Object} The planet object with properties and methods
 */
export function createPlanet(scene) {
    // Create the geometry with sufficient detail
    const geometry = new THREE.IcosahedronGeometry(PLANET_RADIUS, DETAIL_LEVEL);
    
    // Generate the noise for terrain
    modifyGeometryWithNoise(geometry);
    
    // Create materials for light and dark sides
    const material = createPlanetMaterial();
    
    // Create the mesh
    const planetMesh = new THREE.Mesh(geometry, material);
    scene.add(planetMesh);
    
    // Store original vertex positions for collision detection and movement
    const originalVertices = [];
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        originalVertices.push(new THREE.Vector3(
            geometry.attributes.position.array[i * 3],
            geometry.attributes.position.array[i * 3 + 1],
            geometry.attributes.position.array[i * 3 + 2]
        ));
    }
    
    // Planet object with properties and methods
    return {
        mesh: planetMesh,
        radius: PLANET_RADIUS,
        // Get a normalized position on the planet surface from a direction vector
        getPositionOnSurface: function(direction) {
            const raycaster = new THREE.Raycaster(
                new THREE.Vector3(0, 0, 0), // Cast from center
                direction.normalize()
            );
            const intersects = raycaster.intersectObject(planetMesh);
            
            if (intersects.length > 0) {
                return intersects[0].point;
            } else {
                // Fallback: project to sphere if no intersection
                return direction.normalize().multiplyScalar(PLANET_RADIUS);
            }
        },
        // Check if a point is in light or shadow
        isInLight: function(position) {
            // Normalize the position
            const normalizedPos = position.clone().normalize();
            // Dot product with light direction gives us light intensity
            // Positive is light side, negative is dark side
            return normalizedPos.dot(new THREE.Vector3(1, 0.5, 1).normalize()) > 0;
        },
        // Find nearest position on planet surface
        getNearestPointOnSurface: function(position) {
            // Direction from center to position
            const direction = position.clone().normalize();
            return this.getPositionOnSurface(direction);
        },
        // Rotate the planet (not used in initial implementation)
        rotate: function(deltaTime) {
            planetMesh.rotation.y += 0.05 * deltaTime;
        }
    };
}

/**
 * Apply simplex noise to geometry vertices to create terrain
 */
function modifyGeometryWithNoise(geometry) {
    const noise = new SimplexNoise();
    const positionAttribute = geometry.attributes.position;
    
    // Apply noise to each vertex
    for (let i = 0; i < positionAttribute.count; i++) {
        const vertex = new THREE.Vector3(
            positionAttribute.array[i * 3],
            positionAttribute.array[i * 3 + 1],
            positionAttribute.array[i * 3 + 2]
        );
        
        // Normalize to get direction
        const direction = vertex.normalize();
        
        // Multiple layers of noise for more interesting terrain
        let noiseValue = 0;
        noiseValue += noise.noise3d(direction.x * 2, direction.y * 2, direction.z * 2) * 0.5;
        noiseValue += noise.noise3d(direction.x * 4, direction.y * 4, direction.z * 4) * 0.25;
        noiseValue += noise.noise3d(direction.x * 8, direction.y * 8, direction.z * 8) * 0.125;
        
        // Apply noise to vertex
        const offset = 1 + (noiseValue * TERRAIN_HEIGHT);
        vertex.multiplyScalar(PLANET_RADIUS * offset);
        
        // Update position
        positionAttribute.array[i * 3] = vertex.x;
        positionAttribute.array[i * 3 + 1] = vertex.y;
        positionAttribute.array[i * 3 + 2] = vertex.z;
    }
    
    // Update normals for proper lighting
    geometry.computeVertexNormals();
    positionAttribute.needsUpdate = true;
}

/**
 * Create material for the planet with light/dark sides
 */
function createPlanetMaterial() {
    // Custom shader material to handle day/night transition
    return new THREE.MeshStandardMaterial({
        color: 0x3366ff,
        metalness: 0.1,
        roughness: 0.8,
        flatShading: false,
        emissive: 0x112244,
        emissiveIntensity: 0.3,
    });
} 
/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

/**
 * Simple noise implementation - completely standalone
 */
class SimpleNoise {
    constructor(seed = Math.random() * 10000) {
        this.seed = seed;
    }
    
    noise(x, y) {
        return Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 0.5 + 0.5;
    }
    
    noise3d(x, y, z) {
        return Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + this.seed) * 0.5 + 0.5;
    }
}

// Planet configuration
const PLANET_RADIUS = 800;

// Add utility functions at the top level
function isValidVector(vec) {
    return vec && 
           typeof vec.x === 'number' && !isNaN(vec.x) &&
           typeof vec.y === 'number' && !isNaN(vec.y) &&
           typeof vec.z === 'number' && !isNaN(vec.z);
}

function normalizeVector(point) {
    if (!isValidVector(point)) return null;
    
    const length = Math.sqrt(
        point.x * point.x + 
        point.y * point.y + 
        point.z * point.z
    );
    
    if (length < 0.0001) return null;
    
    return {
        x: point.x / length,
        y: point.y / length,
        z: point.z / length,
        length: length
    };
}

// Move getSimpleElevation before createPlanet
function getSimpleElevation(x, y, z, noise) {
    try {
        // Validate inputs
        if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
            console.warn("Invalid input types to getSimpleElevation", {x, y, z});
            return 0;
        }
        
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            console.warn("NaN input to getSimpleElevation", {x, y, z});
            return 0;
        }
        
        // Calculate base elevation
        const baseElevation = noise.noise3d(x, y, z);
        
        // Apply multi-octave noise for more interesting terrain
        const elevation = (
            baseElevation * 50.0 +                    // Large features
            noise.noise3d(x*2, y*2, z*2) * 25.0 +    // Medium features
            noise.noise3d(x*4, y*4, z*4) * 12.5      // Small features
        );
        
        return elevation;
    } catch (error) {
        console.error("Error in getSimpleElevation:", error);
        return 0;
    }
}

function applySimpleDisplacement(geometry, noise) {
    // Get the vertices from the geometry
    const positions = geometry.attributes.position;
    
    // Apply displacement to each vertex
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Get the normalized direction
        const length = Math.sqrt(x * x + y * y + z * z);
        const nx = x / length;
        const ny = y / length;
        const nz = z / length;
        
        // Calculate elevation
        const elevation = getSimpleElevation(nx, ny, nz, noise);
        
        // Apply displacement along normal
        positions.setX(i, nx * (PLANET_RADIUS + elevation));
        positions.setY(i, ny * (PLANET_RADIUS + elevation));
        positions.setZ(i, nz * (PLANET_RADIUS + elevation));
    }
    
    // Mark positions for update
    positions.needsUpdate = true;
    
    // Update geometry
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
}

/**
 * Create the planet geometry, material, and mesh
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} The planet object with properties and methods
 */
export function createPlanet(scene) {
    console.log("Creating planet...");
    
    try {
        // Create a noise generator with a fixed seed for consistent terrain
        const noise = new SimpleNoise(12345);
        
        // Create the planet geometry with higher resolution
        const geometry = new THREE.IcosahedronGeometry(PLANET_RADIUS, 5);
        
        // Create a more detailed material
        const material = new THREE.MeshPhongMaterial({
            color: 0x886644,
            specular: 0x222222,
            shininess: 5,
            flatShading: true
        });
        
        // Apply displacement before creating the mesh
        applySimpleDisplacement(geometry, noise);
        
        // Create the planet mesh
        const planetMesh = new THREE.Mesh(geometry, material);
        scene.add(planetMesh);
        
        // Add ambient and directional light if not present
        if (!scene.getObjectByName('ambientLight')) {
            const ambientLight = new THREE.AmbientLight(0x333333);
            ambientLight.name = 'ambientLight';
            scene.add(ambientLight);
        }
        
        if (!scene.getObjectByName('mainLight')) {
            const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
            mainLight.position.set(1, 1, 1).normalize();
            mainLight.name = 'mainLight';
            scene.add(mainLight);
        }
        
        console.log("Planet mesh and lighting added to scene");
        
        // Create and return the planet object
        const planet = {
            mesh: planetMesh,
            radius: PLANET_RADIUS,
            noise: noise, // Store noise generator for consistent elevation queries
            
            getNearestPointOnSurface: function(point) {
                // Ensure we have a valid point
                if (!isValidVector(point)) {
                    console.warn("Invalid point passed to getNearestPointOnSurface");
                    return new THREE.Vector3(PLANET_RADIUS, 0, 0);
                }
                
                try {
                    // Normalize the input vector
                    const normalized = normalizeVector(point);
                    if (!normalized) {
                        console.warn("Could not normalize vector in getNearestPointOnSurface");
                        return new THREE.Vector3(PLANET_RADIUS, 0, 0);
                    }
                    
                    // Calculate elevation using normalized coordinates
                    const elevation = getSimpleElevation(
                        normalized.x,
                        normalized.y,
                        normalized.z,
                        this.noise
                    );
                    
                    // Calculate final radius with elevation
                    const finalRadius = PLANET_RADIUS + (isNaN(elevation) ? 0 : elevation);
                    
                    // Create surface point
                    const surfacePoint = new THREE.Vector3(
                        normalized.x * finalRadius,
                        normalized.y * finalRadius,
                        normalized.z * finalRadius
                    );
                    
                    // Validate final point
                    if (!isValidVector(surfacePoint)) {
                        console.warn("Generated invalid surface point");
                        return new THREE.Vector3(PLANET_RADIUS, 0, 0);
                    }
                    
                    return surfacePoint;
                } catch (error) {
                    console.error("Error in getNearestPointOnSurface:", error);
                    return new THREE.Vector3(PLANET_RADIUS, 0, 0);
                }
            },
            
            // Add method to check if a point is above surface
            isAboveSurface: function(point) {
                if (!isValidVector(point)) return false;
                
                const surfacePoint = this.getNearestPointOnSurface(point);
                const distanceFromCenter = Math.sqrt(
                    point.x * point.x +
                    point.y * point.y +
                    point.z * point.z
                );
                
                return distanceFromCenter >= surfacePoint.length();
            },
            
            update: function(deltaTime) {
                // No animations in current version
            }
        };
        
        console.log("Planet object created successfully");
        return planet;
    } catch (error) {
        console.error("Error creating planet:", error);
        
        // Create a simple fallback planet
        const fallbackGeometry = new THREE.SphereGeometry(PLANET_RADIUS, 32, 32);
        const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0x886644 });
        const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
        scene.add(fallbackMesh);
        
        // Return a basic planet object
        return {
            mesh: fallbackMesh,
            radius: PLANET_RADIUS,
            
            getNearestPointOnSurface: function(point) {
                if (!isValidVector(point)) {
                    return new THREE.Vector3(PLANET_RADIUS, 0, 0);
                }
                
                const normalized = normalizeVector(point);
                if (!normalized) {
                    return new THREE.Vector3(PLANET_RADIUS, 0, 0);
                }
                
                return new THREE.Vector3(
                    normalized.x * PLANET_RADIUS,
                    normalized.y * PLANET_RADIUS,
                    normalized.z * PLANET_RADIUS
                );
            },
            
            isAboveSurface: function(point) {
                if (!isValidVector(point)) return false;
                
                const distanceFromCenter = Math.sqrt(
                    point.x * point.x +
                    point.y * point.y +
                    point.z * point.z
                );
                
                return distanceFromCenter >= PLANET_RADIUS;
            },
            
            update: function(deltaTime) {
                // Rotate the planet slowly to show it's working
                fallbackMesh.rotation.y += deltaTime * 0.0001;
            }
        };
    }
} 
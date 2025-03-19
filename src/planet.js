/**
 * Luminor
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// Direct reference to the global SimplexNoise
const createNoise = function() {
    console.log("Creating SimplexNoise for planet terrain");
    
    try {
        // Try to get SimplexNoise from either global or window scope
        const NoiseImpl = typeof SimplexNoise !== 'undefined' ? SimplexNoise : 
                         (typeof window !== 'undefined' && window.SimplexNoise ? window.SimplexNoise : null);
        
        if (!NoiseImpl) {
            throw new Error("SimplexNoise implementation not found");
        }
        
        const noise = new NoiseImpl();
        
        // Verify the noise instance works
        const testValue = noise.noise3d(1, 2, 3);
        if (typeof testValue !== 'number' || isNaN(testValue)) {
            throw new Error("Invalid noise value generated");
        }
        
        console.log("SimplexNoise created successfully");
        return noise;
    } catch (e) {
        console.error("Failed to create SimplexNoise:", e);
        throw e;
    }
};

// Planet configuration
const PLANET_RADIUS = 800; // Base planet radius

// Terrain parameters - these can be adjusted for testing
const TERRAIN_PARAMS = {
    // Main terrain scale factor (higher = more dramatic terrain)
    heightScale: 0.8,  // SIGNIFICANTLY INCREASED for dramatic hills
    
    // Base noise settings
    baseFrequency: 0.08, // LOWERED for wider, more dramatic undulations
    roughness: 0.85,     // ADJUSTED for balance between smoothness and detail
    
    // Large scale undulation settings (main dramatic hills)
    largeScale: {
        frequency: 0.025, // LOWERED for much wider features
        influence: 1.2,   // SIGNIFICANTLY INCREASED for more dramatic terrain
    },
    
    // Medium scale features (smaller hills, valleys)
    mediumScale: {
        frequency: 0.08,  // ADJUSTED for better hill shapes
        influence: 0.5,   // INCREASED for more definition
    },
    
    // Small scale details
    smallScale: {
        frequency: 0.4,   // ADJUSTED for better detail scale
        influence: 0.08,  // SLIGHTLY INCREASED for more visible detail
        octaves: 2,       // KEPT LOW for performance
        persistence: 0.5, // SLIGHTLY INCREASED for more detail variation
    },
    
    // Ridge settings - MODIFIED for more pronounced ridges
    ridges: {
        enabled: true,
        frequency: 0.05,  // ADJUSTED for better ridge spacing
        influence: 0.7,   // INCREASED for more dramatic ridges
        sharpness: 1.5,   // SLIGHTLY INCREASED for more defined ridges
    },
    
    // Valley settings - MODIFIED for more pronounced valleys
    valleys: {
        enabled: true,
        frequency: 0.04,  // ADJUSTED for better valley spacing
        influence: 0.8,   // INCREASED for more pronounced valleys
        depth: 1.5,       // INCREASED for deeper valleys
    },
    
    // Crater settings - REDUCED importance for Motocross style
    craters: {
        count: 8,        // REDUCED crater count
        minSize: 15,     // REDUCED for less impact
        maxSize: 45,     // REDUCED for less impact
        depthFactor: 0.12, // REDUCED for smoother craters
        rimHeightFactor: 0.5, // REDUCED for smoother rims
    },
    
    // Texture settings
    texture: {
        enabled: true,
        detailScale: 20,   // Scale of the detail texture
        normalStrength: 1.2, // Strength of normal mapping
    }
};

/**
 * Create the planet geometry, material, and mesh
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} The planet object with properties and methods
 */
export function createPlanet(scene) {
    console.log("Creating planet...");
    
    try {
        // Create a simplex noise generator for terrain
        const noise = createNoise();
        
        // Create a sphere geometry with high resolution
        const geometry = new THREE.SphereGeometry(PLANET_RADIUS, 196, 196); // Increased resolution
        console.log("Planet geometry created with radius:", PLANET_RADIUS);
        
        // Generate craters and store them for later use
        const craters = generateCraters(TERRAIN_PARAMS.craters.count);
        
        // Apply terrain displacement to the geometry
        applyTerrainDisplacement(geometry, noise, craters);
        console.log("Terrain displacement applied");
        
        // Create the planet material
        const material = createPlanetMaterial();
        
        // Create the planet mesh
        const planetMesh = new THREE.Mesh(geometry, material);
        console.log("Planet mesh created");
        scene.add(planetMesh);
        console.log("Planet added to scene");
        
        // Create a planet object to return
        const planet = {
            mesh: planetMesh,
            radius: PLANET_RADIUS,
            craters: craters,
            
            // Get the nearest point on the planet's surface from a given point
            getNearestPointOnSurface: function(point) {
                console.log("getNearestPointOnSurface called for point:", point);
                
                // First check if the point is too close to center (avoid division by zero)
                const distanceFromCenter = point.length();
                if (distanceFromCenter < 10) {
                    console.log("Point too close to center, using safe direction");
                    // Return a safe point on the surface if too close to center
                    const safeDirection = new THREE.Vector3(1, 0, 0);
                    const elevation = getElevationAtDirection(safeDirection, noise, craters);
                    const safePoint = safeDirection.multiplyScalar(PLANET_RADIUS + elevation);
                    console.log("Returning safe point:", safePoint);
                    return safePoint;
                }
                
                // Get the direction from the center to the point
                const direction = point.clone().normalize();
                console.log("Normalized direction:", direction);
                
                // Use raycasting to find the exact height at this point on the planet
                // We'll check multiple points along the ray to handle complex terrain
                
                // Start with the basic elevation calculation
                const basicElevation = getElevationAtDirection(direction, noise, craters);
                const estimatedRadius = PLANET_RADIUS + basicElevation;
                console.log("Basic elevation:", basicElevation, "Estimated radius:", estimatedRadius);
                
                // For non-uniform terrain, check multiple points around the estimated surface
                // This helps find more accurate surface points for complex terrain
                const checkPoints = 5;
                const checkDistance = 20; // Distance to check around estimated surface
                
                let closestPoint = null;
                let closestDistance = Infinity;
                
                // Check multiple points along the ray
                for (let i = -2; i <= 2; i++) {
                    const checkPoint = direction.clone().multiplyScalar(estimatedRadius + i * checkDistance);
                    const checkDirection = checkPoint.clone().normalize();
                    const checkElevation = getElevationAtDirection(checkDirection, noise, craters);
                    const actualSurfacePoint = checkDirection.multiplyScalar(PLANET_RADIUS + checkElevation);
                    
                    // Calculate distance from our original point to this surface point
                    const distance = point.distanceTo(actualSurfacePoint);
                    
                    // Keep track of closest point
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPoint = actualSurfacePoint;
                    }
                }
                
                // Return the closest point we found or a safe fallback
                const result = closestPoint || direction.multiplyScalar(PLANET_RADIUS + basicElevation);
                console.log("Surface point result:", result);
                return result;
            },
            
            // Update method (for future animations if needed)
            update: function(deltaTime) {
                // No animations needed for now
            },
            
            // Method to update terrain parameters (could be connected to UI controls)
            updateTerrainParams: function(newParams) {
                // Copy new parameters to TERRAIN_PARAMS
                for (const key in newParams) {
                    if (typeof newParams[key] === 'object' && newParams[key] !== null) {
                        // Deep merge for nested objects
                        for (const subKey in newParams[key]) {
                            TERRAIN_PARAMS[key][subKey] = newParams[key][subKey];
                        }
                    } else {
                        TERRAIN_PARAMS[key] = newParams[key];
                    }
                }
                
                // Regenerate the planet with new parameters
                // (This would need a complete rebuild of the geometry)
                console.log("Terrain parameters updated:", TERRAIN_PARAMS);
                
                // Note: A full implementation would clear and rebuild the mesh here
            }
        };
        
        console.log("Planet object created and fully initialized");
        return planet;
    } catch (error) {
        console.error("Error creating planet:", error);
        
        // Create a simple fallback planet with no terrain
        const fallbackGeometry = new THREE.SphereGeometry(PLANET_RADIUS, 32, 32);
        
        // Create fallback material - use wireframe mode for debug visibility
        const fallbackMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            wireframe: true 
        });
        
        // Create fallback mesh and add to scene
        const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
        scene.add(fallbackMesh);
        
        console.log("Created fallback planet due to error");
        
        // Return a basic planet object with simplified functions
        return {
            mesh: fallbackMesh,
            radius: PLANET_RADIUS,
            craters: [],
            
            getNearestPointOnSurface: function(point) {
                // For the fallback planet, just return a point on the sphere at fixed radius
                const direction = point.clone().normalize();
                return direction.multiplyScalar(PLANET_RADIUS);
            },
            
            update: function(deltaTime) {
                // Rotate the planet slowly to show it's working
                fallbackMesh.rotation.y += deltaTime * 0.0001;
            },
            
            updateTerrainParams: function(newParams) {
                console.log("Terrain parameters update not available in fallback mode");
            }
        };
    }
}

/**
 * Generate random craters across the planet
 */
function generateCraters(count) {
    const craters = [];
    
    for (let i = 0; i < count; i++) {
        // Random position on unit sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(theta);
        
        // Random crater size with better distribution
        const size = TERRAIN_PARAMS.craters.minSize + 
            Math.pow(Math.random(), 0.7) * (TERRAIN_PARAMS.craters.maxSize - TERRAIN_PARAMS.craters.minSize);
        
        // Random crater depth (deeper for larger craters)
        const depth = size * (0.07 + Math.random() * TERRAIN_PARAMS.craters.depthFactor);
        
        // Random rim height
        const rimHeight = depth * (0.4 + Math.random() * TERRAIN_PARAMS.craters.rimHeightFactor);
        
        // Add crater to list
        craters.push({
            position: new THREE.Vector3(x, y, z),
            size: size,
            depth: depth,
            rimHeight: rimHeight,
            rimWidth: size * (0.15 + Math.random() * 0.1), // Variable rim width
            falloff: 1.5 + Math.random() * 1.5, // Controls crater shape (higher = sharper)
        });
    }
    
    return craters;
}

/**
 * Apply terrain displacement to the sphere geometry
 */
function applyTerrainDisplacement(geometry, noise, craters) {
    // Get the vertices from the geometry
    const positions = geometry.attributes.position;
    
    // Create a new array for storing colors
    const colorArray = new Float32Array(positions.count * 3);
    const colorAttribute = new THREE.BufferAttribute(colorArray, 3);
    
    // Create arrays for texture coordinates
    const uvs = new Float32Array(positions.count * 2);
    
    // Calculate elevation range for color mapping
    let minElevation = Infinity;
    let maxElevation = -Infinity;
    const elevations = [];
    
    // First pass - calculate all elevations for normalization
    for (let i = 0; i < positions.count; i++) {
        // Get the vertex position
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Normalize to get the direction
        const direction = new THREE.Vector3(x, y, z).normalize();
        
        // Get elevation at this point
        const elevation = getElevationAtDirection(direction, noise, craters);
        elevations[i] = elevation;
        
        // Track min/max elevation
        minElevation = Math.min(minElevation, elevation);
        maxElevation = Math.max(maxElevation, elevation);
        
        // Calculate texture coordinates (spherical mapping)
        // These will be used to apply the detailed texture
        const phi = Math.atan2(direction.z, direction.x);
        const theta = Math.asin(direction.y);
        
        uvs[i * 2] = (phi / (2 * Math.PI) + 0.5); // U: 0-1 based on longitude
        uvs[i * 2 + 1] = (theta / Math.PI + 0.5);  // V: 0-1 based on latitude
    }
    
    console.log(`Terrain height range: ${minElevation.toFixed(2)} to ${maxElevation.toFixed(2)} (${(maxElevation - minElevation).toFixed(2)} units)`);
    
    // Second pass - apply displacements and colors
    for (let i = 0; i < positions.count; i++) {
        // Get the vertex position
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Normalize to get the direction
        const direction = new THREE.Vector3(x, y, z).normalize();
        
        // Get elevation and normalize it
        const elevation = elevations[i];
        const normalizedElevation = (elevation - minElevation) / (maxElevation - minElevation);
        
        // Apply displacement to the vertex
        const displacedPosition = direction.multiplyScalar(PLANET_RADIUS + elevation);
        positions.setXYZ(i, displacedPosition.x, displacedPosition.y, displacedPosition.z);
        
        // Calculate slope for shading (steeper = darker)
        const slopeShading = getSlopeShading(direction, noise, craters);
        
        // Apply color tinting based on elevation and slope
        // We're using vertex colors to tint the texture
        let r, g, b;
        
        if (normalizedElevation < 0.3) {
            // Lower areas - slightly darker tint
            r = 0.92 + slopeShading * 0.15;
            g = 0.92 + slopeShading * 0.15;
            b = 0.90 + slopeShading * 0.1;
        } else if (normalizedElevation < 0.65) {
            // Mid elevations - neutral tint
            r = 1.0 + slopeShading * 0.15;
            g = 1.0 + slopeShading * 0.15;
            b = 0.98 + slopeShading * 0.1;
        } else {
            // Higher elevations - slightly lighter tint
            r = 1.05 + slopeShading * 0.15;
            g = 1.05 + slopeShading * 0.15;
            b = 1.02 + slopeShading * 0.1;
        }
        
        // Add some reddish tint to very steep areas (cliff faces)
        if (slopeShading < -0.15) {
            r += Math.abs(slopeShading) * 0.2;
            g -= Math.abs(slopeShading) * 0.1;
            b -= Math.abs(slopeShading) * 0.1;
        }
        
        // Set final vertex colors (these will modulate the texture)
        colorArray[i * 3] = Math.max(0, Math.min(1, r));
        colorArray[i * 3 + 1] = Math.max(0, Math.min(1, g));
        colorArray[i * 3 + 2] = Math.max(0, Math.min(1, b));
    }
    
    // Add the color attribute to the geometry
    geometry.setAttribute('color', colorAttribute);
    
    // Add the uv attribute for texturing
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    
    // Calculate normals for proper lighting
    geometry.computeVertexNormals();
}

/**
 * Calculate how much to darken/lighten a vertex based on slope
 */
function getSlopeShading(direction, noise, craters) {
    // Sample elevation at nearby points to estimate slope
    const step = 0.01;
    const p1 = direction.clone();
    const p2 = new THREE.Vector3(
        direction.x + step, 
        direction.y, 
        direction.z
    ).normalize();
    
    const e1 = getElevationAtDirection(p1, noise, craters);
    const e2 = getElevationAtDirection(p2, noise, craters);
    
    // Estimate slope - higher absolute value means steeper slope
    const slope = Math.abs(e2 - e1) / step;
    
    // Map slope to shading (steeper slopes are darker)
    return Math.max(-0.3, Math.min(0.3, 0.2 - slope * 3.0));
}

/**
 * Calculate the terrain height at a specific direction
 * @param {THREE.Vector3} direction - The normalized direction from the center
 * @param {SimplexNoise} noise - The noise generator
 * @param {Array} craters - Array of crater objects
 * @returns {number} The terrain height at that point
 */
function getElevationAtDirection(direction, noise, craters) {
    // Safety check - if direction or noise is invalid, return a default value
    if (!direction || !noise) {
        console.error("Invalid parameters in getElevationAtDirection", { direction, noise });
        return 0;
    }
    
    // Safety check - verify this is a THREE.Vector3 or at least has x,y,z properties
    if (!direction.isVector3 && (!direction.x || !direction.y || !direction.z)) {
        console.error("Direction is not a valid Vector3:", direction);
        return 0;
    }
    
    try {
        // Sample noise at different scales for more complex terrain
        const x = direction.x;
        const y = direction.y;
        const z = direction.z;
        
        // Make sure these are valid numbers
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            console.error("Direction contains NaN values", direction);
            return 0;
        }
        
        // Safety check for non-normalized direction
        const length = Math.sqrt(x*x + y*y + z*z);
        if (Math.abs(length - 1.0) > 0.01) {
            console.warn("Direction is not normalized, length =", length);
            // Continue with normalized values
        }
        
        // Start with base elevation
        let elevation = 0;
        
        // Cache the terrain parameters to avoid repeated lookups
        const heightScale = TERRAIN_PARAMS.heightScale;
        const largeScaleParams = TERRAIN_PARAMS.largeScale;
        const mediumScaleParams = TERRAIN_PARAMS.mediumScale;
        const smallScaleParams = TERRAIN_PARAMS.smallScale;
        
        // Safely get noise values with error checking
        let largeScale = 0;
        try {
            largeScale = noise.noise3d(
                x * largeScaleParams.frequency, 
                y * largeScaleParams.frequency, 
                z * largeScaleParams.frequency
            );
            if (isNaN(largeScale)) {
                console.error("Large scale noise returned NaN");
                largeScale = 0;
            }
        } catch (e) {
            console.error("Error computing large scale noise:", e);
            largeScale = 0;
        }
        
        let mediumScale = 0;
        try {
            mediumScale = noise.noise3d(
                x * mediumScaleParams.frequency, 
                y * mediumScaleParams.frequency, 
                z * mediumScaleParams.frequency
            );
            if (isNaN(mediumScale)) {
                console.error("Medium scale noise returned NaN");
                mediumScale = 0;
            }
        } catch (e) {
            console.error("Error computing medium scale noise:", e);
            mediumScale = 0;
        }
        
        // Sample small-scale terrain details for roughness
        let smallScale = 0;
        try {
            for (let i = 0; i < smallScaleParams.octaves; i++) {
                const frequency = smallScaleParams.frequency * Math.pow(2, i);
                const amplitude = Math.pow(smallScaleParams.persistence, i);
                
                const noiseValue = noise.noise3d(
                    x * frequency, 
                    y * frequency, 
                    z * frequency
                );
                
                if (!isNaN(noiseValue)) {
                    smallScale += noiseValue * amplitude;
                }
            }
        } catch (e) {
            console.error("Error computing small scale noise:", e);
            smallScale = 0;
        }
        
        // Calculate elevation from the combined noise samples
        elevation = (
            largeScale * largeScaleParams.influence +
            mediumScale * mediumScaleParams.influence +
            smallScale * smallScaleParams.influence
        ) * heightScale * PLANET_RADIUS;
        
        // Check for NaN after basic calculation
        if (isNaN(elevation)) {
            console.error("Elevation calculation produced NaN:", {
                largeScale, mediumScale, smallScale
            });
            return 0;
        }
        
        // Apply smoothing curve for more rounded hills - with safety checks
        try {
            const smoothingInput = 0.5 + elevation / (heightScale * PLANET_RADIUS * 2);
            if (!isNaN(smoothingInput)) {
                elevation = smoothstep(0, 1, smoothingInput) 
                    * heightScale * PLANET_RADIUS * 2
                    - heightScale * PLANET_RADIUS;
            }
        } catch (e) {
            console.error("Error in smoothstep calculation:", e);
            // Keep previous elevation value
        }
        
        // Apply ridges if enabled
        if (TERRAIN_PARAMS.ridges.enabled) {
            try {
                const ridgeNoise = Math.abs(noise.noise3d(
                    x * TERRAIN_PARAMS.ridges.frequency, 
                    y * TERRAIN_PARAMS.ridges.frequency, 
                    z * TERRAIN_PARAMS.ridges.frequency
                ));
                
                if (!isNaN(ridgeNoise)) {
                    // Apply sharpness transform to create ridge effect
                    const ridgeValue = Math.pow(1.0 - ridgeNoise, TERRAIN_PARAMS.ridges.sharpness);
                    elevation += ridgeValue * TERRAIN_PARAMS.ridges.influence * heightScale * PLANET_RADIUS;
                }
            } catch (e) {
                console.error("Error applying ridges:", e);
            }
        }
        
        // Apply valleys if enabled
        if (TERRAIN_PARAMS.valleys.enabled) {
            try {
                const valleyNoise = Math.abs(noise.noise3d(
                    x * TERRAIN_PARAMS.valleys.frequency, 
                    y * TERRAIN_PARAMS.valleys.frequency, 
                    z * TERRAIN_PARAMS.valleys.frequency
                ));
                
                if (!isNaN(valleyNoise)) {
                    // Apply sharpness transform but invert for valleys
                    const valleyValue = -Math.pow(1.0 - valleyNoise, TERRAIN_PARAMS.valleys.sharpness);
                    elevation += valleyValue * TERRAIN_PARAMS.valleys.influence * heightScale * PLANET_RADIUS;
                }
            } catch (e) {
                console.error("Error applying valleys:", e);
            }
        }
        
        // Apply craters (if any)
        if (craters && craters.length > 0) {
            try {
                for (const crater of craters) {
                    if (!crater || !crater.position) continue;
                    
                    const distToCenter = direction.distanceTo(crater.position);
                    
                    if (distToCenter < crater.size / PLANET_RADIUS) {
                        // Inside the crater
                        const normalizedDist = distToCenter / (crater.size / PLANET_RADIUS);
                        
                        // Apply crater depression with rim
                        const craterDepth = crater.depth * heightScale * PLANET_RADIUS;
                        
                        // Create a rim around the edges (between 80% and 100% of radius)
                        if (normalizedDist > 0.8) {
                            // Rim height peaks at ~90% of the radius
                            const rimFactor = (normalizedDist - 0.8) * 5.0; // Scale to 0-1 range
                            const rimHeight = Math.sin(rimFactor * Math.PI) * 0.4 * craterDepth;
                            elevation += rimHeight;
                        } else {
                            // Inside the crater itself
                            const craterShape = smoothstep(0, 1, normalizedDist) * 0.8;
                            elevation -= craterDepth * (1.0 - craterShape);
                        }
                    }
                }
            } catch (e) {
                console.error("Error applying craters:", e);
            }
        }
        
        // Ensure that elevation is a valid number
        if (isNaN(elevation)) {
            console.error("Calculated elevation is NaN", { 
                largeScale, mediumScale, smallScale,
                direction: {x, y, z}
            });
            return 0;
        }
        
        return elevation;
    } catch (error) {
        console.error("Error in getElevationAtDirection", error);
        return 0;
    }
}

/**
 * Smoothing function to create more natural terrain transitions
 */
function smoothstep(min, max, value) {
    // Guard against invalid inputs
    if (min >= max) return min;
    
    // Clamp value to 0-1 range
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    
    // Apply smoothstep formula: 3x^2 - 2x^3
    return x * x * (3 - 2 * x);
}

/**
 * Create the material for the planet
 */
function createPlanetMaterial() {
    // Generate textures for more realistic terrain
    const { diffuseMap, normalMap } = generateTerrainTextures();
    
    // Create material with textures
    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.88,
        metalness: 0.02,
        flatShading: false,
        map: diffuseMap,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(TERRAIN_PARAMS.texture.normalStrength, TERRAIN_PARAMS.texture.normalStrength),
    });
    
    return material;
}

/**
 * Generate textures for terrain
 */
function generateTerrainTextures() {
    // Create a diffuse (color) texture
    const textureSize = 1024;
    const diffuseData = new Uint8Array(textureSize * textureSize * 4);
    const normalData = new Uint8Array(textureSize * textureSize * 4);
    
    // Use simplex noise for texture generation
    const noise = createNoise();
    
    // Generate the texture data
    for (let y = 0; y < textureSize; y++) {
        for (let x = 0; x < textureSize; x++) {
            const i = (y * textureSize + x) * 4;
            
            // Create base coordinates
            const nx = x / textureSize;
            const ny = y / textureSize;
            
            // Multi-layer noise for diffuse texture
            let sandNoise = 0;
            let rockNoise = 0;
            let detailNoise = 0;
            
            // Sand texture (fine details)
            for (let oct = 0; oct < 3; oct++) {
                const freq = Math.pow(2, oct + 4);
                sandNoise += (noise.noise(nx * freq, ny * freq) * 0.5 + 0.5) * Math.pow(0.5, oct);
            }
            
            // Rock texture (medium details)
            for (let oct = 0; oct < 2; oct++) {
                const freq = Math.pow(2, oct + 3);
                rockNoise += (noise.noise(nx * freq + 100, ny * freq + 100) * 0.5 + 0.5) * Math.pow(0.5, oct);
            }
            
            // Fine detail (high frequency)
            detailNoise = (noise.noise(nx * 64, ny * 64) * 0.5 + 0.5);
            
            // Mix the layers
            const mixFactor = (noise.noise(nx * 2, ny * 2) * 0.5 + 0.5);
            const finalNoise = sandNoise * (1 - mixFactor) + rockNoise * mixFactor;
            
            // Add some variation for visual interest
            const variation = (noise.noise(nx * 8, ny * 8) * 0.5 + 0.5) * 0.1;
            
            // Set base sand/dirt color
            let r = 210 + variation * 30;
            let g = 180 + finalNoise * 20 - variation * 20;
            let b = 140 + finalNoise * 15 - variation * 30;
            
            // Occasionally add some rock patches
            if (rockNoise > 0.7) {
                r = 160 + rockNoise * 20;
                g = 150 + rockNoise * 15;
                b = 140 + rockNoise * 10;
            }
            
            // Add some darker patches in low areas
            if (sandNoise < 0.4) {
                r *= 0.9;
                g *= 0.9;
                b *= 0.85;
            }
            
            // Set the diffuse color
            diffuseData[i] = r;
            diffuseData[i+1] = g;
            diffuseData[i+2] = b;
            diffuseData[i+3] = 255; // Alpha
            
            // Calculate normal map values
            // Sample height at neighboring points
            const size = 1.0 / textureSize;
            const heightC = finalNoise;
            const heightL = sampleNoiseHeight(nx - size, ny, noise);
            const heightR = sampleNoiseHeight(nx + size, ny, noise);
            const heightU = sampleNoiseHeight(nx, ny - size, noise);
            const heightD = sampleNoiseHeight(nx, ny + size, noise);
            
            // Calculate normal vector using central differences
            const strength = 2.0; // Normal strength
            let nx1 = (heightL - heightR) * strength;
            let ny1 = (heightU - heightD) * strength;
            let nz = 1.0;
            
            // Normalize
            const length = Math.sqrt(nx1 * nx1 + ny1 * ny1 + nz * nz);
            nx1 /= length;
            ny1 /= length;
            nz /= length;
            
            // Convert from [-1, 1] to [0, 255]
            normalData[i] = Math.floor((nx1 * 0.5 + 0.5) * 255);
            normalData[i+1] = Math.floor((ny1 * 0.5 + 0.5) * 255);
            normalData[i+2] = Math.floor((nz * 0.5 + 0.5) * 255);
            normalData[i+3] = 255; // Alpha
        }
    }
    
    // Create the diffuse texture
    const diffuseMap = new THREE.DataTexture(
        diffuseData,
        textureSize,
        textureSize,
        THREE.RGBAFormat
    );
    diffuseMap.wrapS = THREE.RepeatWrapping;
    diffuseMap.wrapT = THREE.RepeatWrapping;
    diffuseMap.repeat.set(TERRAIN_PARAMS.texture.detailScale, TERRAIN_PARAMS.texture.detailScale);
    diffuseMap.needsUpdate = true;
    
    // Create the normal map
    const normalMap = new THREE.DataTexture(
        normalData,
        textureSize,
        textureSize,
        THREE.RGBAFormat
    );
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(TERRAIN_PARAMS.texture.detailScale, TERRAIN_PARAMS.texture.detailScale);
    normalMap.needsUpdate = true;
    
    return { diffuseMap, normalMap };
}

/**
 * Sample noise at a point for normal map generation
 */
function sampleNoiseHeight(x, y, noise) {
    // Multi-layer noise just like in the main texture generation
    let sandNoise = 0;
    let rockNoise = 0;
    
    // Sand texture (fine details)
    for (let oct = 0; oct < 3; oct++) {
        const freq = Math.pow(2, oct + 4);
        sandNoise += (noise.noise(x * freq, y * freq) * 0.5 + 0.5) * Math.pow(0.5, oct);
    }
    
    // Rock texture (medium details)
    for (let oct = 0; oct < 2; oct++) {
        const freq = Math.pow(2, oct + 3);
        rockNoise += (noise.noise(x * freq + 100, y * freq + 100) * 0.5 + 0.5) * Math.pow(0.5, oct);
    }
    
    // Mix the layers
    const mixFactor = (noise.noise(x * 2, y * 2) * 0.5 + 0.5);
    return sandNoise * (1 - mixFactor) + rockNoise * mixFactor;
} 
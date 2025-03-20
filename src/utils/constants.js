/**
 * Luminor
 * Game constants and configuration
 * Code written by a mixture of AI (2025)
 */

// Planet configuration
export const PLANET_CONFIG = {
    RADIUS: 800,           // Base planet radius
    RESOLUTION: 128,       // Geometry resolution (segments)
    CRATER_COUNT: 15,      // Number of craters
    CRATER_MIN_SIZE: 30,   // Minimum crater size
    CRATER_MAX_SIZE: 100,  // Maximum crater size
    
    // Terrain configuration
    TERRAIN: {
        // Main terrain scale factor (higher = more dramatic terrain)
        heightScale: 0.8,
        
        // Base noise settings
        baseFrequency: 0.08,
        roughness: 0.85,
        
        // Large scale undulation settings (main dramatic hills)
        largeScale: {
            frequency: 0.025,
            influence: 1.2,
        },
        
        // Medium scale features (smaller hills, valleys)
        mediumScale: {
            frequency: 0.08,
            influence: 0.5,
        },
        
        // Small scale details
        smallScale: {
            frequency: 0.4,
            influence: 0.08,
            octaves: 2,
            persistence: 0.5,
        },
        
        // Ridge settings
        ridges: {
            enabled: true,
            frequency: 0.05,
            influence: 0.7,
            sharpness: 1.5,
        },
        
        // Valley settings
        valleys: {
            enabled: true,
            frequency: 0.1,
            influence: 0.5,
        }
    }
};

// Player configuration
export const PLAYER_CONFIG = {
    SEGMENT_SIZE: 2.0,      // Size of player segments
    SPEED: 1.0,             // Base movement speed
    TURN_SPEED: 0.008,      // Turning speed
    MIN_SEGMENT_DISTANCE: 2.0, // Minimum distance between segments
    MAX_SEGMENT_DISTANCE: 3.0, // Maximum distance between segments
    GLOW_INTENSITY: 1.8,    // Glow effect intensity
    HOVER_HEIGHT: 7.0,      // Height above terrain
    HOVER_SMOOTHNESS: 0.08, // Hover movement smoothness
    HOVER_WOBBLE: 0.6,      // Hover wobble amount
    TRAIL_ENABLED: true,    // Enable trail effect
    TRAIL_LIFETIME: 2.0,    // Trail particle lifetime
    TRAIL_EMISSION_RATE: 5, // Trail particles per second
    DEBUG_ALIGNMENT: true,  // Show debug alignment indicators
};

// Resource configuration
export const RESOURCE_CONFIG = {
    COUNT: 60,              // Number of resources
    SIZE: 2.5,              // Resource size
    HOVER_HEIGHT: 2.5,      // Height above terrain
    COLOR: 0xffdd00,        // Resource color
    GLOW_INTENSITY: 1.5,    // Glow effect intensity
    ROTATION_SPEED: 0.01,   // Rotation animation speed
    COLLECTION_DISTANCE: 8.0, // Distance for collection (increased from 5.0)
    MIN_SPACING: 50,        // Minimum spacing between resources
}; 
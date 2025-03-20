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
    TURN_SPEED: 0.015,      // Turning speed
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
    ALIGNMENT_LINE_LENGTH: 10, // Length of the alignment indicator lines
    HISTORY_LENGTH: 10,     // Number of positions to remember per segment
};

// Resource configuration
export const RESOURCE_CONFIG = {
    COUNT: 1000,              // Number of resources
    SIZE: 3.0,              // Resource size
    HOVER_HEIGHT: 2.5,      // Height above terrain
    COLOR: 0xffdd00,        // Resource color
    GLOW_INTENSITY: 1.5,    // Glow effect intensity
    ROTATION_SPEED: 0.01,   // Rotation animation speed
    COLLECTION_DISTANCE: 10.0, // Distance for collection
    MIN_SPACING: 50,        // Minimum spacing between resources
    RESPAWN_INTERVAL: 5000, // Respawn interval in ms
    MAX_ACTIVE_RATIO: 1.5   // Maximum active resources ratio
};

// Camera configuration
export const CAMERA_CONFIG = {
    DISTANCE: 60,         // Distance from the player
    HEIGHT: 80,          // Height above the ground
    SMOOTHNESS: 0.08,    // Camera movement smoothing factor
    FORWARD_OFFSET: 20,  // How far ahead of the player to look
    FOV: 75,            // Field of view
    NEAR: 0.1,          // Near clipping plane
    FAR: 1000,          // Far clipping plane
    // Dynamic camera adjustment settings
    SLOPE: {
        UPHILL_HEIGHT_FACTOR: 1.5,    // How much to lower camera on uphill
        UPHILL_DISTANCE_FACTOR: 0.5,  // How much to increase distance on uphill
        DOWNHILL_HEIGHT_FACTOR: 0.5,  // How much to raise camera on downhill
        DOWNHILL_DISTANCE_FACTOR: 0.5, // How much to increase distance on downhill
        THRESHOLD: {
            UPHILL: 0.55,   // Slope threshold for uphill adjustments
            DOWNHILL: 0.45  // Slope threshold for downhill adjustments
        }
    }
};

// Lighting configuration
export const LIGHTING_CONFIG = {
    BACKGROUND_COLOR: 0x000011,  // Dark blue background
    AMBIENT_LIGHT: {
        COLOR: 0x666666,
        INTENSITY: 0.7
    },
    SUN_LIGHT: {
        COLOR: 0xffffdd,
        INTENSITY: 1.4,
        POSITION: { x: 200, y: 100, z: 200 },
        SHADOW_SIZE: 900
    },
    FILL_LIGHT: {
        COLOR: 0x334466,
        INTENSITY: 0.2,
        POSITION: { x: -200, y: -50, z: -200 }
    }
};

// Starfield configuration
export const STARFIELD_CONFIG = {
    STAR_COUNT: 4000,
    MIN_RADIUS: 300,
    MAX_RADIUS: 900,
    MIN_SIZE: 0.1,
    MAX_SIZE: 1.0
};

// Terrain material configuration
export const TERRAIN_MATERIAL_CONFIG = {
    BASE_COLOR: 0x47803a,        // Earth-like green
    HIGH_ELEVATION_COLOR: 0x8a7152, // Mountain brown
    LOW_ELEVATION_COLOR: 0x2d5a2d   // Valley dark green
};
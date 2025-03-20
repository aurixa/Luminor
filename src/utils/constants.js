/**
 * Luminor
 * Game constants and configuration
 * Code written by a mixture of AI (2025)
 */

// Planet configuration
export const PLANET_CONFIG = {
    RADIUS: 800,  // Base planet radius
    RESOLUTION: 196,  // Sphere geometry resolution
};

// Terrain configuration
export const TERRAIN_CONFIG = {
    // Main terrain scale factor (higher = more dramatic terrain)
    HEIGHT_SCALE: 0.8,  // SIGNIFICANTLY INCREASED for dramatic hills
    
    // Base noise settings
    BASE_FREQUENCY: 0.08, // LOWERED for wider, more dramatic undulations
    ROUGHNESS: 0.85,     // ADJUSTED for balance between smoothness and detail
    
    // Large scale undulation settings (main dramatic hills)
    LARGE_SCALE: {
        FREQUENCY: 0.025, // LOWERED for much wider features
        INFLUENCE: 1.2,   // SIGNIFICANTLY INCREASED for more dramatic terrain
    },
    
    // Medium scale features (smaller hills, valleys)
    MEDIUM_SCALE: {
        FREQUENCY: 0.08,  // ADJUSTED for better hill shapes
        INFLUENCE: 0.5,   // INCREASED for more definition
    },
    
    // Small scale features (local roughness)
    SMALL_SCALE: {
        FREQUENCY: 0.2,   // Frequency of small details
        INFLUENCE: 0.3,   // INCREASED a bit for more noticeable detail
    },
    
    // Crater settings
    CRATERS: {
        ENABLED: true,
        COUNT: 25,         // INCREASED for more interesting terrain
        MIN_SIZE: 60,      // Minimum crater size
        MAX_SIZE: 120,     // Maximum crater size
        DEPTH_FACTOR: 0.2, // How deep craters are relative to size (0-1)
        RIM_HEIGHT_FACTOR: 0.5, // How high crater rims are (0-1)
    }
};

// Player configuration
export const PLAYER_CONFIG = {
    SEGMENT_SIZE: 2.0,      // Size of player segments
    SPEED: 0.8,             // Base movement speed
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
    DEBUG_ALIGNMENT: false, // Show debug alignment indicators (disabled for cleaner look)
    ALIGNMENT_LINE_LENGTH: 10, // Length of the alignment indicator lines
    HISTORY_LENGTH: 20,     // Number of positions to remember per segment
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
    INITIAL_POSITION: { x: 0, y: 0, z: 150 }, // Initial camera position
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
    LOW_ELEVATION_COLOR: 0x2d5a2d,   // Valley dark green
    TEXTURE_RESOLUTION: 1024,    // Texture resolution
    NORMAL_MAP_STRENGTH: 1.2,    // Normal map influence
    ROUGHNESS: 0.7,              // Surface roughness
    METALNESS: 0.1,              // Surface metalness
    DETAIL_SCALE: 20             // Detail texture scale
};
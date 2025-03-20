/**
 * Luminor
 * Game constants and configuration
 * Code written by a mixture of AI (2025)
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ScaleConfig {
  FREQUENCY: number;
  INFLUENCE: number;
}

export interface CraterConfig {
  ENABLED: boolean;
  COUNT: number;
  MIN_SIZE: number;
  MAX_SIZE: number;
  DEPTH_FACTOR: number;
  RIM_HEIGHT_FACTOR: number;
}

export interface TerrainConfig {
  HEIGHT_SCALE: number;
  BASE_FREQUENCY: number;
  ROUGHNESS: number;
  LARGE_SCALE: ScaleConfig;
  MEDIUM_SCALE: ScaleConfig;
  SMALL_SCALE: ScaleConfig;
  CRATERS: CraterConfig;
}

interface PlayerConfig {
  SEGMENT_SIZE: number;
  SPEED: number;
  TURN_SPEED: number;
  MIN_SEGMENT_DISTANCE: number;
  MAX_SEGMENT_DISTANCE: number;
  GLOW_INTENSITY: number;
  HOVER_HEIGHT: number;
  HOVER_SMOOTHNESS: number;
  HOVER_WOBBLE: number;
  TRAIL_ENABLED: boolean;
  TRAIL_LIFETIME: number;
  TRAIL_EMISSION_RATE: number;
  DEBUG_ALIGNMENT: boolean;
  ALIGNMENT_LINE_LENGTH: number;
  HISTORY_LENGTH: number;
}

interface ResourceConfig {
  COUNT: number;
  SIZE: number;
  HOVER_HEIGHT: number;
  COLOR: number;
  GLOW_INTENSITY: number;
  ROTATION_SPEED: number;
  COLLECTION_DISTANCE: number;
  MIN_SPACING: number;
  RESPAWN_INTERVAL: number;
  MAX_ACTIVE_RATIO: number;
  COLLISION_RADIUS: number;
}

export interface CameraConfig {
  FOV: number;
  NEAR: number;
  FAR: number;
  HEIGHT: number;
  DISTANCE: number;
  FOLLOW_DISTANCE: number;
  HEIGHT_OFFSET: number;
  INITIAL_POSITION: {
    x: number;
    y: number;
    z: number;
  };
}

export interface LightingConfig {
  BACKGROUND_COLOR: number;
  AMBIENT_LIGHT: {
    COLOR: number;
    INTENSITY: number;
  };
  SUN_LIGHT: {
    POSITION: {
      x: number;
      y: number;
      z: number;
    };
    INTENSITY: number;
    COLOR: number;
    SHADOW_SIZE: number;
    SHADOW_MAP_SIZE: number;
    SHADOW_NEAR: number;
    SHADOW_FAR: number;
  };
  FILL_LIGHT: {
    POSITION: {
      x: number;
      y: number;
      z: number;
    };
    INTENSITY: number;
    COLOR: number;
  };
}

export interface StarfieldConfig {
  STAR_COUNT: number;
  RADIUS: number;
  MIN_SIZE: number;
  MAX_SIZE: number;
  ROTATION_SPEED: number;
}

export interface TerrainMaterialConfig {
  TEXTURE_SIZE: number;
  ROUGHNESS: number;
  METALNESS: number;
  NORMAL_STRENGTH: number;
  BASE_ROUGHNESS: number;
  ROUGHNESS_VARIATION: number;
  HIGH_ELEVATION_THRESHOLD: number;
  LOW_ELEVATION_THRESHOLD: number;
  BASE_COLOR: number;
  HIGH_ELEVATION_COLOR: number;
  LOW_ELEVATION_COLOR: number;
}

export interface PlanetConfig {
  readonly RADIUS: number;
  readonly RESOLUTION: number;
  readonly TERRAIN_SCALE: number;
  readonly CRATER_COUNT: number;
  readonly MIN_CRATER_SIZE: number;
  readonly MAX_CRATER_SIZE: number;
}

// Terrain configuration
export const TERRAIN_CONFIG: TerrainConfig = {
  // Main terrain scale factor (higher = more dramatic terrain)
  HEIGHT_SCALE: 0.8, // SIGNIFICANTLY INCREASED for dramatic hills

  // Base noise settings
  BASE_FREQUENCY: 0.08, // LOWERED for wider, more dramatic undulations
  ROUGHNESS: 0.85, // ADJUSTED for balance between smoothness and detail

  // Large scale undulation settings (main dramatic hills)
  LARGE_SCALE: {
    FREQUENCY: 0.025, // LOWERED for much wider features
    INFLUENCE: 1.2 // SIGNIFICANTLY INCREASED for more dramatic terrain
  },

  // Medium scale features (smaller hills, valleys)
  MEDIUM_SCALE: {
    FREQUENCY: 0.08, // ADJUSTED for better hill shapes
    INFLUENCE: 0.5 // INCREASED for more definition
  },

  // Small scale features (local roughness)
  SMALL_SCALE: {
    FREQUENCY: 0.2, // Frequency of small details
    INFLUENCE: 0.3 // INCREASED a bit for more noticeable detail
  },

  // Crater settings
  CRATERS: {
    ENABLED: true,
    COUNT: 25, // INCREASED for more interesting terrain
    MIN_SIZE: 60, // Minimum crater size
    MAX_SIZE: 120, // Maximum crater size
    DEPTH_FACTOR: 0.2, // How deep craters are relative to size (0-1)
    RIM_HEIGHT_FACTOR: 0.5 // How high crater rims are (0-1)
  }
} as const;

// Player configuration
export const PLAYER_CONFIG: PlayerConfig = {
  SEGMENT_SIZE: 2.0, // Size of player segments
  SPEED: 0.8, // Base movement speed
  TURN_SPEED: 0.015, // Turning speed
  MIN_SEGMENT_DISTANCE: 2.0, // Minimum distance between segments
  MAX_SEGMENT_DISTANCE: 3.0, // Maximum distance between segments
  GLOW_INTENSITY: 1.8, // Glow effect intensity
  HOVER_HEIGHT: 7.0, // Height above terrain
  HOVER_SMOOTHNESS: 0.08, // Hover movement smoothness
  HOVER_WOBBLE: 0.6, // Hover wobble amount
  TRAIL_ENABLED: true, // Enable trail effect
  TRAIL_LIFETIME: 2.0, // Trail particle lifetime
  TRAIL_EMISSION_RATE: 5, // Trail particles per second
  DEBUG_ALIGNMENT: false, // Show debug alignment indicators (disabled for cleaner look)
  ALIGNMENT_LINE_LENGTH: 10, // Length of the alignment indicator lines
  HISTORY_LENGTH: 20 // Number of positions to remember per segment
} as const;

// Resource configuration
export const RESOURCE_CONFIG: ResourceConfig = {
  COUNT: 1000, // Number of resources
  SIZE: 3.0, // Resource size
  HOVER_HEIGHT: 2.5, // Height above terrain
  COLOR: 0xffdd00, // Resource color
  GLOW_INTENSITY: 1.5, // Glow effect intensity
  ROTATION_SPEED: 0.01, // Rotation animation speed
  COLLECTION_DISTANCE: 10.0, // Distance for collection
  MIN_SPACING: 50, // Minimum spacing between resources
  RESPAWN_INTERVAL: 5000, // Respawn interval in ms
  MAX_ACTIVE_RATIO: 1.5, // Maximum active resources ratio
  COLLISION_RADIUS: 1.0 // Collision radius
} as const;

// Camera configuration
export const CAMERA_CONFIG: CameraConfig = {
  FOV: 75,
  NEAR: 0.1,
  FAR: 1000,
  HEIGHT: 5,
  DISTANCE: 10,
  FOLLOW_DISTANCE: 15,
  HEIGHT_OFFSET: 3,
  INITIAL_POSITION: {
    x: 0,
    y: 10,
    z: 20
  }
};

// Lighting configuration
export const LIGHTING_CONFIG: LightingConfig = {
  BACKGROUND_COLOR: 0x000011,
  AMBIENT_LIGHT: {
    COLOR: 0x666666,
    INTENSITY: 0.7
  },
  SUN_LIGHT: {
    POSITION: { x: 100, y: 100, z: 100 },
    INTENSITY: 1.5,
    COLOR: 0xffffff,
    SHADOW_SIZE: 100,
    SHADOW_MAP_SIZE: 2048,
    SHADOW_NEAR: 1,
    SHADOW_FAR: 1000
  },
  FILL_LIGHT: {
    POSITION: { x: -50, y: 50, z: -50 },
    INTENSITY: 0.5,
    COLOR: 0x6699ff
  }
};

// Starfield configuration
export const STARFIELD_CONFIG: StarfieldConfig = {
  STAR_COUNT: 1000,
  RADIUS: 1000,
  MIN_SIZE: 0.1,
  MAX_SIZE: 0.5,
  ROTATION_SPEED: 0.00001
};

// Terrain material configuration
export const TERRAIN_MATERIAL_CONFIG: TerrainMaterialConfig = {
  TEXTURE_SIZE: 1024,
  ROUGHNESS: 0.85,
  METALNESS: 0.0,
  NORMAL_STRENGTH: 0.8,
  BASE_ROUGHNESS: 0.7,
  ROUGHNESS_VARIATION: 0.3,
  HIGH_ELEVATION_THRESHOLD: 0.2,
  LOW_ELEVATION_THRESHOLD: -0.2,
  BASE_COLOR: 0x808080,
  HIGH_ELEVATION_COLOR: 0xffffff,
  LOW_ELEVATION_COLOR: 0x404040
};

// Crater configuration
export const CRATER_CONFIG: CraterConfig = {
  ENABLED: true,
  COUNT: 100,
  MIN_SIZE: 0.1,
  MAX_SIZE: 0.5,
  DEPTH_FACTOR: 0.1,
  RIM_HEIGHT_FACTOR: 0.2
};

export const PLANET_CONFIG: PlanetConfig = {
  RADIUS: 800,
  RESOLUTION: 196,
  TERRAIN_SCALE: 0.5,
  CRATER_COUNT: 100,
  MIN_CRATER_SIZE: 0.1,
  MAX_CRATER_SIZE: 0.5
};

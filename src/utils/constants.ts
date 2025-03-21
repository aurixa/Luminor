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
  readonly DEBUG_SPHERE_ENABLED: boolean;
  readonly AXES_HELPER_ENABLED: boolean;
  readonly DEBUG_SPHERE_COLOR: number;
  readonly DEBUG_SPHERE_OPACITY: number;
  readonly DEBUG_SPHERE_Y_OFFSET: number;
}

// Terrain configuration
export const TERRAIN_CONFIG: TerrainConfig = {
  HEIGHT_SCALE: 0.4, // Increased for more dramatic terrain
  BASE_FREQUENCY: 0.5,
  ROUGHNESS: 0.8,

  LARGE_SCALE: {
    FREQUENCY: 0.15, // Decreased for wider mountain ranges
    INFLUENCE: 0.8 // Increased for more dramatic terrain
  },

  MEDIUM_SCALE: {
    FREQUENCY: 0.4,
    INFLUENCE: 0.5 // Increased for more visible features
  },

  SMALL_SCALE: {
    FREQUENCY: 1.0, // Increased for finer detail
    INFLUENCE: 0.3
  },

  CRATERS: {
    ENABLED: true,
    COUNT: 15,
    MIN_SIZE: 8,
    MAX_SIZE: 20,
    DEPTH_FACTOR: 0.3,
    RIM_HEIGHT_FACTOR: 0.4
  }
} as const;

// Player configuration
export const PLAYER_CONFIG: PlayerConfig = {
  SEGMENT_SIZE: 5.0,
  SPEED: 120.0,
  TURN_SPEED: 0.03,
  MIN_SEGMENT_DISTANCE: 5.0,
  MAX_SEGMENT_DISTANCE: 7.0,
  GLOW_INTENSITY: 1.8,
  HOVER_HEIGHT: 20.0,
  HOVER_SMOOTHNESS: 0.08,
  HOVER_WOBBLE: 0.3,
  TRAIL_ENABLED: true,
  TRAIL_LIFETIME: 2.0,
  TRAIL_EMISSION_RATE: 5,
  DEBUG_ALIGNMENT: true,
  ALIGNMENT_LINE_LENGTH: 20,
  HISTORY_LENGTH: 20
} as const;

// Resource configuration
export const RESOURCE_CONFIG: ResourceConfig = {
  COUNT: 1000,
  SIZE: 8.0,
  HOVER_HEIGHT: 10.0,
  COLOR: 0xffdd00,
  GLOW_INTENSITY: 1.5,
  ROTATION_SPEED: 0.01,
  COLLECTION_DISTANCE: 15.0,
  MIN_SPACING: 50,
  RESPAWN_INTERVAL: 5000,
  MAX_ACTIVE_RATIO: 1.5,
  COLLISION_RADIUS: 20.0
} as const;

// Camera configuration
export const CAMERA_CONFIG: CameraConfig = {
  FOV: 75,
  NEAR: 1,
  FAR: 20000,
  FOLLOW_DISTANCE: 150,
  HEIGHT_OFFSET: 100,
  INITIAL_POSITION: {
    x: 0,
    y: 2000,
    z: 2000
  }
} as const;

// Lighting configuration
export const LIGHTING_CONFIG: LightingConfig = {
  BACKGROUND_COLOR: 0x000011,
  AMBIENT_LIGHT: {
    COLOR: 0xffffff,
    INTENSITY: 0.8
  },
  SUN_LIGHT: {
    POSITION: {
      x: 4000,
      y: 2000,
      z: 1000
    },
    COLOR: 0xffffff,
    INTENSITY: 10.0,
    SHADOW_SIZE: 2000,
    SHADOW_MAP_SIZE: 2048,
    SHADOW_NEAR: 100,
    SHADOW_FAR: 10000
  },
  FILL_LIGHT: {
    POSITION: {
      x: -2000,
      y: -1000,
      z: -1000
    },
    COLOR: 0xffffee,
    INTENSITY: 3.0
  }
} as const;

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
  ROUGHNESS: 0.7,
  METALNESS: 0.0,
  NORMAL_STRENGTH: 1.0,
  BASE_ROUGHNESS: 0.7,
  ROUGHNESS_VARIATION: 0.3,
  HIGH_ELEVATION_THRESHOLD: 0.7,
  LOW_ELEVATION_THRESHOLD: 0.3,
  BASE_COLOR: 0x4477aa,
  HIGH_ELEVATION_COLOR: 0x88aadd,
  LOW_ELEVATION_COLOR: 0x224488
} as const;

// Crater configuration
export const CRATER_CONFIG: CraterConfig = {
  ENABLED: true,
  COUNT: 100,
  MIN_SIZE: 0.1,
  MAX_SIZE: 0.5,
  DEPTH_FACTOR: 0.1,
  RIM_HEIGHT_FACTOR: 0.2
};

// Planet configuration
export const PLANET_CONFIG = {
  RADIUS: 2000,
  RESOLUTION: 128,
  TERRAIN_SCALE: 1.0,
  DEBUG_SPHERE_ENABLED: false,
  AXES_HELPER_ENABLED: false,
  DEBUG_SPHERE_COLOR: 0xff0000,
  DEBUG_SPHERE_OPACITY: 0.5,
  DEBUG_SPHERE_Y_OFFSET: 1.0
} as const;

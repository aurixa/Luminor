# Luminor Code Organization

This document outlines the improved code organization structure for the Luminor project.

## Directory Structure

```
src/
├── core/                  # Core game functionality
│   ├── engine/            # Game engine components
│   │   ├── loop.ts        # Game loop and timing
│   │   ├── input.ts       # Input handling
│   │   ├── physics.ts     # Physics calculations
│   │   └── audio.ts       # Audio system
│   ├── game.ts            # Main game initialization and setup
│   └── events.ts          # Event system
│
├── rendering/             # Rendering systems
│   ├── renderer.ts        # Main renderer setup
│   ├── shaders/           # Custom shader code
│   ├── effects/           # Post-processing effects
│   └── materials/         # Material definitions
│
├── planet/               # Planet generation and management
│   ├── planetCore.ts     # Core planet generation
│   ├── terrain.ts        # Terrain generation
│   └── biomes.ts         # Biome definitions
│
├── player/               # Player-related code
│   ├── playerCore.ts     # Core player functionality
│   ├── movement.ts       # Player movement
│   └── stats.ts          # Player statistics
│
├── utils/                # Utility functions
│   ├── math.ts           # Math utilities
│   ├── random.ts         # Random generation utilities
│   └── constants.ts      # Game constants
│
├── ui/                   # User interface
│   ├── components/       # UI components
│   ├── screens/          # Game screens (menu, game over, etc.)
│   └── hud.ts            # Heads-up display
│
├── assets/               # Asset management
│   ├── models/           # 3D models
│   ├── textures/         # Texture files
│   └── loader.ts         # Asset loading system
│
├── types.d.ts            # TypeScript type definitions
├── config.ts             # Game configuration
└── index.ts              # Entry point
```

## Module Responsibilities

### Core

- **engine/loop.ts**: Manages the game loop, timing, and update cycle
- **engine/input.ts**: Handles keyboard, mouse, and touch input
- **engine/physics.ts**: Manages collision detection and physics calculations
- **engine/audio.ts**: Controls sound effects and music
- **game.ts**: Main game initialization and state management
- **events.ts**: Event system for communication between components

### Rendering

- **renderer.ts**: Three.js renderer setup and configuration
- **shaders/**: Custom GLSL shaders for special effects
- **effects/**: Post-processing effects like bloom, glow, etc.
- **materials/**: Material definitions for various game objects

### Planet

- **planetCore.ts**: Core planet generation algorithms
- **terrain.ts**: Terrain generation and modification
- **biomes.ts**: Different biome types and their characteristics

### Player

- **playerCore.ts**: Core player functionality and integration
- **movement.ts**: Player movement logic
- **stats.ts**: Player statistics and progression

### Utils

- **math.ts**: Math helper functions
- **random.ts**: Utilities for random generation with seeds
- **constants.ts**: Game constants and configuration values

### UI

- **components/**: Reusable UI components
- **screens/**: Full game screens like menus, pause screen, etc.
- **hud.ts**: In-game heads-up display

### Assets

- **models/**: 3D model management
- **textures/**: Texture management
- **loader.ts**: Asset loading and caching system

## Coding Guidelines

1. **Module Pattern**: Each module should export a clean interface and hide implementation details
2. **Dependency Injection**: Components should receive dependencies rather than importing directly when possible
3. **Single Responsibility**: Each file should have a single responsibility
4. **Immutable Data**: Prefer immutable data structures and pure functions
5. **Type Safety**: Use TypeScript interfaces and types for all components
6. **Error Handling**: Consistent error handling across the codebase
7. **Performance**: Optimize critical paths and use object pooling for frequently created objects 
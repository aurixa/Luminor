# Luminor - Planetary Adventure

A web-based 3D game built with Three.js, created entirely through AI collaboration.

## About

Luminor is an innovative web-based game that leverages the power of Three.js to create immersive 3D experiences. This project is unique in that it's being developed entirely through AI-assisted programming, pushing the boundaries of what's possible in game development.

## Technology Stack

- Three.js for 3D rendering
- Web technologies (HTML5, CSS3, JavaScript)
- Vite for development and building

## Project Structure

The project has been organized into a modular architecture:

- `src/core/` - Core game systems (game loop, controls)
- `src/entities/` - Game entities (player, planet, resources)
- `src/rendering/` - Rendering systems (camera, lighting, effects)
- `src/ui/` - User interface components
- `src/utils/` - Utility functions and constants
- `src/physics/` - Physics systems (in development)

## How to Play

1. Make sure you have Node.js installed on your system
2. Double-click the `Luminor.command` file to start the game
3. The game will open automatically in your default browser
4. When you're done playing, simply close the terminal window

## Development Status

This project is currently in active development. Features include:
- Procedurally generated spherical world
- Dynamic lighting system
- Resource collection mechanics
- Smooth player controls
- Enhanced terrain with texturing

## Future Plans

- Physics-based player movement
- Advanced particle effects
- Level progression system
- Sound effects and music

## License

This project is open source and available under the MIT License.

## Concept

Luminor takes the classic snake mechanic into a unique 3D environment - a procedurally generated spherical world. Players navigate the planet's surface, collecting glowing energy to grow longer.

A fixed light source (the sun) illuminates one portion of the planet, creating a distinct light/dark dichotomy that influences gameplay.

---

*Code written by a mixture of AI (2025)* 
```
Luminor
├─ LICENSE
├─ Luminor
│  ├─ public
│  └─ src
├─ Luminor.command
├─ README.md
├─ index.html
├─ package-lock.json
├─ package.json
├─ src
│  ├─ core
│  │  ├─ controls.js
│  │  └─ game.js
│  ├─ entities
│  │  ├─ planet.js
│  │  ├─ player.js
│  │  └─ resources.js
│  ├─ index.js
│  ├─ main.js
│  ├─ physics
│  │  ├─ bikeModel.js
│  │  ├─ hoverPlayer.js
│  │  ├─ physicsWorld.js
│  │  └─ playerController.js
│  ├─ planet.js
│  ├─ player.js
│  ├─ rendering
│  │  ├─ camera.js
│  │  ├─ cameraController.js
│  │  ├─ lighting.js
│  │  ├─ renderer.js
│  │  ├─ starfield.js
│  │  └─ terrainMaterial.js
│  ├─ resources.js
│  ├─ styles.css
│  ├─ ui
│  │  └─ interface.js
│  ├─ ui.js
│  └─ utils
│     ├─ constants.js
│     └─ materials.js
└─ vite.config.js

```
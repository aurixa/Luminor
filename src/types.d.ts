/**
 * Luminor
 * Common TypeScript type definitions
 * Code written by a mixture of AI (2025)
 */

// Game state interface
interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  playerLength: number;
  gameHasEnded: boolean;
  score?: number;
}

// Callback functions interface
interface GameCallbacks {
  onSpacePressed?: () => void;
  onEscapePressed?: () => void;
  onPausePressed?: () => void;
  onRestartPressed?: () => void;
  onMenuPressed?: () => void;
  onResourceCollected?: (value: number) => void;
  onScoreUpdated?: (score: number) => void;
  onGameOver?: (finalScore?: number) => void;
  updateCamera?: (camera: THREE.PerspectiveCamera, player: Player, planet: any, deltaTime: number) => void;
}

// Player interface
interface Player {
  update: (deltaTime: number) => void;
  dispose: (scene: THREE.Scene) => void;
  getPosition: () => THREE.Vector3;
  getRotation?: () => THREE.Quaternion;
  collidesWith?: (position: THREE.Vector3, radius: number) => boolean;
}

// Resource interface
interface Resource {
  id: string;
  position: THREE.Vector3;
  value: number;
  mesh: THREE.Mesh;
  update: (deltaTime: number) => void;
  collect: () => number;
}

// Resources manager interface
interface ResourceManager {
  resources: Resource[];
  update: (deltaTime: number) => void;
  checkCollisions: (player: Player) => number;
  dispose: (scene: THREE.Scene) => void;
}

// UI interface
interface GameUI {
  updateUI: (gameState: GameState) => void;
  updateScore: (score: number) => void;
  updateResourceCount: (count: number) => void;
  showGameOver: (finalScore?: number) => void;
}

// Game loop interface
interface GameLoop {
  start: () => boolean;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isRunning: boolean;
}

// Game input keys
interface InputKeys {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  space: boolean;
}

// Scene setup result
interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

// Planet configuration
interface PlanetConfig {
  radius: number;
  detail: number;
  terrainHeight: number;
  terrainFrequency: number;
}

// Resource configuration
interface ResourceConfig {
  count: number;
  minValue: number;
  maxValue: number;
  minSize: number;
  maxSize: number;
  rotationSpeed: number;
} 
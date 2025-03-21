/**
 * Luminor
 * Type definitions
 * Code written by a mixture of AI (2025)
 */

import * as THREE from 'three';

// We need to declare the Stats module since it's not properly typed
declare module 'three/examples/jsm/libs/stats.module' {
  class Stats {
    constructor();
    dom: HTMLDivElement;
    showPanel(panel: number): void;
    begin(): void;
    end(): void;
    update(): void;
  }
  export default Stats;
}

// We need to declare the SimplexNoise module since it's not properly typed
declare module 'three/examples/jsm/math/SimplexNoise.js' {
  export class SimplexNoise {
    constructor();
    noise(x: number, y: number, z?: number, w?: number): number;
  }
}

// Game state interface
export interface GameState {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  stats: Stats | null;
  controls: Controls | null;
  planet: Planet | null;
  player: Player | null;
  resources: ResourceManager | null;
  gameLoop: GameLoop | null;
  gameUI: GameUI | null;
  callbacks: GameCallbacks;
  isPlaying: boolean;
  isPaused: boolean;
  playerLength: number;
  gameHasEnded: boolean;
  score: number;
  resourceCount: number;
}

// Input keys interface
export interface InputKeys {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

// Controls interface
export interface Controls {
  keys: InputKeys;
  disable: () => void;
  enable: () => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  handleKeyUp: (event: KeyboardEvent) => void;
}

// Callback functions interface
export interface GameCallbacks {
  onSpacePressed: () => void;
  onEscapePressed: () => void;
  onPausePressed: () => void;
  onRestartPressed: () => void;
  onMenuPressed: () => void;
  onResourceCollected: (count: number) => void;
  onScoreUpdated: (score: number) => void;
  onGameOver: (finalScore?: number) => void;
  onGameWon: () => void;
  onScoreUpdate: (score: number) => void;
}

// Player interface
export interface Player {
  mesh: THREE.Mesh;
  segments: {
    mesh: THREE.Mesh;
    isHead: boolean;
    index: number;
    position?: THREE.Vector3;
    direction?: THREE.Vector3;
    hoverPhase?: number;
  }[];
  updateSegments: (deltaTime: number) => void;
  growTail: (count: number) => void;
  getCount: () => number;
  checkCollisions: () => void;
  trail: {
    update: (deltaTime: number) => void;
    dispose: () => void;
  } | null;
  dispose: (scene: THREE.Scene) => void;
  getPosition: () => THREE.Vector3;
  getDirection: () => THREE.Vector3;
  grow: (count: number) => void;
  getSegmentCount: () => number;
  getHeadPosition: () => THREE.Vector3;
  die: () => void;
  update: (deltaTime: number) => void;
}

// Planet interface
export interface Planet {
  mesh: THREE.Mesh;
  radius: number;
  getNearestPointOnSurface: (point: THREE.Vector3) => THREE.Vector3;
}

// Resource interface
export interface Resource {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  collected: boolean;
  rotationAxis: THREE.Vector3;
  rotationSpeed: number;
  bobHeight: number;
  bobSpeed: number;
  bobPhase: number;
  originalY: number;
}

// Resources manager interface
export interface ResourceManager {
  resources: Resource[];
  collectedResources: number;
  totalCollected: number;
  setVisible: (visible: boolean) => void;
  remove: (resource: Resource) => void;
  update: (player: Player, deltaTime: number) => void;
  dispose: (scene: THREE.Scene) => void;
  checkCollisions: (player: Player) => void;
}

// UI interface
export interface GameUI {
  updateUI: (state: GameState) => void;
  updateScore: (score: number) => void;
  updateResourceCount: (count: number) => void;
  showGameOver: (finalScore: number) => void;
  dispose: () => void;
}

// Game loop interface
export interface GameLoop {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  dispose: () => void;
}

// Scene setup result
export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

// Planet configuration
export interface PlanetConfig {
  RADIUS: number;
  RESOLUTION: number;
}

// Planet geometry interface
export interface PlanetGeometry {
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
}

// Crater interface
export interface Crater {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  radius: number;
  size: number;
  depth: number;
  rimHeight: number;
  falloff: number;
}

// Resource configuration
export interface ResourceConfig {
  COUNT: number;
  SIZE: number;
  HOVER_HEIGHT: number;
  ROTATION_SPEED: number;
  BOBBING_HEIGHT: number;
  BOBBING_SPEED: number;
  COLLECTION_RADIUS: number;
  MIN_SPACING: number;
  RESPAWN_INTERVAL: number;
  MAX_ACTIVE_RATIO: number;
  COLOR: number;
  GLOW_INTENSITY: number;
}

// Custom Events
export interface LuminorCleanupEvent extends CustomEvent<{ source: string }> {
  detail: {
    source: string;
  };
}

declare global {
  interface DocumentEventMap {
    luminorCleanup: LuminorCleanupEvent;
  }
}

// Game initialization options
export interface GameLoopOptions {
  gameState: GameState;
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  player: Player | null;
  planet: Planet;
  resources: ResourceManager | null;
  stats: Stats;
  callbacks: GameCallbacks;
}

export interface StarField extends THREE.Points {
  update: (deltaTime: number) => void;
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

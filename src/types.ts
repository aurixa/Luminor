import * as THREE from 'three';

export interface InputKeys {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  gameHasEnded: boolean;
  score: number;
  playerLength: number;
  finalScore?: number;
  resourceCount: number;

  // Core game objects
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  stats: Stats | null;
  gameLoop: GameLoop | null;
  controls: Controls | null;
  planet: Planet | null;
  player: Player | null;
  resources: ResourceManager | null;
  gameUI: GameUI | null;
  callbacks: GameCallbacks;
}

export interface GameCallbacks {
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onGameOver: (finalScore?: number) => void;
  onGameWon: () => void;
  onResourceCollected: (count: number) => void;
  onScoreUpdated: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onSpacePressed: () => void;
  onEscapePressed: () => void;
  onPausePressed: () => void;
  onRestartPressed: () => void;
  onMenuPressed: () => void;
}

export interface Controls {
  keys: InputKeys;
  disable: () => void;
  enable: () => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  handleKeyUp: (event: KeyboardEvent) => void;
  update: () => void;
  dispose: () => void;
}

export interface Resource {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  collected: boolean;
  originalY: number;
  rotationAxis: THREE.Vector3;
  rotationSpeed: number;
  bobPhase: number;
  bobSpeed: number;
  bobHeight: number;
}

export interface ResourceManager {
  resources: Resource[];
  collectedResources: number;
  totalCollected: number;
  loadAll: () => Promise<void>;
  setVisible: (visible: boolean) => void;
  remove: (resource: Resource) => void;
  update: (player: Player, deltaTime: number) => void;
  checkCollisions: (player: Player) => void;
  dispose: (scene: THREE.Scene) => void;
}

export interface GameLoop {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  dispose: () => void;
}

export interface GameUI {
  update: (state: GameState) => void;
  updateScore: (score: number) => void;
  updateResourceCount: (count: number) => void;
  showGameOver: (finalScore?: number) => void;
  show: () => void;
  hide: () => void;
  dispose: () => void;
}

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export interface TrailSystem {
  update: (deltaTime: number) => void;
  dispose: () => void;
}

export interface TrailParticle {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  lifetime: number;
}

export interface Segment {
  mesh: THREE.Mesh;
  position?: THREE.Vector3;
  direction?: THREE.Vector3;
  isHead: boolean;
  index: number;
  hoverPhase?: number;
}

export interface Player {
  mesh: THREE.Mesh;
  segments: Segment[];
  updateSegments: (deltaTime: number) => void;
  growTail: (count: number) => void;
  getCount: () => number;
  checkCollisions: () => boolean;
  trail: TrailSystem | null;
  dispose: (scene: THREE.Scene) => void;
  getPosition: () => THREE.Vector3;
  getDirection: () => THREE.Vector3;
  grow: (count: number) => void;
  getSegmentCount: () => number;
  getHeadPosition: () => THREE.Vector3;
  die: () => void;
  update: (deltaTime: number) => void;
  getPlanet: () => Planet;
}

export interface Planet {
  mesh: THREE.Mesh;
  radius: number;
  getNearestPointOnSurface: (point: THREE.Vector3) => THREE.Vector3;
  raycast: (raycaster: THREE.Raycaster) => THREE.Intersection[];
}

export interface Crater {
  position: THREE.Vector3;
  radius: number;
  depth: number;
}

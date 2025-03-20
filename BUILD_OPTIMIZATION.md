# Luminor Build Process Optimization

This document outlines recommendations for optimizing the build process and performance of the Luminor game.

## Build Process Improvements

### 1. Code Splitting

Implement code splitting to reduce initial load time and improve performance:

```javascript
// vite.config.js
export default defineConfig({
  // ... other config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          game: [
            './src/core/game.ts',
            './src/core/engine/loop.ts'
          ],
          planet: [
            './src/planet/planetCore.ts',
            './src/planet/terrain.ts'
          ],
          ui: ['./src/ui/']
        }
      }
    }
  }
});
```

### 2. Asset Optimization

Add image optimization for textures and models:

```bash
npm install --save-dev vite-plugin-imagemin
```

Configure in vite.config.js:

```javascript
import imagemin from 'vite-plugin-imagemin';

export default defineConfig({
  // ... other config
  plugins: [
    imagemin({
      gifsicle: { optimizationLevel: 7, interlaced: false },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9], speed: 4 },
      webp: { quality: 80 }
    })
  ]
});
```

### 3. Environment-Based Builds

Create environment-specific builds:

```javascript
// vite.config.js
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    // ... other config
    define: {
      __DEV__: isDev,
      __VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    build: {
      minify: !isDev,
      sourcemap: isDev,
      // ... other build options
    }
  };
});
```

## Runtime Performance Optimizations

### 1. Object Pooling

Implement object pooling for frequently created/destroyed objects:

```typescript
// Example object pool for particles
class ParticlePool {
  private available: Particle[] = [];
  private capacity: number;
  
  constructor(capacity: number = 100) {
    this.capacity = capacity;
    this.initialize();
  }
  
  private initialize(): void {
    for (let i = 0; i < this.capacity; i++) {
      this.available.push(new Particle());
    }
  }
  
  get(): Particle | null {
    if (this.available.length > 0) {
      return this.available.pop()!;
    }
    return null; // Pool is empty
  }
  
  release(particle: Particle): void {
    particle.reset();
    this.available.push(particle);
  }
}
```

### 2. Instanced Rendering

Use instanced rendering for similar objects:

```typescript
function createInstancedMeshes(geometry: THREE.BufferGeometry, material: THREE.Material, count: number): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return mesh;
}
```

### 3. Level of Detail (LOD)

Implement LOD for complex objects:

```typescript
function createLODObject(highDetailGeo: THREE.BufferGeometry, mediumDetailGeo: THREE.BufferGeometry, lowDetailGeo: THREE.BufferGeometry, material: THREE.Material): THREE.LOD {
  const lod = new THREE.LOD();
  
  lod.addLevel(new THREE.Mesh(highDetailGeo, material), 0);    // Highest detail
  lod.addLevel(new THREE.Mesh(mediumDetailGeo, material), 50); // Medium detail at distance 50
  lod.addLevel(new THREE.Mesh(lowDetailGeo, material), 100);   // Low detail at distance 100
  
  return lod;
}
```

## Asset Loading Optimization

### 1. Progressive Loading

Implement progressive loading for assets:

```typescript
function loadAssetsProgressively(assetList: string[], onProgress: (progress: number) => void, onComplete: () => void): void {
  const loader = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loader);
  
  let loaded = 0;
  const total = assetList.length;
  
  loader.onProgress = (url, itemsLoaded, itemsTotal) => {
    loaded++;
    onProgress(loaded / total);
  };
  
  loader.onLoad = () => {
    onComplete();
  };
  
  // Start loading
  assetList.forEach(url => textureLoader.load(url));
}
```

### 2. Texture Atlases

Use texture atlases to reduce draw calls:

```typescript
function createTextureAtlas(textures: THREE.Texture[], rows: number, cols: number): THREE.Texture {
  // Implementation depends on how you create/combine textures
  // This would typically involve creating a canvas, drawing all textures,
  // and then creating a new THREE.Texture from that canvas
}
```

## Memory Management

### 1. Proper Disposal

Ensure proper disposal of Three.js objects:

```typescript
function disposeMesh(mesh: THREE.Mesh): void {
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }
  
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(material => material.dispose());
    } else {
      mesh.material.dispose();
    }
  }
}
```

### 2. Scene Management

Implement scene partitioning for large worlds:

```typescript
class ScenePartition {
  private chunks: Map<string, THREE.Group> = new Map();
  private activeChunks: Set<string> = new Set();
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  getChunkId(x: number, z: number): string {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);
    return `${chunkX},${chunkZ}`;
  }
  
  loadChunk(id: string): void {
    if (this.chunks.has(id) && !this.activeChunks.has(id)) {
      const chunk = this.chunks.get(id)!;
      this.scene.add(chunk);
      this.activeChunks.add(id);
    }
  }
  
  unloadChunk(id: string): void {
    if (this.activeChunks.has(id)) {
      const chunk = this.chunks.get(id)!;
      this.scene.remove(chunk);
      this.activeChunks.delete(id);
    }
  }
}
```

## Monitoring and Profiling

### 1. Performance Monitoring

Add performance monitoring tools:

```typescript
class PerformanceMonitor {
  private frameRates: number[] = [];
  private maxSamples: number;
  private lastTime: number = 0;
  
  constructor(maxSamples: number = 60) {
    this.maxSamples = maxSamples;
  }
  
  update(time: number): void {
    if (this.lastTime === 0) {
      this.lastTime = time;
      return;
    }
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    
    const fps = 1000 / deltaTime;
    this.frameRates.push(fps);
    
    if (this.frameRates.length > this.maxSamples) {
      this.frameRates.shift();
    }
  }
  
  getAverageFPS(): number {
    const sum = this.frameRates.reduce((a, b) => a + b, 0);
    return sum / this.frameRates.length;
  }
}
```

Implementation of these optimizations should be prioritized based on performance bottlenecks identified through profiling. 
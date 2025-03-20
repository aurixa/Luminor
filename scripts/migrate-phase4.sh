#!/bin/bash
# Convert Phase 4: Rendering Components

# Navigate to project root
cd "$(dirname "$0")/.."

echo "=== Converting Phase 4: Rendering Components ==="
echo ""

# Converting files
node scripts/convert-to-ts.js \
    src/rendering/camera.js \
    src/rendering/lighting.js \
    src/rendering/renderer.js \
    src/rendering/starfield.js \
    src/rendering/terrainMaterial.js

echo ""
echo "=== Conversion complete ==="
echo "Now check for TypeScript errors with: npm run typecheck" 
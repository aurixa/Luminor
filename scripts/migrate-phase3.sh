#!/bin/bash
# Convert Phase 3: Planet Components

# Navigate to project root
cd "$(dirname "$0")/.."

echo "=== Converting Phase 3: Planet Components ==="
echo ""

# Converting files
node scripts/convert-to-ts.js \
    src/planet/planetCore.js \
    src/planet/terrainGeneration.js \
    src/planet/textureGeneration.js \
    src/planet/craterGeneration.js

echo ""
echo "=== Conversion complete ==="
echo "Now check for TypeScript errors with: npm run typecheck" 
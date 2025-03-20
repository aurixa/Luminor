#!/bin/bash
# Convert Phase 2: Player Components

# Navigate to project root
cd "$(dirname "$0")/.."

echo "=== Converting Phase 2: Player Components ==="
echo ""

# Converting files
node scripts/convert-to-ts.js \
    src/player/playerCore.js \
    src/player/segments.js \
    src/player/playerEffects.js

echo ""
echo "=== Conversion complete ==="
echo "Now check for TypeScript errors with: npm run typecheck" 
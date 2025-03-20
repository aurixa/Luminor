#!/bin/bash
# Convert Phase 1: Core Game Logic

# Navigate to project root
cd "$(dirname "$0")/.."

echo "=== Converting Phase 1: Core Game Logic ==="
echo ""

# Converting files
node scripts/convert-to-ts.js src/main.js src/resources.js src/player.js

echo ""
echo "=== Conversion complete ==="
echo "Now check for TypeScript errors with: npm run typecheck" 
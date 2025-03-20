#!/bin/bash
# Convert Phase 5: Utilities

# Navigate to project root
cd "$(dirname "$0")/.."

echo "=== Converting Phase 5: Utilities ==="
echo ""

# Converting files
node scripts/convert-to-ts.js \
    src/utils/materials.js

echo ""
echo "=== Conversion complete ==="
echo "Now check for TypeScript errors with: npm run typecheck" 
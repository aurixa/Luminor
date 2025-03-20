# TypeScript Conversion Plan

This document outlines the prioritized plan for converting the remaining JavaScript files to TypeScript.

## Conversion Priority

### Phase 1: Core Game Logic
- [ ] `src/main.js` → `src/main.ts`
- [ ] `src/resources.js` → `src/resources.ts`
- [ ] `src/player.js` → `src/player.ts`

### Phase 2: Player Components
- [ ] `src/player/playerCore.js` → `src/player/playerCore.ts`
- [ ] `src/player/segments.js` → `src/player/segments.ts`
- [ ] `src/player/playerEffects.js` → `src/player/playerEffects.ts`

### Phase 3: Planet Components
- [ ] `src/planet/planetCore.js` → `src/planet/planetCore.ts`
- [ ] `src/planet/terrainGeneration.js` → `src/planet/terrainGeneration.ts`
- [ ] `src/planet/textureGeneration.js` → `src/planet/textureGeneration.ts`
- [ ] `src/planet/craterGeneration.js` → `src/planet/craterGeneration.ts`

### Phase 4: Rendering Components
- [ ] `src/rendering/camera.js` → `src/rendering/camera.ts`
- [ ] `src/rendering/lighting.js` → `src/rendering/lighting.ts`
- [ ] `src/rendering/renderer.js` → `src/rendering/renderer.ts`
- [ ] `src/rendering/starfield.js` → `src/rendering/starfield.ts`
- [ ] `src/rendering/terrainMaterial.js` → `src/rendering/terrainMaterial.ts`

### Phase 5: Utilities
- [ ] `src/utils/materials.js` → `src/utils/materials.ts`

## Conversion Approach

For each file, follow these steps:

1. **Create TypeScript Version**:
   ```bash
   npm run convert-to-ts:file src/path/to/file.js
   ```

2. **Update Imports**:
   - Remove `.js` extensions from imports
   - Update relative paths if needed

3. **Add Type Definitions**:
   - Add proper parameter and return types
   - Update any type definitions in `src/types.d.ts` if needed
   - Use `any` types temporarily where needed

4. **Add Null Checks**:
   - Add appropriate null checks
   - Use optional chaining where needed
   - Add default values for optional parameters

5. **Fix Type Errors**:
   ```bash
   npm run typecheck
   ```

6. **Run ESLint**:
   ```bash
   npm run lint:fix
   ```

7. **Test Changes**:
   ```bash
   npm run start
   ```

## Conversion NPM Scripts

```bash
# List all JavaScript files to convert
npm run convert-to-ts:list

# Convert a specific file
npm run convert-to-ts:file src/path/to/file.js

# Convert all files at once (not recommended)
npm run convert-to-ts

# Convert multiple files at once
node scripts/convert-to-ts.js src/file1.js src/file2.js src/file3.js

# Validate TypeScript types
npm run typecheck
```

## Additional Considerations

1. **Component Interfaces**:
   - Create proper interfaces for each major component
   - Define types for functions and event handlers
   - Consider using generics for reusable components

2. **Module Organization**:
   - Following the structure outlined in CODE_ORGANIZATION.md
   - Put interfaces in appropriate files or centralize in types.d.ts
   - Use module-level types for component-specific interfaces

3. **Incremental Testing**:
   - Test each module after conversion
   - Fix any runtime errors immediately
   - Ensure gameplay functionality is maintained

After completing all conversions, the entire codebase should pass TypeScript validation and maintain the same functionality. 
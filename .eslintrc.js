/**
 * Luminor
 * ESLint configuration
 * Code written by a mixture of AI (2025)
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    indent: ['error', 2],
    '@typescript-eslint/indent': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  },
  overrides: [
    {
      files: [
        'src/core/gameLoop.ts',
        'src/core/game.ts',
        'src/core/resources.ts',
        'src/player/playerCore.ts',
        'src/player/segments.ts',
        'src/ui/interface.ts',
        'src/planet/craterGeneration.ts',
        'src/planet/textureGeneration.ts',
        'src/index.ts'
      ],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};

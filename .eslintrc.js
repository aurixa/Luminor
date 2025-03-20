/**
 * Luminor
 * ESLint configuration
 * Code written by a mixture of AI (2025)
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:promise/recommended',
    'prettier' // This should be last to override other style rules
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'import', 'promise'],
  rules: {
    // Error prevention
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'warn',

    // Code style
    'indent': ['error', 2],
    '@typescript-eslint/indent': 'off', // Let the base indent rule handle it
    'semi': 'off',
    'quotes': 'off',
    'comma-dangle': 'off',
    'arrow-parens': ['error', 'as-needed'],

    // Best practices
    'complexity': ['warn', 15],
    'max-depth': ['warn', 4],
    'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  },
  overrides: [
    // Files that are allowed to use console.log
    {
      files: [
        'src/core/gameLoop.ts',
        'src/core/game.ts',
        'src/core/resources.ts',
        'src/player/playerCore.ts',
        'src/player/segments.ts',
        'src/ui/interface.ts',
        'src/planet/craterGeneration.ts',
        'src/planet/textureGeneration.ts'
      ],
      rules: {
        'no-console': 'off'
      }
    }
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      },
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
      }
    }
  }
};

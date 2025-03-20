const globals = require('globals');
const typescriptParser = require('@typescript-eslint/parser');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    }
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin
    },
    rules: {
      // Error prevention
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'warn',

      // Code style
      indent: ['error', 2],
      '@typescript-eslint/indent': 'off', // Let the base indent rule handle it
      semi: 'off',
      quotes: 'off',
      'comma-dangle': 'off',
      'arrow-parens': ['error', 'as-needed'],

      // Best practices
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },
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
];

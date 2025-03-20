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
    'plugin:import/recommended',
    'plugin:promise/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: [
    'import',
    'promise'
  ],
  rules: {
    // Error prevention
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'warn',
    
    // Code style
    'semi': ['error', 'always'],
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'indent': ['warn', 2],
    'comma-dangle': ['warn', 'never'],
    'arrow-parens': ['warn', 'as-needed'],
    
    // Best practices
    'complexity': ['warn', 15],
    'max-depth': ['warn', 4],
    'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    
    // Import rules
    'import/order': ['warn', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always'
    }]
  },
  overrides: [
    // Files that are known to have console logs for debugging
    {
      files: ['src/core/gameLoop.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ],
  settings: {
    'import/resolver': {
      'node': {
        'extensions': ['.js']
      }
    }
  }
}; 
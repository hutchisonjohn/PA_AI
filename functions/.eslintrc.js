/**
 * ESLint Configuration for Firebase Functions
 */

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'google',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'require-jsdoc': 'off',
    'max-len': ['warn', { code: 120 }],
    'object-curly-spacing': ['error', 'always'],
    'indent': ['error', 2],
  },
};


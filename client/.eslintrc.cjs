module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    ecmaVersion: 2020,
    extraFileExtensions: ['.svelte']
  },
  settings: {
    'import/core-modules': ['svelte'],
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  rules: {
    'import/no-mutable-exports': 0,
    'no-labels': 0,
    'no-restricted-syntax': 0,
    'svelte/valid-compile': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn'
  },
  plugins: ['prettier', '@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:promise/recommended',
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:svelte/recommended'
  ],
  overrides: [
    {
      files: ['**/*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: { parser: '@typescript-eslint/parser' }
    },
  ],
};

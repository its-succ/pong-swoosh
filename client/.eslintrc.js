module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
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
    },
    plugins: ['prettier', '@typescript-eslint', 'svelte3'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:eslint-comments/recommended',
        'plugin:promise/recommended',
        'prettier',
        'prettier/@typescript-eslint',
    ],
    overrides: [
        {
            files: ['**/*.svelte'],
            processor: 'svelte3/svelte3',
        },
    ],
};

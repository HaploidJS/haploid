'use strict';

module.exports = {
    root: true,
    env: {
        browser: true,
    },
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['prettier', '@typescript-eslint'],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-undef': 'off',
        eqeqeq: 'error',
        'max-params': ['warn', 4],
        'no-nested-ternary': 'off',
        'no-unused-expressions': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-empty-interface': [
            'error',
            {
                allowSingleExtends: false,
            },
        ],
        '@typescript-eslint/ban-ts-comment': [
            'error',
            { 'ts-ignore': 'allow-with-description', 'ts-nocheck': 'allow-with-description' },
        ],
        '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true, fixToUnknown: true }],
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        'no-undefined': 'off',
        'no-redeclare': 'error',
        'no-template-curly-in-string': 'error',
        'prefer-template': 'error',
        'no-useless-concat': 'error',
        'prettier/prettier': ['warn', require('./.prettierrc.js')],
        'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
        '@typescript-eslint/explicit-member-accessibility': [
            'error',
            {
                accessibility: 'explicit',
                overrides: {
                    accessors: 'off',
                    constructors: 'no-public',
                    methods: 'explicit',
                    properties: 'off',
                    parameterProperties: 'off',
                },
            },
        ],
    },
    overrides: [
        {
            files: ['*.ts'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': ['error'],
            },
        },
    ],
};

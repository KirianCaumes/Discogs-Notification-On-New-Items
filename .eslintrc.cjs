module.exports = {
    env: {
        browser: true,
        es6: true,
        jest: true,
    },
    extends: [
        'airbnb-base',
        'plugin:jsdoc/recommended',
        /**
         * Turns off all rules that are unnecessary or might conflict with Prettier.
         * Check conflict between Eslint and Prettier with: `npx eslint-config-prettier .eslintrc.js`.
         */
        'prettier',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['jsdoc'],
    rules: {
        'jsdoc/require-jsdoc': [
            'warn',
            {
                checkConstructors: false,
                contexts: [
                    'ClassDeclaration',
                    'FunctionDeclaration',
                    'MethodDefinition',
                    { context: 'TSPropertySignature', inlineCommentBlock: true },
                ],
            },
        ],
        'jsdoc/require-description': [
            'warn',
            {
                checkConstructors: false,
                contexts: [
                    'TSPropertySignature',
                    'ClassDeclaration',
                    'ArrowFunctionExpression',
                    'FunctionDeclaration',
                    'FunctionExpression',
                    'MethodDefinition',
                ],
            },
        ],
        'jsdoc/require-param-description': ['warn', { contexts: ['any'] }],
        'jsdoc/require-param': ['warn', { checkDestructuredRoots: false }],
        'jsdoc/no-undefined-types': [
            'warn',
            {
                definedTypes: [
                    'ApiDiscogsArtistsType',
                    'ApiDiscogsArtistsReleasesType',
                    'ApiDiscogsMastersVersionsType',
                    'ApiDiscogsReleasesType',
                ],
            },
        ],
        'import/extensions': ['error', 'always'],
        // 'capitalized-comments': ['warn', 'always'], // Not always usefull as it also fix comment with code
        camelcase: ['error'],
        'no-underscore-dangle': ['error', { allow: ['_id', '_attributes', '__value__', '_text'] }],
        curly: ['warn', 'all'],
        'max-len': ['warn', { code: 160 }],
        'no-extra-boolean-cast': ['error', { enforceForLogicalOperands: true }],
        'no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }], // Must be at the end
    },
}

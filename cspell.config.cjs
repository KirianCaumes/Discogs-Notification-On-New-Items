/**
 * {@link https://cspell.org/configuration/document-settings/} Documentation
 * @type {import('cspell').Settings}
 */
module.exports = {
    version: '0.2',
    language: 'en',
    ignorePaths: [
        '*.d.ts',
        '*.svg',
        '*.env',
        '*.env.*',
        '*.gitignore',
        '**/.husky/**',
        '**/.devcontainer/**',
        '.github/**',
        '.git/**',
        'data/**',
    ],
    ignoreWords: [],
    words: [
        'cspell',
        'devcontainer',
        'camelcase',
        'gitmojis',
        'airbnb',
        'paypal',
        'lintstagedrc',
        'discogs',
        'wantlist',
        'trackinfo',
        'namevariations',
        'catno',
        'tracklist',
        'extraartists',
        'sendgrid',
        'zwnj',
        'Kirian',
        'Caumes',
        'esbenp',
        'versionlens',
    ],
}

/**
 * {@link https://github.com/okonet/lint-staged#configuration} Documentation
 * @type {import('lint-staged').Config}
 */
module.exports = {
    '*.{ts,tsx,js,jsx,mjs}': ['prettier --ignore-unknown --check', 'eslint --max-warnings=0'],
    '*.{html,json,svg,yml,xml}': ['prettier --ignore-unknown --check'],
}

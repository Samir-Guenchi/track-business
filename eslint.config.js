// Root config only lints root files; each workspace has its own eslint.config.js.
export default [{ ignores: ['apps/**', 'services/**', 'packages/**', 'assets/**'] }];

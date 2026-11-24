// Configuración de ESLint (flat config). Los scripts del navegador comparten el ámbito global
// a propósito (sin empaquetador), por lo que se desactiva no-undef entre archivos y se
// conservan las reglas que detectan errores reales.
const globals = require('globals');

module.exports = [
  {
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser } },
    rules: {
      'no-unused-vars': ['warn', { vars: 'local', args: 'none' }],
      'no-redeclare': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['tests/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } },
  },
];

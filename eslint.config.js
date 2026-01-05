// Root-level ESLint config for lint-staged
module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      'package-lock.json',
    ],
  },
];

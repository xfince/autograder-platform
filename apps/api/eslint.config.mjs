import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['**/*.{js,mjs,cjs,ts}'],
  extends: [
    ...tseslint.configs.recommended,
  ],
  languageOptions: {
    globals: globals.node,
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
});

import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  {
    ...reactPlugin.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },
  reactPlugin.configs.flat['jsx-runtime'],
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
      parser: tsParser,
    },

    rules: {
      'no-redeclare': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'react/prop-types': 'off',
      'no-prototype-builtins': 'off',
      'no-useless-catch': 'off',
    },
  },
  {
    ignores: ['node_modules/**/*', 'dist/**/*'],
  },
];

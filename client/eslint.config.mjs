import eslint from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...reactPlugin.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },
  reactPlugin.configs.flat['jsx-runtime'],

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
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
);

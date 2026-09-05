import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended],
    rules: {
      // Parsing/creating plists is inherently dynamic (arbitrary nested
      // dicts/arrays of unknown shape); `any` is the honest type here, not a
      // shortcut.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'array-callback-return': 'error',
      'eqeqeq': ['error', 'smart'],
      'no-caller': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-implied-eval': 'error',
      'no-lonely-if': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-proto': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-promise-reject-errors': 'error',
      'radix': 'error',
    },
  },
  {
    files: ['test/**'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);

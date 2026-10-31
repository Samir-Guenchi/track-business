// Shared ESLint rules. The size and complexity limits encode AGENTS.md.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export const sizeRules = {
  'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
  'max-params': ['error', 3],
  'max-depth': ['error', 3],
  complexity: ['error', 10],
};

export const typeRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/ban-ts-comment': 'error',
  '@typescript-eslint/consistent-type-imports': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'no-console': 'error',
};

export default tseslint.config(
  { ignores: ['dist/**', '.next/**', 'coverage/**', '*.config.*'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: { ...sizeRules, ...typeRules },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx'],
    rules: { 'max-lines-per-function': 'off' },
  },
);

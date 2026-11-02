import base from '@trackecom/config/eslint';

export default [
  { ignores: ['src/generated/**'] },
  ...base,
  {
    // Nest DI reads constructor types at runtime, so injected classes must be value imports.
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
];

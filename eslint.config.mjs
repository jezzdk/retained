import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['**/dist/**', '**/.wrangler/**', '**/node_modules/**'],
  },

  // Base JS + TS rules for everything
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React Hooks rules — SPA only
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // Project-wide rule overrides
  {
    rules: {
      // Unused vars are fine when prefixed with _
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // `any` is sometimes unavoidable in Worker/D1 generics
      '@typescript-eslint/no-explicit-any': 'warn',
      // Prefer const — catches accidental let where const would do
      'prefer-const': 'error',
    },
  },

  // Disable all rules that Prettier owns
  prettier
);

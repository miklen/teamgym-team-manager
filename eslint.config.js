import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', 'tmp/**', 'playwright-report/**', 'test-results/**', '.agents/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly', URL: 'readonly' } },
  },
  {
    files: ['packages/domain/**/*.ts', 'packages/rules/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: ['node:*', 'react', 'react-dom', '@teamgym/drive', '**/apps/**', '**/drive/**'],
      }],
    },
  },
);

import { defineConfig } from 'vitest/config';

// Separate audit: defects remain visible as failures, outside the normal suite.
export default defineConfig({
  test: { environment: 'node', include: ['tests/review/reglement-2026-10-30.test.ts'], restoreMocks: true },
});

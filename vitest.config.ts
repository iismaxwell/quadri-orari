import { defineConfig } from 'vitest/config';

// Test unitari: tests/**/*.test.ts. I test end-to-end (Playwright) usano il suffisso .spec.ts.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});

import { defineConfig } from 'vitest/config';

// Standalone test config so vitest does NOT load the CRXJS vite.config plugin
// (which is only needed to build the extension, not to unit-test pure logic).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});

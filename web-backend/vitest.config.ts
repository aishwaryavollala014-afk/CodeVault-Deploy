import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://dummy:5432/dummy',
      JWT_SECRET: 'dummy_secret_for_testing_purposes_123456789',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});

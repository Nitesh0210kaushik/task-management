import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 30000,
    include: ['tests/**/*.test.ts'],
    maxWorkers: 1,
    minWorkers: 1,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000
  }
});

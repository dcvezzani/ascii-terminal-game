import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // globalSetup: './test/setup.js',
    // globalTeardown: './test/teardown.js',
    // Run in non-interactive mode
    watch: false,
    // Ensure tests don't hang
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 15000, // Increased for server shutdown
    // Prevent hanging by allowing process to exit
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});

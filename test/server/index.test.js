import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { startServer, stopServer, getServer } from '../../src/server/index.js';
import { serverConfig } from '../../src/config/serverConfig.js';

describe('Server Entry Point', () => {
  beforeEach(async () => {
    // Ensure server is stopped before each test
    try {
      await stopServer();
    } catch (error) {
      // Ignore errors if server wasn't running
    }
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await stopServer();
    } catch (error) {
      // Ignore errors
    }
  });

  test('should start server successfully', async () => {
    await startServer();
    const server = getServer();
    expect(server).toBeDefined();
    expect(server).not.toBeNull();
  });

  test('should throw error if server is already running', async () => {
    await startServer();
    await expect(startServer()).rejects.toThrow('Server is already running');
  });

  test('should stop server successfully', async () => {
    await startServer();
    await stopServer();
    const server = getServer();
    expect(server).toBeNull();
  });

  test('should return null server if not started', () => {
    const server = getServer();
    expect(server).toBeNull();
  });

  test('should stop server even if not started', async () => {
    // Should not throw error
    await expect(stopServer()).resolves.toBeUndefined();
  });
});

/**
 * Test helper for managing WebSocket server lifecycle
 * Ensures only one server instance runs across all tests
 */

import { startServer, stopServer, getServer } from '../../src/server/index.js';

let serverStartPromise = null;

/**
 * Start the server if not already running
 * Safe to call multiple times - will reuse existing server
 */
export async function ensureServerRunning() {
  // Check if server is already running
  const existingServer = getServer();
  if (existingServer) {
    return Promise.resolve();
  }

  // If a start is already in progress, wait for it
  if (serverStartPromise) {
    try {
      await serverStartPromise;
      // After waiting, check again - server might be running now
      const serverAfterWait = getServer();
      if (serverAfterWait) {
        return Promise.resolve();
      }
    } catch (error) {
      // If the previous start failed with "already running", that's fine
      if (error.message && error.message.includes('already running')) {
        return Promise.resolve();
      }
      // Otherwise, try to start again
    }
  }

  // Start the server
  serverStartPromise = (async () => {
    try {
      await startServer();
    } catch (error) {
      // If server is already running (from another test), that's okay
      if (error.message && error.message.includes('already running')) {
        // Server is already running, which is fine
        return;
      }
      // If port is in use, check if server is actually running
      if (error.code === 'EADDRINUSE') {
        // Wait a bit and check if server is running
        await new Promise(resolve => setTimeout(resolve, 100));
        const server = getServer();
        if (server) {
          // Server is running, that's fine
          return;
        }
        // Port is in use but server not found - might be from another process
        throw error;
      }
      // Re-throw other errors
      throw error;
    } finally {
      // Clear the promise after completion
      serverStartPromise = null;
    }
  })();

  return serverStartPromise;
}

/**
 * Stop the server
 * Safe to call multiple times
 */
export async function ensureServerStopped() {
  const existingServer = getServer();
  if (!existingServer) {
    return Promise.resolve();
  }

  try {
    await stopServer();
    // Small delay to ensure port is released
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    // Ignore errors during cleanup
    console.error('Error stopping server:', error);
  }
}

/**
 * Reset server state (useful for test cleanup)
 */
export function resetServerState() {
  serverStartPromise = null;
}

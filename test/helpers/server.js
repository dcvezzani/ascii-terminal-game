/**
 * Test helper utilities for server tests
 */

import { stopServer, getServer } from '../../src/server/index.js';

/**
 * Ensure server is stopped, with retries
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in milliseconds
 */
export async function ensureServerStopped(maxRetries = 10, delay = 300) {
  for (let i = 0; i < maxRetries; i++) {
    const server = getServer();
    if (!server) {
      // Server is stopped, wait a bit to ensure port is released
      await new Promise(resolve => setTimeout(resolve, delay));
      return;
    }

    try {
      await stopServer();
      // Wait longer after stopping to ensure port is released
      await new Promise(resolve => setTimeout(resolve, delay * 2));
    } catch (error) {
      // Ignore errors, try again
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Final check
  const server = getServer();
  if (server) {
    // Force close if still running
    try {
      await stopServer();
      await new Promise(resolve => setTimeout(resolve, delay * 2));
    } catch (error) {
      // Ignore
    }
  }
}

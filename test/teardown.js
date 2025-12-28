/**
 * Global test teardown - stops the WebSocket server after all tests
 */

import { stopServer } from '../src/server/index.js';

export default async function teardown() {
  console.log('Stopping WebSocket server after tests...');
  try {
    await stopServer();
    // Small delay to ensure all cleanup completes
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('WebSocket server stopped successfully');
  } catch (error) {
    console.error('Error stopping WebSocket server:', error);
    // Don't throw - we want tests to complete even if cleanup fails
  }
}

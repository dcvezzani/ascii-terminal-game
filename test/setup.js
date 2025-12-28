/**
 * Global test setup - starts the WebSocket server before all tests
 */

import { startServer } from '../src/server/index.js';

export default async function setup() {
  console.log('Starting WebSocket server for tests...');
  try {
    await startServer();
    console.log('WebSocket server started successfully');
  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
    throw error;
  }
}

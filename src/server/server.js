/**
 * Standalone WebSocket game server entry point
 * Run this file to start the WebSocket server for multiplayer games
 */

import { startServer, stopServer } from './index.js';

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown() {
  const shutdown = async signal => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    try {
      await stopServer();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Main function to start the server
 */
async function main() {
  try {
    setupGracefulShutdown();
    await startServer();
    console.log('WebSocket game server is running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
    process.exit(1);
  }
}

// Start the server
main();

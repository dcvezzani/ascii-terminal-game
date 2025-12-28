/**
 * WebSocket server entry point
 * Handles server startup, shutdown, and connection management
 */

import { WebSocketServer } from 'ws';
import { serverConfig } from '../config/serverConfig.js';

let wss = null;

/**
 * Start the WebSocket server
 * @returns {Promise<void>}
 */
export async function startServer() {
  if (wss) {
    throw new Error('Server is already running');
  }

  return new Promise((resolve, reject) => {
    try {
      wss = new WebSocketServer({
        port: serverConfig.websocket.port,
        host: serverConfig.websocket.host,
      });

      wss.on('listening', () => {
        console.log(
          `WebSocket server listening on ${serverConfig.websocket.host}:${serverConfig.websocket.port}`
        );
        resolve();
      });

      wss.on('error', error => {
        console.error('WebSocket server error:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
      reject(error);
    }
  });
}

/**
 * Stop the WebSocket server
 * @returns {Promise<void>}
 */
export async function stopServer() {
  if (!wss) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    wss.close(error => {
      if (error) {
        console.error('Error closing WebSocket server:', error);
        reject(error);
      } else {
        console.log('WebSocket server stopped');
        wss = null;
        resolve();
      }
    });
  });
}

/**
 * Get the WebSocket server instance
 * @returns {WebSocketServer | null}
 */
export function getServer() {
  return wss;
}

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

// Setup graceful shutdown handlers
setupGracefulShutdown();

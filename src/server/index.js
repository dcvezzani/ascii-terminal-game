import serverConfig from '../../config/serverConfig.js';
import logger from '../utils/logger.js';
import Server from './server.js';

// Set logger level from config
logger.level = serverConfig.logging.level;

/**
 * Start the WebSocket server
 * @param {number} [port] - Optional port override
 */
async function startServer(port) {
  const serverPort = port || serverConfig.websocket.port;
  const server = new Server(serverPort);

  // Set up graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down server...');
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await server.start();
    logger.info(`Server started on port ${serverPort}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { startServer };
export default startServer;

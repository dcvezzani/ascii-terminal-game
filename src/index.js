import clientConfig from '../config/clientConfig.js';
import logger from './utils/logger.js';

// Set logger level from config
logger.level = clientConfig.logging.level;

/**
 * Start the client
 */
async function startClient() {
  // Set up graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down client...');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    // TODO: Import and initialize networked mode in Phase 5
    logger.info('Client entry point - networked mode coming in Phase 5');
    logger.info(`Will connect to: ${clientConfig.websocket.url}`);
  } catch (error) {
    logger.error('Failed to start client:', error);
    process.exit(1);
  }
}

// Start client if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startClient();
}

export { startClient };
export default startClient;

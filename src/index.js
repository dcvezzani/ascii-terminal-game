import clientConfig from '../config/clientConfig.js';
import { configureLogger } from './utils/logger.js';
import logger from './utils/logger.js';
import networkedMode from './modes/networkedMode.js';

// Configure logger for client mode (files only, no console)
configureLogger('client');

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
    await networkedMode();
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

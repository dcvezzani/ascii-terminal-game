import clientConfig from '../config/clientConfig.js';
import { configureLogger } from './utils/logger.js';
import logger from './utils/logger.js';
import networkedMode from './modes/networkedMode.js';

// Configure logger for client mode (files only, no console)
configureLogger('client');

/**
 * Start the client. When config is provided (e.g. from CLI with cwd config), use it; otherwise use repo config.
 * @param {object} [config] - Optional config (when provided, used instead of repo clientConfig)
 */
async function startClient(config) {
  const cfg = config ?? clientConfig;
  logger.level = cfg.logging.level;

  // Set up graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down client...');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await networkedMode(cfg);
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

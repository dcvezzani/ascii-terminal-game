import clientConfig from '../config/clientConfig.js';
import logger from './utils/logger.js';

// Set logger level from config
logger.level = clientConfig.logging.level;

// TODO: Import and start client when implemented
logger.info('Client entry point - implementation coming in Phase 3');

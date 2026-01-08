import serverConfig from '../../config/serverConfig.js';
import logger from '../utils/logger.js';

// Set logger level from config
logger.level = serverConfig.logging.level;

// TODO: Import and start server when implemented
logger.info('Server entry point - implementation coming in Phase 2');

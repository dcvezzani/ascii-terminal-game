/**
 * Configurable logging utility for the WebSocket server
 * Uses winston to support multiple transports (console, file, or both)
 */

import { createLogger } from './createLogger.js';
import { serverConfig } from '../config/serverConfig.js';

/**
 * Server logger instance created from server configuration
 * Maintains the same API as the previous custom implementation
 */
export const logger = createLogger(serverConfig.logging);

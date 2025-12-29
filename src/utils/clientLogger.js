/**
 * Configurable logging utility for the game client
 * Uses winston to support multiple transports (console, file, or both)
 */

import { createLogger } from './createLogger.js';
import { clientConfig } from '../config/clientConfig.js';

/**
 * Client logger instance created from client configuration
 */
export const clientLogger = createLogger(clientConfig.logging);


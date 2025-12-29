/**
 * Configurable logging utility for the WebSocket server
 * Supports multiple log levels and filtering based on configuration
 */

import { serverConfig } from '../config/serverConfig.js';

/**
 * Log levels in order of severity (higher number = more severe)
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Get the current log level from configuration
 */
function getCurrentLogLevel() {
  const configuredLevel = serverConfig.logging?.level || 'info';
  return LOG_LEVELS[configuredLevel.toLowerCase()] ?? LOG_LEVELS.info;
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase().padEnd(5);
  return `[${timestamp}] ${levelUpper} ${message}`;
}

/**
 * Check if a log level should be output
 */
function shouldLog(level) {
  const currentLevel = getCurrentLogLevel();
  const messageLevel = LOG_LEVELS[level.toLowerCase()] ?? LOG_LEVELS.info;
  return messageLevel >= currentLevel;
}

/**
 * Logger object with methods for different log levels
 */
export const logger = {
  /**
   * Log debug messages (all events, messages, state changes)
   */
  debug(message, ...args) {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, ...args));
    }
  },

  /**
   * Log info messages (connections, disconnections, important events)
   */
  info(message, ...args) {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, ...args));
    }
  },

  /**
   * Log warning messages (warnings, non-critical errors)
   */
  warn(message, ...args) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, ...args));
    }
  },

  /**
   * Log error messages (errors only)
   */
  error(message, ...args) {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, ...args));
    }
  },
};

/**
 * Shared logger factory function
 * Creates a winston logger instance with configurable transports
 * Used by both client and server loggers
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

/**
 * Parse file size string (e.g., '20m', '1g') to bytes
 */
function parseFileSize(sizeStr) {
  const units = {
    b: 1,
    k: 1024,
    m: 1024 * 1024,
    g: 1024 * 1024 * 1024,
  };

  const match = sizeStr.toLowerCase().match(/^(\d+)([bkmg])?$/);
  if (!match) {
    return 20 * 1024 * 1024; // Default to 20MB
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] || 'b';
  return value * (units[unit] || 1);
}

/**
 * Create winston transports based on configuration
 */
function createTransports(loggingConfig) {
  const transports = [];

  // Determine which transports to use
  const transportTypes = Array.isArray(loggingConfig.transports)
    ? loggingConfig.transports
    : [loggingConfig.transports || 'console'];

  // Console transport
  if (transportTypes.includes('console')) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [${level}]: ${message} ${metaStr}`;
          })
        ),
      })
    );
  }

  // File transport
  if (transportTypes.includes('file') && loggingConfig.file?.enabled) {
    // Resolve log file path relative to project root
    const logPath = path.isAbsolute(loggingConfig.file.path)
      ? loggingConfig.file.path
      : path.resolve(process.cwd(), loggingConfig.file.path);

    // Ensure log directory exists
    const logDir = path.dirname(logPath);
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (error) {
      // If directory creation fails, log to console and continue
      console.error('Failed to create log directory:', error.message);
    }

    transports.push(
      new winston.transports.File({
        filename: logPath,
        maxsize: parseFileSize(loggingConfig.file.maxSize || '20m'),
        maxFiles: loggingConfig.file.maxFiles || 5,
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.json()
        ),
      })
    );
  }

  return transports;
}

/**
 * Create a winston logger instance with the provided logging configuration
 * @param {Object} loggingConfig - Logging configuration object
 * @param {string} loggingConfig.level - Log level ('debug', 'info', 'warn', 'error')
 * @param {string|string[]} loggingConfig.transports - Transport types ('console', 'file', or ['console', 'file'])
 * @param {Object} loggingConfig.file - File transport configuration
 * @param {boolean} loggingConfig.file.enabled - Whether file logging is enabled
 * @param {string} loggingConfig.file.path - Log file path
 * @param {string} loggingConfig.file.maxSize - Maximum log file size (e.g., '20m')
 * @param {number} loggingConfig.file.maxFiles - Maximum number of rotated log files
 * @returns {Object} Logger object with debug, info, warn, error methods
 */
export function createLogger(loggingConfig) {
  const winstonLogger = winston.createLogger({
    level: loggingConfig.level || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    transports: createTransports(loggingConfig),
    // Don't exit on handled exceptions
    exitOnError: false,
  });

  /**
   * Logger object with methods for different log levels
   */
  return {
    /**
     * Log debug messages (detailed information for debugging)
     */
    debug(message, ...args) {
      winstonLogger.debug(message, ...args);
    },

    /**
     * Log info messages (general information)
     */
    info(message, ...args) {
      winstonLogger.info(message, ...args);
    },

    /**
     * Log warning messages (warnings, non-critical issues)
     */
    warn(message, ...args) {
      winstonLogger.warn(message, ...args);
    },

    /**
     * Log error messages (errors only)
     */
    error(message, ...args) {
      winstonLogger.error(message, ...args);
    },
  };
}

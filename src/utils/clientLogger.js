/**
 * Configurable logging utility for the game client
 * Uses winston to support multiple transports (console, file, or both)
 */

import winston from 'winston';
import { clientConfig } from '../config/clientConfig.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create winston transports based on configuration
 */
function createTransports() {
  const transports = [];
  const config = clientConfig.logging;

  // Determine which transports to use
  const transportTypes = Array.isArray(config.transports)
    ? config.transports
    : [config.transports || 'console'];

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
  if (transportTypes.includes('file') && config.file?.enabled) {
    // Resolve log file path relative to project root
    const logPath = path.isAbsolute(config.file.path)
      ? config.file.path
      : path.resolve(process.cwd(), config.file.path);

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
        maxsize: parseFileSize(config.file.maxSize || '20m'),
        maxFiles: config.file.maxFiles || 5,
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
 * Create winston logger instance
 */
const logger = winston.createLogger({
  level: clientConfig.logging.level || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: createTransports(),
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Client logger with methods for different log levels
 */
export const clientLogger = {
  /**
   * Log debug messages (detailed information for debugging)
   */
  debug(message, ...args) {
    logger.debug(message, ...args);
  },

  /**
   * Log info messages (general information)
   */
  info(message, ...args) {
    logger.info(message, ...args);
  },

  /**
   * Log warning messages (warnings, non-critical issues)
   */
  warn(message, ...args) {
    logger.warn(message, ...args);
  },

  /**
   * Log error messages (errors only)
   */
  error(message, ...args) {
    logger.error(message, ...args);
  },
};


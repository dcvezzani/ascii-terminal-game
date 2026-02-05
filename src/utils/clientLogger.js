import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');
const logsDir = join(projectRoot, 'logs');
const clientsLogsDir = join(logsDir, 'clients');

// Ensure logs directories exist
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}
if (!existsSync(clientsLogsDir)) {
  mkdirSync(clientsLogsDir, { recursive: true });
}

/**
 * Sanitize a client id for use in a log filename (remove path separators and unsafe chars).
 * @param {string} clientId - Raw client identifier
 * @returns {string} Safe filename segment
 */
function sanitizeClientIdForFilename(clientId) {
  if (typeof clientId !== 'string') {
    return String(clientId).replace(/[/\\]/g, '-');
  }
  return clientId.replace(/[/\\]/g, '-');
}

/**
 * Create transports for a single client logger.
 * @param {string} clientId - Client identifier (used in metadata and for per-client file)
 * @param {{ addConsole?: boolean }} [options] - Optional: addConsole to also log to console
 * @returns {winston.transport[]} Array of transports
 */
function createClientTransports(clientId, options = {}) {
  const safeId = sanitizeClientIdForFilename(clientId);
  const transports = [
    // Shared error log (all client errors in one place)
    new winston.transports.File({
      filename: join(logsDir, 'error.log'),
      level: 'error'
    }),
    // Per-client log file
    new winston.transports.File({
      filename: join(clientsLogsDir, `${safeId}.log`)
    })
  ];

  if (options.addConsole) {
    transports.unshift(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  }

  return transports;
}

/**
 * Shared format for client loggers (same as main logger).
 */
const clientLoggerFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Create a dedicated logger for a single client.
 * Each logger writes to logs/clients/{clientId}.log and to the shared logs/error.log for errors.
 *
 * @param {string} clientId - Unique client identifier (e.g. connection id, socket id)
 * @param {{ level?: string, addConsole?: boolean }} [options] - Optional: level (default 'info'), addConsole to also log to console
 * @returns {winston.Logger} A winston logger instance with defaultMeta { service: 'game', clientId }
 *
 * @example
 * const clientLogger = createClientLogger(connectionId);
 * clientLogger.info('Client connected');
 * clientLogger.error('Invalid message', { type: msg.type });
 */
export function createClientLogger(clientId, options = {}) {
  const level = options.level ?? 'info';
  const transports = createClientTransports(clientId, options);

  return winston.createLogger({
    level,
    format: clientLoggerFormat,
    defaultMeta: { service: 'game', clientId },
    transports
  });
}

export default createClientLogger;

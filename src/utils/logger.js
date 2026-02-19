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
 * Create transports based on mode
 * @param {'server'|'client'} mode - Logger mode
 * @returns {winston.transport[]} Array of transports
 */
function createTransports(mode) {
  const transports = [
    // Write all logs to file
    new winston.transports.File({
      filename: join(logsDir, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: join(logsDir, 'combined.log')
    })
  ];

  // Server mode: also log to console
  if (mode === 'server') {
    transports.unshift(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  }

  // Client mode + REUSE_CLIENT_LOGGER: also write to logs/client/client.log
  if (mode === 'client' && process.env.REUSE_CLIENT_LOGGER === 'true') {
    transports.push(
      new winston.transports.File({
        filename: join(clientsLogsDir, 'client.log')
      })
    );
  }

  return transports;
}

// Create logger instance (defaults to server mode)
// Entry points should call configureLogger() to set the mode before other imports
let logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'game' },
  transports: createTransports('server')
});

/**
 * Configure the logger for a specific mode
 * Must be called early, before other modules import the logger
 * @param {'server'|'client'} mode - Logger mode: 'server' logs to console and files, 'client' logs to files only
 */
export function configureLogger(mode) {
  // Clear existing transports
  logger.clear();
  
  // Add transports for the specified mode
  const transports = createTransports(mode);
  transports.forEach(transport => logger.add(transport));
}

export default logger;

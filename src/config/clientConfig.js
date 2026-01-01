/**
 * Client configuration for the game client
 * Controls client-side behavior, logging, WebSocket settings, and reconnection
 */

export const clientConfig = {
  logging: {
    level: 'debug', // Logging level: 'debug', 'info', 'warn', 'error'
    transports: ['file'], // Transport options: 'console', 'file', or ['console', 'file']
    file: {
      enabled: true, // Enable file logging
      path: './logs/client.log', // Log file path (relative to project root)
      maxSize: '20m', // Maximum log file size before rotation
      maxFiles: 5, // Maximum number of log files to keep
    },
  },
  prediction: {
    enabled: true, // Enable client-side prediction for local player
    reconciliationInterval: 5000, // Reconciliation interval in milliseconds (default: 5 seconds)
  },
  websocket: {
    url: process.env.WEBSOCKET_URL || 'ws://localhost:3000', // Full WebSocket URL (default: 'ws://localhost:3000')
  },
  reconnection: {
    enabled: process.env.WEBSOCKET_RECONNECTION_ENABLED === 'true' || 
             (process.env.WEBSOCKET_RECONNECTION_ENABLED !== 'false' && true), // Enable reconnection support (default: true)
    maxAttempts: parseInt(process.env.WEBSOCKET_RECONNECTION_MAX_ATTEMPTS) || 5, // Maximum reconnection attempts (default: 5)
    retryDelay: parseInt(process.env.WEBSOCKET_RECONNECTION_RETRY_DELAY) || 1000, // Initial retry delay in milliseconds (default: 1000ms)
    exponentialBackoff: process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF === 'true' || 
                        (process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF !== 'false' && true), // Use exponential backoff (default: true)
    maxRetryDelay: parseInt(process.env.WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY) || 30000, // Maximum retry delay when using exponential backoff (default: 30000ms)
  },
};


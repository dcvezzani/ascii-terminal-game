/**
 * Client configuration for the game client
 * Controls client-side behavior, logging, and WebSocket settings
 */

export const clientConfig = {
  logging: {
    level: 'warn', // Logging level: 'debug', 'info', 'warn', 'error'
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
};


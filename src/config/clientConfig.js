/**
 * Client configuration for the game client
 * Controls client-side behavior, logging, and WebSocket settings
 */

export const clientConfig = {
  logging: {
    level: 'info', // Logging level: 'debug', 'info', 'warn', 'error'
    transports: ['console'], // Transport options: 'console', 'file', or ['console', 'file']
    file: {
      enabled: false, // Enable file logging
      path: './logs/client.log', // Log file path (relative to project root)
      maxSize: '20m', // Maximum log file size before rotation
      maxFiles: 5, // Maximum number of log files to keep
    },
  },
};


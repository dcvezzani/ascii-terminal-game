/**
 * Server configuration for WebSocket integration
 * Controls WebSocket server behavior, logging, and reconnection settings
 */

export const serverConfig = {
  websocket: {
    enabled: true, // Enable/disable WebSocket mode
    port: 3000, // WebSocket server port (default: 3000)
    host: '0.0.0.0', // Server host (default: '0.0.0.0' - accessible from network)
    updateInterval: 1000, // State update interval in milliseconds (default: 250ms = 4 updates/second)
  },
  logging: {
    level: 'info', // Logging level: 'debug', 'info', 'warn', 'error'
    transports: ['console'], // Transport options: 'console', 'file', or ['console', 'file']
    file: {
      enabled: false, // Enable file logging
      path: './logs/server.log', // Log file path (relative to project root)
      maxSize: '20m', // Maximum log file size before rotation
      maxFiles: 5, // Maximum number of log files to keep
    },
  },
  reconnection: {
    enabled: true, // Enable reconnection support
    maxAttempts: 5, // Maximum reconnection attempts
    retryDelay: 1000, // Delay between reconnection attempts (milliseconds)
  },
};

import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import ConnectionManager from './ConnectionManager.js';
import MessageHandler from '../network/MessageHandler.js';
import MessageTypes from '../network/MessageTypes.js';
import logger from '../utils/logger.js';

/**
 * WebSocket Server class
 */
export class Server {
  constructor(port) {
    this.port = port;
    this.wss = null;
    this.connectionManager = new ConnectionManager();
  }

  /**
   * Start the WebSocket server
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on('connection', (ws) => {
          this.onConnection(ws);
        });

        this.wss.on('listening', () => {
          logger.info(`WebSocket server listening on port ${this.port}`);
          resolve();
        });

        this.wss.on('error', (error) => {
          logger.error('WebSocket server error:', error);
          reject(error);
        });
      } catch (error) {
        logger.error('Failed to start WebSocket server:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop the server and close all connections
   */
  async stop() {
    return new Promise((resolve) => {
      if (!this.wss) {
        resolve();
        return;
      }

      // Close all connections
      this.wss.clients.forEach((client) => {
        client.close();
      });

      // Close the server
      this.wss.close(() => {
        logger.info('WebSocket server stopped');
        resolve();
      });
    });
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   */
  onConnection(ws) {
    // Generate unique client ID
    const clientId = randomUUID();

    // Add to connection manager
    this.connectionManager.addConnection(clientId, ws);

    // Send CONNECT message with clientId
    const connectMessage = MessageHandler.createMessage(
      MessageTypes.CONNECT,
      { clientId }
    );
    ws.send(JSON.stringify(connectMessage));

    // Set up message handler
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    // Set up disconnect handler
    ws.on('close', () => {
      this.onDisconnect(clientId);
    });

    // Set up error handler
    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      this.onDisconnect(clientId);
    });

    logger.info(`Client connected: ${clientId}`);
  }

  /**
   * Handle incoming message
   * @param {string} clientId - Client identifier
   * @param {Buffer|string} data - Raw message data
   */
  handleMessage(clientId, data) {
    try {
      const message = MessageHandler.parseMessage(data.toString());
      logger.debug(`Message from ${clientId}:`, message.type);
      
      // Update last activity
      const connection = this.connectionManager.getConnection(clientId);
      if (connection) {
        connection.lastActivity = Date.now();
      }

      // Route message to appropriate handler
      // TODO: Implement message routing in Phase 4
    } catch (error) {
      logger.error(`Error handling message from ${clientId}:`, error);
    }
  }

  /**
   * Handle client disconnection
   * @param {string} clientId - Client identifier
   */
  onDisconnect(clientId) {
    logger.info(`Client disconnected: ${clientId}`);
    this.connectionManager.removeConnection(clientId);
  }
}

// Default export
export default Server;

import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import ConnectionManager from './ConnectionManager.js';
import GameServer from './GameServer.js';
import MessageHandler from '../network/MessageHandler.js';
import MessageTypes from '../network/MessageTypes.js';
import logger from '../utils/logger.js';

/**
 * WebSocket Server class
 */
export class Server {
  constructor(port, boardWidth = 20, boardHeight = 20) {
    this.port = port;
    this.wss = null;
    this.connectionManager = new ConnectionManager();
    this.gameServer = new GameServer(boardWidth, boardHeight);
    this.broadcastInterval = null;
    this.broadcastIntervalMs = 250; // 250ms = 4 updates per second
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
          this.startBroadcasting();
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
      // Stop broadcasting
      this.stopBroadcasting();

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
   * Start periodic state broadcasting
   */
  startBroadcasting() {
    if (this.broadcastInterval) {
      return; // Already broadcasting
    }

    this.broadcastInterval = setInterval(() => {
      this.broadcastState();
    }, this.broadcastIntervalMs);

    logger.debug('Started periodic state broadcasting');
  }

  /**
   * Stop periodic state broadcasting
   */
  stopBroadcasting() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      logger.debug('Stopped periodic state broadcasting');
    }
  }

  /**
   * Broadcast game state to all connected clients
   */
  broadcastState() {
    const connections = this.connectionManager.getAllConnections();
    if (connections.length === 0) {
      return; // No clients connected
    }

    const gameState = this.gameServer.serializeState();
    const stateUpdate = MessageHandler.createMessage(
      MessageTypes.STATE_UPDATE,
      gameState
    );

    const messageStr = JSON.stringify(stateUpdate);

    connections.forEach(connection => {
      if (connection.ws && connection.ws.readyState === 1) { // OPEN
        try {
          connection.ws.send(messageStr);
        } catch (error) {
          logger.error(`Error broadcasting to ${connection.clientId}:`, error);
        }
      }
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

    // Don't send initial CONNECT message - wait for client to send CONNECT first
    // The client will send CONNECT, and we'll respond with full game state

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
      if (message.type === MessageTypes.CONNECT) {
        this.handleConnect(clientId, message);
      } else if (message.type === MessageTypes.MOVE) {
        // logger.debug(`Received MOVE from ${clientId}:`, message.payload);
        this.handleMove(clientId, message);
      } else {
        logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Error handling message from ${clientId}:`, error);
    }
  }

  /**
   * Handle CONNECT message
   * @param {string} clientId - Client identifier
   * @param {object} message - CONNECT message
   */
  handleConnect(clientId, message) {
    // Generate player ID
    const playerId = randomUUID();
    const playerName = `Player ${playerId.substring(0, 8)}`;

    // Add player to game
    this.gameServer.addPlayer(clientId, playerId, playerName);
    this.gameServer.spawnPlayer(playerId, playerName);

    // Map clientId to playerId
    this.connectionManager.setPlayerId(clientId, playerId);

    // Send CONNECT response with gameState
    const gameState = this.gameServer.serializeState();
    const response = MessageHandler.createMessage(
      MessageTypes.CONNECT,
      {
        clientId,
        playerId,
        playerName,
        gameState
      }
    );

    const connection = this.connectionManager.getConnection(clientId);
    if (connection && connection.ws) {
      connection.ws.send(JSON.stringify(response));
    }

    logger.info(`Player joined: ${playerId} (${playerName})`);
  }

  /**
   * Handle MOVE message
   * @param {string} clientId - Client identifier
   * @param {object} message - MOVE message
   */
  handleMove(clientId, message) {
    const playerId = this.connectionManager.getPlayerId(clientId);
    if (!playerId) {
      logger.warn(`Cannot move: client ${clientId} has no playerId`);
      return;
    }

    const { dx, dy } = message.payload;

    // Validate dx, dy are numbers and in range
    if (typeof dx !== 'number' || typeof dy !== 'number') {
      logger.warn(`Invalid move: dx or dy is not a number`);
      return;
    }

    if (dx < -1 || dx > 1 || dy < -1 || dy > 1) {
      logger.warn(`Invalid move: dx or dy out of range`);
      return;
    }

    // Attempt move
    this.gameServer.movePlayer(playerId, dx, dy);
    // State will be broadcast in next periodic update
  }

  /**
   * Handle client disconnection
   * @param {string} clientId - Client identifier
   */
  onDisconnect(clientId) {
    logger.info(`Client disconnected: ${clientId}`);
    
    // Remove player from game
    const playerId = this.connectionManager.getPlayerId(clientId);
    if (playerId) {
      this.gameServer.removePlayer(playerId);
    }
    
    this.connectionManager.removeConnection(clientId);
  }
}

// Default export
export default Server;

import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import ConnectionManager from './ConnectionManager.js';
import GameServer from './GameServer.js';
import Game from '../game/Game.js';
import MessageHandler from '../network/MessageHandler.js';
import MessageTypes from '../network/MessageTypes.js';
import logger from '../utils/logger.js';
import createClientLogger from '../utils/clientLogger.js';

/**
 * WebSocket Server class
 * @param {number} port - Port to listen on
 * @param {Game} [game] - Game instance
 * @param {{ spawnList?: Array<{x: number, y: number}>, spawnConfig?: object }} [options] - Spawn list and config for GameServer
 */
export class Server {
  constructor(port, game, options = {}) {
    this.port = port;
    this.wss = null;
    this.connectionManager = new ConnectionManager();
    this.gameServer = new GameServer(
      game != null ? game : new Game(),
      options
    );
    this.broadcastInterval = null;
    this.broadcastIntervalMs = 250; // 250ms = 4 updates per second
  }

  log(clientId) {
    const connectionLog = logger;
    const connection = this.connectionManager.getConnection(clientId);
    const clientLog = connection?.logger;

    return {
      info: (message, ...args) => {
        connectionLog.info(message, ...args);
        clientLog.info(message, ...args);
      },
      error: (message, ...args) => {
        connectionLog.error(message, ...args);
        clientLog.error(message, ...args);
      },
      warn: (message, ...args) => {
        connectionLog.warn(message, ...args);
        clientLog.warn(message, ...args);
      },
      debug: (message, ...args) => {
        connectionLog.debug(message, ...args);
        clientLog.debug(message, ...args);
      }
    }
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
          const log = this.log(connection.clientId);
          log.error('Error broadcasting to client', error);
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

    // Create a dedicated logger for this client (writes to logs/clients/{clientId}.log)
    const clientLogger = createClientLogger(clientId, { level: 'debug' });

    // Add to connection manager (store logger on connection for use in handlers)
    this.connectionManager.addConnection(clientId, ws, { logger: clientLogger });

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
      this.log.error('WebSocket error', error);
      this.onDisconnect(clientId);
    });

    this.log(clientId).info('Client connected');
  }

  /**
   * Handle incoming message
   * @param {string} clientId - Client identifier
   * @param {Buffer|string} data - Raw message data
   */
  handleMessage(clientId, data) {
    const connection = this.connectionManager.getConnection(clientId);
    const log = this.log(clientId);

    try {
      const message = MessageHandler.parseMessage(data.toString());
      log.debug('Message received', { type: message.type });

      // Update last activity
      if (connection) {
        connection.lastActivity = Date.now();
      }

      // Route message to appropriate handler
      if (message.type === MessageTypes.CONNECT) {
        this.handleConnect(clientId, message);
      } else if (message.type === MessageTypes.MOVE) {
        this.handleMove(clientId, message);
      } else {
        log.warn('Unknown message type', { type: message.type });
      }
    } catch (error) {
      log.error('Error handling message', error);
    }
  }

  /**
   * Handle CONNECT message
   * @param {string} clientId - Client identifier
   * @param {object} message - CONNECT message
   */
  handleConnect(clientId, message) {
    const playerId = randomUUID();
    const playerName = `Player ${playerId.substring(0, 8)}`;

    this.gameServer.addPlayer(clientId, playerId, playerName);
    const result = this.gameServer.spawnPlayer(playerId, playerName);

    this.connectionManager.setPlayerId(clientId, playerId);

    const connection = this.connectionManager.getConnection(clientId);
    if (!connection || !connection.ws) return;

    if (result.spawned) {
      const gameState = this.gameServer.serializeState();
      const response = MessageHandler.createMessage(MessageTypes.CONNECT, {
        clientId,
        playerId,
        playerName,
        gameState
      });
      connection.ws.send(JSON.stringify(response));
      this.log(clientId).info('Player joined', { playerId, playerName });
    } else {
      const waitMessage = this.gameServer.getSpawnWaitMessage();
      const response = MessageHandler.createMessage(MessageTypes.CONNECT, {
        clientId,
        playerId,
        playerName,
        gameState: null,
        waitingForSpawn: true,
        message: waitMessage
      });
      connection.ws.send(JSON.stringify(response));
      this.log(clientId).info('Player waiting for spawn', {
        playerId,
        playerName
      });
    }
  }

  /**
   * Send CONNECT payload with gameState to a client (e.g. after deferred spawn)
   * @param {string} clientId - Client identifier
   */
  sendSpawnedStateToClient(clientId) {
    const connection = this.connectionManager.getConnection(clientId);
    if (!connection || !connection.ws) return;
    const playerId = this.connectionManager.getPlayerId(clientId);
    if (!playerId) return;
    const player = this.gameServer.getPlayer(playerId);
    if (!player || player.x === null || player.y === null) return;

    const gameState = this.gameServer.serializeState();
    const response = MessageHandler.createMessage(MessageTypes.CONNECT, {
      clientId,
      playerId,
      playerName: player.playerName,
      gameState
    });
    connection.ws.send(JSON.stringify(response));
    this.log(clientId).info('Player spawned (was waiting)', {
      playerId,
      playerName: player.playerName
    });
  }

  /**
   * Handle MOVE message
   * @param {string} clientId - Client identifier
   * @param {object} message - MOVE message
   */
  handleMove(clientId, message) {
    const log = this.log(clientId);

    const playerId = this.connectionManager.getPlayerId(clientId);
    if (!playerId) {
      log.warn('Cannot move: client has no playerId');
      return;
    }

    const { dx, dy } = message.payload;

    // Validate dx, dy are numbers and in range
    if (typeof dx !== 'number' || typeof dy !== 'number') {
      log.warn('Invalid move: dx or dy is not a number');
      return;
    }

    if (dx < -1 || dx > 1 || dy < -1 || dy > 1) {
      log.warn('Invalid move: dx or dy out of range');
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
    const log = this.log(clientId);
    log.info('Client disconnected');

    const playerId = this.connectionManager.getPlayerId(clientId);
    if (playerId) {
      this.gameServer.removePlayer(playerId);
    }
    this.connectionManager.removeConnection(clientId);

    // Try to spawn any players waiting for a spawn
    const spawnedIds = this.gameServer.trySpawnWaitingPlayers();
    for (const pid of spawnedIds) {
      const conn = this.connectionManager.getConnectionByPlayerId(pid);
      if (conn) {
        this.sendSpawnedStateToClient(conn.clientId);
      }
    }
  }
}

// Default export
export default Server;

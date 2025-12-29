/**
 * WebSocket server entry point
 * Handles server startup, shutdown, and connection management
 */

import { WebSocketServer } from 'ws';
import { serverConfig } from '../config/serverConfig.js';
import { ConnectionManager } from './ConnectionManager.js';
import { GameServer } from './GameServer.js';
import {
  parseMessage,
  createMessage,
  createErrorMessage,
  createStateUpdateMessage,
} from '../network/MessageHandler.js';
import { MessageTypes } from '../network/MessageTypes.js';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

let wss = null;
let connectionManager = null;
let gameServer = null;
let pingInterval = null;
let stateUpdateInterval = null;
let purgeInterval = null;

/**
 * Start the WebSocket server
 * @returns {Promise<void>}
 */
export async function startServer() {
  if (wss) {
    throw new Error('Server is already running');
  }

  return new Promise((resolve, reject) => {
    try {
      // Initialize connection manager and game server
      connectionManager = new ConnectionManager();
      gameServer = new GameServer();
      gameServer.startGame();

      wss = new WebSocketServer({
        port: serverConfig.websocket.port,
        host: serverConfig.websocket.host,
        perMessageDeflate: false, // Disable compression for better test performance
      });

      wss.on('listening', () => {
        logger.info(
          `WebSocket server listening on ${serverConfig.websocket.host}:${serverConfig.websocket.port}`
        );
        resolve();
      });

      wss.on('error', error => {
        logger.error('WebSocket server error:', error);
        reject(error);
      });

      // Handle new connections
      wss.on('connection', handleConnection);

      // Configure ping/pong for connection health
      wss.on('connection', ws => {
        ws.isAlive = true;
        ws.on('pong', () => {
          ws.isAlive = true;
        });
      });

      // Ping clients periodically
      pingInterval = setInterval(() => {
        wss.clients.forEach(ws => {
          if (ws.isAlive === false) {
            return ws.terminate();
          }
          ws.isAlive = false;
          ws.ping();
        });
      }, 30000); // Ping every 30 seconds

      // Broadcast state updates periodically
      stateUpdateInterval = setInterval(() => {
        if (gameServer.getPlayerCount() > 0) {
          const stateMessage = createStateUpdateMessage(gameServer.getGameState());
          broadcastMessage(stateMessage);
          logger.debug(
            `Broadcasting state update to ${wss.clients.size} client(s), ${gameServer.getPlayerCount()} player(s)`
          );
        }
      }, serverConfig.websocket.updateInterval);

      // Purge disconnected players and connections periodically (every 30 seconds)
      purgeInterval = setInterval(() => {
        const purgedPlayers = gameServer.purgeDisconnectedPlayers();
        const purgedConnections = connectionManager.purgeDisconnectedConnections();
        if (purgedPlayers > 0) {
          logger.debug(`Purged ${purgedPlayers} disconnected player(s) after grace period`);
        }
        if (purgedConnections > 0) {
          logger.debug(`Purged ${purgedConnections} disconnected connection(s) after grace period`);
        }
      }, 30000); // Check every 30 seconds

      // Clean up purge interval on server close
      wss.on('close', () => {
        if (purgeInterval) {
          clearInterval(purgeInterval);
          purgeInterval = null;
        }
      });

      // Clean up intervals on server close
      wss.on('close', () => {
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        if (stateUpdateInterval) {
          clearInterval(stateUpdateInterval);
          stateUpdateInterval = null;
        }
      });
    } catch (error) {
      logger.error('Failed to start WebSocket server:', error);
      reject(error);
    }
  });
}

/**
 * Stop the WebSocket server
 * @returns {Promise<void>}
 */
export async function stopServer() {
  if (!wss) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Clear intervals first to prevent new operations
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    if (stateUpdateInterval) {
      clearInterval(stateUpdateInterval);
      stateUpdateInterval = null;
    }
    if (purgeInterval) {
      clearInterval(purgeInterval);
      purgeInterval = null;
    }

    // Terminate all connections forcefully
    const clients = Array.from(wss.clients);
    clients.forEach(ws => {
      if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) {
        ws.terminate();
      }
    });

    // Wait for all clients to close, then close the server
    const checkClients = () => {
      if (wss.clients.size === 0) {
        // All clients closed, now close the server
        wss.close(error => {
          if (error) {
            logger.error('Error closing WebSocket server:', error);
            reject(error);
          } else {
            logger.info('WebSocket server stopped');
            wss = null;
            connectionManager = null;
            gameServer = null;
            resolve();
          }
        });
      } else {
        // Still have clients, wait a bit and check again
        setTimeout(checkClients, 10);
      }
    };

    // Start checking for client closure
    // If no clients, close immediately
    if (wss.clients.size === 0) {
      wss.close(error => {
        if (error) {
          logger.error('Error closing WebSocket server:', error);
          reject(error);
        } else {
          logger.info('WebSocket server stopped');
          wss = null;
          connectionManager = null;
          gameServer = null;
          resolve();
        }
      });
    } else {
      // Wait for clients to close (with timeout)
      const timeout = setTimeout(() => {
        // Force close even if clients haven't closed
        wss.close(error => {
          if (error) {
            logger.error('Error closing WebSocket server:', error);
            reject(error);
          } else {
            logger.info('WebSocket server stopped (forced)');
            wss = null;
            connectionManager = null;
            gameServer = null;
            resolve();
          }
        });
      }, 1000);

      checkClients();
    }
  });
}

/**
 * Get the WebSocket server instance
 * @returns {WebSocketServer | null}
 */
export function getServer() {
  return wss;
}

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown() {
  const shutdown = async signal => {
    logger.info(`\nReceived ${signal}, shutting down gracefully...`);
    try {
      await stopServer();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Handle new WebSocket connection
 * @param {WebSocket} ws - WebSocket connection
 */
function handleConnection(ws) {
  // Add connection to manager
  const clientId = connectionManager.addConnection(ws);
  logger.info(`Client connected: ${clientId}`);

  // Send CONNECT message with client ID and initial game state
  const connectMessage = createMessage(MessageTypes.CONNECT, {
    clientId,
    gameState: gameServer.getGameState(),
  });
  sendMessage(ws, connectMessage);

  // Set up message handler
  ws.on('message', data => {
    handleMessage(ws, clientId, data);
  });

  // Set up disconnect handler
  ws.on('close', (code, reason) => {
    logger.info(
      `WebSocket close event fired for clientId: ${clientId}, code: ${code}, reason: ${reason?.toString() || 'none'}`
    );
    handleDisconnect(clientId);
  });

  // Set up error handler
  ws.on('error', error => {
    logger.error(`WebSocket error for client ${clientId}:`, error);
    handleDisconnect(clientId);
  });
}

/**
 * Handle incoming message from client
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} clientId - Client ID
 * @param {Buffer | string} data - Message data
 */
function handleMessage(ws, clientId, data) {
  try {
    // Update activity timestamp
    connectionManager.updateActivity(clientId);

    // Parse message
    const messageString = data.toString();
    logger.debug(`Received message from client ${clientId}: ${messageString.substring(0, 100)}`);

    const { message, error } = parseMessage(messageString);

    if (error) {
      // Send error response
      logger.warn(`Message parse error for client ${clientId}: ${error.message}`);
      const errorMessage = createErrorMessage(
        error.code,
        error.message,
        { action: 'PARSE_MESSAGE' },
        clientId
      );
      sendMessage(ws, errorMessage);
      return;
    }

    // Route message based on type
    routeMessage(ws, clientId, message);
  } catch (error) {
    logger.error(`Error handling message from client ${clientId}:`, error);
    const errorMessage = createErrorMessage(
      'INTERNAL_ERROR',
      'Internal server error while processing message',
      { action: 'HANDLE_MESSAGE' },
      clientId
    );
    sendMessage(ws, errorMessage);
  }
}

/**
 * Route message to appropriate handler
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} clientId - Client ID
 * @param {object} message - Parsed message
 */
function routeMessage(ws, clientId, message) {
  const { type, payload } = message;

  switch (type) {
    case MessageTypes.CONNECT:
      handleConnectMessage(ws, clientId, payload);
      break;

    case MessageTypes.DISCONNECT:
      handleDisconnectMessage(clientId);
      break;

    case MessageTypes.MOVE:
      handleMoveMessage(ws, clientId, payload);
      break;

    case MessageTypes.SET_PLAYER_NAME:
      handleSetPlayerNameMessage(ws, clientId, payload);
      break;

    case MessageTypes.PING:
      handlePingMessage(ws, clientId);
      break;

    default:
      const errorMessage = createErrorMessage(
        'UNKNOWN_MESSAGE_TYPE',
        `Unknown message type: ${type}`,
        { action: type },
        clientId
      );
      sendMessage(ws, errorMessage);
  }
}

/**
 * Handle CONNECT message
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} clientId - Client ID
 * @param {object} payload - Message payload
 */
function handleConnectMessage(ws, clientId, payload) {
  try {
    // console.log("handleConnectMessage payload", JSON.stringify(payload));
    const existingPlayerId = payload.playerId;
    const isReconnection = existingPlayerId && gameServer.hasRecentPlayer(existingPlayerId);
    logger.info(
      `CONNECT message from client ${clientId}: existingPlayerId=${existingPlayerId}, isReconnection=${isReconnection}`
    );

    let playerId;
    let playerName;

    if (isReconnection) {
      // Reconnection: restore existing player
      playerId = existingPlayerId;
      const existingPlayer = gameServer.getPlayer(playerId);
      playerName =
        payload.playerName || existingPlayer?.playerName || `Player-${playerId.slice(0, 8)}`;

      // Restore player if they were disconnected
      const wasRestored = gameServer.restorePlayer(playerId, clientId);
      if (wasRestored) {
        // Update player info
        const restoredPlayer = gameServer.getPlayer(playerId);
        if (restoredPlayer) {
          restoredPlayer.playerName = playerName;
        }
      } else if (existingPlayer) {
        // Player was already active, just update clientId and name
        existingPlayer.clientId = clientId;
        existingPlayer.playerName = playerName;
      }

      // Update connection mapping (new clientId, same playerId)
      connectionManager.setPlayerId(clientId, playerId);
      connectionManager.setPlayerName(clientId, playerName);

      logger.info(`Player reconnected: ${playerId} (client: ${clientId})`);
    } else {
      // New connection: create new player
      playerId = randomUUID();
      playerName = payload.playerName || `Player-${playerId.slice(0, 8)}`;

      // Set player info in connection manager
      connectionManager.setPlayerId(clientId, playerId);
      connectionManager.setPlayerName(clientId, playerName);

      // Add player to game
      const added = gameServer.addPlayer(playerId, playerName, clientId);
      if (!added) {
        const errorMessage = createErrorMessage(
          'PLAYER_ADD_FAILED',
          'Failed to add player to game',
          { action: 'CONNECT', playerId },
          clientId
        );
        sendMessage(ws, errorMessage);
        return;
      }

      logger.info(`Player joined: ${playerId} (client: ${clientId})`);
    }

    // Send CONNECT response with player info and game state
    const connectResponse = createMessage(MessageTypes.CONNECT, {
      clientId,
      playerId,
      playerName,
      gameState: gameServer.getGameState(),
      isReconnection,
    });
    sendMessage(ws, connectResponse);

    if (!isReconnection) {
      // Only broadcast PLAYER_JOINED for new players
      broadcastMessage(
        createMessage(MessageTypes.PLAYER_JOINED, {
          playerId,
          playerName,
          clientId,
        })
      );
    }

    // Broadcast immediate state update to all clients
    const stateMessage = createStateUpdateMessage(gameServer.getGameState());
    broadcastMessage(stateMessage);
  } catch (error) {
    logger.error(`Error handling CONNECT message from client ${clientId}:`, error);
    const errorMessage = createErrorMessage(
      'INTERNAL_ERROR',
      'Internal server error while processing CONNECT',
      { action: 'CONNECT' },
      clientId
    );
    sendMessage(ws, errorMessage);
  }
}

/**
 * Handle DISCONNECT message
 * @param {string} clientId - Client ID
 */
function handleDisconnectMessage(clientId) {
  handleDisconnect(clientId);
}

/**
 * Handle MOVE message
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} clientId - Client ID
 * @param {object} payload - Message payload
 */
function handleMoveMessage(ws, clientId, payload) {
  try {
    const connection = connectionManager.getConnection(clientId);
    if (!connection || !connection.playerId) {
      logger.warn(`Move attempted by non-connected client: ${clientId}`);
      const errorMessage = createErrorMessage(
        'NOT_CONNECTED',
        'Player not connected',
        { action: 'MOVE' },
        clientId
      );
      sendMessage(ws, errorMessage);
      return;
    }

    const { dx, dy } = payload;
    if (typeof dx !== 'number' || typeof dy !== 'number') {
      logger.warn(`Invalid move payload from client ${clientId}: dx=${dx}, dy=${dy}`);
      const errorMessage = createErrorMessage(
        'INVALID_MOVE',
        'dx and dy must be numbers',
        { action: 'MOVE' },
        clientId
      );
      sendMessage(ws, errorMessage);
      return;
    }

    // Validate dx and dy are -1, 0, or 1
    if (dx < -1 || dx > 1 || dy < -1 || dy > 1) {
      logger.warn(`Move out of range from client ${clientId}: dx=${dx}, dy=${dy}`);
      const errorMessage = createErrorMessage(
        'INVALID_MOVE',
        'dx and dy must be -1, 0, or 1',
        { action: 'MOVE' },
        clientId
      );
      sendMessage(ws, errorMessage);
      return;
    }

    // Validate game is running
    if (!gameServer.getGameState().running) {
      logger.warn(`Move attempted while game not running by client ${clientId}`);
      const errorMessage = createErrorMessage(
        'GAME_NOT_RUNNING',
        'Game is not running',
        { action: 'MOVE', playerId: connection.playerId },
        clientId
      );
      sendMessage(ws, errorMessage);
      return;
    }

    const moved = gameServer.movePlayer(connection.playerId, dx, dy);
    if (!moved) {
      logger.debug(`Move failed for player ${connection.playerId}: (${dx}, ${dy})`);
      const errorMessage = createErrorMessage(
        'MOVE_FAILED',
        'Move failed: invalid position or collision',
        { action: 'MOVE', playerId: connection.playerId, dx, dy },
        clientId
      );
      sendMessage(ws, errorMessage);
      return;
    }

    // Movement successful - state will be broadcast via periodic updates
  } catch (error) {
    logger.error(`Error handling MOVE message from client ${clientId}:`, error);
    const errorMessage = createErrorMessage(
      'INTERNAL_ERROR',
      'Internal server error while processing MOVE',
      { action: 'MOVE' },
      clientId
    );
    sendMessage(ws, errorMessage);
  }
}

/**
 * Handle SET_PLAYER_NAME message
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} clientId - Client ID
 * @param {object} payload - Message payload
 */
function handleSetPlayerNameMessage(ws, clientId, payload) {
  try {
    const connection = connectionManager.getConnection(clientId);
    if (!connection || !connection.playerId) {
      logger.warn(`SET_PLAYER_NAME attempted by non-connected client: ${clientId}`);
      const errorMessage = createErrorMessage(
        'NOT_CONNECTED',
        'Player not connected',
        { action: 'SET_PLAYER_NAME' },
        clientId
      );
      sendMessage(ws, errorMessage);
      return;
    }

    const { playerName } = payload;
    if (!playerName || typeof playerName !== 'string') {
      logger.warn(`Invalid player name from client ${clientId}: ${playerName}`);
      const errorMessage = createErrorMessage(
        'INVALID_PLAYER_NAME',
        'playerName must be a non-empty string',
        { action: 'SET_PLAYER_NAME' },
        clientId
      );
      sendMessage(ws, errorMessage);
      return;
    }

    // Update player name
    connectionManager.setPlayerName(clientId, playerName);
    const player = gameServer.getPlayer(connection.playerId);
    if (player) {
      player.playerName = playerName;
      logger.info(`Player name updated: ${playerName} (${connection.playerId})`);
    }

    // Broadcast immediate state update with name change
    const stateMessage = createStateUpdateMessage(gameServer.getGameState());
    broadcastMessage(stateMessage);
  } catch (error) {
    logger.error(`Error handling SET_PLAYER_NAME message from client ${clientId}:`, error);
    const errorMessage = createErrorMessage(
      'INTERNAL_ERROR',
      'Internal server error while processing SET_PLAYER_NAME',
      { action: 'SET_PLAYER_NAME' },
      clientId
    );
    sendMessage(ws, errorMessage);
  }
}

/**
 * Handle PING message
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} clientId - Client ID
 */
function handlePingMessage(ws, clientId) {
  const pongMessage = createMessage(MessageTypes.PONG, {}, clientId);
  sendMessage(ws, pongMessage);
}

/**
 * Handle client disconnect
 * @param {string} clientId - Client ID
 */
function handleDisconnect(clientId) {
  if (!connectionManager) {
    logger.warn(`handleDisconnect called but connectionManager is null for clientId: ${clientId}`);
    return;
  }

  const connection = connectionManager.getConnection(clientId);
  if (!connection) {
    logger.warn(`handleDisconnect called but connection not found for clientId: ${clientId}`);
    return;
  }

  logger.info(`Client disconnected: ${clientId}, playerId: ${connection.playerId || 'none'}`);

  // Mark player as disconnected (instead of removing immediately)
  if (connection.playerId) {
    const player = gameServer.getPlayer(connection.playerId);
    if (player) {
      // Broadcast player left
      broadcastMessage(
        createMessage(MessageTypes.PLAYER_LEFT, {
          playerId: connection.playerId,
          playerName: connection.playerName,
          clientId,
        })
      );
    }
    // Mark as disconnected (will be purged after grace period)
    const marked = gameServer.markPlayerDisconnected(connection.playerId);
    logger.info(
      `Marked player ${connection.playerId} as disconnected: ${marked}, hasPlayer check: ${gameServer.hasPlayer(connection.playerId)}`
    );

    // Broadcast immediate state update after player disconnection
    const stateMessage = createStateUpdateMessage(gameServer.getGameState());
    broadcastMessage(stateMessage);
  }

  // Remove connection
  connectionManager.removeConnection(clientId);
}

/**
 * Send message to a WebSocket connection
 * @param {WebSocket} ws - WebSocket connection
 * @param {object} message - Message object
 */
function sendMessage(ws, message) {
  try {
    if (ws.readyState === ws.OPEN) {
      const messageString = JSON.stringify(message);
      ws.send(messageString);
      logger.debug(`Sent message to client: ${message.type}`);
    } else {
      logger.warn(`Attempted to send message to client in state ${ws.readyState}`);
    }
  } catch (error) {
    logger.error('Error sending message to client:', error);
  }
}

/**
 * Broadcast message to all connected clients
 * @param {object} message - Message object
 */
function broadcastMessage(message) {
  try {
    const messageString = JSON.stringify(message);
    let sentCount = 0;
    connectionManager.getAllConnections().forEach(connection => {
      try {
        if (connection.ws.readyState === connection.ws.OPEN) {
          connection.ws.send(messageString);
          sentCount++;
        }
      } catch (error) {
        logger.error(`Error broadcasting to client ${connection.id}:`, error);
      }
    });
    logger.debug(`Broadcast message ${message.type} to ${sentCount} client(s)`);
  } catch (error) {
    logger.error('Error broadcasting message:', error);
  }
}

// Setup graceful shutdown handlers
setupGracefulShutdown();

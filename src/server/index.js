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

let wss = null;
let connectionManager = null;
let gameServer = null;

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
      });

      wss.on('listening', () => {
        console.log(
          `WebSocket server listening on ${serverConfig.websocket.host}:${serverConfig.websocket.port}`
        );
        resolve();
      });

      wss.on('error', error => {
        console.error('WebSocket server error:', error);
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
      const pingInterval = setInterval(() => {
        wss.clients.forEach(ws => {
          if (ws.isAlive === false) {
            return ws.terminate();
          }
          ws.isAlive = false;
          ws.ping();
        });
      }, 30000); // Ping every 30 seconds

      // Broadcast state updates periodically
      const stateUpdateInterval = setInterval(() => {
        if (gameServer.getPlayerCount() > 0) {
          const stateMessage = createStateUpdateMessage(gameServer.getGameState());
          broadcastMessage(stateMessage);
        }
      }, serverConfig.websocket.updateInterval);

      // Clean up intervals on server close
      wss.on('close', () => {
        clearInterval(pingInterval);
        clearInterval(stateUpdateInterval);
      });
    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
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
    // Close all connections
    wss.clients.forEach(ws => {
      ws.close();
    });

    wss.close(error => {
      if (error) {
        console.error('Error closing WebSocket server:', error);
        reject(error);
      } else {
        console.log('WebSocket server stopped');
        wss = null;
        connectionManager = null;
        gameServer = null;
        resolve();
      }
    });
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
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    try {
      await stopServer();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
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
  console.log(`Client connected: ${clientId}`);

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
  ws.on('close', () => {
    handleDisconnect(clientId);
  });

  // Set up error handler
  ws.on('error', error => {
    console.error(`WebSocket error for client ${clientId}:`, error);
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
  // Update activity timestamp
  connectionManager.updateActivity(clientId);

  // Parse message
  const messageString = data.toString();
  const { message, error } = parseMessage(messageString);

  if (error) {
    // Send error response
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
  const existingPlayerId = payload.playerId;
  const isReconnection = existingPlayerId && gameServer.hasPlayer(existingPlayerId);

  let playerId;
  let playerName;

  if (isReconnection) {
    // Reconnection: restore existing player
    playerId = existingPlayerId;
    const existingPlayer = gameServer.getPlayer(playerId);
    playerName =
      payload.playerName || existingPlayer?.playerName || `Player-${playerId.slice(0, 8)}`;

    // Update connection mapping (new clientId, same playerId)
    connectionManager.setPlayerId(clientId, playerId);
    connectionManager.setPlayerName(clientId, playerName);

    // Update player's clientId in game server
    if (existingPlayer) {
      existingPlayer.clientId = clientId;
      existingPlayer.playerName = playerName;
    }

    console.log(`Player reconnected: ${playerId} (client: ${clientId})`);
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

    console.log(`Player joined: ${playerId} (client: ${clientId})`);
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
  const connection = connectionManager.getConnection(clientId);
  if (!connection || !connection.playerId) {
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
}

/**
 * Handle SET_PLAYER_NAME message
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} clientId - Client ID
 * @param {object} payload - Message payload
 */
function handleSetPlayerNameMessage(ws, clientId, payload) {
  const connection = connectionManager.getConnection(clientId);
  if (!connection || !connection.playerId) {
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
  }

  // Broadcast immediate state update with name change
  const stateMessage = createStateUpdateMessage(gameServer.getGameState());
  broadcastMessage(stateMessage);
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
    return;
  }

  const connection = connectionManager.getConnection(clientId);
  if (!connection) {
    return;
  }

  console.log(`Client disconnected: ${clientId}`);

  // Remove player from game if exists
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
    gameServer.removePlayer(connection.playerId);

    // Broadcast immediate state update after player removal
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
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast message to all connected clients
 * @param {object} message - Message object
 */
function broadcastMessage(message) {
  const messageString = JSON.stringify(message);
  connectionManager.getAllConnections().forEach(connection => {
    if (connection.ws.readyState === connection.ws.OPEN) {
      connection.ws.send(messageString);
    }
  });
}

// Setup graceful shutdown handlers
setupGracefulShutdown();

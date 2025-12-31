/**
 * WebSocket Client Wrapper
 * Handles client-side WebSocket communication with the game server
 */

import WebSocket from 'ws';
import { parseMessage, createMessage } from './MessageHandler.js';
import { MessageTypes } from './MessageTypes.js';
import { serverConfig } from '../config/serverConfig.js';

/**
 * WebSocket Client class
 * Manages connection to game server and message handling
 */
export class WebSocketClient {
  constructor(url = null) {
    this.url =
      url ||
      `ws://${serverConfig.websocket.host === '0.0.0.0' ? 'localhost' : serverConfig.websocket.host}:${serverConfig.websocket.port}`;
    this.ws = null;
    this.connected = false;
    this.clientId = null;
    this.playerId = null;
    this.playerName = null;

    // Reconnection state
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.manualDisconnect = false;

    // Callbacks
    this.callbacks = {
      onConnect: null,
      onDisconnect: null,
      onStateUpdate: null,
      onError: null,
      onPlayerJoined: null,
      onPlayerLeft: null,
      onReconnecting: null,
      onReconnected: null,
      onServerRestart: null,
    };
  }

  /**
   * Connect to the WebSocket server
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.connected) {
      throw new Error('Already connected');
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          this.connected = true;
          this.manualDisconnect = false; // Reset on successful connection
          if (this.callbacks.onConnect) {
            this.callbacks.onConnect();
          }
          resolve();
        });

        this.ws.on('message', data => {
          this.handleMessage(data);
        });

        this.ws.on('close', () => {
          this.connected = false;
          this.ws = null;

          // Attempt reconnection if enabled and not manually disconnected
          if (
            !this.manualDisconnect &&
            serverConfig.reconnection.enabled &&
            this.reconnectAttempts < serverConfig.reconnection.maxAttempts
          ) {
            this.attemptReconnect();
          } else {
            if (this.callbacks.onDisconnect) {
              this.callbacks.onDisconnect();
            }
          }
        });

        this.ws.on('error', error => {
          if (this.callbacks.onError) {
            this.callbacks.onError(error);
          }
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    this.manualDisconnect = true;
    this.reconnecting = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.reconnectAttempts = 0;
    // Don't clear clientId, playerId, playerName on manual disconnect
    // They may be needed for reconnection
  }

  /**
   * Attempt to reconnect to the server with exponential backoff
   */
  async attemptReconnect() {
    if (this.reconnecting) {
      return;
    }

    this.reconnecting = true;
    this.reconnectAttempts++;

    if (this.callbacks.onReconnecting) {
      this.callbacks.onReconnecting(this.reconnectAttempts);
    }

    // Calculate delay with exponential backoff
    const baseDelay = serverConfig.reconnection.retryDelay;
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30 seconds

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        // On successful reconnect, send player ID if we have one
        if (this.playerId) {
          this.sendConnect(this.playerName, this.playerId);
        }
        this.reconnecting = false;
        this.reconnectAttempts = 0;
        if (this.callbacks.onReconnected) {
          this.callbacks.onReconnected();
        }
      } catch (error) {
        this.reconnecting = false;
        // Will trigger another reconnect attempt if maxAttempts not reached
        if (this.reconnectAttempts < serverConfig.reconnection.maxAttempts) {
          this.attemptReconnect();
        } else {
          // Max attempts reached
          if (this.callbacks.onError) {
            this.callbacks.onError({
              code: 'RECONNECTION_FAILED',
              message: `Failed to reconnect after ${this.reconnectAttempts} attempts`,
            });
          }
          if (this.callbacks.onDisconnect) {
            this.callbacks.onDisconnect();
          }
        }
      }
    }, delay);
  }

  /**
   * Handle incoming message from server
   * @param {Buffer | string} data - Message data
   */
  handleMessage(data) {
    const messageString = data.toString();
    const { message, error } = parseMessage(messageString);

    if (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      return;
    }

    const { type, payload } = message;

    switch (type) {
      case MessageTypes.CONNECT:
        this.clientId = payload.clientId;
        // Detect server restart: if we had a playerId but server says isReconnection=false,
        // that means server restarted and we need to reset client state
        if (this.playerId && payload.isReconnection === false) {
          // Server restarted - notify client to reset state
          if (this.callbacks.onServerRestart) {
            this.callbacks.onServerRestart({
              oldPlayerId: this.playerId,
              newPlayerId: payload.playerId,
            });
          }
          // Clear old playerId - we'll get a new one from PLAYER_JOINED
          this.playerId = null;
          this.reconnecting = false;
          this.reconnectAttempts = 0;
        } else if (this.playerId && payload.playerId === this.playerId) {
          // Reconnection successful - player state restored
          this.reconnecting = false;
          this.reconnectAttempts = 0;
        }
        if (payload.gameState) {
          if (this.callbacks.onStateUpdate) {
            this.callbacks.onStateUpdate(payload.gameState);
          }
        }
        break;

      case MessageTypes.STATE_UPDATE:
        if (this.callbacks.onStateUpdate) {
          this.callbacks.onStateUpdate(payload.gameState);
        }
        break;

      case MessageTypes.PLAYER_JOINED:
        // Store player ID if this is our player
        if (payload.clientId === this.clientId) {
          this.playerId = payload.playerId;
          if (payload.playerName) {
            this.playerName = payload.playerName;
          }
        }
        if (this.callbacks.onPlayerJoined) {
          this.callbacks.onPlayerJoined(payload);
        }
        break;

      case MessageTypes.PLAYER_LEFT:
        if (this.callbacks.onPlayerLeft) {
          this.callbacks.onPlayerLeft(payload);
        }
        break;

      case MessageTypes.ERROR:
        if (this.callbacks.onError) {
          this.callbacks.onError(payload);
        }
        break;

      case MessageTypes.PONG:
        // Keep-alive response, no action needed
        break;

      default:
        // Unknown message type, ignore
        break;
    }
  }

  /**
   * Send a message to the server
   * @param {object} message - Message object
   */
  sendMessage(message) {
    if (!this.connected || !this.ws) {
      throw new Error('Not connected to server');
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket is not open');
    }
  }

  /**
   * Send a MOVE message to the server
   * @param {number} dx - Change in X direction (-1, 0, or 1)
   * @param {number} dy - Change in Y direction (-1, 0, or 1)
   */
  sendMove(dx, dy) {
    const message = createMessage(MessageTypes.MOVE, { dx, dy }, this.clientId);
    this.sendMessage(message);
  }

  /**
   * Send a SET_PLAYER_NAME message to the server
   * @param {string} name - Player name
   */
  sendSetPlayerName(name) {
    const message = createMessage(
      MessageTypes.SET_PLAYER_NAME,
      { playerName: name },
      this.clientId
    );
    this.sendMessage(message);
    this.playerName = name;
  }

  /**
   * Send a CONNECT message to join the game
   * @param {string} [playerName] - Optional player name
   * @param {string} [playerId] - Optional player ID (for reconnection)
   */
  sendConnect(playerName = null, playerId = null) {
    const payload = {};
    if (playerName) {
      payload.playerName = playerName;
    }
    if (playerId) {
      payload.playerId = playerId;
    }
    const message = createMessage(MessageTypes.CONNECT, payload, this.clientId);
    this.sendMessage(message);
  }

  /**
   * Send a DISCONNECT message
   */
  sendDisconnect() {
    const message = createMessage(MessageTypes.DISCONNECT, {}, this.clientId);
    this.sendMessage(message);
  }

  /**
   * Send a PING message for keep-alive
   */
  sendPing() {
    const message = createMessage(MessageTypes.PING, {}, this.clientId);
    this.sendMessage(message);
  }

  /**
   * Send a RESTART message to restart the game
   */
  sendRestart() {
    const message = createMessage(MessageTypes.RESTART, {}, this.clientId);
    this.sendMessage(message);
  }

  /**
   * Set callback for connection event
   * @param {Function} callback - Callback function
   */
  onConnect(callback) {
    this.callbacks.onConnect = callback;
  }

  /**
   * Set callback for disconnection event
   * @param {Function} callback - Callback function
   */
  onDisconnect(callback) {
    this.callbacks.onDisconnect = callback;
  }

  /**
   * Set callback for state update event
   * @param {Function} callback - Callback function
   */
  onStateUpdate(callback) {
    this.callbacks.onStateUpdate = callback;
  }

  /**
   * Set callback for error event
   * @param {Function} callback - Callback function
   */
  onError(callback) {
    this.callbacks.onError = callback;
  }

  /**
   * Set callback for player joined event
   * @param {Function} callback - Callback function
   */
  onPlayerJoined(callback) {
    this.callbacks.onPlayerJoined = callback;
  }

  /**
   * Set callback for player left event
   * @param {Function} callback - Callback function
   */
  onPlayerLeft(callback) {
    this.callbacks.onPlayerLeft = callback;
  }

  /**
   * Set callback for reconnecting event
   * @param {Function} callback - Callback function (receives attempt number)
   */
  onReconnecting(callback) {
    this.callbacks.onReconnecting = callback;
  }

  /**
   * Set callback for reconnected event
   * @param {Function} callback - Callback function
   */
  onReconnected(callback) {
    this.callbacks.onReconnected = callback;
  }

  /**
   * Set callback for server restart event
   * @param {Function} callback - Callback function (receives {oldPlayerId, newPlayerId})
   */
  onServerRestart(callback) {
    this.callbacks.onServerRestart = callback;
  }

  /**
   * Check if client is connected
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get client ID
   * @returns {string | null} Client ID or null
   */
  getClientId() {
    return this.clientId;
  }

  /**
   * Get player ID
   * @returns {string | null} Player ID or null
   */
  getPlayerId() {
    return this.playerId;
  }

  /**
   * Get player name
   * @returns {string | null} Player name or null
   */
  getPlayerName() {
    return this.playerName;
  }
}

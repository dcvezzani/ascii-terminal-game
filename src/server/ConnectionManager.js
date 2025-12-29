/**
 * Connection Manager
 * Manages WebSocket connections, client IDs, and player information
 */

import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Connection Manager class
 * Tracks active WebSocket connections and associated metadata
 */
export class ConnectionManager {
  constructor() {
    // Map of clientId -> connection info
    this.connections = new Map();
  }

  /**
   * Add a new connection and generate a unique client ID
   * @param {WebSocket} ws - WebSocket connection
   * @returns {string} - Generated client ID (UUID v4)
   */
  addConnection(ws) {
    const clientId = randomUUID();
    const now = Date.now();

    const connection = {
      id: clientId,
      ws,
      connectedAt: now,
      lastActivity: now,
      playerId: null,
      playerName: null,
    };

    this.connections.set(clientId, connection);
    logger.debug(`Connection added: ${clientId} (total: ${this.connections.size})`);

    return clientId;
  }

  /**
   * Remove a connection by client ID
   * @param {string} clientId - Client ID to remove
   * @returns {boolean} - True if connection was removed, false if not found
   */
  removeConnection(clientId) {
    const removed = this.connections.delete(clientId);
    if (removed) {
      logger.debug(`Connection removed: ${clientId} (total: ${this.connections.size})`);
    }
    return removed;
  }

  /**
   * Get a connection by client ID
   * @param {string} clientId - Client ID
   * @returns {object | undefined} - Connection object or undefined if not found
   */
  getConnection(clientId) {
    return this.connections.get(clientId);
  }

  /**
   * Get all active connections
   * @returns {Array<object>} - Array of connection objects
   */
  getAllConnections() {
    return Array.from(this.connections.values());
  }

  /**
   * Update the last activity timestamp for a connection
   * @param {string} clientId - Client ID
   * @returns {boolean} - True if updated, false if connection not found
   */
  updateActivity(clientId) {
    const connection = this.getConnection(clientId);
    if (!connection) {
      return false;
    }

    connection.lastActivity = Date.now();
    return true;
  }

  /**
   * Set player ID for a connection
   * @param {string} clientId - Client ID
   * @param {string} playerId - Player ID
   * @returns {boolean} - True if set, false if connection not found
   */
  setPlayerId(clientId, playerId) {
    const connection = this.getConnection(clientId);
    if (!connection) {
      logger.warn(`Attempted to set playerId for non-existent connection: ${clientId}`);
      return false;
    }

    connection.playerId = playerId;
    logger.debug(`Player ID set for connection ${clientId}: ${playerId}`);
    return true;
  }

  /**
   * Set player name for a connection
   * @param {string} clientId - Client ID
   * @param {string} playerName - Player name
   * @returns {boolean} - True if set, false if connection not found
   */
  setPlayerName(clientId, playerName) {
    const connection = this.getConnection(clientId);
    if (!connection) {
      logger.warn(`Attempted to set playerName for non-existent connection: ${clientId}`);
      return false;
    }

    connection.playerName = playerName;
    logger.debug(`Player name set for connection ${clientId}: ${playerName}`);
    return true;
  }

  /**
   * Get player information for a connection
   * @param {string} clientId - Client ID
   * @returns {object | null} - Player info object or null if not found
   */
  getPlayerInfo(clientId) {
    const connection = this.getConnection(clientId);
    if (!connection) {
      return null;
    }

    return {
      clientId: connection.id,
      playerId: connection.playerId,
      playerName: connection.playerName,
      connectedAt: connection.connectedAt,
      lastActivity: connection.lastActivity,
    };
  }

  /**
   * Get the number of active connections
   * @returns {number} - Number of active connections
   */
  getConnectionCount() {
    return this.connections.size;
  }

  /**
   * Check if a connection exists
   * @param {string} clientId - Client ID
   * @returns {boolean} - True if connection exists
   */
  hasConnection(clientId) {
    return this.connections.has(clientId);
  }
}

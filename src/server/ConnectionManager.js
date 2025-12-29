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
    // Map of clientId -> connection info (active connections)
    this.connections = new Map();
    // Map of clientId -> { connection, disconnectedAt } (connections scheduled for removal)
    this.disconnectedConnections = new Map();
    // Grace period: 1 minute (60000ms) before permanently removing disconnected connections
    this.disconnectGracePeriod = 60000;
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
   * Schedule a connection for removal after grace period
   * Connection is moved to disconnectedConnections and will be purged after 1 minute
   * @param {string} clientId - Client ID
   * @returns {boolean} - True if connection was scheduled for removal, false if not found
   */
  removeConnection(clientId) {
    const connection = this.connections.get(clientId);
    if (!connection) {
      // Check if already in disconnectedConnections
      if (this.disconnectedConnections.has(clientId)) {
        logger.debug(`Connection ${clientId} already scheduled for removal`);
        return true;
      }
      return false;
    }

    // Move connection to disconnectedConnections with timestamp
    this.disconnectedConnections.set(clientId, {
      connection: { ...connection }, // Copy connection data
      disconnectedAt: Date.now(),
    });

    // Remove from active connections
    this.connections.delete(clientId);
    logger.debug(
      `Connection scheduled for removal: ${clientId} (will be purged after grace period, total active: ${this.connections.size})`
    );
    return true;
  }

  /**
   * Permanently remove a connection (used after grace period)
   * @param {string} clientId - Client ID
   * @returns {boolean} - True if connection was removed, false if not found
   */
  permanentlyRemoveConnection(clientId) {
    const removed = this.disconnectedConnections.delete(clientId);
    if (removed) {
      logger.debug(`Connection permanently removed: ${clientId}`);
    }
    return removed;
  }

  /**
   * Purge connections that have been disconnected for longer than grace period
   * @returns {number} Number of connections purged
   */
  purgeDisconnectedConnections() {
    const now = Date.now();
    const connectionsToPurge = [];

    for (const [
      clientId,
      { connection, disconnectedAt },
    ] of this.disconnectedConnections.entries()) {
      if (now - disconnectedAt > this.disconnectGracePeriod) {
        connectionsToPurge.push(clientId);
      }
    }

    // Remove purged connections
    for (const clientId of connectionsToPurge) {
      this.disconnectedConnections.delete(clientId);
      logger.debug(`Purging disconnected connection after grace period: ${clientId}`);
    }

    return connectionsToPurge.length;
  }

  /**
   * Get a connection by client ID (checks both active and disconnected connections)
   * @param {string} clientId - Client ID
   * @returns {object | undefined} - Connection object or undefined if not found
   */
  getConnection(clientId) {
    // Check active connections first
    const activeConnection = this.connections.get(clientId);
    if (activeConnection) {
      return activeConnection;
    }

    // Check disconnected connections (within grace period)
    const disconnected = this.disconnectedConnections.get(clientId);
    if (disconnected) {
      return disconnected.connection;
    }

    return undefined;
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

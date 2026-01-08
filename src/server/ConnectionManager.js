/**
 * ConnectionManager class for managing WebSocket connections
 */
export class ConnectionManager {
  constructor() {
    this.connections = new Map(); // clientId -> connection object
    this.playerIdMap = new Map(); // clientId -> playerId
  }

  /**
   * Add a connection
   * @param {string} clientId - Unique client identifier
   * @param {WebSocket} ws - WebSocket connection
   */
  addConnection(clientId, ws) {
    this.connections.set(clientId, {
      clientId,
      ws,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    });
  }

  /**
   * Remove a connection
   * @param {string} clientId - Client identifier
   */
  removeConnection(clientId) {
    this.connections.delete(clientId);
    this.playerIdMap.delete(clientId);
  }

  /**
   * Get connection by clientId
   * @param {string} clientId - Client identifier
   * @returns {object|undefined} Connection object or undefined
   */
  getConnection(clientId) {
    return this.connections.get(clientId);
  }

  /**
   * Get all connections
   * @returns {Array} Array of connection objects
   */
  getAllConnections() {
    return Array.from(this.connections.values());
  }

  /**
   * Map clientId to playerId
   * @param {string} clientId - Client identifier
   * @param {string} playerId - Player identifier
   */
  setPlayerId(clientId, playerId) {
    this.playerIdMap.set(clientId, playerId);
  }

  /**
   * Get playerId for clientId
   * @param {string} clientId - Client identifier
   * @returns {string|undefined} Player identifier or undefined
   */
  getPlayerId(clientId) {
    return this.playerIdMap.get(clientId);
  }
}

// Default export
export default ConnectionManager;

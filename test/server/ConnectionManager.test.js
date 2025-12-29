import { describe, test, expect, beforeEach } from 'vitest';
import { ConnectionManager } from '../../src/server/ConnectionManager.js';

describe('ConnectionManager', () => {
  let connectionManager;
  let mockWebSocket;

  beforeEach(() => {
    connectionManager = new ConnectionManager();
    mockWebSocket = {
      readyState: 1,
      send: () => {},
      close: () => {},
    };
  });

  describe('addConnection', () => {
    test('should add connection and return UUID v4 client ID', () => {
      const clientId = connectionManager.addConnection(mockWebSocket);

      expect(clientId).toBeDefined();
      expect(typeof clientId).toBe('string');
      // UUID v4 format: 8-4-4-4-12 hex digits
      expect(clientId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    test('should store connection with metadata', () => {
      const clientId = connectionManager.addConnection(mockWebSocket);
      const connection = connectionManager.getConnection(clientId);

      expect(connection).toBeDefined();
      expect(connection.id).toBe(clientId);
      expect(connection.ws).toBe(mockWebSocket);
      expect(connection.connectedAt).toBeDefined();
      expect(typeof connection.connectedAt).toBe('number');
      expect(connection.lastActivity).toBeDefined();
      expect(typeof connection.lastActivity).toBe('number');
      expect(connection.playerId).toBeNull();
      expect(connection.playerName).toBeNull();
    });

    test('should generate unique client IDs', () => {
      const id1 = connectionManager.addConnection(mockWebSocket);
      const id2 = connectionManager.addConnection(mockWebSocket);

      expect(id1).not.toBe(id2);
    });
  });

  describe('removeConnection', () => {
    test('should schedule connection for removal (still accessible during grace period)', () => {
      const clientId = connectionManager.addConnection(mockWebSocket);
      const removed = connectionManager.removeConnection(clientId);

      expect(removed).toBe(true);
      // Connection should still be accessible during grace period
      expect(connectionManager.getConnection(clientId)).toBeDefined();
      // But should not be in active connections
      expect(connectionManager.hasConnection(clientId)).toBe(false);
    });

    test('should return false if connection not found', () => {
      const removed = connectionManager.removeConnection('non-existent-id');
      expect(removed).toBe(false);
    });
  });

  describe('getConnection', () => {
    test('should retrieve connection by client ID', () => {
      const clientId = connectionManager.addConnection(mockWebSocket);
      const connection = connectionManager.getConnection(clientId);

      expect(connection).toBeDefined();
      expect(connection.id).toBe(clientId);
    });

    test('should return undefined for non-existent connection', () => {
      const connection = connectionManager.getConnection('non-existent-id');
      expect(connection).toBeUndefined();
    });
  });

  describe('getAllConnections', () => {
    test('should return empty array when no connections', () => {
      const connections = connectionManager.getAllConnections();
      expect(connections).toEqual([]);
    });

    test('should return all connections', () => {
      const id1 = connectionManager.addConnection(mockWebSocket);
      const id2 = connectionManager.addConnection(mockWebSocket);

      const connections = connectionManager.getAllConnections();
      expect(connections.length).toBe(2);
      expect(connections.map(c => c.id)).toContain(id1);
      expect(connections.map(c => c.id)).toContain(id2);
    });
  });

  describe('updateActivity', () => {
    test('should update last activity timestamp', () => {
      const clientId = connectionManager.addConnection(mockWebSocket);
      const connection = connectionManager.getConnection(clientId);
      const originalActivity = connection.lastActivity;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        connectionManager.updateActivity(clientId);
        const updatedConnection = connectionManager.getConnection(clientId);
        expect(updatedConnection.lastActivity).toBeGreaterThan(originalActivity);
      }, 10);
    });

    test('should return false if connection not found', () => {
      const updated = connectionManager.updateActivity('non-existent-id');
      expect(updated).toBe(false);
    });
  });

  describe('setPlayerId', () => {
    test('should set player ID for connection', () => {
      const clientId = connectionManager.addConnection(mockWebSocket);
      const playerId = 'player-123';

      const set = connectionManager.setPlayerId(clientId, playerId);
      expect(set).toBe(true);

      const connection = connectionManager.getConnection(clientId);
      expect(connection.playerId).toBe(playerId);
    });

    test('should return false if connection not found', () => {
      const set = connectionManager.setPlayerId('non-existent-id', 'player-123');
      expect(set).toBe(false);
    });
  });

  describe('setPlayerName', () => {
    test('should set player name for connection', () => {
      const clientId = connectionManager.addConnection(mockWebSocket);
      const playerName = 'TestPlayer';

      const set = connectionManager.setPlayerName(clientId, playerName);
      expect(set).toBe(true);

      const connection = connectionManager.getConnection(clientId);
      expect(connection.playerName).toBe(playerName);
    });

    test('should return false if connection not found', () => {
      const set = connectionManager.setPlayerName('non-existent-id', 'TestPlayer');
      expect(set).toBe(false);
    });
  });

  describe('getPlayerInfo', () => {
    test('should return player info for connection', () => {
      const clientId = connectionManager.addConnection(mockWebSocket);
      connectionManager.setPlayerId(clientId, 'player-123');
      connectionManager.setPlayerName(clientId, 'TestPlayer');

      const playerInfo = connectionManager.getPlayerInfo(clientId);

      expect(playerInfo).toBeDefined();
      expect(playerInfo.clientId).toBe(clientId);
      expect(playerInfo.playerId).toBe('player-123');
      expect(playerInfo.playerName).toBe('TestPlayer');
      expect(playerInfo.connectedAt).toBeDefined();
      expect(playerInfo.lastActivity).toBeDefined();
    });

    test('should return null if connection not found', () => {
      const playerInfo = connectionManager.getPlayerInfo('non-existent-id');
      expect(playerInfo).toBeNull();
    });
  });

  describe('getConnectionCount', () => {
    test('should return 0 when no connections', () => {
      expect(connectionManager.getConnectionCount()).toBe(0);
    });

    test('should return correct count', () => {
      connectionManager.addConnection(mockWebSocket);
      connectionManager.addConnection(mockWebSocket);
      expect(connectionManager.getConnectionCount()).toBe(2);
    });
  });

  describe('hasConnection', () => {
    test('should return true if connection exists', () => {
      const clientId = connectionManager.addConnection(mockWebSocket);
      expect(connectionManager.hasConnection(clientId)).toBe(true);
    });

    test('should return false if connection does not exist', () => {
      expect(connectionManager.hasConnection('non-existent-id')).toBe(false);
    });
  });
});

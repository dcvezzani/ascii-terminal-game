import { describe, it, expect, beforeEach } from 'vitest';
import ConnectionManager from '../../src/server/ConnectionManager.js';

describe('ConnectionManager', () => {
  let connectionManager;
  let mockWebSocket;

  beforeEach(() => {
    connectionManager = new ConnectionManager();
    mockWebSocket = {
      readyState: 1,
      send: () => {},
      close: () => {}
    };
  });

  describe('addConnection', () => {
    it('should add a connection', () => {
      const clientId = 'test-client-id';
      connectionManager.addConnection(clientId, mockWebSocket);

      const connection = connectionManager.getConnection(clientId);
      expect(connection).toBeDefined();
      expect(connection.ws).toBe(mockWebSocket);
    });

    it('should store connection with clientId', () => {
      const clientId = 'test-client-id';
      connectionManager.addConnection(clientId, mockWebSocket);

      expect(connectionManager.getConnection(clientId)).toBeDefined();
    });
  });

  describe('removeConnection', () => {
    it('should remove a connection', () => {
      const clientId = 'test-client-id';
      connectionManager.addConnection(clientId, mockWebSocket);
      
      connectionManager.removeConnection(clientId);

      expect(connectionManager.getConnection(clientId)).toBeUndefined();
    });

    it('should handle removing non-existent connection', () => {
      expect(() => {
        connectionManager.removeConnection('non-existent');
      }).not.toThrow();
    });
  });

  describe('getConnection', () => {
    it('should return connection for existing clientId', () => {
      const clientId = 'test-client-id';
      connectionManager.addConnection(clientId, mockWebSocket);

      const connection = connectionManager.getConnection(clientId);
      expect(connection).toBeDefined();
      expect(connection.ws).toBe(mockWebSocket);
    });

    it('should return undefined for non-existent clientId', () => {
      expect(connectionManager.getConnection('non-existent')).toBeUndefined();
    });
  });

  describe('getAllConnections', () => {
    it('should return empty array when no connections', () => {
      const connections = connectionManager.getAllConnections();
      expect(connections).toEqual([]);
    });

    it('should return all connections', () => {
      const clientId1 = 'client-1';
      const clientId2 = 'client-2';
      connectionManager.addConnection(clientId1, mockWebSocket);
      connectionManager.addConnection(clientId2, mockWebSocket);

      const connections = connectionManager.getAllConnections();
      expect(connections.length).toBe(2);
      expect(connections.some(c => c.clientId === clientId1)).toBe(true);
      expect(connections.some(c => c.clientId === clientId2)).toBe(true);
    });
  });

  describe('setPlayerId and getPlayerId', () => {
    it('should set and get playerId for clientId', () => {
      const clientId = 'test-client-id';
      const playerId = 'test-player-id';
      
      connectionManager.addConnection(clientId, mockWebSocket);
      connectionManager.setPlayerId(clientId, playerId);

      expect(connectionManager.getPlayerId(clientId)).toBe(playerId);
    });

    it('should return undefined for clientId without playerId', () => {
      const clientId = 'test-client-id';
      connectionManager.addConnection(clientId, mockWebSocket);

      expect(connectionManager.getPlayerId(clientId)).toBeUndefined();
    });

    it('should return undefined for non-existent clientId', () => {
      expect(connectionManager.getPlayerId('non-existent')).toBeUndefined();
    });

    it('should update playerId', () => {
      const clientId = 'test-client-id';
      const playerId1 = 'player-1';
      const playerId2 = 'player-2';
      
      connectionManager.addConnection(clientId, mockWebSocket);
      connectionManager.setPlayerId(clientId, playerId1);
      expect(connectionManager.getPlayerId(clientId)).toBe(playerId1);

      connectionManager.setPlayerId(clientId, playerId2);
      expect(connectionManager.getPlayerId(clientId)).toBe(playerId2);
    });
  });
});

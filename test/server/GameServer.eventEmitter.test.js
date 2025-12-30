/**
 * Unit tests for GameServer EventEmitter integration
 * Phase 1: EventEmitter Integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import { GameServer } from '../../src/server/GameServer.js';

describe('GameServer EventEmitter Integration', () => {
  let gameServer;

  beforeEach(() => {
    gameServer = new GameServer();
  });

  describe('EventEmitter Extension', () => {
    it('should extend EventEmitter', () => {
      expect(gameServer).toBeInstanceOf(EventEmitter);
      expect(gameServer).toBeInstanceOf(GameServer);
    });

    it('should have EventEmitter methods available', () => {
      expect(typeof gameServer.emit).toBe('function');
      expect(typeof gameServer.on).toBe('function');
      expect(typeof gameServer.once).toBe('function');
      expect(typeof gameServer.off).toBe('function');
      expect(typeof gameServer.removeAllListeners).toBe('function');
    });
  });

  describe('Event Emission', () => {
    it('should emit events', () => {
      let eventReceived = false;
      let receivedData = null;

      gameServer.on('test-event', data => {
        eventReceived = true;
        receivedData = data;
      });

      const testData = { message: 'test' };
      gameServer.emit('test-event', testData);

      expect(eventReceived).toBe(true);
      expect(receivedData).toEqual(testData);
    });

    it('should support multiple listeners for same event type', () => {
      const listener1Calls = [];
      const listener2Calls = [];

      gameServer.on('test-event', data => {
        listener1Calls.push(data);
      });

      gameServer.on('test-event', data => {
        listener2Calls.push(data);
      });

      const testData = { message: 'test' };
      gameServer.emit('test-event', testData);

      expect(listener1Calls).toHaveLength(1);
      expect(listener2Calls).toHaveLength(1);
      expect(listener1Calls[0]).toEqual(testData);
      expect(listener2Calls[0]).toEqual(testData);
    });

    it('should support once listeners', () => {
      let callCount = 0;

      gameServer.once('test-event', () => {
        callCount++;
      });

      gameServer.emit('test-event');
      gameServer.emit('test-event');
      gameServer.emit('test-event');

      expect(callCount).toBe(1);
    });

    it('should support removing listeners', () => {
      let callCount = 0;

      const listener = () => {
        callCount++;
      };

      gameServer.on('test-event', listener);
      gameServer.emit('test-event');
      expect(callCount).toBe(1);

      gameServer.off('test-event', listener);
      gameServer.emit('test-event');
      expect(callCount).toBe(1); // Should still be 1, not 2
    });

    it('should support removing all listeners', () => {
      let callCount = 0;

      gameServer.on('test-event', () => {
        callCount++;
      });

      gameServer.on('test-event', () => {
        callCount++;
      });

      gameServer.emit('test-event');
      expect(callCount).toBe(2);

      gameServer.removeAllListeners('test-event');
      gameServer.emit('test-event');
      expect(callCount).toBe(2); // Should still be 2, not 4
    });
  });

  describe('No Breaking Changes', () => {
    it('should maintain existing GameServer API', () => {
      // Verify existing methods still exist
      expect(typeof gameServer.getGameState).toBe('function');
      expect(typeof gameServer.addPlayer).toBe('function');
      expect(typeof gameServer.movePlayer).toBe('function');
      expect(typeof gameServer.getPlayerCount).toBe('function');
    });

    it('should maintain existing GameServer functionality', () => {
      const playerId = 'test-player';
      const playerName = 'Test Player';
      const clientId = 'test-client';

      const added = gameServer.addPlayer(playerId, playerName, clientId);
      expect(added).toBe(true);
      expect(gameServer.getPlayerCount()).toBe(1);

      const moved = gameServer.movePlayer(playerId, 1, 0);
      expect(moved).toBe(true);

      const state = gameServer.getGameState();
      expect(state).toHaveProperty('board');
      expect(state).toHaveProperty('players');
      expect(state.players).toHaveLength(1);
    });
  });
});

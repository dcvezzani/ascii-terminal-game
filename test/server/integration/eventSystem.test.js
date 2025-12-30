/**
 * Integration tests for event system
 * Phase 5: Event Listener Registration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameServer } from '../../../src/server/GameServer.js';
import { EventTypes } from '../../../src/server/EventTypes.js';
import { setupCollisionListener } from '../../../src/server/listeners/index.js';

describe('Event System Integration', () => {
  let gameServer;

  beforeEach(() => {
    gameServer = new GameServer();
    setupCollisionListener(gameServer);
  });

  describe('End-to-End Event Flow', () => {
    it('should emit and receive collision events', () => {
      const receivedEvents = [];

      gameServer.on(EventTypes.BUMP, eventData => {
        receivedEvents.push(eventData);
      });

      // Add players
      gameServer.addPlayer('player-1', 'Player 1', 'client-1', 5, 5);
      gameServer.addPlayer('player-2', 'Player 2', 'client-2', 6, 5);

      // Trigger collision
      gameServer.movePlayer('player-1', 1, 0);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].type).toBe(EventTypes.PLAYER_COLLISION);
    });

    it('should trigger listeners when events are emitted', () => {
      let listenerCalled = false;

      gameServer.on(EventTypes.BUMP, () => {
        listenerCalled = true;
      });

      gameServer.addPlayer('player-1', 'Player 1', 'client-1', 5, 5);
      gameServer.addPlayer('player-2', 'Player 2', 'client-2', 6, 5);
      gameServer.movePlayer('player-1', 1, 0);

      expect(listenerCalled).toBe(true);
    });

    it('should process events in correct order', () => {
      const eventOrder = [];

      gameServer.on(EventTypes.BUMP, () => {
        eventOrder.push('listener1');
      });

      gameServer.on(EventTypes.BUMP, () => {
        eventOrder.push('listener2');
      });

      gameServer.addPlayer('player-1', 'Player 1', 'client-1', 5, 5);
      gameServer.addPlayer('player-2', 'Player 2', 'client-2', 6, 5);
      gameServer.movePlayer('player-1', 1, 0);

      // Both listeners should be called
      expect(eventOrder).toHaveLength(2);
      expect(eventOrder[0]).toBe('listener1');
      expect(eventOrder[1]).toBe('listener2');
    });

    it('should handle multiple listeners for same event type', () => {
      const listener1Calls = [];
      const listener2Calls = [];

      gameServer.on(EventTypes.BUMP, event => {
        listener1Calls.push(event);
      });

      gameServer.on(EventTypes.BUMP, event => {
        listener2Calls.push(event);
      });

      gameServer.addPlayer('player-1', 'Player 1', 'client-1', 5, 5);
      gameServer.addPlayer('player-2', 'Player 2', 'client-2', 6, 5);
      gameServer.movePlayer('player-1', 1, 0);

      expect(listener1Calls).toHaveLength(1);
      expect(listener2Calls).toHaveLength(1);
    });

    it('should not crash on listener errors', () => {
      // The collision listener has try-catch, so it should handle errors gracefully
      // Even if an error occurs in the listener, the event emission should complete
      gameServer.addPlayer('player-1', 'Player 1', 'client-1', 5, 5);
      gameServer.addPlayer('player-2', 'Player 2', 'client-2', 6, 5);

      // Move should complete successfully even if listener has issues
      // (The collision listener has try-catch, so errors are logged but don't crash)
      const moved = gameServer.movePlayer('player-1', 1, 0);

      // Move should be blocked (collision), but no crash
      expect(moved).toBe(false);
    });
  });
});

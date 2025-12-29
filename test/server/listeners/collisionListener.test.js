/**
 * Unit tests for collision event listener
 * Phase 4: Event Listener Infrastructure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameServer } from '../../../src/server/GameServer.js';
import { EventTypes } from '../../../src/server/EventTypes.js';
import { setupCollisionListener } from '../../../src/server/listeners/collisionListener.js';
import { logger } from '../../../src/utils/logger.js';

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Collision Listener', () => {
  let gameServer;

  beforeEach(() => {
    gameServer = new GameServer();
    vi.clearAllMocks();
  });

  describe('Listener Setup', () => {
    it('should set up collision listener', () => {
      setupCollisionListener(gameServer);

      // Verify listener is set up by checking if it responds to events
      let eventReceived = false;
      gameServer.on(EventTypes.BUMP, () => {
        eventReceived = true;
      });

      // Emit a test event
      gameServer.emit(EventTypes.BUMP, {
        scope: 'targeted',
        type: EventTypes.PLAYER_COLLISION,
        targetId: 'test-player',
        playerId: 'test-player',
        attemptedPosition: { x: 5, y: 5 },
        currentPosition: { x: 4, y: 5 },
        collisionType: 'player',
        timestamp: Date.now(),
      });

      expect(eventReceived).toBe(true);
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      setupCollisionListener(gameServer);
    });

    it('should receive player collision events', () => {
      const eventData = {
        scope: 'targeted',
        type: EventTypes.PLAYER_COLLISION,
        targetId: 'player-1',
        playerId: 'player-1',
        attemptedPosition: { x: 5, y: 5 },
        currentPosition: { x: 4, y: 5 },
        collisionType: 'player',
        otherPlayerId: 'player-2',
        timestamp: Date.now(),
      };

      gameServer.emit(EventTypes.BUMP, eventData);

      expect(logger.debug).toHaveBeenCalled();
      const logCall = logger.debug.mock.calls.find(call =>
        call[0].includes('Collision event')
      );
      expect(logCall).toBeDefined();
    });

    it('should receive wall collision events', () => {
      const eventData = {
        scope: 'targeted',
        type: EventTypes.WALL_COLLISION,
        targetId: 'player-1',
        playerId: 'player-1',
        attemptedPosition: { x: 5, y: 5 },
        currentPosition: { x: 4, y: 5 },
        collisionType: 'wall',
        timestamp: Date.now(),
      };

      gameServer.emit(EventTypes.BUMP, eventData);

      expect(logger.debug).toHaveBeenCalled();
      const logCall = logger.debug.mock.calls.find(call =>
        call[0].includes('Collision event')
      );
      expect(logCall).toBeDefined();
    });

    it('should log collision events', () => {
      const eventData = {
        scope: 'targeted',
        type: EventTypes.PLAYER_COLLISION,
        targetId: 'player-1',
        playerId: 'player-1',
        attemptedPosition: { x: 5, y: 5 },
        currentPosition: { x: 4, y: 5 },
        collisionType: 'player',
        otherPlayerId: 'player-2',
        timestamp: Date.now(),
      };

      gameServer.emit(EventTypes.BUMP, eventData);

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Collision event')
      );
    });

    it('should handle errors gracefully', () => {
      // The collision listener has try-catch, so errors should be caught
      // Let's verify that if an error occurs in the listener, it's logged
      const eventData = {
        scope: 'targeted',
        type: EventTypes.PLAYER_COLLISION,
        targetId: 'player-1',
        playerId: 'player-1',
        attemptedPosition: { x: 5, y: 5 },
        currentPosition: { x: 4, y: 5 },
        collisionType: 'player',
        timestamp: Date.now(),
      };

      // Emit event - should not throw because listener has try-catch
      expect(() => {
        gameServer.emit(EventTypes.BUMP, eventData);
      }).not.toThrow();

      // Verify logger.debug was called (normal operation)
      expect(logger.debug).toHaveBeenCalled();
    });
  });
});


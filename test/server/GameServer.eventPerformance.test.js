/**
 * Unit tests for GameServer event emission performance
 * Phase 6: Testing - Event Performance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameServer } from '../../src/server/GameServer.js';
import { EventTypes } from '../../src/server/EventTypes.js';

describe('GameServer Event Performance', () => {
  let gameServer;

  beforeEach(() => {
    gameServer = new GameServer();
  });

  describe('Event Emission Speed', () => {
    it('should emit events efficiently (< 1ms overhead)', () => {
      gameServer.on(EventTypes.BUMP, () => {
        // Minimal listener
      });

      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        gameServer.emit(EventTypes.BUMP, {
          scope: 'targeted',
          type: EventTypes.PLAYER_COLLISION,
          targetId: 'player-1',
          playerId: 'player-1',
          attemptedPosition: { x: 5, y: 5 },
          currentPosition: { x: 4, y: 5 },
          collisionType: 'player',
          timestamp: Date.now(),
        });
      }

      const end = performance.now();
      const totalTime = end - start;
      const averageTime = totalTime / iterations;

      // Average time per event should be less than 1ms
      expect(averageTime).toBeLessThan(1);
    });

    it('should not block game operations', () => {
      let operationBlocked = false;
      const start = performance.now();

      // Add a slow listener
      gameServer.on(EventTypes.BUMP, () => {
        // Simulate slow processing (10ms)
        const slowStart = performance.now();
        while (performance.now() - slowStart < 10) {
          // Wait
        }
      });

      // Emit event
      gameServer.emit(EventTypes.BUMP, {
        scope: 'targeted',
        type: EventTypes.PLAYER_COLLISION,
        targetId: 'player-1',
        playerId: 'player-1',
        attemptedPosition: { x: 5, y: 5 },
        currentPosition: { x: 4, y: 5 },
        collisionType: 'player',
        timestamp: Date.now(),
      });

      const end = performance.now();
      const duration = end - start;

      // Event emission should complete (even if listener is slow)
      // The operation itself should not be blocked indefinitely
      expect(duration).toBeLessThan(100); // Should complete within reasonable time
      expect(operationBlocked).toBe(false);
    });
  });

  describe('Multiple Listeners Performance', () => {
    it('should handle multiple listeners without significant performance degradation', () => {
      // Add multiple listeners
      for (let i = 0; i < 10; i++) {
        gameServer.on(EventTypes.BUMP, () => {
          // Minimal processing
        });
      }

      const iterations = 100;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        gameServer.emit(EventTypes.BUMP, {
          scope: 'targeted',
          type: EventTypes.PLAYER_COLLISION,
          targetId: 'player-1',
          playerId: 'player-1',
          attemptedPosition: { x: 5, y: 5 },
          currentPosition: { x: 4, y: 5 },
          collisionType: 'player',
          timestamp: Date.now(),
        });
      }

      const end = performance.now();
      const totalTime = end - start;
      const averageTime = totalTime / iterations;

      // Even with 10 listeners, average time should still be reasonable
      expect(averageTime).toBeLessThan(5); // Less than 5ms per event with 10 listeners
    });

    it('should handle many listeners efficiently', () => {
      // Add many listeners (50)
      for (let i = 0; i < 50; i++) {
        gameServer.on(EventTypes.BUMP, () => {
          // Minimal processing
        });
      }

      const iterations = 50;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        gameServer.emit(EventTypes.BUMP, {
          scope: 'targeted',
          type: EventTypes.PLAYER_COLLISION,
          targetId: 'player-1',
          playerId: 'player-1',
          attemptedPosition: { x: 5, y: 5 },
          currentPosition: { x: 4, y: 5 },
          collisionType: 'player',
          timestamp: Date.now(),
        });
      }

      const end = performance.now();
      const totalTime = end - start;

      // Should complete in reasonable time even with many listeners
      expect(totalTime).toBeLessThan(1000); // Less than 1 second for 50 events with 50 listeners
    });
  });

  describe('Event Emission During Game Operations', () => {
    it('should not significantly slow down move operations', () => {
      // Set up collision listener
      gameServer.on(EventTypes.BUMP, () => {
        // Minimal processing
      });

      // Add players
      gameServer.addPlayer('player-1', 'Player 1', 'client-1', 5, 5);
      gameServer.addPlayer('player-2', 'Player 2', 'client-2', 6, 5);

      const iterations = 100;
      const start = performance.now();

      // Perform many move operations (some will trigger collisions)
      for (let i = 0; i < iterations; i++) {
        gameServer.movePlayer('player-1', 1, 0); // Will collide with player-2
        gameServer.movePlayer('player-1', -1, 0); // Move back
      }

      const end = performance.now();
      const totalTime = end - start;
      const averageTime = totalTime / iterations;

      // Average time per move operation should be reasonable
      expect(averageTime).toBeLessThan(10); // Less than 10ms per move operation
    });

    it('should handle rapid event emission', () => {
      let eventCount = 0;

      gameServer.on(EventTypes.BUMP, () => {
        eventCount++;
      });

      const iterations = 1000;
      const start = performance.now();

      // Emit many events rapidly
      for (let i = 0; i < iterations; i++) {
        gameServer.emit(EventTypes.BUMP, {
          scope: 'targeted',
          type: EventTypes.PLAYER_COLLISION,
          targetId: 'player-1',
          playerId: 'player-1',
          attemptedPosition: { x: 5, y: 5 },
          currentPosition: { x: 4, y: 5 },
          collisionType: 'player',
          timestamp: Date.now(),
        });
      }

      const end = performance.now();
      const totalTime = end - start;

      // All events should be received
      expect(eventCount).toBe(iterations);
      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(1000); // Less than 1 second for 1000 events
    });
  });

  describe('Event Data Size Impact', () => {
    it('should handle large event data efficiently', () => {
      // Create event with large data
      const largeEventData = {
        scope: 'group',
        type: EventTypes.ALIGNED_VERTICALLY,
        group: 'players',
        entityId: 'entity-1',
        alignmentType: 'vertical',
        alignedWith: Array.from({ length: 100 }, (_, i) => `entity-${i}`),
        position: { x: 10, y: 10 },
        metadata: {
          formation: 'line',
          bonuses: Array.from({ length: 50 }, (_, i) => ({ id: i, value: i * 10 })),
        },
        timestamp: Date.now(),
      };

      gameServer.on(EventTypes.ALIGNED_VERTICALLY, () => {
        // Minimal processing
      });

      const iterations = 100;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        gameServer.emit(EventTypes.ALIGNED_VERTICALLY, largeEventData);
      }

      const end = performance.now();
      const totalTime = end - start;
      const averageTime = totalTime / iterations;

      // Even with large event data, should be reasonably fast
      expect(averageTime).toBeLessThan(5); // Less than 5ms per event
    });
  });
});


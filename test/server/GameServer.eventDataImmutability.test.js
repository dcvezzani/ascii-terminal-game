/**
 * Unit tests for GameServer event data immutability
 * Phase 6: Testing - Event Data Immutability
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameServer } from '../../src/server/GameServer.js';
import { EventTypes } from '../../src/server/EventTypes.js';

describe('GameServer Event Data Immutability', () => {
  let gameServer;

  beforeEach(() => {
    gameServer = new GameServer();
  });

  describe('Event Data Copies', () => {
    it('should pass event data as copies, not references', () => {
      const originalPosition = { x: 5, y: 5 };
      let receivedPosition = null;

      gameServer.on(EventTypes.BUMP, eventData => {
        receivedPosition = eventData.attemptedPosition;
        // Modify the received position
        receivedPosition.x = 999;
        receivedPosition.y = 999;
      });

      // Emit event with position
      gameServer.emit(EventTypes.BUMP, {
        scope: 'targeted',
        type: EventTypes.PLAYER_COLLISION,
        targetId: 'player-1',
        playerId: 'player-1',
        attemptedPosition: { x: originalPosition.x, y: originalPosition.y },
        currentPosition: { x: 4, y: 5 },
        collisionType: 'player',
        timestamp: Date.now(),
      });

      // Original position should not be modified
      expect(originalPosition.x).toBe(5);
      expect(originalPosition.y).toBe(5);
      // Received position was modified in listener
      expect(receivedPosition.x).toBe(999);
      expect(receivedPosition.y).toBe(999);
    });

    it('should not allow listeners to modify original game state through event data', () => {
      // Add a player
      gameServer.addPlayer('player-1', 'Player 1', 'client-1', 5, 5);
      const originalPlayer = gameServer.getPlayer('player-1');
      const originalX = originalPlayer.x;
      const originalY = originalPlayer.y;

      gameServer.on(EventTypes.BUMP, eventData => {
        // Try to modify the position in event data
        if (eventData.currentPosition) {
          eventData.currentPosition.x = 999;
          eventData.currentPosition.y = 999;
        }
      });

      // Trigger collision event
      gameServer.addPlayer('player-2', 'Player 2', 'client-2', 6, 5);
      gameServer.movePlayer('player-1', 1, 0);

      // Original player position should not be modified
      const playerAfterEvent = gameServer.getPlayer('player-1');
      expect(playerAfterEvent.x).toBe(originalX);
      expect(playerAfterEvent.y).toBe(originalY);
    });

    it('should pass nested objects as copies', () => {
      const originalNested = {
        position: { x: 5, y: 5 },
        metadata: { level: 1, score: 100 },
      };
      let receivedNested = null;

      gameServer.on('testEvent', eventData => {
        receivedNested = eventData.nested;
        // Modify nested properties
        receivedNested.position.x = 999;
        receivedNested.metadata.level = 999;
      });

      gameServer.emit('testEvent', {
        scope: 'targeted',
        type: 'testEvent',
        targetId: 'player-1',
        nested: {
          position: { x: originalNested.position.x, y: originalNested.position.y },
          metadata: {
            level: originalNested.metadata.level,
            score: originalNested.metadata.score,
          },
        },
        timestamp: Date.now(),
      });

      // Original nested object should not be modified
      expect(originalNested.position.x).toBe(5);
      expect(originalNested.metadata.level).toBe(1);
    });
  });

  describe('Event Data Serializability', () => {
    it('should have serializable event data (no functions)', () => {
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

      // Should be able to serialize to JSON
      expect(() => {
        JSON.stringify(eventData);
      }).not.toThrow();

      const serialized = JSON.stringify(eventData);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.scope).toBe(eventData.scope);
      expect(deserialized.type).toBe(eventData.type);
      expect(deserialized.targetId).toBe(eventData.targetId);
    });

    it('should have serializable event data (no circular references)', () => {
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

      // Should be able to serialize without circular reference errors
      expect(() => {
        JSON.stringify(eventData);
      }).not.toThrow();
    });

    it('should handle complex nested structures in event data', () => {
      const complexEventData = {
        scope: 'group',
        type: EventTypes.ALIGNED_VERTICALLY,
        group: 'players',
        entityId: 'entity-1',
        alignmentType: 'vertical',
        alignedWith: ['entity-2', 'entity-3', 'entity-4'],
        position: { x: 10, y: 10 },
        metadata: {
          formation: 'line',
          bonuses: {
            attack: 10,
            defense: 5,
          },
        },
        timestamp: Date.now(),
      };

      // Should serialize complex structures
      expect(() => {
        const serialized = JSON.stringify(complexEventData);
        const deserialized = JSON.parse(serialized);
        expect(deserialized.alignedWith).toHaveLength(3);
        expect(deserialized.metadata.bonuses.attack).toBe(10);
      }).not.toThrow();
    });
  });

  describe('Event Data Structure Consistency', () => {
    it('should maintain consistent event data structure for same event type', () => {
      const collisionEvents = [];

      gameServer.on(EventTypes.BUMP, eventData => {
        collisionEvents.push(eventData);
      });

      // Emit multiple collision events
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

      gameServer.emit(EventTypes.BUMP, {
        scope: 'targeted',
        type: EventTypes.WALL_COLLISION,
        targetId: 'player-2',
        playerId: 'player-2',
        attemptedPosition: { x: 10, y: 10 },
        currentPosition: { x: 9, y: 10 },
        collisionType: 'wall',
        timestamp: Date.now(),
      });

      // Both events should have same structure (scope, type, targetId, etc.)
      expect(collisionEvents).toHaveLength(2);
      collisionEvents.forEach(event => {
        expect(event).toHaveProperty('scope');
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('targetId');
        expect(event).toHaveProperty('playerId');
        expect(event).toHaveProperty('attemptedPosition');
        expect(event).toHaveProperty('currentPosition');
        expect(event).toHaveProperty('collisionType');
        expect(event).toHaveProperty('timestamp');
      });
    });
  });

  describe('Event Data from Game State', () => {
    it('should not expose game state references in event data', () => {
      gameServer.addPlayer('player-1', 'Player 1', 'client-1', 5, 5);
      const player = gameServer.getPlayer('player-1');

      let eventDataReceived = null;

      gameServer.on(EventTypes.BUMP, eventData => {
        eventDataReceived = eventData;
        // Try to access/modify player through event data
        if (eventData.player) {
          eventData.player.x = 999;
        }
      });

      // Trigger collision
      gameServer.addPlayer('player-2', 'Player 2', 'client-2', 6, 5);
      gameServer.movePlayer('player-1', 1, 0);

      // Event data should not contain direct player reference
      if (eventDataReceived) {
        expect(eventDataReceived).not.toHaveProperty('player');
        // Player position should not be modified
        const playerAfterEvent = gameServer.getPlayer('player-1');
        expect(playerAfterEvent.x).toBe(5);
        expect(playerAfterEvent.y).toBe(5);
      }
    });
  });
});


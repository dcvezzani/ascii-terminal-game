/**
 * Unit tests for GameServer event scoping
 * Phase 6: Testing - Event Scoping
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameServer } from '../../src/server/GameServer.js';
import { EventTypes } from '../../src/server/EventTypes.js';

describe('GameServer Event Scoping', () => {
  let gameServer;

  beforeEach(() => {
    gameServer = new GameServer();
  });

  describe('Global Events', () => {
    it('should support global events', () => {
      const receivedEvents = [];

      gameServer.on(EventTypes.GAME_STATE_CHANGE, eventData => {
        receivedEvents.push(eventData);
      });

      // Emit a global event
      gameServer.emit(EventTypes.GAME_STATE_CHANGE, {
        scope: 'global',
        type: EventTypes.GAME_STATE_CHANGE,
        stateType: 'paused',
        paused: true,
        timestamp: Date.now(),
      });

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].scope).toBe('global');
      expect(receivedEvents[0].type).toBe(EventTypes.GAME_STATE_CHANGE);
      expect(receivedEvents[0]).not.toHaveProperty('targetId');
      expect(receivedEvents[0]).not.toHaveProperty('group');
    });

    it('should allow listeners to filter global events', () => {
      const globalEvents = [];
      const otherEvents = [];

      gameServer.on(EventTypes.GAME_STATE_CHANGE, eventData => {
        if (eventData.scope === 'global') {
          globalEvents.push(eventData);
        } else {
          otherEvents.push(eventData);
        }
      });

      // Emit global event
      gameServer.emit(EventTypes.GAME_STATE_CHANGE, {
        scope: 'global',
        type: EventTypes.GAME_STATE_CHANGE,
        stateType: 'paused',
        paused: true,
        timestamp: Date.now(),
      });

      // Emit targeted event
      gameServer.emit(EventTypes.GAME_STATE_CHANGE, {
        scope: 'targeted',
        type: EventTypes.GAME_STATE_CHANGE,
        targetId: 'player-1',
        stateType: 'score',
        timestamp: Date.now(),
      });

      expect(globalEvents).toHaveLength(1);
      expect(otherEvents).toHaveLength(1);
      expect(globalEvents[0].scope).toBe('global');
      expect(otherEvents[0].scope).toBe('targeted');
    });
  });

  describe('Group Events', () => {
    it('should support group events', () => {
      const receivedEvents = [];

      gameServer.on(EventTypes.ALIGNED_VERTICALLY, eventData => {
        receivedEvents.push(eventData);
      });

      // Emit a group event
      gameServer.emit(EventTypes.ALIGNED_VERTICALLY, {
        scope: 'group',
        type: EventTypes.ALIGNED_VERTICALLY,
        group: 'players',
        entityId: 'entity-1',
        alignmentType: 'vertical',
        alignedWith: ['entity-2', 'entity-3'],
        position: { x: 5, y: 5 },
        timestamp: Date.now(),
      });

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].scope).toBe('group');
      expect(receivedEvents[0].group).toBe('players');
      expect(receivedEvents[0]).not.toHaveProperty('targetId');
    });

    it('should allow listeners to filter group events by group identifier', () => {
      const playerGroupEvents = [];
      const entityGroupEvents = [];

      // Use a custom event type for testing
      const testEventType = 'testGroupEvent';

      gameServer.on(testEventType, eventData => {
        if (eventData.scope === 'group' && eventData.group === 'players') {
          playerGroupEvents.push(eventData);
        } else if (eventData.scope === 'group' && eventData.group === 'entities') {
          entityGroupEvents.push(eventData);
        }
      });

      // Emit group event for players
      gameServer.emit(testEventType, {
        scope: 'group',
        type: testEventType,
        group: 'players',
        area: { x: 10, y: 10, radius: 5 },
        damage: 10,
        timestamp: Date.now(),
      });

      // Emit group event for entities
      gameServer.emit(testEventType, {
        scope: 'group',
        type: testEventType,
        group: 'entities',
        area: { x: 10, y: 10, radius: 5 },
        damage: 10,
        timestamp: Date.now(),
      });

      expect(playerGroupEvents).toHaveLength(1);
      expect(entityGroupEvents).toHaveLength(1);
      expect(playerGroupEvents[0].group).toBe('players');
      expect(entityGroupEvents[0].group).toBe('entities');
    });

    it('should support dynamic group identifiers', () => {
      const customGroupEvents = [];

      gameServer.on('customGroupEvent', eventData => {
        if (eventData.scope === 'group' && eventData.group === 'custom-group') {
          customGroupEvents.push(eventData);
        }
      });

      // Emit group event with custom group identifier
      gameServer.emit('customGroupEvent', {
        scope: 'group',
        type: 'customGroupEvent',
        group: 'custom-group',
        data: 'test',
        timestamp: Date.now(),
      });

      expect(customGroupEvents).toHaveLength(1);
      expect(customGroupEvents[0].group).toBe('custom-group');
    });
  });

  describe('Targeted Events', () => {
    it('should support targeted events', () => {
      const receivedEvents = [];

      gameServer.on(EventTypes.BUMP, eventData => {
        receivedEvents.push(eventData);
      });

      // Emit a targeted event (collision event)
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

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].scope).toBe('targeted');
      expect(receivedEvents[0].targetId).toBe('player-1');
      expect(receivedEvents[0]).not.toHaveProperty('group');
    });

    it('should allow listeners to filter targeted events by targetId', () => {
      const player1Events = [];
      const player2Events = [];

      gameServer.on(EventTypes.SHOT, eventData => {
        if (eventData.scope === 'targeted' && eventData.targetId === 'player-1') {
          player1Events.push(eventData);
        } else if (eventData.scope === 'targeted' && eventData.targetId === 'player-2') {
          player2Events.push(eventData);
        }
      });

      // Emit targeted event for player-1
      gameServer.emit(EventTypes.SHOT, {
        scope: 'targeted',
        type: EventTypes.SHOT,
        targetId: 'player-1',
        attackerId: 'enemy-1',
        damage: 10,
        position: { x: 5, y: 5 },
        timestamp: Date.now(),
      });

      // Emit targeted event for player-2
      gameServer.emit(EventTypes.SHOT, {
        scope: 'targeted',
        type: EventTypes.SHOT,
        targetId: 'player-2',
        attackerId: 'enemy-1',
        damage: 10,
        position: { x: 6, y: 6 },
        timestamp: Date.now(),
      });

      expect(player1Events).toHaveLength(1);
      expect(player2Events).toHaveLength(1);
      expect(player1Events[0].targetId).toBe('player-1');
      expect(player2Events[0].targetId).toBe('player-2');
    });

    it('should support targeted events for entities (not just players)', () => {
      const entityEvents = [];

      gameServer.on(EventTypes.SPAWN, eventData => {
        if (eventData.scope === 'targeted' && eventData.targetId.startsWith('entity-')) {
          entityEvents.push(eventData);
        }
      });

      // Emit targeted event for an entity
      gameServer.emit(EventTypes.SPAWN, {
        scope: 'targeted',
        type: EventTypes.SPAWN,
        targetId: 'entity-123',
        entityId: 'entity-123',
        entityType: 'enemy',
        position: { x: 10, y: 10 },
        timestamp: Date.now(),
      });

      expect(entityEvents).toHaveLength(1);
      expect(entityEvents[0].targetId).toBe('entity-123');
    });
  });

  describe('Scope Filtering in Listeners', () => {
    it('should allow listeners to filter by scope', () => {
      const globalEvents = [];
      const groupEvents = [];
      const targetedEvents = [];

      gameServer.on('testEvent', eventData => {
        if (eventData.scope === 'global') {
          globalEvents.push(eventData);
        } else if (eventData.scope === 'group') {
          groupEvents.push(eventData);
        } else if (eventData.scope === 'targeted') {
          targetedEvents.push(eventData);
        }
      });

      // Emit events with different scopes
      gameServer.emit('testEvent', {
        scope: 'global',
        type: 'testEvent',
        timestamp: Date.now(),
      });

      gameServer.emit('testEvent', {
        scope: 'group',
        type: 'testEvent',
        group: 'players',
        timestamp: Date.now(),
      });

      gameServer.emit('testEvent', {
        scope: 'targeted',
        type: 'testEvent',
        targetId: 'player-1',
        timestamp: Date.now(),
      });

      expect(globalEvents).toHaveLength(1);
      expect(groupEvents).toHaveLength(1);
      expect(targetedEvents).toHaveLength(1);
    });

    it('should support multiple listeners with different scope filters', () => {
      const globalListenerCalls = [];
      const targetedListenerCalls = [];

      gameServer.on('multiScopeEvent', eventData => {
        if (eventData.scope === 'global') {
          globalListenerCalls.push(eventData);
        }
      });

      gameServer.on('multiScopeEvent', eventData => {
        if (eventData.scope === 'targeted') {
          targetedListenerCalls.push(eventData);
        }
      });

      // Emit events
      gameServer.emit('multiScopeEvent', {
        scope: 'global',
        type: 'multiScopeEvent',
        timestamp: Date.now(),
      });

      gameServer.emit('multiScopeEvent', {
        scope: 'targeted',
        type: 'multiScopeEvent',
        targetId: 'player-1',
        timestamp: Date.now(),
      });

      expect(globalListenerCalls).toHaveLength(1);
      expect(targetedListenerCalls).toHaveLength(1);
    });
  });
});

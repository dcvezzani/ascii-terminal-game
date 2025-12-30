/**
 * Unit tests for state comparison utilities
 * Tests Phase 2: State Comparison Utilities
 */

import { describe, test, expect } from 'vitest';
import {
  comparePlayers,
  compareEntities,
  compareScore,
  compareStates,
} from '../../src/utils/stateComparison.js';

describe('State Comparison Utilities - Phase 2', () => {
  describe('comparePlayers', () => {
    test('should detect moved players', () => {
      const previousPlayers = [
        { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
        { playerId: 'player-2', x: 10, y: 10, playerName: 'Player 2' },
      ];
      const currentPlayers = [
        { playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' }, // Moved
        { playerId: 'player-2', x: 10, y: 11, playerName: 'Player 2' }, // Moved
      ];

      const result = comparePlayers(previousPlayers, currentPlayers);

      expect(result.moved).toHaveLength(2);
      expect(result.moved[0]).toEqual({
        playerId: 'player-1',
        oldX: 5,
        oldY: 5,
        newX: 6,
        newY: 5,
      });
      expect(result.moved[1]).toEqual({
        playerId: 'player-2',
        oldX: 10,
        oldY: 10,
        newX: 10,
        newY: 11,
      });
      expect(result.joined).toHaveLength(0);
      expect(result.left).toHaveLength(0);
    });

    test('should detect joined players', () => {
      const previousPlayers = [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }];
      const currentPlayers = [
        { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
        { playerId: 'player-2', x: 10, y: 10, playerName: 'Player 2' }, // Joined
      ];

      const result = comparePlayers(previousPlayers, currentPlayers);

      expect(result.joined).toHaveLength(1);
      expect(result.joined[0]).toEqual({
        playerId: 'player-2',
        x: 10,
        y: 10,
        playerName: 'Player 2',
      });
      expect(result.moved).toHaveLength(0);
      expect(result.left).toHaveLength(0);
    });

    test('should detect left players', () => {
      const previousPlayers = [
        { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
        { playerId: 'player-2', x: 10, y: 10, playerName: 'Player 2' },
      ];
      const currentPlayers = [
        { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
        // player-2 left
      ];

      const result = comparePlayers(previousPlayers, currentPlayers);

      expect(result.left).toHaveLength(1);
      expect(result.left[0]).toEqual({
        playerId: 'player-2',
        x: 10,
        y: 10,
      });
      expect(result.moved).toHaveLength(0);
      expect(result.joined).toHaveLength(0);
    });

    test('should handle empty arrays', () => {
      const result1 = comparePlayers([], []);
      expect(result1.moved).toHaveLength(0);
      expect(result1.joined).toHaveLength(0);
      expect(result1.left).toHaveLength(0);

      const result2 = comparePlayers(
        [],
        [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }]
      );
      expect(result2.joined).toHaveLength(1);

      const result3 = comparePlayers(
        [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        []
      );
      expect(result3.left).toHaveLength(1);
    });

    test('should handle null/undefined arrays', () => {
      const result1 = comparePlayers(null, []);
      expect(result1.moved).toHaveLength(0);
      expect(result1.joined).toHaveLength(0);
      expect(result1.left).toHaveLength(0);

      const result2 = comparePlayers([], undefined);
      expect(result2.moved).toHaveLength(0);
      expect(result2.joined).toHaveLength(0);
      expect(result2.left).toHaveLength(0);
    });

    test('should handle complex scenario with moves, joins, and leaves', () => {
      const previousPlayers = [
        { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
        { playerId: 'player-2', x: 10, y: 10, playerName: 'Player 2' },
      ];
      const currentPlayers = [
        { playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' }, // Moved
        { playerId: 'player-3', x: 15, y: 15, playerName: 'Player 3' }, // Joined
        // player-2 left
      ];

      const result = comparePlayers(previousPlayers, currentPlayers);

      expect(result.moved).toHaveLength(1);
      expect(result.joined).toHaveLength(1);
      expect(result.left).toHaveLength(1);
    });
  });

  describe('compareEntities', () => {
    test('should detect moved entities', () => {
      const previousEntities = [
        { entityId: 'entity-1', x: 5, y: 5, entityType: 'enemy' },
        { entityId: 'entity-2', x: 10, y: 10, entityType: 'collectible' },
      ];
      const currentEntities = [
        { entityId: 'entity-1', x: 6, y: 5, entityType: 'enemy' }, // Moved
        { entityId: 'entity-2', x: 10, y: 11, entityType: 'collectible' }, // Moved
      ];

      const result = compareEntities(previousEntities, currentEntities);

      expect(result.moved).toHaveLength(2);
      expect(result.moved[0]).toEqual({
        entityId: 'entity-1',
        oldX: 5,
        oldY: 5,
        newX: 6,
        newY: 5,
        entityType: 'enemy',
      });
      expect(result.moved[1]).toEqual({
        entityId: 'entity-2',
        oldX: 10,
        oldY: 10,
        newX: 10,
        newY: 11,
        entityType: 'collectible',
      });
      expect(result.spawned).toHaveLength(0);
      expect(result.despawned).toHaveLength(0);
      expect(result.animated).toHaveLength(0);
    });

    test('should detect spawned entities', () => {
      const previousEntities = [{ entityId: 'entity-1', x: 5, y: 5, entityType: 'enemy' }];
      const currentEntities = [
        { entityId: 'entity-1', x: 5, y: 5, entityType: 'enemy' },
        {
          entityId: 'entity-2',
          x: 10,
          y: 10,
          entityType: 'collectible',
          glyph: 'G',
          animationFrame: 0,
        }, // Spawned
      ];

      const result = compareEntities(previousEntities, currentEntities);

      expect(result.spawned).toHaveLength(1);
      expect(result.spawned[0]).toEqual({
        entityId: 'entity-2',
        x: 10,
        y: 10,
        entityType: 'collectible',
        glyph: 'G',
        animationFrame: 0,
      });
      expect(result.moved).toHaveLength(0);
      expect(result.despawned).toHaveLength(0);
      expect(result.animated).toHaveLength(0);
    });

    test('should detect despawned entities', () => {
      const previousEntities = [
        { entityId: 'entity-1', x: 5, y: 5, entityType: 'enemy' },
        { entityId: 'entity-2', x: 10, y: 10, entityType: 'collectible' },
      ];
      const currentEntities = [
        { entityId: 'entity-1', x: 5, y: 5, entityType: 'enemy' },
        // entity-2 despawned
      ];

      const result = compareEntities(previousEntities, currentEntities);

      expect(result.despawned).toHaveLength(1);
      expect(result.despawned[0]).toEqual({
        entityId: 'entity-2',
        x: 10,
        y: 10,
      });
      expect(result.moved).toHaveLength(0);
      expect(result.spawned).toHaveLength(0);
      expect(result.animated).toHaveLength(0);
    });

    test('should detect animated entities (same position, different glyph/animationFrame)', () => {
      const previousEntities = [
        {
          entityId: 'entity-1',
          x: 5,
          y: 5,
          entityType: 'animated',
          glyph: 'A',
          animationFrame: 0,
        },
      ];
      const currentEntities = [
        {
          entityId: 'entity-1',
          x: 5,
          y: 5,
          entityType: 'animated',
          glyph: 'B',
          animationFrame: 1,
        }, // Animated (same position, different glyph)
      ];

      const result = compareEntities(previousEntities, currentEntities);

      expect(result.animated).toHaveLength(1);
      expect(result.animated[0]).toEqual({
        entityId: 'entity-1',
        x: 5,
        y: 5,
        oldGlyph: 'A',
        newGlyph: 'B',
        animationFrame: 1,
      });
      expect(result.moved).toHaveLength(0);
      expect(result.spawned).toHaveLength(0);
      expect(result.despawned).toHaveLength(0);
    });

    test('should not detect animation if position changed', () => {
      const previousEntities = [
        {
          entityId: 'entity-1',
          x: 5,
          y: 5,
          entityType: 'animated',
          glyph: 'A',
          animationFrame: 0,
        },
      ];
      const currentEntities = [
        {
          entityId: 'entity-1',
          x: 6,
          y: 5,
          entityType: 'animated',
          glyph: 'B',
          animationFrame: 1,
        }, // Moved (position changed, so it's a move, not animation)
      ];

      const result = compareEntities(previousEntities, currentEntities);

      expect(result.moved).toHaveLength(1);
      expect(result.animated).toHaveLength(0);
    });

    test('should handle empty arrays', () => {
      const result1 = compareEntities([], []);
      expect(result1.moved).toHaveLength(0);
      expect(result1.spawned).toHaveLength(0);
      expect(result1.despawned).toHaveLength(0);
      expect(result1.animated).toHaveLength(0);

      const result2 = compareEntities(
        [],
        [{ entityId: 'entity-1', x: 5, y: 5, entityType: 'enemy' }]
      );
      expect(result2.spawned).toHaveLength(1);

      const result3 = compareEntities(
        [{ entityId: 'entity-1', x: 5, y: 5, entityType: 'enemy' }],
        []
      );
      expect(result3.despawned).toHaveLength(1);
    });

    test('should handle null/undefined arrays', () => {
      const result1 = compareEntities(null, []);
      expect(result1.moved).toHaveLength(0);
      expect(result1.spawned).toHaveLength(0);
      expect(result1.despawned).toHaveLength(0);
      expect(result1.animated).toHaveLength(0);

      const result2 = compareEntities([], undefined);
      expect(result2.moved).toHaveLength(0);
      expect(result2.spawned).toHaveLength(0);
      expect(result2.despawned).toHaveLength(0);
      expect(result2.animated).toHaveLength(0);
    });

    test('should handle entities without optional fields', () => {
      const previousEntities = [{ entityId: 'entity-1', x: 5, y: 5, entityType: 'enemy' }];
      const currentEntities = [
        {
          entityId: 'entity-1',
          x: 5,
          y: 5,
          entityType: 'enemy',
          glyph: 'E',
        }, // Added glyph
      ];

      const result = compareEntities(previousEntities, currentEntities);

      // Should detect as animated if position same but glyph added
      expect(result.animated).toHaveLength(1);
      expect(result.animated[0].oldGlyph).toBeUndefined();
      expect(result.animated[0].newGlyph).toBe('E');
    });
  });

  describe('compareScore', () => {
    test('should detect score changes', () => {
      const result = compareScore(0, 100);
      expect(result.changed).toBe(true);
      expect(result.oldScore).toBe(0);
      expect(result.newScore).toBe(100);
    });

    test('should detect no score change', () => {
      const result = compareScore(50, 50);
      expect(result.changed).toBe(false);
      expect(result.oldScore).toBe(50);
      expect(result.newScore).toBe(50);
    });

    test('should handle null/undefined scores', () => {
      const result1 = compareScore(null, 0);
      expect(result1.changed).toBe(true);
      expect(result1.oldScore).toBeNull();
      expect(result1.newScore).toBe(0);

      const result2 = compareScore(0, undefined);
      expect(result2.changed).toBe(true);
      expect(result2.oldScore).toBe(0);
      expect(result2.newScore).toBeUndefined();
    });

    test('should handle zero scores', () => {
      const result = compareScore(0, 0);
      expect(result.changed).toBe(false);
      expect(result.oldScore).toBe(0);
      expect(result.newScore).toBe(0);
    });
  });

  describe('compareStates', () => {
    test('should compare complete states', () => {
      const previousState = {
        board: { width: 20, height: 10, grid: [] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [{ entityId: 'entity-1', x: 3, y: 3, entityType: 'enemy' }],
        score: 0,
      };
      const currentState = {
        board: { width: 20, height: 10, grid: [] },
        players: [
          { playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' }, // Moved
          { playerId: 'player-2', x: 10, y: 10, playerName: 'Player 2' }, // Joined
        ],
        entities: [
          { entityId: 'entity-1', x: 4, y: 3, entityType: 'enemy' }, // Moved
          { entityId: 'entity-2', x: 15, y: 15, entityType: 'collectible' }, // Spawned
        ],
        score: 100, // Changed
      };

      const result = compareStates(previousState, currentState);

      expect(result.players.moved).toHaveLength(1);
      expect(result.players.joined).toHaveLength(1);
      expect(result.players.left).toHaveLength(0);
      expect(result.entities.moved).toHaveLength(1);
      expect(result.entities.spawned).toHaveLength(1);
      expect(result.entities.despawned).toHaveLength(0);
      expect(result.entities.animated).toHaveLength(0);
      expect(result.score.changed).toBe(true);
      expect(result.score.oldScore).toBe(0);
      expect(result.score.newScore).toBe(100);
    });

    test('should handle null/undefined states', () => {
      const currentState = {
        board: { width: 20, height: 10, grid: [] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };

      const result1 = compareStates(null, currentState);
      expect(result1.players.joined).toHaveLength(1);
      expect(result1.entities.spawned).toHaveLength(0);

      const result2 = compareStates(currentState, null);
      expect(result2.players.left).toHaveLength(1);
      expect(result2.entities.despawned).toHaveLength(0);
    });

    test('should handle missing arrays in state', () => {
      const previousState = {
        board: { width: 20, height: 10, grid: [] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        score: 0,
        // entities missing
      };
      const currentState = {
        board: { width: 20, height: 10, grid: [] },
        players: [{ playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' }],
        entities: [{ entityId: 'entity-1', x: 3, y: 3, entityType: 'enemy' }],
        score: 0,
      };

      const result = compareStates(previousState, currentState);

      expect(result.players.moved).toHaveLength(1);
      expect(result.entities.spawned).toHaveLength(1);
    });

    test('should handle empty states', () => {
      const emptyState = {
        board: { width: 20, height: 10, grid: [] },
        players: [],
        entities: [],
        score: 0,
      };

      const result = compareStates(emptyState, emptyState);

      expect(result.players.moved).toHaveLength(0);
      expect(result.players.joined).toHaveLength(0);
      expect(result.players.left).toHaveLength(0);
      expect(result.entities.moved).toHaveLength(0);
      expect(result.entities.spawned).toHaveLength(0);
      expect(result.entities.despawned).toHaveLength(0);
      expect(result.entities.animated).toHaveLength(0);
      expect(result.score.changed).toBe(false);
    });
  });
});

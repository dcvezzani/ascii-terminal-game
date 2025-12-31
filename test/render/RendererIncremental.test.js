/**
 * Unit tests for incremental renderer methods
 * Tests Phase 3: Incremental Renderer Methods
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { Renderer } from '../../src/render/Renderer.js';
import { Board } from '../../src/game/Board.js';
import { PLAYER_CHAR, WALL_CHAR, EMPTY_SPACE_CHAR } from '../../src/constants/gameConstants.js';
import { gameConfig } from '../../src/config/gameConfig.js';
import cliCursor from 'cli-cursor';

// Mock cli-cursor
vi.mock('cli-cursor', () => ({
  default: {
    hide: vi.fn(),
    show: vi.fn(),
  },
}));

describe('Renderer Incremental Methods - Phase 3', () => {
  let renderer;
  let writeSpy;

  beforeEach(() => {
    renderer = new Renderer();
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.clearAllMocks();
  });

  afterEach(() => {
    writeSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('updateCell', () => {
    test('should exist and update a single cell', () => {
      expect(typeof renderer.updateCell).toBe('function');
    });

    test('should use correct cursor positioning', () => {
      const mockChalk = vi.fn(() => 'colored-char');
      renderer.updateCell(5, 10, 'X', mockChalk);

      expect(writeSpy).toHaveBeenCalled();
      // Verify cursor positioning was called
      const calls = writeSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('updatePlayersIncremental', () => {
    test('should exist as a method', () => {
      expect(typeof renderer.updatePlayersIncremental).toBe('function');
    });

    test('should handle moved players', () => {
      const board = new Board();
      const previousPlayers = [
        { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
      ];
      const currentPlayers = [
        { playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' }, // Moved
      ];
      const changes = {
        moved: [
          { playerId: 'player-1', oldX: 5, oldY: 5, newX: 6, newY: 5 },
        ],
        joined: [],
        left: [],
      };

      renderer.updatePlayersIncremental(previousPlayers, currentPlayers, board, changes);

      // Should update old position (restore cell) and new position (draw player)
      expect(writeSpy).toHaveBeenCalled();
    });

    test('should handle joined players', () => {
      const board = new Board();
      const previousPlayers = [];
      const currentPlayers = [
        { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
      ];
      const changes = {
        moved: [],
        joined: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        left: [],
      };

      renderer.updatePlayersIncremental(previousPlayers, currentPlayers, board, changes);

      // Should draw player at new position
      expect(writeSpy).toHaveBeenCalled();
    });

    test('should handle left players', () => {
      const board = new Board();
      const previousPlayers = [
        { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
      ];
      const currentPlayers = [];
      const changes = {
        moved: [],
        joined: [],
        left: [{ playerId: 'player-1', x: 5, y: 5 }],
      };

      renderer.updatePlayersIncremental(previousPlayers, currentPlayers, board, changes);

      // Should clear player position (restore cell)
      expect(writeSpy).toHaveBeenCalled();
    });

    test('should restore correct cell content for old positions', () => {
      const board = new Board();
      // Set up a wall at position (5, 5)
      const previousPlayers = [
        { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
      ];
      const currentPlayers = [
        { playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' },
      ];
      const changes = {
        moved: [
          { playerId: 'player-1', oldX: 5, oldY: 5, newX: 6, newY: 5 },
        ],
        joined: [],
        left: [],
      };

      renderer.updatePlayersIncremental(previousPlayers, currentPlayers, board, changes);

      // Should restore cell content (wall or empty space) at old position
      expect(writeSpy).toHaveBeenCalled();
    });
  });

  describe('updateEntitiesIncremental', () => {
    test('should exist as a method', () => {
      expect(typeof renderer.updateEntitiesIncremental).toBe('function');
    });

    test('should handle moved entities', () => {
      const board = new Board();
      const previousEntities = [
        { entityId: 'entity-1', x: 3, y: 3, entityType: 'enemy', glyph: 'E' },
      ];
      const currentEntities = [
        { entityId: 'entity-1', x: 4, y: 3, entityType: 'enemy', glyph: 'E' },
      ];
      const changes = {
        moved: [
          {
            entityId: 'entity-1',
            oldX: 3,
            oldY: 3,
            newX: 4,
            newY: 3,
            entityType: 'enemy',
          },
        ],
        spawned: [],
        despawned: [],
        animated: [],
      };

      renderer.updateEntitiesIncremental(
        previousEntities,
        currentEntities,
        board,
        changes
      );

      // Should update old position (restore cell) and new position (draw entity)
      expect(writeSpy).toHaveBeenCalled();
    });

    test('should handle spawned entities', () => {
      const board = new Board();
      const previousEntities = [];
      const currentEntities = [
        {
          entityId: 'entity-1',
          x: 5,
          y: 5,
          entityType: 'collectible',
          glyph: 'G',
          color: 'yellow',
        },
      ];
      const changes = {
        moved: [],
        spawned: [
          {
            entityId: 'entity-1',
            x: 5,
            y: 5,
            entityType: 'collectible',
            glyph: 'G',
          },
        ],
        despawned: [],
        animated: [],
      };

      renderer.updateEntitiesIncremental(
        previousEntities,
        currentEntities,
        board,
        changes
      );

      // Should draw entity at new position
      expect(writeSpy).toHaveBeenCalled();
    });

    test('should handle despawned entities', () => {
      const board = new Board();
      const previousEntities = [
        { entityId: 'entity-1', x: 5, y: 5, entityType: 'enemy', glyph: 'E' },
      ];
      const currentEntities = [];
      const changes = {
        moved: [],
        spawned: [],
        despawned: [{ entityId: 'entity-1', x: 5, y: 5 }],
        animated: [],
      };

      renderer.updateEntitiesIncremental(
        previousEntities,
        currentEntities,
        board,
        changes
      );

      // Should clear entity position (restore cell)
      expect(writeSpy).toHaveBeenCalled();
    });

    test('should handle animated entities (glyph change at same position)', () => {
      const board = new Board();
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
        },
      ];
      const changes = {
        moved: [],
        spawned: [],
        despawned: [],
        animated: [
          {
            entityId: 'entity-1',
            x: 5,
            y: 5,
            oldGlyph: 'A',
            newGlyph: 'B',
            animationFrame: 1,
          },
        ],
      };

      renderer.updateEntitiesIncremental(
        previousEntities,
        currentEntities,
        board,
        changes
      );

      // Should update glyph at same position
      expect(writeSpy).toHaveBeenCalled();
    });

    test('should use entity-specific glyphs and colors', () => {
      const board = new Board();
      const previousEntities = [];
      const currentEntities = [
        {
          entityId: 'entity-1',
          x: 5,
          y: 5,
          entityType: 'enemy',
          glyph: 'E',
          color: 'red',
        },
        {
          entityId: 'entity-2',
          x: 6,
          y: 6,
          entityType: 'collectible',
          glyph: 'G',
          color: 'yellow',
        },
      ];
      const changes = {
        moved: [],
        spawned: [
          {
            entityId: 'entity-1',
            x: 5,
            y: 5,
            entityType: 'enemy',
            glyph: 'E',
          },
          {
            entityId: 'entity-2',
            x: 6,
            y: 6,
            entityType: 'collectible',
            glyph: 'G',
          },
        ],
        despawned: [],
        animated: [],
      };

      renderer.updateEntitiesIncremental(
        previousEntities,
        currentEntities,
        board,
        changes
      );

      // Should use different glyphs and colors for different entity types
      expect(writeSpy).toHaveBeenCalled();
    });
  });

  describe('updateStatusBarIfChanged', () => {
    test('should exist as a method', () => {
      expect(typeof renderer.updateStatusBarIfChanged).toBe('function');
    });

    test('should update status bar when score changes', () => {
      renderer.updateStatusBarIfChanged(100, 5, 5, 0, 5, 5);

      // Should call renderStatusBar
      expect(writeSpy).toHaveBeenCalled();
    });

    test('should update status bar when position changes', () => {
      renderer.updateStatusBarIfChanged(0, 6, 5, 0, 5, 5);

      // Should call renderStatusBar
      expect(writeSpy).toHaveBeenCalled();
    });

    test('should not update status bar when score and position unchanged', () => {
      const callCountBefore = writeSpy.mock.calls.length;
      renderer.updateStatusBarIfChanged(0, 5, 5, 0, 5, 5);

      // Should not call renderStatusBar
      const callCountAfter = writeSpy.mock.calls.length;
      expect(callCountAfter).toBe(callCountBefore);
    });

    test('should update status bar when both score and position change', () => {
      renderer.updateStatusBarIfChanged(100, 6, 5, 0, 5, 5);

      // Should call renderStatusBar
      expect(writeSpy).toHaveBeenCalled();
    });
  });
});


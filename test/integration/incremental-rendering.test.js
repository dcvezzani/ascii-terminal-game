/**
 * Integration tests for incremental rendering
 * Tests Phase 5.3: Integration Tests for incremental rendering functionality
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { Renderer } from '../../src/render/Renderer.js';
import { Game } from '../../src/game/Game.js';
import * as stateComparison from '../../src/utils/stateComparison.js';

describe('Incremental Rendering Integration - Phase 5.3', () => {
  let mockRenderer;
  let mockGame;
  let previousState;
  let localPlayerId;
  let renderer;
  let game;

  beforeEach(() => {
    // Reset state
    previousState = null;
    localPlayerId = 'player-1';

    // Create real instances for integration testing
    renderer = new Renderer();
    game = new Game();

    // Spy on renderer instance methods (not prototype)
    mockRenderer = {
      renderFull: vi.spyOn(renderer, 'renderFull'),
      updatePlayersIncremental: vi.spyOn(renderer, 'updatePlayersIncremental'),
      updateEntitiesIncremental: vi.spyOn(renderer, 'updateEntitiesIncremental'),
      updateStatusBarIfChanged: vi.spyOn(renderer, 'updateStatusBarIfChanged'),
    };

    mockGame = {
      getPlayerPosition: vi.fn(() => ({ x: 5, y: 5 })),
      getScore: vi.fn(() => 0),
      isRunning: vi.fn(() => true),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to simulate state update callback logic
  function simulateStateUpdate(gameState) {
    if (!renderer || !localPlayerId) {
      return; // Wait for renderer and localPlayerId
    }

    try {
      if (previousState === null) {
        // First render - use renderFull()
        renderer.renderFull(game, gameState, localPlayerId);
        previousState = JSON.parse(JSON.stringify(gameState));
      } else {
        // Subsequent renders - use incremental updates
        const boardAdapter = {
          getCell: (x, y) => {
            if (
              y >= 0 &&
              y < gameState.board.grid.length &&
              x >= 0 &&
              x < gameState.board.grid[y].length
            ) {
              return gameState.board.grid[y][x];
            }
            return null;
          },
        };

        const changes = stateComparison.compareStates(previousState, gameState);

        const totalChanges =
          changes.players.moved.length +
          changes.players.joined.length +
          changes.players.left.length +
          changes.entities.moved.length +
          changes.entities.spawned.length +
          changes.entities.despawned.length +
          changes.entities.animated.length;

        const FALLBACK_THRESHOLD = 10;

        if (totalChanges > FALLBACK_THRESHOLD) {
          renderer.renderFull(game, gameState, localPlayerId);
          previousState = JSON.parse(JSON.stringify(gameState));
          return;
        }

        if (
          changes.players.moved.length > 0 ||
          changes.players.joined.length > 0 ||
          changes.players.left.length > 0
        ) {
          renderer.updatePlayersIncremental(
            previousState.players || [],
            gameState.players || [],
            boardAdapter,
            changes.players
          );
        }

        if (
          changes.entities.moved.length > 0 ||
          changes.entities.spawned.length > 0 ||
          changes.entities.despawned.length > 0 ||
          changes.entities.animated.length > 0
        ) {
          renderer.updateEntitiesIncremental(
            previousState.entities || [],
            gameState.entities || [],
            boardAdapter,
            changes.entities
          );
        }

        const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
        if (localPlayer) {
          const prevLocalPlayer = previousState.players.find(p => p.playerId === localPlayerId);
          renderer.updateStatusBarIfChanged(
            gameState.score || 0,
            localPlayer.x,
            localPlayer.y,
            previousState.score || 0,
            prevLocalPlayer?.x || 0,
            prevLocalPlayer?.y || 0
          );
        }

        previousState = JSON.parse(JSON.stringify(gameState));
      }
    } catch (error) {
      try {
        renderer.renderFull(game, gameState, localPlayerId);
        previousState = JSON.parse(JSON.stringify(gameState));
      } catch (fallbackError) {
        previousState = null;
      }
    }
  }

  describe('Full Rendering Flow', () => {
    test('should use renderFull() on first render', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Test' }],
        entities: [],
        score: 0,
      };

      simulateStateUpdate(initialState);

      expect(mockRenderer.renderFull).toHaveBeenCalledTimes(1);
      expect(mockRenderer.renderFull).toHaveBeenCalledWith(game, initialState, localPlayerId);
      expect(mockRenderer.updatePlayersIncremental).not.toHaveBeenCalled();
      expect(previousState).not.toBeNull();
    });

    test('should use incremental updates on subsequent renders', () => {
      // First state update - should use renderFull()
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Test' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      expect(mockRenderer.renderFull).toHaveBeenCalledTimes(1);
      mockRenderer.renderFull.mockClear();

      // Second state update - should use incremental updates
      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 6, y: 5, playerName: 'Test' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      expect(mockRenderer.renderFull).not.toHaveBeenCalled();
      expect(mockRenderer.updatePlayersIncremental).toHaveBeenCalledTimes(1);
    });

    test('should track state correctly between renders', () => {
      const state1 = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Test' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(state1);

      const state2 = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 6, y: 5, playerName: 'Test' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(state2);

      expect(mockRenderer.updatePlayersIncremental).toHaveBeenCalled();
      const updateCall = mockRenderer.updatePlayersIncremental.mock.calls[0];
      expect(updateCall[0]).toEqual(state1.players);
      expect(updateCall[1]).toEqual(state2.players);
    });
  });

  describe('Multiple Players', () => {
    test('should handle player movements correctly', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [
          { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
          { playerId: 'player-2', x: 10, y: 10, playerName: 'Player 2' },
        ],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [
          { playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' },
          { playerId: 'player-2', x: 10, y: 10, playerName: 'Player 2' },
        ],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      expect(mockRenderer.updatePlayersIncremental).toHaveBeenCalled();
      const updateCall = mockRenderer.updatePlayersIncremental.mock.calls[0];
      const changes = updateCall[3];
      expect(changes.moved).toHaveLength(1);
      expect(changes.moved[0].playerId).toBe('player-1');
      expect(changes.moved[0].oldX).toBe(5);
      expect(changes.moved[0].newX).toBe(6);
    });

    test('should handle player joins correctly', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [
          { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
          { playerId: 'player-2', x: 10, y: 10, playerName: 'Player 2' },
        ],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      expect(mockRenderer.updatePlayersIncremental).toHaveBeenCalled();
      const updateCall = mockRenderer.updatePlayersIncremental.mock.calls[0];
      const changes = updateCall[3];
      expect(changes.joined).toHaveLength(1);
      expect(changes.joined[0].playerId).toBe('player-2');
    });

    test('should handle player leaves correctly', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [
          { playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' },
          { playerId: 'player-2', x: 10, y: 10, playerName: 'Player 2' },
        ],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      expect(mockRenderer.updatePlayersIncremental).toHaveBeenCalled();
      const updateCall = mockRenderer.updatePlayersIncremental.mock.calls[0];
      const changes = updateCall[3];
      expect(changes.left).toHaveLength(1);
      expect(changes.left[0].playerId).toBe('player-2');
    });
  });

  describe('Entities', () => {
    test('should handle entity movements correctly', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [{ entityId: 'entity-1', x: 3, y: 3, entityType: 'enemy', glyph: 'E' }],
        score: 0,
      };
      simulateStateUpdate(initialState);

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [{ entityId: 'entity-1', x: 4, y: 3, entityType: 'enemy', glyph: 'E' }],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      expect(mockRenderer.updateEntitiesIncremental).toHaveBeenCalled();
      const updateCall = mockRenderer.updateEntitiesIncremental.mock.calls[0];
      const changes = updateCall[3];
      expect(changes.moved).toHaveLength(1);
      expect(changes.moved[0].entityId).toBe('entity-1');
      expect(changes.moved[0].oldX).toBe(3);
      expect(changes.moved[0].newX).toBe(4);
    });

    test('should handle entity spawns correctly', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [
          {
            entityId: 'entity-1',
            x: 10,
            y: 10,
            entityType: 'collectible',
            glyph: 'G',
            color: 'yellow',
          },
        ],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      expect(mockRenderer.updateEntitiesIncremental).toHaveBeenCalled();
      const updateCall = mockRenderer.updateEntitiesIncremental.mock.calls[0];
      const changes = updateCall[3];
      expect(changes.spawned).toHaveLength(1);
      expect(changes.spawned[0].entityId).toBe('entity-1');
    });

    test('should handle entity despawns correctly', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [{ entityId: 'entity-1', x: 3, y: 3, entityType: 'enemy', glyph: 'E' }],
        score: 0,
      };
      simulateStateUpdate(initialState);

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      expect(mockRenderer.updateEntitiesIncremental).toHaveBeenCalled();
      const updateCall = mockRenderer.updateEntitiesIncremental.mock.calls[0];
      const changes = updateCall[3];
      expect(changes.despawned).toHaveLength(1);
      expect(changes.despawned[0].entityId).toBe('entity-1');
    });

    test('should handle entity animations correctly', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [
          {
            entityId: 'entity-1',
            x: 3,
            y: 3,
            entityType: 'animated',
            glyph: 'A',
            animationFrame: 0,
          },
        ],
        score: 0,
      };
      simulateStateUpdate(initialState);

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [
          {
            entityId: 'entity-1',
            x: 3,
            y: 3,
            entityType: 'animated',
            glyph: 'B',
            animationFrame: 1,
          },
        ],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      expect(mockRenderer.updateEntitiesIncremental).toHaveBeenCalled();
      const updateCall = mockRenderer.updateEntitiesIncremental.mock.calls[0];
      const changes = updateCall[3];
      expect(changes.animated).toHaveLength(1);
      expect(changes.animated[0].entityId).toBe('entity-1');
      expect(changes.animated[0].oldGlyph).toBe('A');
      expect(changes.animated[0].newGlyph).toBe('B');
    });
  });

  describe('Fallback Logic', () => {
    test('should fall back to full render when threshold exceeded', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      mockRenderer.renderFull.mockClear();

      // Updated state with many changes (>10 threshold)
      const manyPlayers = Array.from({ length: 12 }, (_, i) => ({
        playerId: `player-${i}`,
        x: i,
        y: i,
        playerName: `Player ${i}`,
      }));
      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: manyPlayers,
        entities: [],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      // Should fall back to full render (12 joined players > 10 threshold)
      expect(mockRenderer.renderFull).toHaveBeenCalledTimes(1);
      expect(mockRenderer.updatePlayersIncremental).not.toHaveBeenCalled();
    });

    test('should fall back on errors', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      mockRenderer.renderFull.mockClear();

      // Make updatePlayersIncremental throw an error
      mockRenderer.updatePlayersIncremental.mockImplementation(() => {
        throw new Error('Test error');
      });

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      // Should fall back to full render after error
      expect(mockRenderer.renderFull).toHaveBeenCalledTimes(1);
      expect(mockRenderer.updatePlayersIncremental).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    test('should fall back to full render on error', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      mockRenderer.renderFull.mockClear();

      // Make compareStates throw an error
      const originalCompareStates = stateComparison.compareStates;
      vi.spyOn(stateComparison, 'compareStates').mockImplementationOnce(() => {
        throw new Error('Comparison error');
      });

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      // Should fall back to full render
      expect(mockRenderer.renderFull).toHaveBeenCalledTimes(1);

      // Restore original
      vi.restoreAllMocks();
    });

    test('should reset previousState if fallback also fails', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      // Make both incremental update and renderFull throw errors
      mockRenderer.updatePlayersIncremental.mockImplementation(() => {
        throw new Error('Incremental error');
      });
      mockRenderer.renderFull.mockImplementation(() => {
        throw new Error('Fallback error');
      });

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      // Both should have been attempted
      expect(mockRenderer.updatePlayersIncremental).toHaveBeenCalled();
      expect(mockRenderer.renderFull).toHaveBeenCalled();
      // previousState should be reset to null
      expect(previousState).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid state changes', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      // Clear the initial renderFull call
      mockRenderer.renderFull.mockClear();
      mockRenderer.updatePlayersIncremental.mockClear();

      // Rapid state changes - start from x=6 to ensure movement
      for (let i = 1; i <= 5; i++) {
        const state = {
          board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
          players: [{ playerId: 'player-1', x: 5 + i, y: 5, playerName: 'Player 1' }],
          entities: [],
          score: 0,
        };
        simulateStateUpdate(state);
      }

      // Should handle all updates (5 incremental updates)
      expect(mockRenderer.updatePlayersIncremental).toHaveBeenCalledTimes(5);
    });

    test('should handle null/undefined values', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: null,
        score: 0,
      };
      simulateStateUpdate(initialState);

      mockRenderer.renderFull.mockClear();
      mockRenderer.updatePlayersIncremental.mockClear();

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 6, y: 5, playerName: 'Player 1' }],
        entities: undefined,
        score: 0,
      };
      simulateStateUpdate(updatedState);

      // Should handle null/undefined gracefully and still update players
      expect(mockRenderer.updatePlayersIncremental).toHaveBeenCalled();
    });

    test('should handle empty arrays', () => {
      const initialState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(initialState);

      // Verify first render happened
      expect(mockRenderer.renderFull).toHaveBeenCalledTimes(1);
      mockRenderer.renderFull.mockClear();
      mockRenderer.updatePlayersIncremental.mockClear();

      const updatedState = {
        board: { width: 20, height: 10, grid: [['#', ' ', ' ']] },
        players: [{ playerId: 'player-1', x: 5, y: 5, playerName: 'Player 1' }],
        entities: [],
        score: 0,
      };
      simulateStateUpdate(updatedState);

      // Should handle empty arrays correctly and detect player join
      // The player join should trigger updatePlayersIncremental
      expect(mockRenderer.updatePlayersIncremental).toHaveBeenCalled();
      if (mockRenderer.updatePlayersIncremental.mock.calls.length > 0) {
        const updateCall = mockRenderer.updatePlayersIncremental.mock.calls[0];
        const changes = updateCall[3];
        expect(changes.joined).toHaveLength(1);
        expect(changes.joined[0].playerId).toBe('player-1');
      }
    });
  });
});

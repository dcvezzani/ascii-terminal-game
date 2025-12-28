import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Game } from '../../src/game/Game.js';
import { Renderer } from '../../src/render/Renderer.js';
import { PLAYER_CHAR, EMPTY_SPACE_CHAR } from '../../src/constants/gameConstants.js';
import { gameConfig } from '../../src/config/gameConfig.js';
import chalk from 'chalk';

// Helper to get center position
function getCenterPosition() {
  return {
    x: Math.floor(gameConfig.board.width / 2),
    y: Math.floor(gameConfig.board.height / 2),
  };
}

// Mock process.stdout.write
const mockWrite = vi.fn();

describe('Movement and Rendering Integration', () => {
  let game;
  let renderer;
  let writeSpy;

  beforeEach(() => {
    game = new Game();
    renderer = new Renderer();

    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    process.stdout.columns = 80;
    vi.clearAllMocks();
  });

  afterEach(() => {
    writeSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Game and Renderer Integration', () => {
    test('Game initializes correctly', () => {
      const center = getCenterPosition();
      expect(game).toBeDefined();
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y });
      expect(game.getScore()).toBe(0);
    });

    test('Renderer initializes correctly', () => {
      expect(renderer).toBeDefined();
      expect(renderer.boardWidth).toBe(gameConfig.board.width);
      expect(renderer.boardHeight).toBe(gameConfig.board.height);
    });

    test('Game and Renderer can work together', () => {
      const position = game.getPlayerPosition();
      renderer.renderBoard(game.board, position.x, position.y);

      expect(writeSpy).toHaveBeenCalled();
    });
  });

  describe('Movement to Rendering Flow', () => {
    test('Player movement triggers renderer update', () => {
      const center = getCenterPosition();
      const oldPosition = game.getPlayerPosition();
      const moved = game.movePlayer(1, 0);

      expect(moved).toBe(true);

      const newPosition = game.getPlayerPosition();
      expect(newPosition.x).toBe(center.x + 1);

      // Update renderer
      renderer.updatePlayerPosition(
        oldPosition.x,
        oldPosition.y,
        newPosition.x,
        newPosition.y,
        game.board
      );

      expect(writeSpy).toHaveBeenCalled();
    });

    test('Old position is cleared correctly', () => {
      const oldPosition = game.getPlayerPosition();
      game.movePlayer(1, 0);
      const newPosition = game.getPlayerPosition();

      renderer.updatePlayerPosition(
        oldPosition.x,
        oldPosition.y,
        newPosition.x,
        newPosition.y,
        game.board
      );

      // Should have called updateCell for old position
      expect(writeSpy).toHaveBeenCalled();
    });

    test('New position is rendered correctly', () => {
      const oldPosition = game.getPlayerPosition();
      game.movePlayer(1, 0);
      const newPosition = game.getPlayerPosition();

      renderer.updatePlayerPosition(
        oldPosition.x,
        oldPosition.y,
        newPosition.x,
        newPosition.y,
        game.board
      );

      // Should render player at new position
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain(PLAYER_CHAR.char);
    });

    test('Status bar updates with new position', () => {
      const oldPosition = game.getPlayerPosition();
      game.movePlayer(1, 0);
      const newPosition = game.getPlayerPosition();

      renderer.updatePlayerPosition(
        oldPosition.x,
        oldPosition.y,
        newPosition.x,
        newPosition.y,
        game.board
      );

      // Status bar should be updated
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain(`Position: (${newPosition.x}, ${newPosition.y})`);
    });

    test('Only changed cells are updated (efficiency)', () => {
      const oldPosition = game.getPlayerPosition();
      game.movePlayer(1, 0);
      const newPosition = game.getPlayerPosition();

      writeSpy.mockClear();

      renderer.updatePlayerPosition(
        oldPosition.x,
        oldPosition.y,
        newPosition.x,
        newPosition.y,
        game.board
      );

      // Should only update a few cells (old position, new position, status bar)
      // Not the entire board
      expect(writeSpy.mock.calls.length).toBeLessThan(10);
    });
  });

  describe('Complete Movement Flow', () => {
    test('Complete flow: movePlayer → updatePlayerPosition', () => {
      const center = getCenterPosition();
      const oldPosition = game.getPlayerPosition();

      // Move player
      const moved = game.movePlayer(1, 0);
      expect(moved).toBe(true);

      const newPosition = game.getPlayerPosition();
      expect(newPosition.x).toBe(center.x + 1);
      expect(newPosition.y).toBe(center.y);

      // Update renderer
      renderer.updatePlayerPosition(
        oldPosition.x,
        oldPosition.y,
        newPosition.x,
        newPosition.y,
        game.board
      );

      // Verify rendering happened
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Multiple movements work correctly', () => {
      const center = getCenterPosition();
      let position = game.getPlayerPosition();

      // Move right
      game.movePlayer(1, 0);
      position = game.getPlayerPosition();
      expect(position).toEqual({ x: center.x + 1, y: center.y });

      // Move down
      game.movePlayer(0, 1);
      position = game.getPlayerPosition();
      expect(position).toEqual({ x: center.x + 1, y: center.y + 1 });

      // Move left
      game.movePlayer(-1, 0);
      position = game.getPlayerPosition();
      expect(position).toEqual({ x: center.x, y: center.y + 1 });

      // Move up
      game.movePlayer(0, -1);
      position = game.getPlayerPosition();
      expect(position).toEqual({ x: center.x, y: center.y });
    });

    test('Wall collision prevents movement and rendering update', () => {
      const center = getCenterPosition();
      // Move to edge (one cell from right wall)
      const nearEdgeX = gameConfig.board.width - 2;
      const dx = nearEdgeX - center.x;
      game.movePlayer(dx, 0);
      const positionBefore = game.getPlayerPosition();

      // Try to move into wall
      const moved = game.movePlayer(1, 0);
      expect(moved).toBe(false);

      const positionAfter = game.getPlayerPosition();
      expect(positionAfter).toEqual(positionBefore);

      // Renderer should not be called for failed movement
      // (In actual game, we'd check if movement succeeded before updating renderer)
    });
  });

  describe('State Consistency', () => {
    test('Game position matches expected position after movement', () => {
      const center = getCenterPosition();
      game.movePlayer(1, 0);
      const position = game.getPlayerPosition();
      expect(position).toEqual({ x: center.x + 1, y: center.y });

      game.movePlayer(0, 1);
      const position2 = game.getPlayerPosition();
      expect(position2).toEqual({ x: center.x + 1, y: center.y + 1 });
    });

    test('Board state is consistent across components', () => {
      const center = getCenterPosition();
      const cellBefore = game.board.getCell(center.x, center.y);
      expect(cellBefore).toBe(EMPTY_SPACE_CHAR.char);

      game.movePlayer(1, 0);

      // Old position should still be empty
      const oldCell = game.board.getCell(center.x, center.y);
      expect(oldCell).toBe(EMPTY_SPACE_CHAR.char);

      // New position should be empty (player is tracked separately)
      const newCell = game.board.getCell(center.x + 1, center.y);
      expect(newCell).toBe(EMPTY_SPACE_CHAR.char);
    });

    test('State remains consistent after multiple operations', () => {
      const initialPosition = game.getPlayerPosition();

      // Multiple movements
      game.movePlayer(1, 0);
      game.movePlayer(0, 1);
      game.movePlayer(-1, 0);
      game.movePlayer(0, -1);

      // Should be back to start
      const finalPosition = game.getPlayerPosition();
      expect(finalPosition).toEqual(initialPosition);
    });
  });

  describe('Rendering Methods Integration', () => {
    test('renderFull works with game instance', () => {
      renderer.renderFull(game);

      // Should render title, board, and status bar
      expect(writeSpy).toHaveBeenCalled();
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Terminal Game');
      expect(allCalls).toContain('Score:');
    });

    test('renderBoard works with game board and position', () => {
      const position = game.getPlayerPosition();
      renderer.renderBoard(game.board, position.x, position.y);

      expect(writeSpy).toHaveBeenCalled();
    });

    test('renderStatusBar works with game state', () => {
      const position = game.getPlayerPosition();
      renderer.renderStatusBar(game.getScore(), position.x, position.y);

      expect(writeSpy).toHaveBeenCalled();
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Score: 0');
      expect(allCalls).toContain(`Position: (${position.x}, ${position.y})`);
    });
  });
});

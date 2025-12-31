import { describe, test, expect } from 'vitest';
import { Game } from '../../src/game/Game.js';
import { gameConfig } from '../../src/config/gameConfig.js';
import { EMPTY_SPACE_CHAR, WALL_CHAR } from '../../src/constants/gameConstants.js';

// Helper to get center position
function getCenterPosition() {
  return {
    x: Math.floor(gameConfig.board.width / 2),
    y: Math.floor(gameConfig.board.height / 2),
  };
}

describe('Game', () => {
  describe('Initialization', () => {
    test('Game is created with Board instance', () => {
      const game = new Game();
      expect(game.board).toBeDefined();
      expect(game.board.width).toBe(gameConfig.board.width);
      expect(game.board.height).toBe(gameConfig.board.height);
    });

    test('Player starts at center position', () => {
      const game = new Game();
      const position = game.getPlayerPosition();
      const expectedX = Math.floor(gameConfig.board.width / 2);
      const expectedY = Math.floor(gameConfig.board.height / 2);
      expect(position.x).toBe(expectedX);
      expect(position.y).toBe(expectedY);
    });

    test('Score is initialized to 0', () => {
      const game = new Game();
      expect(game.getScore()).toBe(0);
    });

    test('Game is not running initially', () => {
      const game = new Game();
      expect(game.isRunning()).toBe(false);
    });

    test('getPlayerPosition() returns correct initial position', () => {
      const game = new Game();
      const position = game.getPlayerPosition();
      const expectedX = Math.floor(gameConfig.board.width / 2);
      const expectedY = Math.floor(gameConfig.board.height / 2);
      expect(position).toEqual({ x: expectedX, y: expectedY });
    });

    test('getScore() returns 0', () => {
      const game = new Game();
      expect(game.getScore()).toBe(0);
    });
  });

  describe('start() and stop()', () => {
    test('start() sets running state to true', () => {
      const game = new Game();
      game.start();
      expect(game.isRunning()).toBe(true);
    });

    test('isRunning() returns true after start()', () => {
      const game = new Game();
      expect(game.isRunning()).toBe(false);
      game.start();
      expect(game.isRunning()).toBe(true);
    });

    test('stop() sets running state to false', () => {
      const game = new Game();
      game.start();
      expect(game.isRunning()).toBe(true);
      game.stop();
      expect(game.isRunning()).toBe(false);
    });

    test('isRunning() returns false after stop()', () => {
      const game = new Game();
      game.start();
      game.stop();
      expect(game.isRunning()).toBe(false);
    });

    test('Can start and stop multiple times', () => {
      const game = new Game();
      game.start();
      game.stop();
      game.start();
      game.stop();
      game.start();
      expect(game.isRunning()).toBe(true);
      game.stop();
      expect(game.isRunning()).toBe(false);
    });
  });

  describe('movePlayer() - Successful Movement', () => {
    test('Moves player right (dx=1, dy=0) successfully', () => {
      const game = new Game();
      const center = getCenterPosition();
      const success = game.movePlayer(1, 0);
      expect(success).toBe(true);
      expect(game.getPlayerPosition()).toEqual({ x: center.x + 1, y: center.y });
    });

    test('Moves player left (dx=-1, dy=0) successfully', () => {
      const game = new Game();
      const center = getCenterPosition();
      const success = game.movePlayer(-1, 0);
      expect(success).toBe(true);
      expect(game.getPlayerPosition()).toEqual({ x: center.x - 1, y: center.y });
    });

    test('Moves player up (dx=0, dy=-1) successfully', () => {
      const game = new Game();
      const center = getCenterPosition();
      const success = game.movePlayer(0, -1);
      expect(success).toBe(true);
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y - 1 });
    });

    test('Moves player down (dx=0, dy=1) successfully', () => {
      const game = new Game();
      const center = getCenterPosition();
      const success = game.movePlayer(0, 1);
      expect(success).toBe(true);
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y + 1 });
    });

    test('Moves player diagonally (dx=1, dy=1) successfully', () => {
      const game = new Game();
      const center = getCenterPosition();
      const success = game.movePlayer(1, 1);
      expect(success).toBe(true);
      expect(game.getPlayerPosition()).toEqual({ x: center.x + 1, y: center.y + 1 });
    });

    test('Returns true when movement is successful', () => {
      const game = new Game();
      expect(game.movePlayer(1, 0)).toBe(true);
      expect(game.movePlayer(0, 1)).toBe(true);
      expect(game.movePlayer(-1, 0)).toBe(true);
      expect(game.movePlayer(0, -1)).toBe(true);
    });

    test('Player position is updated correctly after movement', () => {
      const game = new Game();
      const center = getCenterPosition();
      game.movePlayer(1, 0);
      expect(game.getPlayerPosition().x).toBe(center.x + 1);
      expect(game.getPlayerPosition().y).toBe(center.y);

      game.movePlayer(0, 1);
      expect(game.getPlayerPosition().x).toBe(center.x + 1);
      expect(game.getPlayerPosition().y).toBe(center.y + 1);
    });

    test('Can move multiple times in sequence', () => {
      const game = new Game();
      const center = getCenterPosition();
      game.movePlayer(1, 0); // Right
      expect(game.getPlayerPosition()).toEqual({ x: center.x + 1, y: center.y });

      game.movePlayer(0, 1); // Down
      expect(game.getPlayerPosition()).toEqual({ x: center.x + 1, y: center.y + 1 });

      game.movePlayer(-1, 0); // Left
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y + 1 });

      game.movePlayer(0, -1); // Up
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y });
    });
  });

  describe('movePlayer() - Wall Collision', () => {
    test('Cannot move into left wall (x=0)', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Move player to left edge (x=1)
      const dx = 1 - center.x;
      game.movePlayer(dx, 0);
      expect(game.getPlayerPosition().x).toBe(1);

      // Try to move into wall
      const success = game.movePlayer(-1, 0);
      expect(success).toBe(false);
      expect(game.getPlayerPosition().x).toBe(1); // Position unchanged
    });

    test('Cannot move into right wall', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Move player to right edge (one cell from wall)
      const nearEdgeX = gameConfig.board.width - 2;
      const dx = nearEdgeX - center.x;
      game.movePlayer(dx, 0);
      expect(game.getPlayerPosition().x).toBe(nearEdgeX);

      // Try to move into wall
      const success = game.movePlayer(1, 0);
      expect(success).toBe(false);
      expect(game.getPlayerPosition().x).toBe(nearEdgeX); // Position unchanged
    });

    test('Cannot move into top wall (y=0)', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Move player to top edge (y=1)
      const dy = 1 - center.y;
      game.movePlayer(0, dy);
      expect(game.getPlayerPosition().y).toBe(1);

      // Try to move into wall
      const success = game.movePlayer(0, -1);
      expect(success).toBe(false);
      expect(game.getPlayerPosition().y).toBe(1); // Position unchanged
    });

    test('Cannot move into bottom wall', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Move player to bottom edge (one cell from wall)
      const nearEdgeY = gameConfig.board.height - 2;
      const dy = nearEdgeY - center.y;
      game.movePlayer(0, dy);
      expect(game.getPlayerPosition().y).toBe(nearEdgeY);

      // Try to move into wall
      const success = game.movePlayer(0, 1);
      expect(success).toBe(false);
      expect(game.getPlayerPosition().y).toBe(nearEdgeY); // Position unchanged
    });

    test('Returns false when movement is blocked by wall', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Move to left edge
      const dxLeft = 1 - center.x;
      game.movePlayer(dxLeft, 0);
      expect(game.movePlayer(-1, 0)).toBe(false);

      // Move to right edge
      const nearEdgeX = gameConfig.board.width - 2;
      const dxRight = nearEdgeX - center.x;
      game.movePlayer(dxRight - dxLeft, 0);
      expect(game.movePlayer(1, 0)).toBe(false);
    });

    test('Player position does not change when blocked by wall', () => {
      const game = new Game();
      const center = getCenterPosition();
      const dx = 1 - center.x;
      game.movePlayer(dx, 0); // Move to x=1
      const positionBefore = game.getPlayerPosition();

      game.movePlayer(-1, 0); // Try to move into wall
      const positionAfter = game.getPlayerPosition();

      expect(positionAfter).toEqual(positionBefore);
    });

    test('Can move to edge of board but not into wall', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Move to one before right wall
      const nearEdgeX = gameConfig.board.width - 2;
      const dx = nearEdgeX - center.x;
      game.movePlayer(dx, 0);
      expect(game.getPlayerPosition().x).toBe(nearEdgeX);

      // Can't move into wall
      expect(game.movePlayer(1, 0)).toBe(false);
      expect(game.getPlayerPosition().x).toBe(nearEdgeX);
    });
  });

  describe('movePlayer() - Boundary Checks', () => {
    test('Cannot move outside board bounds (negative coordinates)', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Move to x=1, y=1 (near edge)
      const dx = 1 - center.x;
      const dy = 1 - center.y;
      game.movePlayer(dx, dy);
      expect(game.getPlayerPosition()).toEqual({ x: 1, y: 1 });

      // Try to move to negative coordinates
      expect(game.movePlayer(-2, 0)).toBe(false);
      expect(game.movePlayer(0, -2)).toBe(false);
    });

    test('Cannot move outside board bounds (coordinates >= board size)', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Move to near edge (one cell from right/bottom wall)
      const nearEdgeX = gameConfig.board.width - 2;
      const nearEdgeY = gameConfig.board.height - 2;
      const dx = nearEdgeX - center.x;
      const dy = nearEdgeY - center.y;
      game.movePlayer(dx, dy);
      expect(game.getPlayerPosition()).toEqual({ x: nearEdgeX, y: nearEdgeY });

      // Try to move beyond bounds
      expect(game.movePlayer(2, 0)).toBe(false);
      expect(game.movePlayer(0, 2)).toBe(false);
    });

    test('Returns false when movement is out of bounds', () => {
      const game = new Game();
      const center = getCenterPosition();
      const initialX = center.x;

      // Try to move to negative x (out of bounds)
      game.movePlayer(-(initialX + 1), 0);
      expect(game.getPlayerPosition().x).toBe(initialX); // Should not move

      // Try to move beyond board width
      const beyondBounds = gameConfig.board.width - initialX;
      game.movePlayer(beyondBounds, 0);
      expect(game.getPlayerPosition().x).toBe(initialX); // Should not move
    });

    test('Player position does not change when out of bounds', () => {
      const game = new Game();
      const initialPosition = game.getPlayerPosition();

      // Try various out-of-bounds moves
      game.movePlayer(-11, 0);
      game.movePlayer(11, 0);
      game.movePlayer(0, -11);
      game.movePlayer(0, 11);

      expect(game.getPlayerPosition()).toEqual(initialPosition);
    });
  });

  describe('movePlayer() - Edge Cases', () => {
    test('Moving with dx=0, dy=0 (no movement) - should handle gracefully', () => {
      const game = new Game();
      const positionBefore = game.getPlayerPosition();
      const success = game.movePlayer(0, 0);

      // Should either return true (no-op) or false, but position shouldn't change
      expect(game.getPlayerPosition()).toEqual(positionBefore);
    });

    test('Moving large distances - should be blocked if out of bounds', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Try to move beyond board bounds
      const largeDx = gameConfig.board.width;
      const largeDy = gameConfig.board.height;
      const success = game.movePlayer(largeDx, largeDy);
      expect(success).toBe(false);
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y });
    });

    test('Moving from center to near wall, then trying to move into wall', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Move to near right wall (one cell from edge)
      const nearEdgeX = gameConfig.board.width - 2;
      const dx = nearEdgeX - center.x;
      game.movePlayer(dx, 0);
      expect(game.getPlayerPosition().x).toBe(nearEdgeX);

      // Try to move into wall
      expect(game.movePlayer(1, 0)).toBe(false);
      expect(game.getPlayerPosition().x).toBe(nearEdgeX);
    });
  });

  describe('reset()', () => {
    test('Resets player position to center', () => {
      const game = new Game();
      const center = getCenterPosition();
      game.movePlayer(5, 5);
      expect(game.getPlayerPosition()).not.toEqual({ x: center.x, y: center.y });

      game.reset();
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y });
    });

    test('Resets score to 0', () => {
      const game = new Game();
      // Score should already be 0, but verify reset maintains it
      game.reset();
      expect(game.getScore()).toBe(0);
    });

    test('Creates new Board instance', () => {
      const game = new Game();
      const boardBefore = game.board;

      // Modify board
      const center = getCenterPosition();
      game.board.setCell(center.x, center.y, 'X');
      expect(game.board.getCellChar(center.x, center.y)).toBe('X');

      game.reset();
      // Board should be reinitialized
      expect(game.board.getCellChar(center.x, center.y)).toBe(EMPTY_SPACE_CHAR.char);
      expect(game.board).not.toBe(boardBefore);
    });

    test('Sets running state to true', () => {
      const game = new Game();
      game.stop();
      expect(game.isRunning()).toBe(false);

      game.reset();
      expect(game.isRunning()).toBe(true);
    });

    test('Board is reinitialized with walls and empty spaces', () => {
      const game = new Game();
      // Modify board
      game.board.setCell(5, 5, 'X');
      game.board.setCell(15, 15, 'Y');

      game.reset();

      // Board should be back to original state
      expect(game.board.getCellChar(5, 5)).toBe(EMPTY_SPACE_CHAR.char);
      expect(game.board.getCellChar(15, 15)).toBe(EMPTY_SPACE_CHAR.char);
      expect(game.board.getCellChar(0, 0)).toBe(WALL_CHAR.char);
      expect(game.board.getCellChar(gameConfig.board.width - 1, gameConfig.board.height - 1)).toBe(
        WALL_CHAR.char
      );
    });

    test('Can reset multiple times', () => {
      const game = new Game();
      const center = getCenterPosition();
      game.movePlayer(5, 5);
      game.reset();
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y });

      game.movePlayer(-3, -3);
      game.reset();
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y });
    });
  });

  describe('State Consistency', () => {
    test('Player position remains consistent after multiple operations', () => {
      const game = new Game();
      const center = getCenterPosition();
      game.movePlayer(1, 0);
      expect(game.getPlayerPosition().x).toBe(center.x + 1);

      game.movePlayer(0, 1);
      expect(game.getPlayerPosition()).toEqual({ x: center.x + 1, y: center.y + 1 });

      game.movePlayer(-1, 0);
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y + 1 });
    });

    test('Score remains 0 (as per MVP requirements)', () => {
      const game = new Game();
      game.movePlayer(1, 0);
      game.movePlayer(0, 1);
      game.reset();
      game.start();
      game.stop();

      expect(game.getScore()).toBe(0);
    });

    test('Board state is maintained correctly', () => {
      const game = new Game();
      const center = getCenterPosition();
      // Board should have walls on edges
      expect(game.board.isWall(0, 0)).toBe(true);
      expect(game.board.isWall(gameConfig.board.width - 1, gameConfig.board.height - 1)).toBe(true);
      expect(game.board.isWall(center.x, center.y)).toBe(false);

      // After operations, board should still be valid
      game.movePlayer(1, 0);
      expect(game.board.isWall(0, 0)).toBe(true);
    });

    test('Game state is consistent after reset', () => {
      const game = new Game();
      const center = getCenterPosition();
      game.movePlayer(5, 5);
      game.start();

      game.reset();

      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y });
      expect(game.getScore()).toBe(0);
      expect(game.isRunning()).toBe(true);
      // After reset, the cell should have empty space as base char (player entity is separate)
      expect(game.board.getCellChar(center.x, center.y)).toBe(EMPTY_SPACE_CHAR.char);
    });
  });
});

import { describe, test, expect } from 'vitest';
import { Game } from './Game.js';

describe('Game', () => {
  describe('Initialization', () => {
    test('Game is created with Board instance', () => {
      const game = new Game();
      expect(game.board).toBeDefined();
      expect(game.board.width).toBe(20);
      expect(game.board.height).toBe(20);
    });

    test('Player starts at center position (10, 10)', () => {
      const game = new Game();
      const position = game.getPlayerPosition();
      expect(position.x).toBe(10);
      expect(position.y).toBe(10);
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
      expect(position).toEqual({ x: 10, y: 10 });
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
      const success = game.movePlayer(1, 0);
      expect(success).toBe(true);
      expect(game.getPlayerPosition()).toEqual({ x: 11, y: 10 });
    });

    test('Moves player left (dx=-1, dy=0) successfully', () => {
      const game = new Game();
      const success = game.movePlayer(-1, 0);
      expect(success).toBe(true);
      expect(game.getPlayerPosition()).toEqual({ x: 9, y: 10 });
    });

    test('Moves player up (dx=0, dy=-1) successfully', () => {
      const game = new Game();
      const success = game.movePlayer(0, -1);
      expect(success).toBe(true);
      expect(game.getPlayerPosition()).toEqual({ x: 10, y: 9 });
    });

    test('Moves player down (dx=0, dy=1) successfully', () => {
      const game = new Game();
      const success = game.movePlayer(0, 1);
      expect(success).toBe(true);
      expect(game.getPlayerPosition()).toEqual({ x: 10, y: 11 });
    });

    test('Moves player diagonally (dx=1, dy=1) successfully', () => {
      const game = new Game();
      const success = game.movePlayer(1, 1);
      expect(success).toBe(true);
      expect(game.getPlayerPosition()).toEqual({ x: 11, y: 11 });
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
      game.movePlayer(1, 0);
      expect(game.getPlayerPosition().x).toBe(11);
      expect(game.getPlayerPosition().y).toBe(10);
      
      game.movePlayer(0, 1);
      expect(game.getPlayerPosition().x).toBe(11);
      expect(game.getPlayerPosition().y).toBe(11);
    });

    test('Can move multiple times in sequence', () => {
      const game = new Game();
      game.movePlayer(1, 0); // Right
      expect(game.getPlayerPosition()).toEqual({ x: 11, y: 10 });
      
      game.movePlayer(0, 1); // Down
      expect(game.getPlayerPosition()).toEqual({ x: 11, y: 11 });
      
      game.movePlayer(-1, 0); // Left
      expect(game.getPlayerPosition()).toEqual({ x: 10, y: 11 });
      
      game.movePlayer(0, -1); // Up
      expect(game.getPlayerPosition()).toEqual({ x: 10, y: 10 });
    });
  });

  describe('movePlayer() - Wall Collision', () => {
    test('Cannot move into left wall (x=0)', () => {
      const game = new Game();
      // Move player to left edge (x=1)
      game.movePlayer(-9, 0);
      expect(game.getPlayerPosition().x).toBe(1);
      
      // Try to move into wall
      const success = game.movePlayer(-1, 0);
      expect(success).toBe(false);
      expect(game.getPlayerPosition().x).toBe(1); // Position unchanged
    });

    test('Cannot move into right wall (x=19)', () => {
      const game = new Game();
      // Move player to right edge (x=18)
      game.movePlayer(8, 0);
      expect(game.getPlayerPosition().x).toBe(18);
      
      // Try to move into wall
      const success = game.movePlayer(1, 0);
      expect(success).toBe(false);
      expect(game.getPlayerPosition().x).toBe(18); // Position unchanged
    });

    test('Cannot move into top wall (y=0)', () => {
      const game = new Game();
      // Move player to top edge (y=1)
      game.movePlayer(0, -9);
      expect(game.getPlayerPosition().y).toBe(1);
      
      // Try to move into wall
      const success = game.movePlayer(0, -1);
      expect(success).toBe(false);
      expect(game.getPlayerPosition().y).toBe(1); // Position unchanged
    });

    test('Cannot move into bottom wall (y=19)', () => {
      const game = new Game();
      // Move player to bottom edge (y=18)
      game.movePlayer(0, 8);
      expect(game.getPlayerPosition().y).toBe(18);
      
      // Try to move into wall
      const success = game.movePlayer(0, 1);
      expect(success).toBe(false);
      expect(game.getPlayerPosition().y).toBe(18); // Position unchanged
    });

    test('Returns false when movement is blocked by wall', () => {
      const game = new Game();
      // Move to left edge
      game.movePlayer(-9, 0);
      expect(game.movePlayer(-1, 0)).toBe(false);
      
      // Move to right edge
      game.movePlayer(17, 0);
      expect(game.movePlayer(1, 0)).toBe(false);
    });

    test('Player position does not change when blocked by wall', () => {
      const game = new Game();
      game.movePlayer(-9, 0); // Move to x=1
      const positionBefore = game.getPlayerPosition();
      
      game.movePlayer(-1, 0); // Try to move into wall
      const positionAfter = game.getPlayerPosition();
      
      expect(positionAfter).toEqual(positionBefore);
    });

    test('Can move to edge of board but not into wall', () => {
      const game = new Game();
      // Move to x=18 (one before right wall)
      game.movePlayer(8, 0);
      expect(game.getPlayerPosition().x).toBe(18);
      
      // Can't move into wall at x=19
      expect(game.movePlayer(1, 0)).toBe(false);
      expect(game.getPlayerPosition().x).toBe(18);
    });
  });

  describe('movePlayer() - Boundary Checks', () => {
    test('Cannot move outside board bounds (negative coordinates)', () => {
      const game = new Game();
      // Move to x=1, y=1 (near edge)
      game.movePlayer(-9, -9);
      expect(game.getPlayerPosition()).toEqual({ x: 1, y: 1 });
      
      // Try to move to negative coordinates
      expect(game.movePlayer(-2, 0)).toBe(false);
      expect(game.movePlayer(0, -2)).toBe(false);
    });

    test('Cannot move outside board bounds (coordinates >= 20)', () => {
      const game = new Game();
      // Move to x=18, y=18 (near edge)
      game.movePlayer(8, 8);
      expect(game.getPlayerPosition()).toEqual({ x: 18, y: 18 });
      
      // Try to move beyond bounds
      expect(game.movePlayer(2, 0)).toBe(false);
      expect(game.movePlayer(0, 2)).toBe(false);
    });

    test('Returns false when movement is out of bounds', () => {
      const game = new Game();
      game.movePlayer(-10, 0); // Try to move to x=-1
      expect(game.getPlayerPosition().x).toBe(10); // Should not move
      
      game.movePlayer(10, 0); // Try to move to x=20
      expect(game.getPlayerPosition().x).toBe(10); // Should not move
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

    test('Moving large distances (dx=10, dy=10) - should be blocked if out of bounds', () => {
      const game = new Game();
      // From center (10, 10), moving (10, 10) would go to (20, 20) which is out of bounds
      const success = game.movePlayer(10, 10);
      expect(success).toBe(false);
      expect(game.getPlayerPosition()).toEqual({ x: 10, y: 10 });
    });

    test('Moving from center to near wall, then trying to move into wall', () => {
      const game = new Game();
      // Move to near right wall
      game.movePlayer(8, 0); // x=18
      expect(game.getPlayerPosition().x).toBe(18);
      
      // Try to move into wall
      expect(game.movePlayer(1, 0)).toBe(false);
      expect(game.getPlayerPosition().x).toBe(18);
    });
  });

  describe('reset()', () => {
    test('Resets player position to center (10, 10)', () => {
      const game = new Game();
      game.movePlayer(5, 5);
      expect(game.getPlayerPosition()).not.toEqual({ x: 10, y: 10 });
      
      game.reset();
      expect(game.getPlayerPosition()).toEqual({ x: 10, y: 10 });
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
      game.board.setCell(10, 10, 'X');
      expect(game.board.getCell(10, 10)).toBe('X');
      
      game.reset();
      // Board should be reinitialized
      expect(game.board.getCell(10, 10)).toBe('.');
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
      expect(game.board.getCell(5, 5)).toBe('.');
      expect(game.board.getCell(15, 15)).toBe('.');
      expect(game.board.getCell(0, 0)).toBe('#');
      expect(game.board.getCell(19, 19)).toBe('#');
    });

    test('Can reset multiple times', () => {
      const game = new Game();
      game.movePlayer(5, 5);
      game.reset();
      expect(game.getPlayerPosition()).toEqual({ x: 10, y: 10 });
      
      game.movePlayer(-3, -3);
      game.reset();
      expect(game.getPlayerPosition()).toEqual({ x: 10, y: 10 });
    });
  });

  describe('State Consistency', () => {
    test('Player position remains consistent after multiple operations', () => {
      const game = new Game();
      game.movePlayer(1, 0);
      expect(game.getPlayerPosition().x).toBe(11);
      
      game.movePlayer(0, 1);
      expect(game.getPlayerPosition()).toEqual({ x: 11, y: 11 });
      
      game.movePlayer(-1, 0);
      expect(game.getPlayerPosition()).toEqual({ x: 10, y: 11 });
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
      // Board should have walls on edges
      expect(game.board.isWall(0, 0)).toBe(true);
      expect(game.board.isWall(19, 19)).toBe(true);
      expect(game.board.isWall(10, 10)).toBe(false);
      
      // After operations, board should still be valid
      game.movePlayer(1, 0);
      expect(game.board.isWall(0, 0)).toBe(true);
    });

    test('Game state is consistent after reset', () => {
      const game = new Game();
      game.movePlayer(5, 5);
      game.start();
      
      game.reset();
      
      expect(game.getPlayerPosition()).toEqual({ x: 10, y: 10 });
      expect(game.getScore()).toBe(0);
      expect(game.isRunning()).toBe(true);
      expect(game.board.getCell(10, 10)).toBe('.');
    });
  });
});


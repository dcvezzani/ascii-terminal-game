import { describe, test, expect } from 'vitest';
import { Board } from '../../src/game/Board.js';
import { WALL_CHAR, EMPTY_SPACE_CHAR } from '../../src/constants/gameConstants.js';

describe('Board', () => {
  describe('Initialization', () => {
    test('Board is created with correct dimensions (20x20)', () => {
      const board = new Board();
      expect(board.width).toBe(20);
      expect(board.height).toBe(20);
    });

    test('Grid is initialized as 2D array', () => {
      const board = new Board();
      expect(Array.isArray(board.grid)).toBe(true);
      expect(board.grid.length).toBe(20);
      expect(Array.isArray(board.grid[0])).toBe(true);
      expect(board.grid[0].length).toBe(20);
    });

    test('Outer walls are present on all four sides', () => {
      const board = new Board();
      
      // Top edge (y=0)
      for (let x = 0; x < 20; x++) {
        expect(board.getCell(x, 0)).toBe(WALL_CHAR);
      }
      
      // Bottom edge (y=19)
      for (let x = 0; x < 20; x++) {
        expect(board.getCell(x, 19)).toBe(WALL_CHAR);
      }
      
      // Left edge (x=0)
      for (let y = 0; y < 20; y++) {
        expect(board.getCell(0, y)).toBe(WALL_CHAR);
      }
      
      // Right edge (x=19)
      for (let y = 0; y < 20; y++) {
        expect(board.getCell(19, y)).toBe(WALL_CHAR);
      }
    });

    test('Interior cells are all empty spaces', () => {
      const board = new Board();
      
      // Check interior (not edges)
      for (let y = 1; y < 19; y++) {
        for (let x = 1; x < 19; x++) {
          expect(board.getCell(x, y)).toBe(EMPTY_SPACE_CHAR);
        }
      }
    });

    test('Corner cells are walls', () => {
      const board = new Board();
      
      expect(board.getCell(0, 0)).toBe(WALL_CHAR);   // Top-left
      expect(board.getCell(19, 0)).toBe(WALL_CHAR);  // Top-right
      expect(board.getCell(0, 19)).toBe(WALL_CHAR);  // Bottom-left
      expect(board.getCell(19, 19)).toBe(WALL_CHAR); // Bottom-right
    });
  });

  describe('getCell(x, y)', () => {
    test('Returns correct cell content for valid positions', () => {
      const board = new Board();
      expect(board.getCell(0, 0)).toBe(WALL_CHAR);
      expect(board.getCell(10, 10)).toBe(EMPTY_SPACE_CHAR);
      expect(board.getCell(19, 19)).toBe(WALL_CHAR);
    });

    test('Returns # for wall positions (edges)', () => {
      const board = new Board();
      expect(board.getCell(0, 5)).toBe(WALL_CHAR);   // Left edge
      expect(board.getCell(19, 5)).toBe(WALL_CHAR); // Right edge
      expect(board.getCell(5, 0)).toBe(WALL_CHAR);  // Top edge
      expect(board.getCell(5, 19)).toBe(WALL_CHAR);  // Bottom edge
    });

    test('Returns . for empty positions (interior)', () => {
      const board = new Board();
      expect(board.getCell(10, 10)).toBe(EMPTY_SPACE_CHAR);
      expect(board.getCell(5, 5)).toBe(EMPTY_SPACE_CHAR);
      expect(board.getCell(15, 15)).toBe(EMPTY_SPACE_CHAR);
    });

    test('Returns null for invalid X coordinate (negative)', () => {
      const board = new Board();
      expect(board.getCell(-1, 10)).toBeNull();
    });

    test('Returns null for invalid X coordinate (too large)', () => {
      const board = new Board();
      expect(board.getCell(20, 10)).toBeNull();
      expect(board.getCell(25, 10)).toBeNull();
    });

    test('Returns null for invalid Y coordinate (negative)', () => {
      const board = new Board();
      expect(board.getCell(10, -1)).toBeNull();
    });

    test('Returns null for invalid Y coordinate (too large)', () => {
      const board = new Board();
      expect(board.getCell(10, 20)).toBeNull();
      expect(board.getCell(10, 25)).toBeNull();
    });

    test('Returns null for both coordinates invalid', () => {
      const board = new Board();
      expect(board.getCell(-1, -1)).toBeNull();
      expect(board.getCell(25, 25)).toBeNull();
    });
  });

  describe('setCell(x, y, value)', () => {
    test('Successfully sets cell value for valid position', () => {
      const board = new Board();
      const result = board.setCell(10, 10, '@');
      expect(result).toBe(true);
      expect(board.getCell(10, 10)).toBe('@');
    });

    test('Returns true when set is successful', () => {
      const board = new Board();
      expect(board.setCell(5, 5, 'X')).toBe(true);
    });

    test('Returns false for invalid X coordinate (negative)', () => {
      const board = new Board();
      expect(board.setCell(-1, 10, '@')).toBe(false);
    });

    test('Returns false for invalid X coordinate (too large)', () => {
      const board = new Board();
      expect(board.setCell(20, 10, '@')).toBe(false);
      expect(board.setCell(25, 10, '@')).toBe(false);
    });

    test('Returns false for invalid Y coordinate (negative)', () => {
      const board = new Board();
      expect(board.setCell(10, -1, '@')).toBe(false);
    });

    test('Returns false for invalid Y coordinate (too large)', () => {
      const board = new Board();
      expect(board.setCell(10, 20, '@')).toBe(false);
      expect(board.setCell(10, 25, '@')).toBe(false);
    });

    test('Cell value is actually updated after successful set', () => {
      const board = new Board();
      board.setCell(10, 10, 'X');
      expect(board.getCell(10, 10)).toBe('X');
      
      board.setCell(10, 10, 'Y');
      expect(board.getCell(10, 10)).toBe('Y');
    });

    test('Can set different values (not just . and #)', () => {
      const board = new Board();
      board.setCell(10, 10, '@');
      expect(board.getCell(10, 10)).toBe('@');
      
      board.setCell(10, 10, '*');
      expect(board.getCell(10, 10)).toBe('*');
      
      board.setCell(10, 10, 'A');
      expect(board.getCell(10, 10)).toBe('A');
    });
  });

  describe('isWall(x, y)', () => {
    test('Returns true for top edge wall (y=0)', () => {
      const board = new Board();
      for (let x = 0; x < 20; x++) {
        expect(board.isWall(x, 0)).toBe(true);
      }
    });

    test('Returns true for bottom edge wall (y=19)', () => {
      const board = new Board();
      for (let x = 0; x < 20; x++) {
        expect(board.isWall(x, 19)).toBe(true);
      }
    });

    test('Returns true for left edge wall (x=0)', () => {
      const board = new Board();
      for (let y = 0; y < 20; y++) {
        expect(board.isWall(0, y)).toBe(true);
      }
    });

    test('Returns true for right edge wall (x=19)', () => {
      const board = new Board();
      for (let y = 0; y < 20; y++) {
        expect(board.isWall(19, y)).toBe(true);
      }
    });

    test('Returns true for corner positions', () => {
      const board = new Board();
      expect(board.isWall(0, 0)).toBe(true);   // Top-left
      expect(board.isWall(19, 0)).toBe(true); // Top-right
      expect(board.isWall(0, 19)).toBe(true); // Bottom-left
      expect(board.isWall(19, 19)).toBe(true); // Bottom-right
    });

    test('Returns false for interior empty spaces', () => {
      const board = new Board();
      expect(board.isWall(10, 10)).toBe(false);
      expect(board.isWall(5, 5)).toBe(false);
      expect(board.isWall(15, 15)).toBe(false);
    });

    test('Returns false for invalid positions (handles gracefully)', () => {
      const board = new Board();
      expect(board.isWall(-1, 10)).toBe(false);
      expect(board.isWall(25, 10)).toBe(false);
      expect(board.isWall(10, -1)).toBe(false);
      expect(board.isWall(10, 25)).toBe(false);
    });
  });

  describe('isValidPosition(x, y)', () => {
    test('Returns true for valid positions (0-19 for both x and y)', () => {
      const board = new Board();
      expect(board.isValidPosition(0, 0)).toBe(true);
      expect(board.isValidPosition(10, 10)).toBe(true);
      expect(board.isValidPosition(19, 19)).toBe(true);
      expect(board.isValidPosition(5, 15)).toBe(true);
    });

    test('Returns true for corner positions', () => {
      const board = new Board();
      expect(board.isValidPosition(0, 0)).toBe(true);
      expect(board.isValidPosition(19, 0)).toBe(true);
      expect(board.isValidPosition(0, 19)).toBe(true);
      expect(board.isValidPosition(19, 19)).toBe(true);
    });

    test('Returns true for center position (10, 10)', () => {
      const board = new Board();
      expect(board.isValidPosition(10, 10)).toBe(true);
    });

    test('Returns false for negative X coordinate', () => {
      const board = new Board();
      expect(board.isValidPosition(-1, 10)).toBe(false);
    });

    test('Returns false for negative Y coordinate', () => {
      const board = new Board();
      expect(board.isValidPosition(10, -1)).toBe(false);
    });

    test('Returns false for X coordinate equal to width (20)', () => {
      const board = new Board();
      expect(board.isValidPosition(20, 10)).toBe(false);
    });

    test('Returns false for Y coordinate equal to height (20)', () => {
      const board = new Board();
      expect(board.isValidPosition(10, 20)).toBe(false);
    });

    test('Returns false for X coordinate greater than width', () => {
      const board = new Board();
      expect(board.isValidPosition(21, 10)).toBe(false);
      expect(board.isValidPosition(25, 10)).toBe(false);
    });

    test('Returns false for Y coordinate greater than height', () => {
      const board = new Board();
      expect(board.isValidPosition(10, 21)).toBe(false);
      expect(board.isValidPosition(10, 25)).toBe(false);
    });
  });
});


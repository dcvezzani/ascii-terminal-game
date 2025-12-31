import { describe, test, expect } from 'vitest';
import { Board } from '../../src/game/Board.js';
import { Cell } from '../../src/game/Cell.js';
import { WALL_CHAR, EMPTY_SPACE_CHAR } from '../../src/constants/gameConstants.js';
import { gameConfig } from '../../src/config/gameConfig.js';

describe('Board', () => {
  describe('Initialization', () => {
    test('Board is created with dimensions from configuration', () => {
      const board = new Board();
      expect(board.width).toBe(gameConfig.board.width);
      expect(board.height).toBe(gameConfig.board.height);
    });

    test('Grid is initialized as 2D array with correct dimensions', () => {
      const board = new Board();
      expect(Array.isArray(board.grid)).toBe(true);
      expect(board.grid.length).toBe(gameConfig.board.height);
      expect(Array.isArray(board.grid[0])).toBe(true);
      expect(board.grid[0].length).toBe(gameConfig.board.width);
    });

    test('Outer walls are present on all four sides', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;

      // Top edge (y=0)
      for (let x = 0; x < width; x++) {
        expect(board.getCellChar(x, 0)).toBe(WALL_CHAR.char);
      }

      // Bottom edge (y=height-1)
      for (let x = 0; x < width; x++) {
        expect(board.getCellChar(x, height - 1)).toBe(WALL_CHAR.char);
      }

      // Left edge (x=0)
      for (let y = 0; y < height; y++) {
        expect(board.getCellChar(0, y)).toBe(WALL_CHAR.char);
      }

      // Right edge (x=width-1)
      for (let y = 0; y < height; y++) {
        expect(board.getCellChar(width - 1, y)).toBe(WALL_CHAR.char);
      }
    });

    test('Interior cells are all empty spaces', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;

      // Check interior (not edges)
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          expect(board.getCellChar(x, y)).toBe(EMPTY_SPACE_CHAR.char);
        }
      }
    });

    test('Corner cells are walls', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;

      expect(board.getCellChar(0, 0)).toBe(WALL_CHAR.char); // Top-left
      expect(board.getCellChar(width - 1, 0)).toBe(WALL_CHAR.char); // Top-right
      expect(board.getCellChar(0, height - 1)).toBe(WALL_CHAR.char); // Bottom-left
      expect(board.getCellChar(width - 1, height - 1)).toBe(WALL_CHAR.char); // Bottom-right
    });
  });

  describe('getCellChar(x, y)', () => {
    test('Returns correct cell content for valid positions', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.getCellChar(0, 0)).toBe(WALL_CHAR.char);
      expect(board.getCellChar(Math.floor(width / 2), Math.floor(height / 2))).toBe(
        EMPTY_SPACE_CHAR.char
      );
      expect(board.getCellChar(width - 1, height - 1)).toBe(WALL_CHAR.char);
    });

    test('Returns # for wall positions (edges)', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      const midY = Math.floor(height / 2);
      const midX = Math.floor(width / 2);

      expect(board.getCellChar(0, midY)).toBe(WALL_CHAR.char); // Left edge
      expect(board.getCellChar(width - 1, midY)).toBe(WALL_CHAR.char); // Right edge
      expect(board.getCellChar(midX, 0)).toBe(WALL_CHAR.char); // Top edge
      expect(board.getCellChar(midX, height - 1)).toBe(WALL_CHAR.char); // Bottom edge
    });

    test('Returns . for empty positions (interior)', () => {
      const board = new Board();
      expect(board.getCellChar(10, 10)).toBe(EMPTY_SPACE_CHAR.char);
      expect(board.getCellChar(5, 5)).toBe(EMPTY_SPACE_CHAR.char);
      expect(board.getCellChar(15, 15)).toBe(EMPTY_SPACE_CHAR.char);
    });

    test('Returns null for invalid X coordinate (negative)', () => {
      const board = new Board();
      expect(board.getCell(-1, 10)).toBeNull();
    });

    test('Returns null for invalid X coordinate (too large)', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.getCell(width, Math.floor(height / 2))).toBeNull();
      expect(board.getCell(width + 5, Math.floor(height / 2))).toBeNull();
    });

    test('Returns null for invalid Y coordinate (negative)', () => {
      const board = new Board();
      expect(board.getCell(10, -1)).toBeNull();
    });

    test('Returns null for invalid Y coordinate (too large)', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.getCell(Math.floor(width / 2), height)).toBeNull();
      expect(board.getCell(Math.floor(width / 2), height + 5)).toBeNull();
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
      expect(board.getCellChar(10, 10)).toBe('@');
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
      const { width, height } = gameConfig.board;
      expect(board.setCell(width, Math.floor(height / 2), '@')).toBe(false);
      expect(board.setCell(width + 5, Math.floor(height / 2), '@')).toBe(false);
    });

    test('Returns false for invalid Y coordinate (negative)', () => {
      const board = new Board();
      expect(board.setCell(10, -1, '@')).toBe(false);
    });

    test('Returns false for invalid Y coordinate (too large)', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.setCell(Math.floor(width / 2), height, '@')).toBe(false);
      expect(board.setCell(Math.floor(width / 2), height + 5, '@')).toBe(false);
    });

    test('Cell value is actually updated after successful set', () => {
      const board = new Board();
      board.setCell(10, 10, 'X');
      expect(board.getCellChar(10, 10)).toBe('X');

      board.setCell(10, 10, 'Y');
      expect(board.getCellChar(10, 10)).toBe('Y');
    });

    test('Can set different values (not just . and #)', () => {
      const board = new Board();
      board.setCell(10, 10, '@');
      expect(board.getCellChar(10, 10)).toBe('@');

      board.setCell(10, 10, '*');
      expect(board.getCellChar(10, 10)).toBe('*');

      board.setCell(10, 10, 'A');
      expect(board.getCellChar(10, 10)).toBe('A');
    });
  });

  describe('isWall(x, y)', () => {
    test('Returns true for top edge wall (y=0)', () => {
      const board = new Board();
      const { width } = gameConfig.board;
      for (let x = 0; x < width; x++) {
        expect(board.isWall(x, 0)).toBe(true);
      }
    });

    test('Returns true for bottom edge wall', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      for (let x = 0; x < width; x++) {
        expect(board.isWall(x, height - 1)).toBe(true);
      }
    });

    test('Returns true for left edge wall (x=0)', () => {
      const board = new Board();
      const { height } = gameConfig.board;
      for (let y = 0; y < height; y++) {
        expect(board.isWall(0, y)).toBe(true);
      }
    });

    test('Returns true for right edge wall', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      for (let y = 0; y < height; y++) {
        expect(board.isWall(width - 1, y)).toBe(true);
      }
    });

    test('Returns true for corner positions', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.isWall(0, 0)).toBe(true); // Top-left
      expect(board.isWall(width - 1, 0)).toBe(true); // Top-right
      expect(board.isWall(0, height - 1)).toBe(true); // Bottom-left
      expect(board.isWall(width - 1, height - 1)).toBe(true); // Bottom-right
    });

    test('Returns false for interior empty spaces', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.isWall(Math.floor(width / 2), Math.floor(height / 2))).toBe(false);
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
    test('Returns true for valid positions within board bounds', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.isValidPosition(0, 0)).toBe(true);
      expect(board.isValidPosition(Math.floor(width / 2), Math.floor(height / 2))).toBe(true);
      expect(board.isValidPosition(width - 1, height - 1)).toBe(true);
      expect(board.isValidPosition(5, 15)).toBe(true);
    });

    test('Returns true for corner positions', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.isValidPosition(0, 0)).toBe(true);
      expect(board.isValidPosition(width - 1, 0)).toBe(true);
      expect(board.isValidPosition(0, height - 1)).toBe(true);
      expect(board.isValidPosition(width - 1, height - 1)).toBe(true);
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

    test('Returns false for X coordinate equal to width', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.isValidPosition(width, Math.floor(height / 2))).toBe(false);
    });

    test('Returns false for Y coordinate equal to height', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.isValidPosition(Math.floor(width / 2), height)).toBe(false);
    });

    test('Returns false for X coordinate greater than width', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.isValidPosition(width + 1, Math.floor(height / 2))).toBe(false);
      expect(board.isValidPosition(width + 5, Math.floor(height / 2))).toBe(false);
    });

    test('Returns false for Y coordinate greater than height', () => {
      const board = new Board();
      const { width, height } = gameConfig.board;
      expect(board.isValidPosition(Math.floor(width / 2), height + 1)).toBe(false);
      expect(board.isValidPosition(Math.floor(width / 2), height + 5)).toBe(false);
    });
  });

  describe('fromSerialized', () => {
    test('should create Board from serialized data', () => {
      const boardData = {
        width: 20,
        height: 20,
        grid: [
          ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
          ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
        ],
      };
      const board = Board.fromSerialized(boardData);
      expect(board.width).toBe(20);
      expect(board.height).toBe(20);
      expect(board.grid.length).toBe(20);
      expect(board.grid[0].length).toBe(20);
    });

    test('should create Cell objects in grid', () => {
      const boardData = {
        width: 5,
        height: 5,
        grid: [
          ['#', '#', '#', '#', '#'],
          ['#', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', '#'],
          ['#', ' ', ' ', ' ', '#'],
          ['#', '#', '#', '#', '#'],
        ],
      };
      const board = Board.fromSerialized(boardData);
      const cell = board.getCell(1, 1);
      expect(cell).toBeInstanceOf(Cell);
      expect(cell.getBaseChar()).toBe(' ');
    });

    test('should handle wall characters correctly', () => {
      const boardData = {
        width: 3,
        height: 3,
        grid: [
          ['#', '#', '#'],
          ['#', ' ', '#'],
          ['#', '#', '#'],
        ],
      };
      const board = Board.fromSerialized(boardData);
      expect(board.isWall(0, 0)).toBe(true);
      expect(board.isWall(1, 1)).toBe(false);
    });

    test('should return correct display information', () => {
      const boardData = {
        width: 3,
        height: 3,
        grid: [
          ['#', '#', '#'],
          ['#', ' ', '#'],
          ['#', '#', '#'],
        ],
      };
      const board = Board.fromSerialized(boardData);
      const wallDisplay = board.getDisplay(0, 0);
      expect(wallDisplay.char).toBe(WALL_CHAR.char);
      expect(wallDisplay.color).toBe(WALL_CHAR.color);

      const emptyDisplay = board.getDisplay(1, 1);
      expect(emptyDisplay.char).toBe(EMPTY_SPACE_CHAR.char);
      expect(emptyDisplay.color).toBe(EMPTY_SPACE_CHAR.color);
    });
  });
});

import { describe, it, expect } from 'vitest';
import Board from '../../src/game/Board.js';

describe('Board', () => {
  describe('initialization', () => {
    it('should create board with specified dimensions', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      expect(board.width).toBe(20);
      expect(board.height).toBe(20);
    });

    it('should create grid with correct dimensions', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      const serialized = board.serialize();
      expect(serialized.length).toBe(20);
      expect(serialized[0].length).toBe(20);
    });
  });

  describe('walls', () => {
    it('should have walls on top row', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      for (let x = 0; x < 20; x++) {
        expect(board.getCell(x, 0)).toBe('#');
        expect(board.isWall(x, 0)).toBe(true);
      }
    });

    it('should have walls on bottom row', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      for (let x = 0; x < 20; x++) {
        expect(board.getCell(x, 19)).toBe('#');
        expect(board.isWall(x, 19)).toBe(true);
      }
    });

    it('should have walls on left column', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      for (let y = 0; y < 20; y++) {
        expect(board.getCell(0, y)).toBe('#');
        expect(board.isWall(0, y)).toBe(true);
      }
    });

    it('should have walls on right column', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      for (let y = 0; y < 20; y++) {
        expect(board.getCell(19, y)).toBe('#');
        expect(board.isWall(19, y)).toBe(true);
      }
    });
  });

  describe('empty interior', () => {
    it('should have empty spaces in interior', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      // Check interior cells (not on perimeter)
      for (let y = 1; y < 19; y++) {
        for (let x = 1; x < 19; x++) {
          expect(board.getCell(x, y)).toBe('.');
          expect(board.isWall(x, y)).toBe(false);
        }
      }
    });
  });

  describe('getCell', () => {
    it('should return correct character at position', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      expect(board.getCell(0, 0)).toBe('#'); // Corner wall
      expect(board.getCell(10, 10)).toBe('.'); // Interior empty
      expect(board.getCell(19, 19)).toBe('#'); // Corner wall
    });
  });

  describe('isWall', () => {
    it('should return true for wall cells', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      expect(board.isWall(0, 0)).toBe(true);
      expect(board.isWall(19, 0)).toBe(true);
      expect(board.isWall(0, 19)).toBe(true);
      expect(board.isWall(19, 19)).toBe(true);
    });

    it('should return false for empty cells', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      expect(board.isWall(10, 10)).toBe(false);
      expect(board.isWall(1, 1)).toBe(false);
      expect(board.isWall(18, 18)).toBe(false);
    });
  });

  describe('serialize', () => {
    it('should return 2D array of base characters', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      const serialized = board.serialize();
      
      expect(Array.isArray(serialized)).toBe(true);
      expect(serialized.length).toBe(20);
      expect(Array.isArray(serialized[0])).toBe(true);
      expect(serialized[0].length).toBe(20);
    });

    it('should return correct characters in serialized format', () => {
      const board = new Board({ width: 20, height: 20 });
      board.initialize();

      const serialized = board.serialize();
      
      expect(serialized[0][0]).toBe('#'); // Top-left corner
      expect(serialized[10][10]).toBe('.'); // Interior
      expect(serialized[19][19]).toBe('#'); // Bottom-right corner
    });
  });

  describe('initializeFromGrid', () => {
    it('sets grid so getCell returns character at each position', () => {
      const board = new Board({ width: 2, height: 2 });
      const grid = [['#', ' '], [' ', '#']];
      board.initializeFromGrid(grid);

      expect(board.getCell(0, 0)).toBe('#');
      expect(board.getCell(1, 0)).toBe(' ');
      expect(board.getCell(0, 1)).toBe(' ');
      expect(board.getCell(1, 1)).toBe('#');
    });

    it('isWall returns true only where grid has #', () => {
      const board = new Board({ width: 2, height: 2 });
      const grid = [['#', ' '], [' ', '#']];
      board.initializeFromGrid(grid);

      expect(board.isWall(0, 0)).toBe(true);
      expect(board.isWall(1, 0)).toBe(false);
      expect(board.isWall(0, 1)).toBe(false);
      expect(board.isWall(1, 1)).toBe(true);
    });

    it('serialize returns a copy of the grid with same dimensions and contents', () => {
      const board = new Board({ width: 2, height: 2 });
      const grid = [['#', ' '], [' ', '#']];
      board.initializeFromGrid(grid);

      const serialized = board.serialize();
      expect(serialized).toEqual([['#', ' '], [' ', '#']]);
      expect(serialized).not.toBe(board.grid);
      expect(serialized[0]).not.toBe(board.grid[0]);
    });
  });
});

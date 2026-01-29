import { describe, it, expect } from 'vitest';
import Game from '../../src/game/Game.js';
import Board from '../../src/game/Board.js';

describe('Game', () => {
  describe('initialization', () => {
    it('should create game with specified board dimensions', () => {
      const game = new Game(20, 20);

      expect(game.board).toBeDefined();
      expect(game.board.width).toBe(20);
      expect(game.board.height).toBe(20);
    });

    it('should initialize board', () => {
      const game = new Game(20, 20);

      expect(game.board.grid).toBeDefined();
      expect(game.board.grid.length).toBe(20);
    });

    it('should have score default to 0', () => {
      const game = new Game(20, 20);

      expect(game.score).toBe(0);
    });

    it('should have running default to true', () => {
      const game = new Game(20, 20);

      expect(game.running).toBe(true);
    });
  });

  describe('constructor with optional pre-built Board', () => {
    it('new Game(20, 20) still works (existing behavior)', () => {
      const game = new Game(20, 20);
      expect(game.board).toBeDefined();
      expect(game.board.width).toBe(20);
      expect(game.board.height).toBe(20);
      expect(game.board.grid).toBeDefined();
      expect(game.board.grid.length).toBe(20);
    });

    it('new Game(board.width, board.height, board) uses the passed Board instance', () => {
      const board = new Board(3, 2);
      board.initializeFromGrid([['#', ' ', '#'], [' ', '#', ' ']]);
      const game = new Game(board.width, board.height, board);

      expect(game.board).toBe(board);
      expect(game.board.width).toBe(3);
      expect(game.board.height).toBe(2);
      expect(game.board.getCell(0, 0)).toBe('#');
      expect(game.board.getCell(1, 0)).toBe(' ');
    });
  });
});

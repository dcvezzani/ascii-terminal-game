import { describe, it, expect } from 'vitest';
import Game from '../../src/game/Game.js';
import Board from '../../src/game/Board.js';

describe('Game', () => {
  describe('initialization', () => {
    it('should create game with default board when no board provided', () => {
      const game = new Game();

      expect(game.board).toBeDefined();
      expect(game.board.width).toBe(60);
      expect(game.board.height).toBe(25);
    });

    it('should initialize default board with grid', () => {
      const game = new Game();

      expect(game.board.grid).toBeDefined();
      expect(game.board.grid.length).toBe(25);
    });

    it('should have score default to 0', () => {
      const game = new Game();

      expect(game.score).toBe(0);
    });

    it('should have running default to true', () => {
      const game = new Game();

      expect(game.running).toBe(true);
    });
  });

  describe('constructor with optional pre-built Board', () => {
    it('new Game() uses default board from JSON', () => {
      const game = new Game();
      expect(game.board).toBeDefined();
      expect(game.board.width).toBe(60);
      expect(game.board.height).toBe(25);
      expect(game.board.grid).toBeDefined();
      expect(game.board.grid.length).toBe(25);
    });

    it('new Game(board) uses the passed Board instance', () => {
      const board = new Board({ width: 3, height: 2 });
      board.initializeFromGrid([['#', ' ', '#'], [' ', '#', ' ']]);
      const game = new Game(board);

      expect(game.board).toBe(board);
      expect(game.board.width).toBe(3);
      expect(game.board.height).toBe(2);
      expect(game.board.getCell(0, 0)).toBe('#');
      expect(game.board.getCell(1, 0)).toBe(' ');
    });
  });
});

import { describe, it, expect } from 'vitest';
import Game from '../../src/game/Game.js';

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
});

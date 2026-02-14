import { describe, it, expect } from 'vitest';
import { isSpawnAvailable } from '../../src/server/spawnAvailability.js';

describe('spawnAvailability', () => {
  const makeBoard = (width, height, walls = []) => {
    const grid = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        grid[y][x] = walls.some(([wx, wy]) => wx === x && wy === y)
          ? '#'
          : ' ';
      }
    }
    return {
      width,
      height,
      getCell(x, y) {
        return grid[y][x];
      }
    };
  };

  describe('isSpawnAvailable', () => {
    it('returns true when no players and no walls in circle', () => {
      const board = makeBoard(10, 10);
      const players = [];
      expect(isSpawnAvailable({ x: 5, y: 5 }, board, players, 3)).toBe(true);
    });

    it('returns false when spawn cell itself is a wall', () => {
      const board = makeBoard(10, 10, [[5, 5]]);
      const players = [];
      expect(isSpawnAvailable({ x: 5, y: 5 }, board, players, 3)).toBe(false);
    });

    it('returns true when a wall is in the radius but not on the spawn cell', () => {
      const board = makeBoard(10, 10, [[6, 5]]);
      const players = [];
      expect(isSpawnAvailable({ x: 5, y: 5 }, board, players, 3)).toBe(true);
    });

    it('returns false when another player is within Manhattan R', () => {
      const board = makeBoard(10, 10);
      const players = [{ playerId: 'p1', x: 5, y: 5 }];
      expect(isSpawnAvailable({ x: 6, y: 5 }, board, players, 3)).toBe(false);
    });

    it('spawn at edge: returns true when full disk is in bounds and clear (e.g. (1,1) R=1)', () => {
      const board = makeBoard(5, 5);
      const players = [];
      expect(isSpawnAvailable({ x: 1, y: 1 }, board, players, 1)).toBe(true);
    });

    it('spawn at edge: returns false when circle extends out of bounds', () => {
      const board = makeBoard(5, 5);
      const players = [];
      expect(isSpawnAvailable({ x: 0, y: 0 }, board, players, 3)).toBe(false);
    });

    it('radius 0: only the spawn cell itself must be clear', () => {
      const board = makeBoard(5, 5);
      const players = [];
      expect(isSpawnAvailable({ x: 2, y: 2 }, board, players, 0)).toBe(true);
    });

    it('radius 0: returns false if spawn cell has wall', () => {
      const board = makeBoard(5, 5, [[2, 2]]);
      const players = [];
      expect(isSpawnAvailable({ x: 2, y: 2 }, board, players, 0)).toBe(false);
    });

    it('ignores waiting players (x/y null) for occupancy', () => {
      const board = makeBoard(10, 10);
      const players = [{ playerId: 'p1', x: null, y: null }];
      expect(isSpawnAvailable({ x: 5, y: 5 }, board, players, 3)).toBe(true);
    });
  });
});

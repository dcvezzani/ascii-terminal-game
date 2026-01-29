import { describe, it, expect } from 'vitest';
import { getConfigPath, loadBoardFromFiles } from '../../src/board/boardLoader.js';

describe('boardLoader', () => {
  describe('getConfigPath', () => {
    it('returns path with extension replaced by .config.json', () => {
      expect(getConfigPath('boards/level.json')).toBe('boards/level.config.json');
    });

    it('handles path with nested directory', () => {
      expect(getConfigPath('boards/levels/level1.json')).toBe('boards/levels/level1.config.json');
    });

    it('handles path with only .json extension', () => {
      expect(getConfigPath('my-board.json')).toBe('my-board.config.json');
    });
  });

  describe('loadBoardFromFiles', () => {
    it('throws with clear message when board file is missing', () => {
      const missingPath = 'boards/nonexistent-board-file.json';
      expect(() => loadBoardFromFiles(missingPath)).toThrow();
      try {
        loadBoardFromFiles(missingPath);
      } catch (err) {
        expect(err.message).toContain(missingPath);
      }
    });

    it('throws with clear message when config file is missing', () => {
      const boardPath = 'test/fixtures/board-loader/board-only.json';
      expect(() => loadBoardFromFiles(boardPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath);
      } catch (err) {
        expect(err.message).toMatch(/config|\.config\.json/i);
      }
    });
  });

  describe('loadBoardFromFiles - JSON parse and dimensions config', () => {
    it('throws with clear message when board file has invalid JSON', () => {
      const boardPath = 'test/fixtures/board-loader/invalid-board-json.json';
      expect(() => loadBoardFromFiles(boardPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath);
      } catch (err) {
        expect(err.message).toMatch(/JSON|parse|board/i);
      }
    });

    it('throws with clear message when config file has invalid JSON', () => {
      const boardPath = 'test/fixtures/board-loader/board-valid-json.json';
      expect(() => loadBoardFromFiles(boardPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath);
      } catch (err) {
        expect(err.message).toMatch(/JSON|parse|config/i);
      }
    });

    it('throws when config is missing width', () => {
      const boardPath = 'test/fixtures/board-loader/config-missing-width.json';
      expect(() => loadBoardFromFiles(boardPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath);
      } catch (err) {
        expect(err.message).toMatch(/width/i);
      }
    });

    it('throws when config is missing height', () => {
      const boardPath = 'test/fixtures/board-loader/config-missing-height.json';
      expect(() => loadBoardFromFiles(boardPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath);
      } catch (err) {
        expect(err.message).toMatch(/height/i);
      }
    });

    it('throws when config width or height is not a number or < 1', () => {
      const invalidWidthPath = 'test/fixtures/board-loader/config-invalid-width.json';
      expect(() => loadBoardFromFiles(invalidWidthPath)).toThrow();
      try {
        loadBoardFromFiles(invalidWidthPath);
      } catch (err) {
        expect(err.message).toMatch(/width|height|dimension/i);
      }

      const nonNumberPath = 'test/fixtures/board-loader/config-non-number.json';
      expect(() => loadBoardFromFiles(nonNumberPath)).toThrow();
      try {
        loadBoardFromFiles(nonNumberPath);
      } catch (err) {
        expect(err.message).toMatch(/width|height|number|dimension/i);
      }
    });

    it('returns object with width, height and grid when board and config are valid', () => {
      const boardPath = 'test/fixtures/board-loader/valid-for-parse.json';
      const result = loadBoardFromFiles(boardPath);
      expect(result).toHaveProperty('width', 2);
      expect(result).toHaveProperty('height', 2);
      expect(result).toHaveProperty('grid');
      expect(result.grid).toEqual([['#', '#'], ['#', '#']]);
    });
  });

  describe('loadBoardFromFiles - RLE decode and entity/cell count validation', () => {
    it('returns { width, height, grid } with correct character mapping (0→space, 1→#, 2→space)', () => {
      const boardPath = 'test/fixtures/board-loader/valid-mapping.json';
      const result = loadBoardFromFiles(boardPath);
      expect(result).toHaveProperty('width', 2);
      expect(result).toHaveProperty('height', 2);
      expect(result).toHaveProperty('grid');
      expect(Array.isArray(result.grid)).toBe(true);
      expect(result.grid.length).toBe(2);
      expect(result.grid[0].length).toBe(2);
      expect(result.grid[0][0]).toBe('#');  // entity 1
      expect(result.grid[0][1]).toBe(' ');  // entity 0
      expect(result.grid[1][0]).toBe(' '); // entity 2 (spawn)
      expect(result.grid[1][1]).toBe(' ');  // entity 0
    });

    it('throws and reports invalid entity value (e.g. 3, -1)', () => {
      const boardPath = 'test/fixtures/board-loader/invalid-entity.json';
      expect(() => loadBoardFromFiles(boardPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath);
      } catch (err) {
        expect(err.message).toMatch(/entity|invalid|3|unsupported/i);
      }
    });

    it('throws when repeat is 0 or negative', () => {
      const boardPath = 'test/fixtures/board-loader/invalid-repeat.json';
      expect(() => loadBoardFromFiles(boardPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath);
      } catch (err) {
        expect(err.message).toMatch(/repeat|cell|count/i);
      }
    });

    it('throws when decoded cell count is less than width×height', () => {
      const boardPath = 'test/fixtures/board-loader/cell-count-less.json';
      expect(() => loadBoardFromFiles(boardPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath);
      } catch (err) {
        expect(err.message).toMatch(/cell|count|dimension/i);
      }
    });

    it('throws when decoded cell count is more than width×height', () => {
      const boardPath = 'test/fixtures/board-loader/cell-count-more.json';
      expect(() => loadBoardFromFiles(boardPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath);
      } catch (err) {
        expect(err.message).toMatch(/cell|count|dimension/i);
      }
    });

    it('decodes single-cell entry without repeat correctly', () => {
      const boardPath = 'test/fixtures/board-loader/single-cell-no-repeat.json';
      const result = loadBoardFromFiles(boardPath);
      expect(result.grid).toEqual([[' ', '#']]);
      expect(result.width).toBe(2);
      expect(result.height).toBe(1);
    });
  });
});

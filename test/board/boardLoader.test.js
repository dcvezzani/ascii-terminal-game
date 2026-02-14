import { describe, it, expect } from 'vitest';
import { DEFAULT_DIMENSIONS_PATH, loadBoardFromFiles } from '../../src/board/boardLoader.js';

const FIXTURES = 'test/fixtures/board-loader';

describe('boardLoader', () => {
  describe('DEFAULT_DIMENSIONS_PATH', () => {
    it('is boards/dimensions.json', () => {
      expect(DEFAULT_DIMENSIONS_PATH).toBe('boards/dimensions.json');
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

    it('throws with clear message when dimensions file is missing', () => {
      const boardPath = `${FIXTURES}/board-only.json`;
      const dimensionsPath = 'nonexistent-dimensions.json';
      expect(() => loadBoardFromFiles(boardPath, dimensionsPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath, dimensionsPath);
      } catch (err) {
        expect(err.message).toMatch(/dimensions|not found/i);
      }
    });
  });

  describe('loadBoardFromFiles - JSON parse and dimensions config', () => {
    it('throws with clear message when board file has invalid JSON', () => {
      const boardPath = `${FIXTURES}/invalid-board-json.json`;
      expect(() => loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`)).toThrow();
      try {
        loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`);
      } catch (err) {
        expect(err.message).toMatch(/JSON|parse|board/i);
      }
    });

    it('throws with clear message when dimensions file has invalid JSON', () => {
      const boardPath = `${FIXTURES}/board-valid-json.json`;
      const dimensionsPath = `${FIXTURES}/dimensions-invalid-json.json`;
      expect(() => loadBoardFromFiles(boardPath, dimensionsPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath, dimensionsPath);
      } catch (err) {
        expect(err.message).toMatch(/JSON|parse|dimensions/i);
      }
    });

    it('throws when dimensions config is missing width', () => {
      const boardPath = `${FIXTURES}/valid-for-parse.json`;
      const dimensionsPath = `${FIXTURES}/dimensions-missing-width.json`;
      expect(() => loadBoardFromFiles(boardPath, dimensionsPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath, dimensionsPath);
      } catch (err) {
        expect(err.message).toMatch(/width/i);
      }
    });

    it('throws when dimensions config is missing height', () => {
      const boardPath = `${FIXTURES}/valid-for-parse.json`;
      const dimensionsPath = `${FIXTURES}/dimensions-missing-height.json`;
      expect(() => loadBoardFromFiles(boardPath, dimensionsPath)).toThrow();
      try {
        loadBoardFromFiles(boardPath, dimensionsPath);
      } catch (err) {
        expect(err.message).toMatch(/height/i);
      }
    });

    it('throws when dimensions config width or height is not a number or < 1', () => {
      const boardPath = `${FIXTURES}/valid-for-parse.json`;
      expect(() => loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions-invalid-width.json`)).toThrow();
      try {
        loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions-invalid-width.json`);
      } catch (err) {
        expect(err.message).toMatch(/width|height|dimension/i);
      }

      expect(() => loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions-non-number.json`)).toThrow();
      try {
        loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions-non-number.json`);
      } catch (err) {
        expect(err.message).toMatch(/width|height|number|dimension/i);
      }
    });

    it('returns object with width, height, grid and spawnPoints when board and dimensions are valid', () => {
      const boardPath = `${FIXTURES}/valid-for-parse.json`;
      const result = loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`);
      expect(result).toHaveProperty('width', 2);
      expect(result).toHaveProperty('height', 2);
      expect(result).toHaveProperty('grid');
      expect(result.grid).toEqual([['#', '#'], ['#', '#']]);
      expect(result).toHaveProperty('spawnPoints');
      expect(Array.isArray(result.spawnPoints)).toBe(true);
    });
  });

  describe('loadBoardFromFiles - RLE decode and entity/cell count validation', () => {
    it('returns { width, height, grid } with correct character mapping (0→space, 1→#, 2→space)', () => {
      const boardPath = `${FIXTURES}/valid-mapping.json`;
      const result = loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`);
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
      expect(result.spawnPoints).toEqual([{ x: 0, y: 1 }]); // row-major: index 2 -> (0,1)
    });

    it('returns empty spawnPoints when board has no entity 2', () => {
      const boardPath = `${FIXTURES}/valid-for-parse.json`;
      const result = loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`);
      expect(result.spawnPoints).toEqual([]);
    });

    it('throws and reports invalid entity value (e.g. 3, -1)', () => {
      const boardPath = `${FIXTURES}/invalid-entity.json`;
      expect(() => loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`)).toThrow();
      try {
        loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`);
      } catch (err) {
        expect(err.message).toMatch(/entity|invalid|3|unsupported/i);
      }
    });

    it('throws when repeat is 0 or negative', () => {
      const boardPath = `${FIXTURES}/invalid-repeat.json`;
      expect(() => loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`)).toThrow();
      try {
        loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`);
      } catch (err) {
        expect(err.message).toMatch(/repeat|cell|count/i);
      }
    });

    it('throws when decoded cell count is less than width×height', () => {
      const boardPath = `${FIXTURES}/cell-count-less.json`;
      expect(() => loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`)).toThrow();
      try {
        loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`);
      } catch (err) {
        expect(err.message).toMatch(/cell|count|dimension/i);
      }
    });

    it('throws when decoded cell count is more than width×height', () => {
      const boardPath = `${FIXTURES}/cell-count-more.json`;
      expect(() => loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`)).toThrow();
      try {
        loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions.json`);
      } catch (err) {
        expect(err.message).toMatch(/cell|count|dimension/i);
      }
    });

    it('decodes single-cell entry without repeat correctly', () => {
      const boardPath = `${FIXTURES}/single-cell-no-repeat.json`;
      const result = loadBoardFromFiles(boardPath, `${FIXTURES}/dimensions-2x1.json`);
      expect(result.grid).toEqual([[' ', '#']]);
      expect(result.width).toBe(2);
      expect(result.height).toBe(1);
    });

    it('loads default classic board (60×25) with perimeter walls using default dimensions', () => {
      const boardPath = 'boards/classic.json';
      const result = loadBoardFromFiles(boardPath);
      expect(result.width).toBe(60);
      expect(result.height).toBe(25);
      expect(result.grid.length).toBe(25);
      result.grid.forEach((row, y) => {
        expect(row.length).toBe(60);
        expect(row[0]).toBe('#');
        expect(row[59]).toBe('#');
      });
      expect(result.grid[0].every((c) => c === '#')).toBe(true);
      expect(result.grid[24].every((c) => c === '#')).toBe(true);
      for (let y = 1; y < 24; y++) {
        for (let x = 1; x < 59; x++) {
          expect(result.grid[y][x]).toBe(' ');
        }
      }
    });
  });
});

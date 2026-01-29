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
});

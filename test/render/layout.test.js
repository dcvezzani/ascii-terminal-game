import { describe, it, expect } from 'vitest';
import {
  TITLE_AND_STATUS_BAR_WIDTH,
  BLANK_LINES_AFTER_TITLE,
  BLANK_LINES_BEFORE_STATUS_BAR,
  computeLayout,
  truncateTitleToWidth,
  getContentRegionFromLayout
} from '../../src/render/layout.js';

describe('layout', () => {
  describe('constants', () => {
    it('TITLE_AND_STATUS_BAR_WIDTH is 60', () => {
      expect(TITLE_AND_STATUS_BAR_WIDTH).toBe(60);
    });
    it('BLANK_LINES_AFTER_TITLE is 1', () => {
      expect(BLANK_LINES_AFTER_TITLE).toBe(1);
    });
    it('BLANK_LINES_BEFORE_STATUS_BAR is 1', () => {
      expect(BLANK_LINES_BEFORE_STATUS_BAR).toBe(1);
    });
  });

  describe('computeLayout', () => {
    const titleHeight = 2;

    it('centerBoard true: terminal 80x24, board 20x20, statusBarHeight 5', () => {
      const layout = computeLayout(80, 24, 20, 20, 5, { centerBoard: true });
      expect(layout.blockWidth).toBe(60);
      expect(layout.blockHeight).toBe(titleHeight + 20 + 1 + 5); // 28
      expect(layout.startColumn).toBe(Math.max(1, Math.floor((80 - 60) / 2) + 1)); // 11
      expect(layout.startRow).toBe(Math.max(1, Math.floor((24 - 28) / 2) + 1)); // 1 (block doesn't fit)
      expect(layout.boardStartColumn).toBe(11 + Math.floor((60 - 20) / 2)); // 11 + 20 = 31
      expect(layout.fitsInTerminal).toBe(false);
      expect(layout.minColumns).toBe(60);
      expect(layout.minRows).toBe(28);
    });

    it('centerBoard true: terminal 100x30, board 20x20, statusBarHeight 5', () => {
      const layout = computeLayout(100, 30, 20, 20, 5, { centerBoard: true });
      const blockHeight = 28;
      expect(layout.blockWidth).toBe(60);
      expect(layout.blockHeight).toBe(blockHeight);
      expect(layout.startRow).toBe(Math.floor((30 - blockHeight) / 2) + 1); // 2
      expect(layout.startColumn).toBe(Math.floor((100 - 60) / 2) + 1); // 21
      expect(layout.boardStartColumn).toBe(21 + Math.floor((60 - 20) / 2)); // 41
      expect(layout.fitsInTerminal).toBe(true);
    });

    it('centerBoard false: startColumn 1, startRow 1, boardStartColumn offset when board 20', () => {
      const layout = computeLayout(80, 24, 20, 20, 5, { centerBoard: false });
      expect(layout.startColumn).toBe(1);
      expect(layout.startRow).toBe(1);
      expect(layout.boardStartColumn).toBe(1 + Math.floor((60 - 20) / 2)); // 21
      expect(layout.blockWidth).toBe(60);
      expect(layout.blockHeight).toBe(28);
    });

    it('boardWidth >= 60: blockWidth is boardWidth, boardStartColumn equals startColumn', () => {
      const layout = computeLayout(100, 30, 80, 20, 5, { centerBoard: true });
      expect(layout.blockWidth).toBe(80);
      expect(layout.boardStartColumn).toBe(layout.startColumn);
      expect(layout.startColumn).toBe(Math.floor((100 - 80) / 2) + 1); // 11
    });

    it('fitsInTerminal true when terminal large enough', () => {
      const layout = computeLayout(80, 35, 20, 20, 5, { centerBoard: true });
      expect(layout.blockHeight).toBe(28);
      expect(layout.fitsInTerminal).toBe(true);
    });

    it('fitsInTerminal false when terminal rows too small', () => {
      const layout = computeLayout(80, 20, 20, 20, 5, { centerBoard: true });
      expect(layout.fitsInTerminal).toBe(false);
    });

    it('fitsInTerminal false when terminal columns too small', () => {
      const layout = computeLayout(50, 30, 20, 20, 5, { centerBoard: true });
      expect(layout.fitsInTerminal).toBe(false);
    });
  });

  describe('truncateTitleToWidth', () => {
    it('returns short string unchanged', () => {
      expect(truncateTitleToWidth('Short')).toBe('Short');
    });
    it('returns string of length 60 unchanged', () => {
      const s = 'A'.repeat(60);
      expect(truncateTitleToWidth(s)).toBe(s);
      expect(truncateTitleToWidth(s).length).toBe(60);
    });
    it('truncates long string to 57 chars + ellipses (length 60)', () => {
      const result = truncateTitleToWidth('A'.repeat(70));
      expect(result).toBe('A'.repeat(57) + '...');
      expect(result.length).toBe(60);
    });
    it('respects custom maxWidth', () => {
      expect(truncateTitleToWidth('Title', 10)).toBe('Title');
      const result = truncateTitleToWidth('A'.repeat(20), 10);
      expect(result.length).toBe(10);
      expect(result).toBe('A'.repeat(7) + '...');
    });
  });

  describe('getContentRegionFromLayout', () => {
    it('returns null when layout is null', () => {
      expect(getContentRegionFromLayout(null)).toBeNull();
    });

    it('returns region matching layout block dimensions', () => {
      const layout = computeLayout(100, 30, 20, 20, 5, { centerBoard: true });
      const region = getContentRegionFromLayout(layout);
      expect(region).toEqual({
        startRow: layout.startRow,
        startColumn: layout.startColumn,
        rows: layout.blockHeight,
        columns: layout.blockWidth
      });
    });
  });
});

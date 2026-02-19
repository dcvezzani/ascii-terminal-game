import { describe, it, expect, beforeEach, vi } from 'vitest';
import Renderer from '../../src/render/Renderer.js';
import Canvas from '../../src/render/Canvas.js';
import Board from '../../src/game/Board.js';

vi.mock('ansi-escapes', () => ({
  cursorHide: '\x1b[?25l',
  cursorShow: '\x1b[?25h',
  cursorTo: (x, y) => `\x1b[${y};${x}H`
}));

vi.mock('cli-cursor', () => ({
  default: {
    hide: vi.fn(),
    show: vi.fn()
  }
}));

describe('Renderer', () => {
  let renderer;
  let mockStdout;
  let canvas;
  let board;

  beforeEach(() => {
    renderer = new Renderer();
    mockStdout = {
      write: vi.fn(),
      columns: 80,
      rows: 24
    };
    renderer.stdout = mockStdout;

    board = new Board({ width: 20, height: 20 });
    board.initialize();
    canvas = new Canvas();
    canvas.renderBoard(board, []);
  });

  describe('hideCursor and showCursor', () => {
    it('should have hideCursor method', () => {
      expect(typeof renderer.hideCursor).toBe('function');
      expect(() => renderer.hideCursor()).not.toThrow();
    });

    it('should have showCursor method', () => {
      expect(typeof renderer.showCursor).toBe('function');
      expect(() => renderer.showCursor()).not.toThrow();
    });
  });

  describe('clearScreen', () => {
    it('should have clearScreen method', () => {
      expect(typeof renderer.clearScreen).toBe('function');
      expect(() => renderer.clearScreen()).not.toThrow();
    });

    it('writes to stdout (cursorTo and spaces) and clears _lastRenderedGrid', () => {
      renderer._lastRenderedGrid = [{ length: 1 }];
      renderer.clearScreen();
      expect(mockStdout.write).toHaveBeenCalled();
      expect(renderer._lastRenderedGrid).toBeNull();
    });
  });

  describe('moveCursorToHome', () => {
    it('writes cursorTo to stdout', () => {
      renderer.moveCursorToHome();
      expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('0;0H'));
    });

    it('does not throw', () => {
      expect(() => renderer.moveCursorToHome()).not.toThrow();
    });
  });

  describe('getColorFunction', () => {
    it('returns a function for hex color', () => {
      const fn = renderer.getColorFunction('FF0000');
      expect(typeof fn).toBe('function');
      expect(fn('x')).toBeDefined();
    });

    it('returns chalk.white for empty hex', () => {
      const fn = renderer.getColorFunction();
      expect(typeof fn).toBe('function');
    });
  });

  describe('renderFull', () => {
    it('is no-op when canvas is null', () => {
      mockStdout.write.mockClear();
      renderer.renderFull(null);
      expect(mockStdout.write).not.toHaveBeenCalled();
    });

    it('is no-op when canvas has no grid', () => {
      mockStdout.write.mockClear();
      const emptyCanvas = new Canvas();
      renderer.renderFull(emptyCanvas);
      expect(mockStdout.write).not.toHaveBeenCalled();
    });

    it('writes canvas grid to stdout and sets _lastRenderedGrid', () => {
      mockStdout.write.mockClear();

      renderer.renderFull(canvas);

      expect(mockStdout.write).toHaveBeenCalled();
      expect(renderer._lastRenderedGrid).not.toBeNull();
      expect(renderer._lastRenderedGrid.length).toBe(canvas.grid.length);
      expect(renderer._lastRenderedGrid[0].length).toBe(canvas.grid[0].length);
    });

    it('sets horizOffset for centering', () => {
      renderer.renderFull(canvas);
      const columns = process.stdout.columns ?? 80;
      expect(renderer.horizOffset).toBe(Math.max(0, Math.floor((columns - 20) / 2)));
    });
  });

  describe('renderIncremental', () => {
    it('is no-op when canvas is null', () => {
      mockStdout.write.mockClear();
      renderer.renderIncremental(null);
      expect(mockStdout.write).not.toHaveBeenCalled();
    });

    it('falls back to full render when no previous grid', () => {
      renderer._lastRenderedGrid = null;
      mockStdout.write.mockClear();

      renderer.renderIncremental(canvas);

      expect(mockStdout.write).toHaveBeenCalled();
      expect(renderer._lastRenderedGrid).not.toBeNull();
    });

    it('writes only changed cells when previous grid has same shape', () => {
      mockStdout.write.mockClear();
      renderer.renderFull(canvas);
      const fullWriteCount = mockStdout.write.mock.calls.length;

      canvas.updateCell(5, 10, '@', '00FF00');
      mockStdout.write.mockClear();
      renderer.renderIncremental(canvas);

      expect(mockStdout.write).toHaveBeenCalled();
      expect(mockStdout.write.mock.calls.length).toBeLessThan(fullWriteCount);
    });

    it('updates _lastRenderedGrid after incremental render', () => {
      renderer.renderFull(canvas);
      canvas.updateCell(5, 10, 'X', 'FFFFFF');
      renderer.renderIncremental(canvas);
      expect(renderer._lastRenderedGrid[10][5].character).toBe('X');
    });
  });

  describe('render', () => {
    it('is no-op when canvas is null', () => {
      mockStdout.write.mockClear();
      renderer.render(null);
      expect(mockStdout.write).not.toHaveBeenCalled();
    });

    it('performs full render when no previous frame', () => {
      mockStdout.write.mockClear();

      renderer.render(canvas);

      expect(mockStdout.write).toHaveBeenCalled();
      expect(renderer._lastRenderedGrid).not.toBeNull();
    });

    it('skips render when canvas has no changes vs previous', () => {
      renderer.renderFull(canvas);
      mockStdout.write.mockClear();

      renderer.render(canvas);

      expect(mockStdout.write).not.toHaveBeenCalled();
    });

    it('performs incremental render when canvas has few changes', () => {
      renderer.renderFull(canvas);
      canvas.updateCell(0, 0, 'x', '000000');
      mockStdout.write.mockClear();

      renderer.render(canvas);

      expect(mockStdout.write).toHaveBeenCalled();
    });
  });
});

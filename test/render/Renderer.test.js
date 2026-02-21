import { describe, it, expect, beforeEach, vi } from 'vitest';
import Renderer from '../../src/render/Renderer.js';
import Board from '../../src/game/Board.js';

vi.mock('ansi-escapes', () => ({
  cursorHide: '\x1b[?25l',
  cursorShow: '\x1b[?25h',
  eraseScreen: '\x1b[2J',
  cursorTo: (x, y) => `\x1b[${y};${x}H`,
  eraseEndLine: '\x1b[K'
}));

vi.mock('cli-cursor', () => ({
  default: {
    hide: vi.fn(),
    show: vi.fn()
  },
  hide: vi.fn(),
  show: vi.fn()
}));

describe('Renderer', () => {
  let renderer;
  let board;
  let mockStdout;

  beforeEach(() => {
    renderer = new Renderer();
    board = new Board({ width: 20, height: 20 });
    board.initialize();
    mockStdout = {
      write: vi.fn(),
      columns: 80,
      rows: 24
    };
    renderer.stdout = mockStdout;
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
  });

  describe('moveCursorToHome', () => {
    it('writes cursor position to stdout', () => {
      mockStdout.write.mockClear();
      renderer.moveCursorToHome();
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('does not throw', () => {
      expect(() => renderer.moveCursorToHome()).not.toThrow();
    });
  });
});

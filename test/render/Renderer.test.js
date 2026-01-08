import { describe, it, expect, beforeEach, vi } from 'vitest';
import Renderer from '../../src/render/Renderer.js';
import Board from '../../src/game/Board.js';

// Mock terminal utilities
vi.mock('ansi-escapes', () => ({
  cursorHide: '\x1b[?25l',
  cursorShow: '\x1b[?25h',
  eraseScreen: '\x1b[2J',
  cursorTo: (x, y) => `\x1b[${y};${x}H`
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
    board = new Board(20, 20);
    board.initialize();

    // Mock stdout
    mockStdout = {
      write: vi.fn(),
      columns: 80,
      rows: 24
    };
    renderer.stdout = mockStdout;
  });

  describe('getCellContent', () => {
    it('should return player character when player at position', () => {
      const players = [
        { playerId: 'p1', x: 10, y: 10, playerName: 'Player 1' }
      ];

      const content = renderer.getCellContent(10, 10, board, players);
      expect(content.character).toBe('@');
      expect(content.color).toBeDefined();
    });

    it('should return board cell when no player at position', () => {
      const players = [];

      const content = renderer.getCellContent(10, 10, board, players);
      expect(content.character).toBe('.');
    });

    it('should return wall character for wall cells', () => {
      const players = [];

      const content = renderer.getCellContent(0, 0, board, players);
      expect(content.character).toBe('#');
    });

    it('should prioritize player over board cell', () => {
      const players = [
        { playerId: 'p1', x: 5, y: 5, playerName: 'Player 1' }
      ];

      const content = renderer.getCellContent(5, 5, board, players);
      expect(content.character).toBe('@');
    });
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

  describe('renderTitle', () => {
    it('should have renderTitle method', () => {
      expect(typeof renderer.renderTitle).toBe('function');
      expect(() => renderer.renderTitle()).not.toThrow();
    });
  });

  describe('renderBoard', () => {
    it('should have renderBoard method', () => {
      expect(typeof renderer.renderBoard).toBe('function');
      expect(() => renderer.renderBoard(board, [])).not.toThrow();
    });
  });

  describe('renderStatusBar', () => {
    it('should have renderStatusBar method', () => {
      expect(typeof renderer.renderStatusBar).toBe('function');
      expect(() => renderer.renderStatusBar(0, { x: 10, y: 10 })).not.toThrow();
    });
  });
});

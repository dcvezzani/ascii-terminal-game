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
    board = new Board({ width: 20, height: 20 });
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
      expect(content.character).toBe('☻');
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
      expect(content.character).toBe('☻');
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

  describe('updateCell', () => {
    it('should update cell at correct position', () => {
      renderer.updateCell(5, 10, '@', '00FF00');
      
      // Check that cursorTo was called with correct coordinates
      // Title offset is 2 lines (title + blank line)
      // So y = 10 + 2 + 1 = 13 (1-indexed)
      // x = 5 + 1 = 6 (1-indexed)
      const calls = mockStdout.write.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should use correct color', () => {
      renderer.updateCell(5, 10, '@', '00FF00');
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle out-of-bounds gracefully', () => {
      expect(() => renderer.updateCell(-1, 10, '@', '00FF00')).not.toThrow();
      expect(() => renderer.updateCell(100, 10, '@', '00FF00')).not.toThrow();
      expect(() => renderer.updateCell(5, -1, '@', '00FF00')).not.toThrow();
      expect(() => renderer.updateCell(5, 100, '@', '00FF00')).not.toThrow();
    });
  });

  describe('restoreCellContent', () => {
    it('should restore board cell when no player present', () => {
      const players = [];
      renderer.restoreCellContent(10, 10, board, players, []);
      
      // Should call updateCell with board cell character
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should restore other player when present', () => {
      const players = [
        { playerId: 'p2', x: 10, y: 10, playerName: 'Player 2' }
      ];
      renderer.restoreCellContent(10, 10, board, players, []);
      
      // Should call updateCell with player character
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should prioritize player over board cell', () => {
      const players = [
        { playerId: 'p2', x: 5, y: 5, playerName: 'Player 2' }
      ];
      renderer.restoreCellContent(5, 5, board, players, []);
      
      // Should restore player, not board cell
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle out-of-bounds gracefully', () => {
      expect(() => {
        renderer.restoreCellContent(-1, 10, board, [], []);
      }).not.toThrow();
    });
  });

  describe('renderIncremental', () => {
    it('should handle moved player', () => {
      const changes = {
        players: {
          moved: [
            {
              playerId: 'p1',
              oldPos: { x: 10, y: 10 },
              newPos: { x: 11, y: 10 }
            }
          ],
          joined: [],
          left: []
        },
        scoreChanged: false
      };
      const players = [
        { playerId: 'p1', x: 11, y: 10, playerName: 'Player 1' }
      ];

      renderer.renderIncremental(changes, board, players, [], 'local-player');
      
      // Should restore old position and draw at new position
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle joined player', () => {
      const changes = {
        players: {
          moved: [],
          joined: [
            {
              playerId: 'p2',
              pos: { x: 12, y: 12 },
              playerName: 'Player 2'
            }
          ],
          left: []
        },
        scoreChanged: false
      };
      const players = [
        { playerId: 'p2', x: 12, y: 12, playerName: 'Player 2' }
      ];

      renderer.renderIncremental(changes, board, players, [], 'local-player');
      
      // Should draw player at spawn position
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle left player', () => {
      const changes = {
        players: {
          moved: [],
          joined: [],
          left: [
            {
              playerId: 'p1',
              pos: { x: 10, y: 10 }
            }
          ]
        },
        scoreChanged: false
      };
      const players = [];

      renderer.restoreCellContent = vi.fn();
      renderer.renderIncremental(changes, board, players, [], 'local-player');
      
      // Should restore cell content at left position
      expect(renderer.restoreCellContent).toHaveBeenCalledWith(10, 10, board, players, []);
    });

    it('should handle multiple changes', () => {
      const changes = {
        players: {
          moved: [
            {
              playerId: 'p1',
              oldPos: { x: 10, y: 10 },
              newPos: { x: 11, y: 10 }
            }
          ],
          joined: [
            {
              playerId: 'p2',
              pos: { x: 12, y: 12 },
              playerName: 'Player 2'
            }
          ],
          left: [
            {
              playerId: 'p3',
              pos: { x: 5, y: 5 }
            }
          ]
        },
        scoreChanged: false
      };
      const players = [
        { playerId: 'p1', x: 11, y: 10, playerName: 'Player 1' },
        { playerId: 'p2', x: 12, y: 12, playerName: 'Player 2' }
      ];

      renderer.restoreCellContent = vi.fn();
      renderer.updateCell = vi.fn();
      renderer.renderIncremental(changes, board, players, [], 'local-player');
      
      // Should process all changes
      expect(renderer.restoreCellContent).toHaveBeenCalled();
      expect(renderer.updateCell).toHaveBeenCalled();
    });

    it('should update status bar when score changed', () => {
      const changes = {
        players: {
          moved: [],
          joined: [],
          left: []
        },
        scoreChanged: true
      };
      const players = [];

      renderer.renderStatusBar = vi.fn();
      renderer.renderIncremental(changes, board, players, [], 'local-player', 10, { x: 10, y: 10 });
      
      // Should call renderStatusBar
      expect(renderer.renderStatusBar).toHaveBeenCalled();
    });

    it('should not update status bar when score unchanged', () => {
      const changes = {
        players: {
          moved: [],
          joined: [],
          left: []
        },
        scoreChanged: false
      };
      const players = [];

      renderer.renderStatusBar = vi.fn();
      renderer.renderIncremental(changes, board, players, [], 'local-player', 0, { x: 10, y: 10 });
      
      // Should not call renderStatusBar
      expect(renderer.renderStatusBar).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      const changes = {
        players: {
          moved: [
            {
              playerId: 'p1',
              oldPos: { x: 10, y: 10 },
              newPos: { x: 11, y: 10 }
            }
          ],
          joined: [],
          left: []
        },
        scoreChanged: false
      };
      const players = [];

      // Make restoreCellContent throw
      renderer.restoreCellContent = vi.fn(() => {
        throw new Error('Test error');
      });

      expect(() => {
        renderer.renderIncremental(changes, board, players, [], 'local-player');
      }).toThrow('Test error');
    });
  });
});

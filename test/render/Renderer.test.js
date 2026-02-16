import { describe, it, expect, beforeEach, vi } from 'vitest';
import Renderer from '../../src/render/Renderer.js';
import Board from '../../src/game/Board.js';

// Mock terminal utilities
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

  describe('clearContentRegion', () => {
    it('is no-op when region is null', () => {
      mockStdout.write.mockClear();
      renderer.clearContentRegion(null);
      expect(mockStdout.write).not.toHaveBeenCalled();
    });

    it('is no-op when region has zero rows', () => {
      mockStdout.write.mockClear();
      renderer.clearContentRegion({ startRow: 1, startColumn: 1, rows: 0, columns: 10 });
      expect(mockStdout.write).not.toHaveBeenCalled();
    });

    it('overwrites region with spaces and eraseEndLine per row', () => {
      mockStdout.write.mockClear();
      renderer.clearContentRegion({ startRow: 2, startColumn: 3, rows: 2, columns: 5 });
      const calls = mockStdout.write.mock.calls.map(c => c[0]);
      expect(calls.length).toBeGreaterThanOrEqual(6); // 2 rows × (cursorTo + spaces + eraseEndLine)
      expect(calls.some(c => c.includes('2;3H'))).toBe(true);
      expect(calls.some(c => c.includes('3;3H'))).toBe(true);
      expect(calls.some(c => c === '     ')).toBe(true);
      expect(calls.some(c => c === '\x1b[K')).toBe(true);
    });
  });

  describe('renderTerminalTooSmallMessage', () => {
    it('shows two-line message (terminal is too small / please resize)', () => {
      mockStdout.write.mockClear();
      renderer.renderTerminalTooSmallMessage(40, 24, 60, 28);
      const output = mockStdout.write.mock.calls.map(c => c[0]).join('');
      expect(output).toContain(Renderer.TERMINAL_TOO_SMALL_LINE1);
      expect(output).toContain(Renderer.TERMINAL_TOO_SMALL_LINE2);
    });

    it('clears screen before writing message', () => {
      mockStdout.write.mockClear();
      renderer.renderTerminalTooSmallMessage(40, 24, 60, 28);
      expect(mockStdout.write).toHaveBeenCalledWith(expect.any(String)); // eraseScreen
    });
  });

  describe('renderTitle', () => {
    it('should have renderTitle method', () => {
      expect(typeof renderer.renderTitle).toBe('function');
      expect(() => renderer.renderTitle()).not.toThrow();
    });

    it('when layout provided, writes title at layout position with 60-char truncation', () => {
      const layout = { startRow: 5, startColumn: 10 };
      renderer.renderTitle('Short Title', layout);
      expect(mockStdout.write).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[5;10H')
      );
      const chalkCall = mockStdout.write.mock.calls.find(
        c => typeof c[0] === 'string' && c[0].includes('Short Title')
      );
      expect(chalkCall).toBeDefined();
    });

    it('when layout provided, truncates long title to 60 chars with ellipses', () => {
      const layout = { startRow: 1, startColumn: 1 };
      const longTitle = 'A'.repeat(70);
      renderer.renderTitle(longTitle, layout);
      const chalkCall = mockStdout.write.mock.calls.find(
        c => typeof c[0] === 'string' && c[0].includes('...')
      );
      expect(chalkCall).toBeDefined();
      expect(chalkCall[0].length).toBeLessThanOrEqual(60 + 20); // chalk adds codes; content part is 60
    });

    it('when layout not provided, writes title and newlines (current behavior)', () => {
      mockStdout.write.mockClear();
      renderer.renderTitle();
      expect(mockStdout.write).toHaveBeenCalledWith(
        expect.stringContaining('=== Multiplayer Terminal Game ===')
      );
      expect(mockStdout.write).toHaveBeenCalledWith(expect.stringMatching(/\n\n$/));
    });
  });

  describe('renderBoard', () => {
    it('should have renderBoard method', () => {
      expect(typeof renderer.renderBoard).toBe('function');
      expect(() => renderer.renderBoard(board, [])).not.toThrow();
    });

    it('when layout provided, draws each row at layout position', () => {
      const layout = { startRow: 3, boardStartColumn: 21 };
      mockStdout.write.mockClear();
      renderer.renderBoard(board, [], layout);
      const cursorCalls = mockStdout.write.mock.calls
        .map(c => c[0])
        .filter(s => typeof s === 'string' && s.includes('\x1b[') && s.includes('H'));
      expect(cursorCalls.length).toBe(20);
      expect(cursorCalls[0]).toContain('\x1b[5;21H'); // startRow 3 + TITLE_HEIGHT 2 + y 0 = 5
      expect(cursorCalls[19]).toContain('\x1b[24;21H'); // startRow 3 + 2 + 19 = 24
    });

    it('when layout not provided, does not use cursorTo for board rows', () => {
      mockStdout.write.mockClear();
      renderer.renderBoard(board, []);
      const cursorCalls = mockStdout.write.mock.calls
        .filter(c => typeof c[0] === 'string' && c[0].includes(';') && c[0].includes('H'));
      expect(cursorCalls.length).toBe(0);
    });
  });

  describe('renderStatusBar', () => {
    it('should have renderStatusBar method', () => {
      expect(typeof renderer.renderStatusBar).toBe('function');
      expect(() =>
        renderer.renderStatusBar(0, { x: 10, y: 10 }, 80, 20)
      ).not.toThrow();
    });

    it('should use full format (two lines) when boardWidth > threshold', () => {
      renderer.renderStatusBar(0, { x: 10, y: 12 }, 30, 20);
      const calls = mockStdout.write.mock.calls;
      const output = calls.map(c => c[0]).join('');
      expect(output).toContain('Score: 0');
      expect(output).toContain('Position: (10,');
      expect(output).toContain('12)');
      expect(output).toContain('Arrow keys/WASD to move');
    });

    it('should render status bar in a box (dash top/bottom, pipe content lines)', () => {
      mockStdout.write.mockClear();
      renderer.renderStatusBar(0, { x: 3, y: 5 }, 60, 20);
      const calls = mockStdout.write.mock.calls;
      const lines = calls.map(c => c[0]).filter(s => typeof s === 'string');
      const output = lines.join('');
      expect(output).toContain('------------------------------------------------------------');
      expect(output).toContain('| Score: 0 | Position: (3, 5)');
      expect(output).toContain('| Arrow keys/WASD to move, Q/ESC to quit');
      expect(output).toMatch(/\|\s+Score: 0 \| Position: \(3, 5\)\s+\|/);
    });

    it('should use simplified format when boardWidth <= threshold', () => {
      mockStdout.write.mockClear();
      renderer.renderStatusBar(0, { x: 10, y: 12 }, 20, 20);
      const calls = mockStdout.write.mock.calls;
      const output = calls.map(c => c[0]).join('');
      expect(output).toContain('S: 0');
      expect(output).toContain('P: (10,');
      expect(output).toContain('12)');
      expect(output).not.toContain('Arrow keys');
    });

    it('should not rewrite unchanged lines on second call', () => {
      mockStdout.write.mockClear();
      renderer.renderStatusBar(0, { x: 1, y: 1 }, 30, 20);
      const firstCallCount = mockStdout.write.mock.calls.length;
      mockStdout.write.mockClear();
      renderer.renderStatusBar(0, { x: 1, y: 1 }, 30, 20);
      const secondCallCount = mockStdout.write.mock.calls.length;
      expect(secondCallCount).toBe(0);
    });

    it('should use threshold from config when provided', () => {
      const rendererWithConfig = new Renderer({
        ...renderer.config,
        statusBar: { widthThreshold: 30 }
      });
      rendererWithConfig.stdout = mockStdout;
      mockStdout.write.mockClear();
      rendererWithConfig.renderStatusBar(0, { x: 10, y: 12 }, 25, 20);
      const output = mockStdout.write.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('S: 0');
      expect(output).toContain('P: (10, 12)');
      expect(output).not.toContain('Arrow keys');
    });

    it('when layout provided, draws status bar at layout position with 60-char width', () => {
      const layout = { startRow: 2, startColumn: 10 };
      mockStdout.write.mockClear();
      renderer.renderStatusBar(0, { x: 10, y: 12 }, 60, 20, layout);
      const cursorCalls = mockStdout.write.mock.calls
        .map(c => c[0])
        .filter(s => typeof s === 'string' && s.includes('\x1b[') && s.includes('H'));
      const statusBarStartRow = 2 + 2 + 20 + 1; // layout.startRow + TITLE_HEIGHT + boardHeight + BLANK
      expect(cursorCalls[0]).toContain(`\x1b[${statusBarStartRow};10H`);
      const dashLine = mockStdout.write.mock.calls
        .map(c => c[0])
        .find(s => typeof s === 'string' && /^-+$/.test(s.trim()));
      expect(dashLine).toBeDefined();
      expect(dashLine.trim().length).toBe(60);
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

    it('when _currentLayout is set, uses layout position for cursor', () => {
      renderer._currentLayout = { startRow: 3, boardStartColumn: 21 };
      mockStdout.write.mockClear();
      renderer.updateCell(5, 10, '@', '00FF00');
      const cursorCall = mockStdout.write.mock.calls.find(
        c => typeof c[0] === 'string' && c[0].includes('\x1b[') && c[0].includes('H')
      );
      expect(cursorCall).toBeDefined();
      expect(cursorCall[0]).toContain('\x1b[15;26H'); // row 3+2+10=15, col 21+5=26
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

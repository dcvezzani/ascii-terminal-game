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

    it('fills this.grid with blank cells and does not write to stdout', () => {
      renderer.renderTerminalTooSmallMessage(10, 5, 60, 28);
      mockStdout.write.mockClear();
      renderer.clearScreen();
      expect(mockStdout.write).not.toHaveBeenCalled();
      for (let y = 0; y < renderer.grid.length; y++) {
        for (let x = 0; x < renderer.grid[y].length; x++) {
          expect(renderer.grid[y][x]).toEqual({ character: ' ', color: 'FFFFFF' });
        }
      }
    });

    it('is no-op when grid is null', () => {
      renderer.grid = null;
      expect(() => renderer.clearScreen()).not.toThrow();
    });
  });

  describe('clearContentRegion', () => {
    it('is no-op when region is null', () => {
      renderer.grid = [['x']];
      mockStdout.write.mockClear();
      renderer.clearContentRegion(null);
      expect(mockStdout.write).not.toHaveBeenCalled();
      expect(renderer.grid[0][0]).toBe('x');
    });

    it('is no-op when region has zero rows', () => {
      renderer.grid = [['x']];
      mockStdout.write.mockClear();
      renderer.clearContentRegion({ startRow: 1, startColumn: 1, rows: 0, columns: 10 });
      expect(mockStdout.write).not.toHaveBeenCalled();
    });

    it('overwrites region in this.grid with blank cells and does not write to stdout', () => {
      renderer.renderTerminalTooSmallMessage(10, 5, 60, 28);
      mockStdout.write.mockClear();
      renderer.clearContentRegion({ startRow: 2, startColumn: 3, rows: 2, columns: 5 });
      expect(mockStdout.write).not.toHaveBeenCalled();
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 5; c++) {
          const cell = renderer.grid[1 + r][2 + c];
          expect(cell).toEqual({ character: ' ', color: 'FFFFFF' });
        }
      }
    });
  });

  describe('moveCursorToHome', () => {
    it('does not write to stdout (no-op when rendering to grid)', () => {
      mockStdout.write.mockClear();
      renderer.moveCursorToHome();
      expect(mockStdout.write).not.toHaveBeenCalled();
    });

    it('does not throw', () => {
      expect(() => renderer.moveCursorToHome()).not.toThrow();
    });
  });

  describe('renderTerminalTooSmallMessage', () => {
    it('writes two-line message into this.grid (terminal is too small / please resize)', () => {
      renderer.renderTerminalTooSmallMessage(40, 24, 60, 28);
      expect(renderer.grid).toBeDefined();
      expect(renderer.grid.length).toBe(24);
      expect(renderer.grid[0].length).toBe(40);
      const line1Row = renderer.grid[11].map(c => c.character).join('').trim();
      const line2Row = renderer.grid[12].map(c => c.character).join('').trim();
      expect(line1Row).toBe(Renderer.TERMINAL_TOO_SMALL_LINE1);
      expect(line2Row).toBe(Renderer.TERMINAL_TOO_SMALL_LINE2);
      const firstCharCol = renderer.grid[11].findIndex(c => c.character !== ' ');
      expect(renderer.grid[11][firstCharCol].color).toBe(Renderer.TERMINAL_TOO_SMALL_COLOR);
    });

    it('sets grid size to terminalRows x terminalColumns', () => {
      renderer.renderTerminalTooSmallMessage(80, 30, 60, 28);
      expect(renderer.grid.length).toBe(30);
      expect(renderer.grid[0].length).toBe(80);
    });
  });

  describe('renderTitle', () => {
    it('should have renderTitle method', () => {
      expect(typeof renderer.renderTitle).toBe('function');
      expect(() => renderer.renderTitle()).not.toThrow();
    });

    it('when layout provided, writes title into this.grid with 60-char truncation', () => {
      const layout = { startRow: 5, startColumn: 10 };
      renderer.renderTitle('Short Title', layout);
      expect(renderer.grid).toBeDefined();
      expect(renderer.grid.length).toBe(2);
      const titleChars = renderer.grid[0].map(c => c.character).join('');
      expect(titleChars.trim()).toBe('Short Title');
      expect(renderer.grid[0][0].color).toBe(Renderer.TITLE_COLOR);
    });

    it('when layout provided, truncates long title to 60 chars with ellipses', () => {
      const layout = { startRow: 1, startColumn: 1 };
      const longTitle = 'A'.repeat(70);
      renderer.renderTitle(longTitle, layout);
      const titleChars = renderer.grid[0].map(c => c.character).join('').trim();
      expect(titleChars.length).toBe(60);
      expect(titleChars.endsWith('...')).toBe(true);
    });

    it('when layout not provided, writes full title into this.grid row 0', () => {
      renderer.renderTitle();
      const titleChars = renderer.grid[0].map(c => c.character).join('').trim();
      expect(titleChars).toBe('=== Multiplayer Terminal Game ===');
      expect(renderer.grid[1].every(c => c.character === ' ')).toBe(true);
    });
  });

  describe('renderBoard', () => {
    it('should have renderBoard method', () => {
      expect(typeof renderer.renderBoard).toBe('function');
      expect(() => renderer.renderBoard(board, [])).not.toThrow();
    });

    it('writes board and players into this.grid (2D array of { character, color })', () => {
      renderer.renderBoard(board, []);
      expect(renderer.grid).toBeDefined();
      expect(renderer.grid.length).toBe(20);
      expect(renderer.grid[0].length).toBe(20);
      expect(renderer.grid[0][0]).toEqual({ character: '#', color: '808080' });
      expect(renderer.grid[10][10]).toEqual({ character: '.', color: 'FFFFFF' });
    });

    it('when layout provided, still populates grid and stores layout for incremental updates', () => {
      const layout = { startRow: 3, boardStartColumn: 21 };
      renderer.renderBoard(board, [], layout);
      expect(renderer.grid).toBeDefined();
      expect(renderer.grid.length).toBe(20);
      expect(renderer._currentLayout).toBe(layout);
    });

    it('when players provided, draws players on grid', () => {
      const players = [{ playerId: 'p1', x: 10, y: 10, playerName: 'P1' }];
      renderer.renderBoard(board, players);
      expect(renderer.grid[10][10].character).toBe('☻');
      expect(renderer.grid[10][10].color).toBe(renderer.config.playerColor);
    });
  });

  describe('renderStatusBar', () => {
    it('should have renderStatusBar method', () => {
      expect(typeof renderer.renderStatusBar).toBe('function');
      expect(() =>
        renderer.renderStatusBar(0, { x: 10, y: 10 }, 80, 20)
      ).not.toThrow();
    });

    it('writes status bar into this.grid (full format when boardWidth > threshold)', () => {
      renderer.renderStatusBar(0, { x: 10, y: 12 }, 30, 20);
      const text = renderer.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toContain('Score: 0');
      expect(text).toContain('Position: (10,');
      expect(text).toContain('12)');
      expect(text).toContain('Arrow keys/WASD to move');
      expect(renderer.grid[0][0].color).toBe(Renderer.STATUS_BAR_COLOR);
    });

    it('renders status bar in a box (dash top/bottom, pipe content lines)', () => {
      renderer.renderStatusBar(0, { x: 3, y: 5 }, 60, 20);
      const text = renderer.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toContain('------------------------------------------------------------');
      expect(text).toContain('| Score: 0 | Position: (3, 5)');
      expect(text).toContain('| Arrow keys/WASD to move, Q/ESC to quit');
    });

    it('uses simplified format when boardWidth <= threshold', () => {
      renderer.renderStatusBar(0, { x: 10, y: 12 }, 20, 20);
      const text = renderer.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toContain('S: 0');
      expect(text).toContain('P: (10,');
      expect(text).toContain('12)');
      expect(text).not.toContain('Arrow keys');
    });

    it('replaces previous status bar rows on second call (same row count)', () => {
      renderer.renderStatusBar(0, { x: 1, y: 1 }, 30, 20);
      const firstRowCount = renderer.grid.length;
      renderer.renderStatusBar(0, { x: 1, y: 1 }, 30, 20);
      expect(renderer.grid.length).toBe(firstRowCount);
      const text = renderer.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toContain('Score: 0');
    });

    it('should use threshold from config when provided', () => {
      const rendererWithConfig = new Renderer({
        ...renderer.config,
        statusBar: { widthThreshold: 30 }
      });
      rendererWithConfig.renderStatusBar(0, { x: 10, y: 12 }, 25, 20);
      const text = rendererWithConfig.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toContain('S: 0');
      expect(text).toContain('P: (10, 12)');
      expect(text).not.toContain('Arrow keys');
    });

    it('when layout provided, uses 60-char width for status bar box', () => {
      const layout = { startRow: 2, startColumn: 10 };
      renderer.renderStatusBar(0, { x: 10, y: 12 }, 60, 20, layout);
      expect(renderer.grid[0].length).toBe(60);
      const topRow = renderer.grid[0].map((c) => c.character).join('');
      expect(topRow).toMatch(/^-+$/);
    });
  });

  describe('updateCell', () => {
    it('writes cell to this.grid at (x, y)', () => {
      renderer.renderBoard(board, []);
      renderer.updateCell(5, 10, '@', '00FF00');
      expect(renderer.grid[10][5]).toEqual({ character: '@', color: '00FF00' });
    });

    it('no-ops when grid does not exist', () => {
      expect(renderer.grid).toBeNull();
      renderer.updateCell(5, 10, '@', '00FF00');
      expect(renderer.grid).toBeNull();
    });

    it('stores character and color in grid', () => {
      renderer.renderBoard(board, []);
      renderer.updateCell(5, 10, '@', '00FF00');
      expect(renderer.grid[10][5].character).toBe('@');
      expect(renderer.grid[10][5].color).toBe('00FF00');
    });

    it('should handle out-of-bounds gracefully (no throw, no write)', () => {
      renderer.renderBoard(board, []);
      expect(() => renderer.updateCell(-1, 10, '@', '00FF00')).not.toThrow();
      expect(() => renderer.updateCell(100, 10, '@', '00FF00')).not.toThrow();
      expect(() => renderer.updateCell(5, -1, '@', '00FF00')).not.toThrow();
      expect(() => renderer.updateCell(5, 100, '@', '00FF00')).not.toThrow();
      // Original in-bounds cell unchanged by out-of-bounds calls
      expect(renderer.grid[10][5]).toEqual({ character: '.', color: 'FFFFFF' });
    });
  });

  describe('restoreCellContent', () => {
    it('should restore board cell when no player present', () => {
      renderer.renderBoard(board, []);
      const players = [];
      renderer.restoreCellContent(10, 10, board, players, []);
      expect(renderer.grid[10][10]).toEqual({ character: '.', color: 'FFFFFF' });
    });

    it('should restore other player when present', () => {
      renderer.renderBoard(board, []);
      const players = [
        { playerId: 'p2', x: 10, y: 10, playerName: 'Player 2' }
      ];
      renderer.restoreCellContent(10, 10, board, players, []);
      expect(renderer.grid[10][10].character).toBe('☻');
    });

    it('should prioritize player over board cell', () => {
      renderer.renderBoard(board, []);
      const players = [
        { playerId: 'p2', x: 5, y: 5, playerName: 'Player 2' }
      ];
      renderer.restoreCellContent(5, 5, board, players, []);
      expect(renderer.grid[5][5].character).toBe('☻');
    });

    it('should handle out-of-bounds gracefully', () => {
      expect(() => {
        renderer.restoreCellContent(-1, 10, board, [], []);
      }).not.toThrow();
    });
  });

  describe('renderIncremental', () => {
    it('should handle moved player', () => {
      renderer.renderBoard(board, []);
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
      expect(renderer.grid[10][10].character).toBe('.');
      expect(renderer.grid[10][11].character).toBe('☻');
    });

    it('should handle joined player', () => {
      renderer.renderBoard(board, []);
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
      expect(renderer.grid[12][12].character).toBe('☻');
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

import { describe, it, expect, beforeEach } from 'vitest';
import Canvas from '../../src/render/Canvas.js';
import Board from '../../src/game/Board.js';
import Message from '../../src/render/Message.js';

describe('Canvas', () => {
  let canvas;
  let board;

  beforeEach(() => {
    canvas = new Canvas();
    board = new Board({ width: 20, height: 20 });
    board.initialize();
  });

  describe('getCellContent', () => {
    it('should return player character when player at position', () => {
      const players = [
        { playerId: 'p1', x: 10, y: 10, playerName: 'Player 1' }
      ];

      const content = canvas.getCellContent(10, 10, board, players);
      expect(content.character).toBe('☻');
      expect(content.color).toBeDefined();
    });

    it('should return board cell when no player at position', () => {
      const players = [];

      const content = canvas.getCellContent(10, 10, board, players);
      expect(content.character).toBe('.');
    });

    it('should return wall character for wall cells', () => {
      const players = [];

      const content = canvas.getCellContent(0, 0, board, players);
      expect(content.character).toBe('#');
    });

    it('should prioritize player over board cell', () => {
      const players = [
        { playerId: 'p1', x: 5, y: 5, playerName: 'Player 1' }
      ];

      const content = canvas.getCellContent(5, 5, board, players);
      expect(content.character).toBe('☻');
    });
  });

  describe('clearScreen', () => {
    it('is no-op when grid is null', () => {
      canvas.grid = null;
      expect(() => canvas.clearScreen()).not.toThrow();
    });

    it('fills this.grid with blank cells', () => {
      Message.apply(canvas, { terminalColumns: 60, terminalRows: 28 });
      canvas.clearScreen();
      for (let y = 0; y < canvas.grid.length; y++) {
        for (let x = 0; x < canvas.grid[y].length; x++) {
          expect(canvas.grid[y][x]).toEqual({ character: ' ', color: 'FFFFFF' });
        }
      }
    });
  });

  describe('clearContentRegion', () => {
    it('is no-op when region is null', () => {
      canvas.grid = [['x']];
      canvas.clearContentRegion(null);
      expect(canvas.grid[0][0]).toBe('x');
    });

    it('is no-op when region has zero rows', () => {
      canvas.grid = [[{ character: 'x', color: 'FFFFFF' }]];
      canvas.clearContentRegion({ startRow: 1, startColumn: 1, rows: 0, columns: 10 });
      expect(canvas.grid[0][0].character).toBe('x');
    });

    it('overwrites region in this.grid with blank cells', () => {
      Message.apply(canvas, { terminalColumns: 60, terminalRows: 28 });
      canvas.clearContentRegion({ startRow: 2, startColumn: 3, rows: 2, columns: 5 });
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 5; c++) {
          const cell = canvas.grid[1 + r][2 + c];
          expect(cell).toEqual({ character: ' ', color: 'FFFFFF' });
        }
      }
    });
  });

  describe('Message.apply (terminal too small)', () => {
    it('writes two-line message into canvas.grid', () => {
      Message.apply(canvas, { terminalColumns: 40, terminalRows: 24 });
      expect(canvas.grid).toBeDefined();
      expect(canvas.grid.length).toBe(24);
      expect(canvas.grid[0].length).toBe(40);
      const line1Row = canvas.grid[11].map(c => c.character).join('').trim();
      const line2Row = canvas.grid[12].map(c => c.character).join('').trim();
      expect(line1Row).toBe(Message.TERMINAL_TOO_SMALL_LINE1);
      expect(line2Row).toBe(Message.TERMINAL_TOO_SMALL_LINE2);
      const firstCharCol = canvas.grid[11].findIndex(c => c.character !== ' ');
      expect(canvas.grid[11][firstCharCol].color).toBe(Message.TERMINAL_TOO_SMALL_COLOR);
    });

    it('sets grid size to terminalRows x terminalColumns', () => {
      Message.apply(canvas, { terminalColumns: 80, terminalRows: 30 });
      expect(canvas.grid.length).toBe(30);
      expect(canvas.grid[0].length).toBe(80);
    });
  });

  describe('renderTitle', () => {
    it('should have renderTitle method', () => {
      expect(typeof canvas.renderTitle).toBe('function');
      expect(() => canvas.renderTitle()).not.toThrow();
    });

    it('when layout provided, writes title into this.grid with 60-char truncation', () => {
      const layout = { startRow: 5, startColumn: 10 };
      canvas.renderTitle('Short Title', layout);
      expect(canvas.grid).toBeDefined();
      expect(canvas.grid.length).toBe(2);
      const titleChars = canvas.grid[0].map(c => c.character).join('');
      expect(titleChars.trim()).toBe('Short Title');
      expect(canvas.grid[0][0].color).toBe(Canvas.TITLE_COLOR);
    });

    it('when layout provided, truncates long title to 60 chars with ellipses', () => {
      const layout = { startRow: 1, startColumn: 1 };
      const longTitle = 'A'.repeat(70);
      canvas.renderTitle(longTitle, layout);
      const titleChars = canvas.grid[0].map(c => c.character).join('').trim();
      expect(titleChars.length).toBe(60);
      expect(titleChars.endsWith('...')).toBe(true);
    });

    it('when layout not provided, writes full title into this.grid row 0', () => {
      canvas.renderTitle();
      const titleChars = canvas.grid[0].map(c => c.character).join('').trim();
      expect(titleChars).toBe('=== Multiplayer Terminal Game ===');
      expect(canvas.grid[1].every(c => c.character === ' ')).toBe(true);
    });
  });

  describe('renderBoard', () => {
    it('should have renderBoard method', () => {
      expect(typeof canvas.renderBoard).toBe('function');
      expect(() => canvas.renderBoard(board, [])).not.toThrow();
    });

    it('writes board and players into this.grid (2D array of { character, color })', () => {
      canvas.renderBoard(board, []);
      expect(canvas.grid).toBeDefined();
      expect(canvas.grid.length).toBe(20);
      expect(canvas.grid[0].length).toBe(20);
      expect(canvas.grid[0][0]).toEqual({ character: '#', color: '808080' });
      expect(canvas.grid[10][10]).toEqual({ character: '.', color: 'FFFFFF' });
    });

    it('when layout provided, still populates grid and stores layout for incremental updates', () => {
      const layout = { startRow: 3, boardStartColumn: 21 };
      canvas.renderBoard(board, [], layout);
      expect(canvas.grid).toBeDefined();
      expect(canvas.grid.length).toBe(20);
      expect(canvas._currentLayout).toBe(layout);
    });

    it('when players provided, draws players on grid', () => {
      const players = [{ playerId: 'p1', x: 10, y: 10, playerName: 'P1' }];
      canvas.renderBoard(board, players);
      expect(canvas.grid[10][10].character).toBe('☻');
      expect(canvas.grid[10][10].color).toBe(canvas.config.playerColor);
    });
  });

  describe('renderStatusBar', () => {
    it('should have renderStatusBar method', () => {
      expect(typeof canvas.renderStatusBar).toBe('function');
      canvas.renderBoard(board, []);
      expect(() =>
        canvas.renderStatusBar(0, { x: 10, y: 10 }, 80, 20)
      ).not.toThrow();
    });

    it('writes status bar into this.grid (full format when boardWidth > threshold)', () => {
      canvas.renderBoard(board, []);
      canvas.renderStatusBar(0, { x: 10, y: 12 }, 30, 20);
      const text = canvas.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toContain('Score: 0');
      expect(text).toContain('Position: (10,');
      expect(text).toContain('12)');
      expect(text).toContain('Arrow keys/WASD to move');
      const statusBarStart = canvas._statusBarStartRow;
      expect(canvas.grid[statusBarStart][0].color).toBe(Canvas.STATUS_BAR_COLOR);
    });

    it('renders status bar in a box (dash top/bottom, pipe content lines)', () => {
      canvas.renderBoard(board, []);
      canvas.renderStatusBar(0, { x: 3, y: 5 }, 60, 20);
      const text = canvas.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toContain('------------------------------------------------------------');
      expect(text).toContain('| Score: 0 | Position: (3, 5)');
      expect(text).toContain('| Arrow keys/WASD to move, Q/ESC to quit');
    });

    it('uses simplified format when boardWidth <= threshold', () => {
      canvas.renderBoard(board, []);
      canvas.renderStatusBar(0, { x: 10, y: 12 }, 20, 20);
      const text = canvas.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toContain('S: 0');
      expect(text).toContain('P: (10,');
      expect(text).toContain('12)');
      expect(text).not.toContain('Arrow keys');
    });

    it('replaces previous status bar rows on second call (same row count)', () => {
      canvas.renderBoard(board, []);
      canvas.renderStatusBar(0, { x: 1, y: 1 }, 30, 20);
      const firstRowCount = canvas.grid.length;
      canvas.renderStatusBar(0, { x: 1, y: 1 }, 30, 20);
      expect(canvas.grid.length).toBe(firstRowCount);
      const text = canvas.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toContain('Score: 0');
    });

    it('should use threshold from config when provided', () => {
      const canvasWithConfig = new Canvas({
        statusBar: { widthThreshold: 30 }
      });
      canvasWithConfig.renderBoard(board, []);
      canvasWithConfig.renderStatusBar(0, { x: 10, y: 12 }, 25, 20);
      const text = canvasWithConfig.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toContain('S: 0');
      expect(text).toContain('P: (10, 12)');
      expect(text).not.toContain('Arrow keys');
    });

    it('when layout provided, uses 60-char width for status bar box', () => {
      canvas.renderBoard(board, []);
      canvas.renderStatusBar(0, { x: 10, y: 12 }, 60, 20, { startRow: 2, startColumn: 10 });
      const statusBarStart = canvas._statusBarStartRow;
      expect(canvas.grid[statusBarStart].length).toBe(60);
      const topRow = canvas.grid[statusBarStart].map((c) => c.character).join('');
      expect(topRow).toMatch(/^-+$/);
    });
  });

  describe('updateCell', () => {
    it('writes cell to this.grid at (x, y)', () => {
      canvas.renderBoard(board, []);
      canvas.updateCell(5, 10, '@', '00FF00');
      expect(canvas.grid[10][5]).toEqual({ character: '@', color: '00FF00' });
    });

    it('no-ops when grid does not exist', () => {
      expect(canvas.grid).toBeNull();
      canvas.updateCell(5, 10, '@', '00FF00');
      expect(canvas.grid).toBeNull();
    });

    it('stores character and color in grid', () => {
      canvas.renderBoard(board, []);
      canvas.updateCell(5, 10, '@', '00FF00');
      expect(canvas.grid[10][5].character).toBe('@');
      expect(canvas.grid[10][5].color).toBe('00FF00');
    });

    it('should handle out-of-bounds gracefully (no throw, no write)', () => {
      canvas.renderBoard(board, []);
      expect(() => canvas.updateCell(-1, 10, '@', '00FF00')).not.toThrow();
      expect(() => canvas.updateCell(100, 10, '@', '00FF00')).not.toThrow();
      expect(() => canvas.updateCell(5, -1, '@', '00FF00')).not.toThrow();
      expect(() => canvas.updateCell(5, 100, '@', '00FF00')).not.toThrow();
      expect(canvas.grid[10][5]).toEqual({ character: '.', color: 'FFFFFF' });
    });
  });

  describe('restoreCellContent', () => {
    it('should restore board cell when no player present', () => {
      canvas.renderBoard(board, []);
      const players = [];
      canvas.restoreCellContent(10, 10, board, players, []);
      expect(canvas.grid[10][10]).toEqual({ character: '.', color: 'FFFFFF' });
    });

    it('should restore other player when present', () => {
      canvas.renderBoard(board, []);
      const players = [
        { playerId: 'p2', x: 10, y: 10, playerName: 'Player 2' }
      ];
      canvas.restoreCellContent(10, 10, board, players, []);
      expect(canvas.grid[10][10].character).toBe('☻');
    });

    it('should prioritize player over board cell', () => {
      canvas.renderBoard(board, []);
      const players = [
        { playerId: 'p2', x: 5, y: 5, playerName: 'Player 2' }
      ];
      canvas.restoreCellContent(5, 5, board, players, []);
      expect(canvas.grid[5][5].character).toBe('☻');
    });

    it('should handle out-of-bounds gracefully', () => {
      expect(() => {
        canvas.restoreCellContent(-1, 10, board, [], []);
      }).not.toThrow();
    });
  });

  describe('renderIncremental', () => {
    it('should handle moved player', () => {
      canvas.renderBoard(board, []);
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

      canvas.renderIncremental(changes, board, players, [], 'local-player');
      expect(canvas.grid[10][10].character).toBe('.');
      expect(canvas.grid[10][11].character).toBe('☻');
    });

    it('should handle joined player', () => {
      canvas.renderBoard(board, []);
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

      canvas.renderIncremental(changes, board, players, [], 'local-player');
      expect(canvas.grid[12][12].character).toBe('☻');
    });

    it('should handle left player', () => {
      canvas.renderBoard(board, []);
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

      canvas.renderIncremental(changes, board, players, [], 'local-player');
      expect(canvas.grid[10][10].character).toBe('.');
    });

    it('should update status bar when score changed', () => {
      canvas.renderBoard(board, []);
      const changes = {
        players: {
          moved: [],
          joined: [],
          left: []
        },
        scoreChanged: true
      };
      const players = [];
      const rowCountBefore = canvas.grid.length;

      canvas.renderIncremental(changes, board, players, [], 'local-player', 10, { x: 10, y: 10 });
      expect(canvas.grid.length).toBeGreaterThanOrEqual(rowCountBefore);
      const text = canvas.grid.map((row) => row.map((c) => c.character).join('')).join('\n');
      expect(text).toMatch(/Score: 10|S: 10/);
    });

    it('should not update status bar when score unchanged', () => {
      canvas.renderBoard(board, []);
      canvas.renderStatusBar(0, { x: 10, y: 10 }, 80, 20);
      const rowCountBefore = canvas.grid.length;
      const changes = {
        players: { moved: [], joined: [], left: [] },
        scoreChanged: false
      };
      canvas.renderIncremental(changes, board, [], [], 'local-player', 0, { x: 10, y: 10 });
      expect(canvas.grid.length).toBe(rowCountBefore);
    });
  });

  describe('hasNoChanges / hasFewChanges', () => {
    it('hasNoChanges returns true when grids are identical', () => {
      canvas.renderBoard(board, []);
      const other = new Canvas();
      other.renderBoard(board, []);
      expect(canvas.hasNoChanges(canvas, other)).toBe(true);
      expect(canvas.hasNoChanges(canvas, canvas)).toBe(true);
    });

    it('hasFewChanges returns true when diff count <= MAX_DIFF_COUNT', () => {
      canvas.renderBoard(board, []);
      const other = new Canvas();
      other.renderBoard(board, []);
      other.updateCell(0, 0, 'x', 'FFFFFF');
      expect(canvas.hasFewChanges(canvas, other)).toBe(true);
    });
  });
});

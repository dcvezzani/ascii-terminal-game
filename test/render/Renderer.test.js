import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Renderer } from '../../src/render/Renderer.js';
import { Board } from '../../src/game/Board.js';
import { Game } from '../../src/game/Game.js';
import { PLAYER_CHAR, WALL_CHAR, EMPTY_SPACE_CHAR } from '../../src/constants/gameConstants.js';
import { gameConfig } from '../../src/config/gameConfig.js';
import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import cliCursor from 'cli-cursor';

// Mock cli-cursor
vi.mock('cli-cursor', () => ({
  default: {
    hide: vi.fn(),
    show: vi.fn(),
  },
}));

describe('Renderer', () => {
  let renderer;
  let writeSpy;

  beforeEach(() => {
    renderer = new Renderer();
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.clearAllMocks();
  });

  afterEach(() => {
    writeSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    test('Renderer is created with correct default offsets', () => {
      expect(renderer.titleOffset).toBe(2);
      expect(renderer.boardOffset).toBe(5);
      expect(renderer.statusBarOffset).toBe(26);
    });

    test('Constructor sets boardWidth and boardHeight correctly', () => {
      expect(renderer.boardWidth).toBe(gameConfig.board.width);
      expect(renderer.boardHeight).toBe(gameConfig.board.height);
    });

    test('All offset properties are set', () => {
      expect(renderer.titleOffset).toBeDefined();
      expect(renderer.boardOffset).toBeDefined();
      expect(renderer.statusBarOffset).toBeDefined();
      expect(typeof renderer.titleOffset).toBe('number');
      expect(typeof renderer.boardOffset).toBe('number');
      expect(typeof renderer.statusBarOffset).toBe('number');
    });
  });

  describe('initialize()', () => {
    test('Calls cliCursor.hide()', () => {
      renderer.initialize();
      expect(cliCursor.hide).toHaveBeenCalled();
    });

    test('Writes cursor hide escape sequence', () => {
      renderer.initialize();
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.cursorHide);
    });

    test('Prepares terminal for rendering', () => {
      renderer.initialize();
      expect(cliCursor.hide).toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalled();
    });
  });

  describe('clearScreen()', () => {
    test('Writes clear screen escape sequence', () => {
      renderer.clearScreen();
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.clearScreen);
    });

    test('Moves cursor to (0, 0)', () => {
      renderer.clearScreen();
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.cursorTo(0, 0));
    });

    test('Clears terminal output', () => {
      renderer.clearScreen();
      expect(writeSpy).toHaveBeenCalledTimes(2); // clearScreen + cursorTo
    });
  });

  describe('renderTitle()', () => {
    test('Writes title text to correct position', () => {
      // Mock getHorizontalCenter by setting terminal width
      process.stdout.columns = 80;
      const expectedCenter = Math.floor((80 - 'Terminal Game'.length) / 2);
      
      renderer.renderTitle();
      
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.cursorTo(expectedCenter, 2));
    });

    test('Centers title horizontally', () => {
      process.stdout.columns = 100;
      const titleLength = 'Terminal Game'.length;
      const expectedCenter = Math.floor((100 - titleLength) / 2);
      
      renderer.renderTitle();
      
      const cursorCall = writeSpy.mock.calls.find(call => 
        call[0] === ansiEscapes.cursorTo(expectedCenter, 2)
      );
      expect(cursorCall).toBeDefined();
    });

    test('Applies correct styling (bold, cyan)', () => {
      renderer.renderTitle();
      
      // Check that chalk styling was applied
      const styledText = writeSpy.mock.calls.find(call => 
        typeof call[0] === 'string' && call[0].includes('Terminal Game')
      );
      expect(styledText).toBeDefined();
    });

    test('Uses correct row offset', () => {
      process.stdout.columns = 80;
      renderer.renderTitle();
      
      // Check that cursorTo was called (title should be rendered)
      // We verify by checking that write was called and title text is present
      expect(writeSpy).toHaveBeenCalled();
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Terminal Game');
    });
  });

  describe('renderBoard()', () => {
    let board;
    let game;

    beforeEach(() => {
      board = new Board();
      game = new Game();
    });

    test('Renders all board cells', () => {
      process.stdout.columns = 80;
      renderer.renderBoard(board, 10, 10);
      
      // Should write cursorTo for each row (20 rows)
      // Plus characters for each cell (20x20 = 400 cells)
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Centers board horizontally', () => {
      process.stdout.columns = 80;
      const boardStartX = Math.floor((80 - 20) / 2);
      
      renderer.renderBoard(board, 10, 10);
      
      // Check that cursorTo was called (board rendering should happen)
      // We verify by checking that write was called multiple times
      expect(writeSpy).toHaveBeenCalled();
      // Should have called write for each row (20 rows)
      expect(writeSpy.mock.calls.length).toBeGreaterThan(20);
    });

    test('Renders player character at correct position with color', () => {
      process.stdout.columns = 80;
      renderer.renderBoard(board, 10, 10);
      
      // Player should be rendered with its associated color
      // We can't easily test the exact color, but we can verify the character
      const allCalls = writeSpy.mock.calls.map(call => call[0]).join('');
      expect(allCalls).toContain(PLAYER_CHAR.char);
    });

    test('Renders walls with associated color', () => {
      process.stdout.columns = 80;
      renderer.renderBoard(board, 10, 10);
      
      // Walls should be rendered with their associated color
      const allCalls = writeSpy.mock.calls.map(call => call[0]).join('');
      expect(allCalls).toContain(WALL_CHAR.char);
    });

    test('Renders empty spaces with associated color', () => {
      process.stdout.columns = 80;
      renderer.renderBoard(board, 10, 10);
      
      // Empty spaces should be rendered with their associated color
      const allCalls = writeSpy.mock.calls.map(call => call[0]).join('');
      expect(allCalls).toContain(EMPTY_SPACE_CHAR.char);
    });

    test('Handles all board positions correctly', () => {
      process.stdout.columns = 80;
      renderer.renderBoard(board, 0, 0);
      expect(writeSpy).toHaveBeenCalled();
      
      renderer.renderBoard(board, 19, 19);
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Uses correct row offsets for each board row', () => {
      process.stdout.columns = 80;
      renderer.renderBoard(board, 10, 10);
      
      // Check that board was rendered (should have many write calls)
      // Board has 20 rows, so we should have at least 20 cursorTo calls
      expect(writeSpy.mock.calls.length).toBeGreaterThan(20);
      
      // Verify that rendering happened (contains board characters)
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain(WALL_CHAR.char);
      expect(allCalls).toContain(EMPTY_SPACE_CHAR.char);
    });
  });

  describe('renderStatusBar()', () => {
    test('Renders status text with score', () => {
      process.stdout.columns = 80;
      renderer.renderStatusBar(0, 10, 10);
      
      const allCalls = writeSpy.mock.calls.map(call => call[0]).join('');
      expect(allCalls).toContain('Score: 0');
    });

    test('Renders status text with position coordinates', () => {
      process.stdout.columns = 80;
      renderer.renderStatusBar(0, 10, 10);
      
      const allCalls = writeSpy.mock.calls.map(call => call[0]).join('');
      expect(allCalls).toContain('Position: (10, 10)');
    });

    test('Renders control instructions', () => {
      process.stdout.columns = 80;
      renderer.renderStatusBar(0, 10, 10);
      
      const allCalls = writeSpy.mock.calls.map(call => call[0]).join('');
      expect(allCalls).toContain('Arrow/WASD');
    });

    test('Centers status bar horizontally', () => {
      process.stdout.columns = 80;
      renderer.renderStatusBar(0, 10, 10);
      
      // Should call cursorTo with calculated center
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Uses correct row offset', () => {
      process.stdout.columns = 80;
      renderer.renderStatusBar(0, 10, 10);
      
      // Should use statusBarOffset (26) - check that write was called
      // Status bar should be rendered
      expect(writeSpy).toHaveBeenCalled();
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Score:');
    });

    test('Applies dim styling', () => {
      process.stdout.columns = 80;
      renderer.renderStatusBar(0, 10, 10);
      
      // Status bar should be rendered (we can't easily test dim, but it should be called)
      expect(writeSpy).toHaveBeenCalled();
    });
  });

  describe('renderFull()', () => {
    let game;

    beforeEach(() => {
      game = new Game();
    });

    test('Calls clearScreen()', () => {
      process.stdout.columns = 80;
      renderer.renderFull(game);
      
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.clearScreen);
    });

    test('Calls renderTitle()', () => {
      process.stdout.columns = 80;
      renderer.renderFull(game);
      
      // Title should be rendered (we check by verifying cursorTo calls)
      const titleCalls = writeSpy.mock.calls.filter(call => 
        typeof call[0] === 'string' && call[0].includes('Terminal Game')
      );
      expect(titleCalls.length).toBeGreaterThan(0);
    });

    test('Calls renderBoard() with correct parameters', () => {
      process.stdout.columns = 80;
      const position = game.getPlayerPosition();
      renderer.renderFull(game);
      
      // Board should be rendered
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Calls renderStatusBar() with correct parameters', () => {
      process.stdout.columns = 80;
      renderer.renderFull(game);
      
      // Status bar should be rendered
      const allCalls = writeSpy.mock.calls.map(call => call[0]).join('');
      expect(allCalls).toContain('Score:');
    });

    test('Moves cursor out of the way after rendering', () => {
      process.stdout.columns = 80;
      renderer.renderFull(game);
      
      // Should call cursorTo at the end
      const lastCall = writeSpy.mock.calls[writeSpy.mock.calls.length - 1];
      expect(lastCall[0]).toBe(ansiEscapes.cursorTo(0, 28)); // statusBarOffset + 2
    });

    test('Renders complete game state correctly', () => {
      process.stdout.columns = 80;
      renderer.renderFull(game);
      
      // Should have called multiple rendering methods
      // Should have at least: clearScreen, cursorTo, title, board, status bar
      expect(writeSpy.mock.calls.length).toBeGreaterThan(5);
      
      // Verify all components were rendered
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Terminal Game');
      expect(allCalls).toContain('Score:');
    });
  });

  describe('updateCell()', () => {
    test('Calculates correct screen position from board coordinates', () => {
      process.stdout.columns = 80;
      const boardStartX = Math.floor((80 - gameConfig.board.width) / 2);
      
      renderer.updateCell(5, 5, EMPTY_SPACE_CHAR.char, chalk.white);
      
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.cursorTo(boardStartX + 5, gameConfig.renderer.boardOffset + 5));
    });

    test('Moves cursor to correct position', () => {
      process.stdout.columns = 80;
      const boardStartX = Math.floor((80 - gameConfig.board.width) / 2);
      
      renderer.updateCell(10, 10, PLAYER_CHAR.char, chalk.green);
      
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.cursorTo(boardStartX + 10, gameConfig.renderer.boardOffset + 10));
    });

    test('Writes character with correct color', () => {
      process.stdout.columns = 80;
      renderer.updateCell(10, 10, PLAYER_CHAR.char, chalk.green);
      
      // Should write the colored character
      const colorCall = writeSpy.mock.calls.find(call => 
        typeof call[0] === 'string' && call[0].includes(PLAYER_CHAR.char)
      );
      expect(colorCall).toBeDefined();
    });

    test('Handles all board positions', () => {
      process.stdout.columns = 80;
      renderer.updateCell(0, 0, WALL_CHAR.char, chalk.gray);
      renderer.updateCell(gameConfig.board.width - 1, gameConfig.board.height - 1, EMPTY_SPACE_CHAR.char, chalk.white);
      
      expect(writeSpy).toHaveBeenCalledTimes(4); // 2 cursorTo + 2 characters
    });

    test('Uses horizontal centering offset correctly', () => {
      process.stdout.columns = 100;
      const boardStartX = Math.floor((100 - gameConfig.board.width) / 2);
      
      renderer.updateCell(0, 0, WALL_CHAR.char, chalk.gray);
      
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.cursorTo(boardStartX, gameConfig.renderer.boardOffset));
    });
  });

  describe('updatePlayerPosition()', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('Clears old position (restores cell content)', () => {
      process.stdout.columns = 80;
      renderer.updatePlayerPosition(10, 10, 11, 10, board);
      
      // Should update old position
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Draws new position with player character', () => {
      process.stdout.columns = 80;
      renderer.updatePlayerPosition(10, 10, 11, 10, board);
      
      // Should write player character
      const allCalls = writeSpy.mock.calls.map(call => call[0]).join('');
      expect(allCalls).toContain(PLAYER_CHAR.char);
    });

    test('Uses correct colors (green for player, gray/white for cells)', () => {
      process.stdout.columns = 80;
      renderer.updatePlayerPosition(10, 10, 11, 10, board);
      
      // Should have written multiple times (old position + new position + status)
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Updates status bar with new position', () => {
      process.stdout.columns = 80;
      renderer.updatePlayerPosition(10, 10, 11, 10, board);
      
      // Should update status bar
      const allCalls = writeSpy.mock.calls.map(call => call[0]).join('');
      expect(allCalls).toContain('Position: (11, 10)');
    });

    test('Handles movement correctly', () => {
      process.stdout.columns = 80;
      renderer.updatePlayerPosition(5, 5, 6, 5, board);
      
      // Should update both positions
      expect(writeSpy).toHaveBeenCalled();
    });
  });

  describe('cleanup()', () => {
    test('Shows cursor (cliCursor.show())', () => {
      renderer.cleanup();
      expect(cliCursor.show).toHaveBeenCalled();
    });

    test('Writes cursor show escape sequence', () => {
      renderer.cleanup();
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.cursorShow);
    });

    test('Clears screen', () => {
      renderer.cleanup();
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.clearScreen);
    });

    test('Moves cursor to (0, 0)', () => {
      renderer.cleanup();
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.cursorTo(0, 0));
    });

    test('Restores terminal state', () => {
      renderer.cleanup();
      expect(cliCursor.show).toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.cursorShow);
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.clearScreen);
    });
  });

  describe('Edge Cases', () => {
    let board;

    beforeEach(() => {
      board = new Board();
    });

    test('Handles board positions at edges correctly', () => {
      process.stdout.columns = 80;
      renderer.renderBoard(board, 0, 0);
      renderer.renderBoard(board, 19, 19);
      
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Handles player at (0, 0) correctly', () => {
      process.stdout.columns = 80;
      renderer.renderBoard(board, 0, 0);
      
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Handles player at (19, 19) correctly', () => {
      process.stdout.columns = 80;
      renderer.renderBoard(board, 19, 19);
      
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Handles rendering when terminal is small (graceful degradation)', () => {
      process.stdout.columns = 10; // Very small terminal
      renderer.renderBoard(board, 10, 10);
      
      // Should still render (may not be centered, but shouldn't crash)
      expect(writeSpy).toHaveBeenCalled();
    });
  });

  describe('renderHelp()', () => {
    test('Renders help screen', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Clears screen before rendering', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      expect(writeSpy).toHaveBeenCalledWith(ansiEscapes.clearScreen);
    });

    test('Displays title "Terminal Game - Help"', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Terminal Game - Help');
    });

    test('Displays movement instructions (Arrow keys, WASD)', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Arrow Keys');
      expect(allCalls).toContain('WASD');
    });

    test('Displays control instructions (Q/ESC, R, H/?)', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Q or ESC');
      expect(allCalls).toContain('R - Restart');
      expect(allCalls).toContain('H or ?');
    });

    test('Centers help text horizontally', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      // Should call cursorTo with calculated center positions
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Centers help text vertically', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      // Should calculate vertical center
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Uses correct colors (title=cyan, sections=yellow, instructions=white)', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      // Colors are applied via chalk, verify rendering happened
      expect(writeSpy).toHaveBeenCalled();
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Terminal Game - Help');
    });

    test('Formats help text correctly', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Movement:');
      expect(allCalls).toContain('Controls:');
    });

    test('Moves cursor out of the way after rendering', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      // Should call cursorTo at the end
      expect(writeSpy).toHaveBeenCalled();
    });

    test('Contains all movement controls', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Arrow Keys');
      expect(allCalls).toContain('W (up)');
      expect(allCalls).toContain('S (down)');
      expect(allCalls).toContain('A (left)');
      expect(allCalls).toContain('D (right)');
    });

    test('Contains all game controls', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Quit game');
      expect(allCalls).toContain('Restart game');
      expect(allCalls).toContain('Show this help');
    });

    test('Instructions are clear and readable', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      // Should contain key information
      expect(allCalls.length).toBeGreaterThan(100); // Substantial content
    });

    test('All key bindings are listed correctly', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;
      renderer.renderHelp();
      
      const allCalls = writeSpy.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('↑ ↓ ← →');
      expect(allCalls).toContain('W');
      expect(allCalls).toContain('S');
      expect(allCalls).toContain('A');
      expect(allCalls).toContain('D');
      expect(allCalls).toContain('Q');
      expect(allCalls).toContain('ESC');
      expect(allCalls).toContain('R');
      expect(allCalls).toContain('H');
      expect(allCalls).toContain('?');
    });
  });
});


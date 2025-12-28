import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Game } from '../../src/game/Game.js';
import { Renderer } from '../../src/render/Renderer.js';
import { InputHandler } from '../../src/input/InputHandler.js';
import { validateTerminalSize } from '../../src/utils/terminal.js';
import { gameConfig } from '../../src/config/gameConfig.js';

// Helper to get center position
function getCenterPosition() {
  return {
    x: Math.floor(gameConfig.board.width / 2),
    y: Math.floor(gameConfig.board.height / 2),
  };
}

// Mock process.stdout.write
const mockWrite = vi.fn();
const mockExit = vi.fn();

describe('Game Loop Integration', () => {
  let originalStdoutWrite;
  let originalExit;
  let originalStdoutRows;
  let originalStdoutColumns;

  beforeEach(() => {
    // Save originals
    originalStdoutWrite = process.stdout.write;
    originalExit = process.exit;
    originalStdoutRows = process.stdout.rows;
    originalStdoutColumns = process.stdout.columns;

    // Mock process.stdout.write
    process.stdout.write = mockWrite;
    process.stdout.rows = 30;
    process.stdout.columns = 80;

    // Mock process.exit
    process.exit = mockExit;

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore originals
    process.stdout.write = originalStdoutWrite;
    process.exit = originalExit;
    process.stdout.rows = originalStdoutRows;
    process.stdout.columns = originalStdoutColumns;
    vi.restoreAllMocks();
  });

  describe('Terminal Size Validation', () => {
    test('Validates terminal size on startup', () => {
      const result = validateTerminalSize(25, 30);
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('columns');
    });

    test('Shows error if terminal too small (rows)', () => {
      process.stdout.rows = 20;
      process.stdout.columns = 80;

      const result = validateTerminalSize(25, 30);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('too small');
      expect(result.message).toContain('25x30');
    });

    test('Shows error if terminal too small (columns)', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 20;

      const result = validateTerminalSize(25, 30);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('too small');
    });

    test('Continues if terminal size is valid', () => {
      process.stdout.rows = 30;
      process.stdout.columns = 80;

      const result = validateTerminalSize(25, 30);
      expect(result.valid).toBe(true);
      expect(result.rows).toBe(30);
      expect(result.columns).toBe(80);
    });

    test('Uses correct minimum size (25x30)', () => {
      process.stdout.rows = 24;
      process.stdout.columns = 80;

      const result = validateTerminalSize(25, 30);
      expect(result.valid).toBe(false);

      process.stdout.rows = 25;
      process.stdout.columns = 29;
      const result2 = validateTerminalSize(25, 30);
      expect(result2.valid).toBe(false);

      process.stdout.rows = 25;
      process.stdout.columns = 30;
      const result3 = validateTerminalSize(25, 30);
      expect(result3.valid).toBe(true);
    });
  });

  describe('Component Initialization', () => {
    test('Game initializes correctly', () => {
      const game = new Game();
      const center = getCenterPosition();
      expect(game).toBeDefined();
      expect(game.getPlayerPosition()).toEqual({ x: center.x, y: center.y });
      expect(game.getScore()).toBe(0);
    });

    test('Renderer initializes correctly', () => {
      const renderer = new Renderer();
      expect(renderer).toBeDefined();
      expect(renderer.boardWidth).toBe(gameConfig.board.width);
      expect(renderer.boardHeight).toBe(gameConfig.board.height);
    });

    test('InputHandler initializes correctly', () => {
      const callbacks = {
        onMoveUp: vi.fn(),
        onQuit: vi.fn(),
      };
      const inputHandler = new InputHandler(callbacks);
      expect(inputHandler).toBeDefined();
      expect(inputHandler.callbacks).toBe(callbacks);
    });

    test('All components work together', () => {
      const game = new Game();
      const renderer = new Renderer();
      const inputHandler = new InputHandler({
        onMoveUp: () => {
          const oldPos = game.getPlayerPosition();
          if (game.movePlayer(0, -1)) {
            const newPos = game.getPlayerPosition();
            renderer.updatePlayerPosition(oldPos.x, oldPos.y, newPos.x, newPos.y, game.board);
          }
        },
      });

      expect(game).toBeDefined();
      expect(renderer).toBeDefined();
      expect(inputHandler).toBeDefined();

      // Test they work together
      renderer.initialize();
      expect(mockWrite).toHaveBeenCalled();
    });

    test('Initial render happens', () => {
      const game = new Game();
      const renderer = new Renderer();

      renderer.initialize();
      renderer.renderFull(game);

      expect(mockWrite).toHaveBeenCalled();
    });
  });

  describe('Control Integration', () => {
    test('Movement controls work', () => {
      const game = new Game();
      const renderer = new Renderer();
      const center = getCenterPosition();
      const oldPos = game.getPlayerPosition();

      const moved = game.movePlayer(1, 0);
      expect(moved).toBe(true);

      const newPos = game.getPlayerPosition();
      expect(newPos.x).toBe(center.x + 1);

      renderer.updatePlayerPosition(oldPos.x, oldPos.y, newPos.x, newPos.y, game.board);

      expect(mockWrite).toHaveBeenCalled();
    });

    test('Quit control works', () => {
      const game = new Game();
      game.start();
      expect(game.isRunning()).toBe(true);

      game.stop();
      expect(game.isRunning()).toBe(false);
    });

    test('Restart control works', () => {
      const game = new Game();
      const renderer = new Renderer();

      // Move player
      const center = getCenterPosition();
      game.movePlayer(5, 5);
      const pos1 = game.getPlayerPosition();
      expect(pos1).not.toEqual({ x: center.x, y: center.y });

      // Reset
      game.reset();
      const pos2 = game.getPlayerPosition();
      expect(pos2).toEqual({ x: center.x, y: center.y });
      expect(game.getScore()).toBe(0);

      // Re-render
      renderer.renderFull(game);
      expect(mockWrite).toHaveBeenCalled();
    });

    test('Help control works', () => {
      const renderer = new Renderer();
      renderer.renderHelp();

      expect(mockWrite).toHaveBeenCalled();
      const allCalls = mockWrite.mock.calls.map(call => String(call[0])).join('');
      expect(allCalls).toContain('Terminal Game - Help');
    });
  });

  describe('Cleanup', () => {
    test('InputHandler stops correctly', () => {
      const inputHandler = new InputHandler();
      inputHandler.start();
      expect(inputHandler.listening).toBe(true);

      inputHandler.stop();
      expect(inputHandler.listening).toBe(false);
      expect(inputHandler.rl).toBeNull();
    });

    test('Renderer cleanup happens', () => {
      const renderer = new Renderer();
      renderer.initialize();
      renderer.cleanup();

      expect(mockWrite).toHaveBeenCalled();
    });

    test('Terminal state restored', () => {
      const renderer = new Renderer();
      renderer.initialize();

      mockWrite.mockClear();
      renderer.cleanup();

      // Should clear screen and restore cursor
      expect(mockWrite).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('Handles errors gracefully', () => {
      // Test that components handle errors
      const game = new Game();

      // Invalid movement should return false, not throw
      const result = game.movePlayer(100, 100);
      expect(result).toBe(false);
      expect(() => game.movePlayer(100, 100)).not.toThrow();
    });

    test('Components can be cleaned up even if errors occur', () => {
      const renderer = new Renderer();
      const inputHandler = new InputHandler();

      inputHandler.start();
      renderer.initialize();

      // Cleanup should work even if there were errors
      inputHandler.stop();
      renderer.cleanup();

      expect(inputHandler.listening).toBe(false);
    });
  });

  describe('Game Loop Flow', () => {
    test('Game state stays consistent during movement', () => {
      const game = new Game();
      const renderer = new Renderer();

      const initialPos = game.getPlayerPosition();

      // Simulate movement
      const oldPos = game.getPlayerPosition();
      game.movePlayer(1, 0);
      const newPos = game.getPlayerPosition();

      renderer.updatePlayerPosition(oldPos.x, oldPos.y, newPos.x, newPos.y, game.board);

      // State should be consistent
      expect(newPos.x).toBe(initialPos.x + 1);
      expect(newPos.y).toBe(initialPos.y);
    });

    test('Multiple movements work correctly', () => {
      const game = new Game();
      const renderer = new Renderer();

      let position = game.getPlayerPosition();

      // Multiple movements
      const center = getCenterPosition();
      game.movePlayer(1, 0);
      position = game.getPlayerPosition();
      expect(position).toEqual({ x: center.x + 1, y: center.y });

      game.movePlayer(0, 1);
      position = game.getPlayerPosition();
      expect(position).toEqual({ x: center.x + 1, y: center.y + 1 });

      game.movePlayer(-1, 0);
      position = game.getPlayerPosition();
      expect(position).toEqual({ x: center.x, y: center.y + 1 });

      game.movePlayer(0, -1);
      position = game.getPlayerPosition();
      expect(position).toEqual({ x: center.x, y: center.y });
    });
  });
});

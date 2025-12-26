import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import readline from 'readline';

// Mock readline before importing InputHandler
const mockEmitKeypressEvents = vi.fn();
const mockCreateInterface = vi.fn();
const mockClose = vi.fn();

vi.mock('readline', () => ({
  default: {
    createInterface: (...args) => {
      const result = mockCreateInterface(...args);
      return result || { close: mockClose };
    },
    emitKeypressEvents: (...args) => mockEmitKeypressEvents(...args),
  },
}));

// Import after mocking
import { InputHandler } from '../../src/input/InputHandler.js';

describe('InputHandler', () => {
  let inputHandler;
  let mockStdin;
  let mockRl;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock process.stdin
    mockStdin = {
      isTTY: true,
      setRawMode: vi.fn(),
      resume: vi.fn(),
      pause: vi.fn(),
      setEncoding: vi.fn(),
      on: vi.fn(),
      removeAllListeners: vi.fn(),
    };

    // Mock readline interface
    mockRl = {
      close: mockClose,
    };

    mockCreateInterface.mockReturnValue(mockRl);
    mockClose.mockClear();
    
    // Replace process.stdin for testing
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('InputHandler is created with callbacks object', () => {
      const callbacks = {
        onMoveUp: vi.fn(),
        onMoveDown: vi.fn(),
      };
      inputHandler = new InputHandler(callbacks);
      expect(inputHandler.callbacks).toBe(callbacks);
    });

    test('Constructor accepts empty callbacks object (optional)', () => {
      inputHandler = new InputHandler();
      expect(inputHandler.callbacks).toEqual({});
    });

    test('Constructor stores callbacks correctly', () => {
      const callbacks = {
        onMoveUp: vi.fn(),
        onQuit: vi.fn(),
      };
      inputHandler = new InputHandler(callbacks);
      expect(inputHandler.callbacks.onMoveUp).toBe(callbacks.onMoveUp);
      expect(inputHandler.callbacks.onQuit).toBe(callbacks.onQuit);
    });

    test('Initial state is not listening', () => {
      inputHandler = new InputHandler();
      expect(inputHandler.listening).toBe(false);
    });

    test('rl property is null initially', () => {
      inputHandler = new InputHandler();
      expect(inputHandler.rl).toBeNull();
    });
  });

  describe('start()', () => {
    test('Creates readline interface', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      expect(mockCreateInterface).toHaveBeenCalledWith({
        input: mockStdin,
        output: process.stdout,
      });
    });

    test('Enables keypress events (readline.emitKeypressEvents)', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      expect(mockEmitKeypressEvents).toHaveBeenCalledWith(mockStdin);
    });

    test('Sets raw mode on stdin (if TTY)', () => {
      mockStdin.isTTY = true;
      inputHandler = new InputHandler();
      inputHandler.start();
      expect(mockStdin.setRawMode).toHaveBeenCalledWith(true);
    });

    test('Resumes stdin', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      expect(mockStdin.resume).toHaveBeenCalled();
    });

    test('Sets encoding to utf8', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      expect(mockStdin.setEncoding).toHaveBeenCalledWith('utf8');
    });

    test('Registers keypress event listener', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      expect(mockStdin.on).toHaveBeenCalledWith('keypress', expect.any(Function));
    });

    test('Sets listening state to true', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      expect(inputHandler.listening).toBe(true);
    });

    test('Does not start if already listening (idempotent)', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      const firstCallCount = mockCreateInterface.mock.calls.length;
      inputHandler.start();
      expect(mockCreateInterface).toHaveBeenCalledTimes(firstCallCount);
    });

    test('Handles non-TTY stdin gracefully', () => {
      mockStdin.isTTY = false;
      inputHandler = new InputHandler();
      inputHandler.start();
      // Should not call setRawMode if not TTY
      expect(mockStdin.setRawMode).not.toHaveBeenCalled();
      // But should still set up other things
      expect(mockStdin.resume).toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    test('Closes readline interface', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      inputHandler.stop();
      expect(mockClose).toHaveBeenCalled();
    });

    test('Sets raw mode to false (if TTY)', () => {
      mockStdin.isTTY = true;
      inputHandler = new InputHandler();
      inputHandler.start();
      inputHandler.stop();
      expect(mockStdin.setRawMode).toHaveBeenCalledWith(false);
    });

    test('Pauses stdin', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      inputHandler.stop();
      expect(mockStdin.pause).toHaveBeenCalled();
    });

    test('Removes all keypress event listeners', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      inputHandler.stop();
      expect(mockStdin.removeAllListeners).toHaveBeenCalledWith('keypress');
    });

    test('Sets listening state to false', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      inputHandler.stop();
      expect(inputHandler.listening).toBe(false);
    });

    test('Sets rl to null', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      inputHandler.stop();
      expect(inputHandler.rl).toBeNull();
    });

    test('Does not stop if not listening (idempotent)', () => {
      inputHandler = new InputHandler();
      inputHandler.stop();
      expect(mockClose).not.toHaveBeenCalled();
    });

    test('Handles non-TTY stdin gracefully', () => {
      mockStdin.isTTY = false;
      inputHandler = new InputHandler();
      inputHandler.start();
      inputHandler.stop();
      // Should not call setRawMode if not TTY
      expect(mockStdin.setRawMode).not.toHaveBeenCalled();
      // But should still clean up
      expect(mockStdin.pause).toHaveBeenCalled();
    });
  });

  describe('handleKeypress() - Arrow Keys', () => {
    beforeEach(() => {
      inputHandler = new InputHandler();
    });

    test('Calls onMoveUp callback when up arrow pressed', () => {
      const onMoveUp = vi.fn();
      inputHandler.callbacks.onMoveUp = onMoveUp;
      inputHandler.handleKeypress('', { name: 'up' });
      expect(onMoveUp).toHaveBeenCalled();
    });

    test('Calls onMoveDown callback when down arrow pressed', () => {
      const onMoveDown = vi.fn();
      inputHandler.callbacks.onMoveDown = onMoveDown;
      inputHandler.handleKeypress('', { name: 'down' });
      expect(onMoveDown).toHaveBeenCalled();
    });

    test('Calls onMoveLeft callback when left arrow pressed', () => {
      const onMoveLeft = vi.fn();
      inputHandler.callbacks.onMoveLeft = onMoveLeft;
      inputHandler.handleKeypress('', { name: 'left' });
      expect(onMoveLeft).toHaveBeenCalled();
    });

    test('Calls onMoveRight callback when right arrow pressed', () => {
      const onMoveRight = vi.fn();
      inputHandler.callbacks.onMoveRight = onMoveRight;
      inputHandler.handleKeypress('', { name: 'right' });
      expect(onMoveRight).toHaveBeenCalled();
    });

    test('Does not call callbacks if not provided', () => {
      // No callbacks set
      expect(() => {
        inputHandler.handleKeypress('', { name: 'up' });
      }).not.toThrow();
    });

    test('Handles arrow keys via key.name property', () => {
      const onMoveUp = vi.fn();
      inputHandler.callbacks.onMoveUp = onMoveUp;
      inputHandler.handleKeypress('', { name: 'up' });
      expect(onMoveUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleKeypress() - WASD Keys', () => {
    beforeEach(() => {
      inputHandler = new InputHandler();
    });

    test('Calls onMoveUp callback when w pressed', () => {
      const onMoveUp = vi.fn();
      inputHandler.callbacks.onMoveUp = onMoveUp;
      inputHandler.handleKeypress('w', {});
      expect(onMoveUp).toHaveBeenCalled();
    });

    test('Calls onMoveDown callback when s pressed', () => {
      const onMoveDown = vi.fn();
      inputHandler.callbacks.onMoveDown = onMoveDown;
      inputHandler.handleKeypress('s', {});
      expect(onMoveDown).toHaveBeenCalled();
    });

    test('Calls onMoveLeft callback when a pressed', () => {
      const onMoveLeft = vi.fn();
      inputHandler.callbacks.onMoveLeft = onMoveLeft;
      inputHandler.handleKeypress('a', {});
      expect(onMoveLeft).toHaveBeenCalled();
    });

    test('Calls onMoveRight callback when d pressed', () => {
      const onMoveRight = vi.fn();
      inputHandler.callbacks.onMoveRight = onMoveRight;
      inputHandler.handleKeypress('d', {});
      expect(onMoveRight).toHaveBeenCalled();
    });

    test('Handles uppercase and lowercase (W, S, A, D)', () => {
      const onMoveUp = vi.fn();
      const onMoveDown = vi.fn();
      const onMoveLeft = vi.fn();
      const onMoveRight = vi.fn();
      
      inputHandler.callbacks.onMoveUp = onMoveUp;
      inputHandler.callbacks.onMoveDown = onMoveDown;
      inputHandler.callbacks.onMoveLeft = onMoveLeft;
      inputHandler.callbacks.onMoveRight = onMoveRight;
      
      inputHandler.handleKeypress('W', {});
      inputHandler.handleKeypress('S', {});
      inputHandler.handleKeypress('A', {});
      inputHandler.handleKeypress('D', {});
      
      expect(onMoveUp).toHaveBeenCalled();
      expect(onMoveDown).toHaveBeenCalled();
      expect(onMoveLeft).toHaveBeenCalled();
      expect(onMoveRight).toHaveBeenCalled();
    });

    test('Does not call callbacks if not provided', () => {
      expect(() => {
        inputHandler.handleKeypress('w', {});
      }).not.toThrow();
    });
  });

  describe('handleKeypress() - Quit Keys', () => {
    beforeEach(() => {
      inputHandler = new InputHandler();
    });

    test('Calls onQuit callback when q pressed', () => {
      const onQuit = vi.fn();
      inputHandler.callbacks.onQuit = onQuit;
      inputHandler.handleKeypress('q', {});
      expect(onQuit).toHaveBeenCalled();
    });

    test('Calls onQuit callback when Q pressed', () => {
      const onQuit = vi.fn();
      inputHandler.callbacks.onQuit = onQuit;
      inputHandler.handleKeypress('Q', {});
      expect(onQuit).toHaveBeenCalled();
    });

    test('Calls onQuit callback when ESC pressed (key.name === escape)', () => {
      const onQuit = vi.fn();
      inputHandler.callbacks.onQuit = onQuit;
      inputHandler.handleKeypress('', { name: 'escape' });
      expect(onQuit).toHaveBeenCalled();
    });

    test('Calls onQuit callback when Ctrl+C pressed', () => {
      const onQuit = vi.fn();
      inputHandler.callbacks.onQuit = onQuit;
      inputHandler.handleKeypress('', { ctrl: true, name: 'c' });
      expect(onQuit).toHaveBeenCalled();
    });

    test('Does not call callback if not provided', () => {
      expect(() => {
        inputHandler.handleKeypress('q', {});
      }).not.toThrow();
    });

    test('Handles all quit methods correctly', () => {
      const onQuit = vi.fn();
      inputHandler.callbacks.onQuit = onQuit;
      
      inputHandler.handleKeypress('q', {});
      inputHandler.handleKeypress('', { name: 'escape' });
      inputHandler.handleKeypress('', { ctrl: true, name: 'c' });
      
      expect(onQuit).toHaveBeenCalledTimes(3);
    });
  });

  describe('handleKeypress() - Restart Key', () => {
    beforeEach(() => {
      inputHandler = new InputHandler();
    });

    test('Calls onRestart callback when r pressed', () => {
      const onRestart = vi.fn();
      inputHandler.callbacks.onRestart = onRestart;
      inputHandler.handleKeypress('r', {});
      expect(onRestart).toHaveBeenCalled();
    });

    test('Calls onRestart callback when R pressed', () => {
      const onRestart = vi.fn();
      inputHandler.callbacks.onRestart = onRestart;
      inputHandler.handleKeypress('R', {});
      expect(onRestart).toHaveBeenCalled();
    });

    test('Does not call callback if not provided', () => {
      expect(() => {
        inputHandler.handleKeypress('r', {});
      }).not.toThrow();
    });
  });

  describe('handleKeypress() - Help Key', () => {
    beforeEach(() => {
      inputHandler = new InputHandler();
    });

    test('Calls onHelp callback when h pressed', () => {
      const onHelp = vi.fn();
      inputHandler.callbacks.onHelp = onHelp;
      inputHandler.handleKeypress('h', {});
      expect(onHelp).toHaveBeenCalled();
    });

    test('Calls onHelp callback when H pressed', () => {
      const onHelp = vi.fn();
      inputHandler.callbacks.onHelp = onHelp;
      inputHandler.handleKeypress('H', {});
      expect(onHelp).toHaveBeenCalled();
    });

    test('Calls onHelp callback when ? pressed', () => {
      const onHelp = vi.fn();
      inputHandler.callbacks.onHelp = onHelp;
      inputHandler.handleKeypress('?', {});
      expect(onHelp).toHaveBeenCalled();
    });

    test('Does not call callback if not provided', () => {
      expect(() => {
        inputHandler.handleKeypress('h', {});
      }).not.toThrow();
    });
  });

  describe('handleKeypress() - Edge Cases', () => {
    beforeEach(() => {
      inputHandler = new InputHandler();
    });

    test('Handles unknown keys gracefully (no crash)', () => {
      expect(() => {
        inputHandler.handleKeypress('x', {});
        inputHandler.handleKeypress('z', {});
        inputHandler.handleKeypress('1', {});
      }).not.toThrow();
    });

    test('Handles empty string input', () => {
      expect(() => {
        inputHandler.handleKeypress('', {});
      }).not.toThrow();
    });

    test('Handles null/undefined key object', () => {
      expect(() => {
        inputHandler.handleKeypress('w', null);
        inputHandler.handleKeypress('w', undefined);
      }).not.toThrow();
    });

    test('Handles key without name property', () => {
      expect(() => {
        inputHandler.handleKeypress('w', {});
        inputHandler.handleKeypress('', {});
      }).not.toThrow();
    });

    test('Handles multiple rapid keypresses', () => {
      const onMoveUp = vi.fn();
      inputHandler.callbacks.onMoveUp = onMoveUp;
      
      inputHandler.handleKeypress('w', {});
      inputHandler.handleKeypress('w', {});
      inputHandler.handleKeypress('w', {});
      
      expect(onMoveUp).toHaveBeenCalledTimes(3);
    });

    test('Does not crash on invalid input', () => {
      expect(() => {
        inputHandler.handleKeypress(null, null);
        inputHandler.handleKeypress(undefined, undefined);
        inputHandler.handleKeypress(123, {});
      }).not.toThrow();
    });
  });

  describe('Integration - Start/Stop Cycle', () => {
    test('Can start and stop multiple times', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      inputHandler.stop();
      inputHandler.start();
      inputHandler.stop();
      
      expect(mockCreateInterface).toHaveBeenCalledTimes(2);
      expect(mockClose).toHaveBeenCalledTimes(2);
    });

    test('State is correct after start/stop cycle', () => {
      inputHandler = new InputHandler();
      expect(inputHandler.listening).toBe(false);
      
      inputHandler.start();
      expect(inputHandler.listening).toBe(true);
      
      inputHandler.stop();
      expect(inputHandler.listening).toBe(false);
      expect(inputHandler.rl).toBeNull();
    });

    test('Event listeners are properly cleaned up', () => {
      inputHandler = new InputHandler();
      inputHandler.start();
      const listenerCount = mockStdin.on.mock.calls.length;
      
      inputHandler.stop();
      expect(mockStdin.removeAllListeners).toHaveBeenCalledWith('keypress');
      
      inputHandler.start();
      // Should be able to register new listeners
      expect(mockStdin.on).toHaveBeenCalledTimes(listenerCount + 1);
    });

    test('No memory leaks from event listeners', () => {
      inputHandler = new InputHandler();
      
      for (let i = 0; i < 5; i++) {
        inputHandler.start();
        inputHandler.stop();
      }
      
      // Each stop should clean up
      expect(mockStdin.removeAllListeners).toHaveBeenCalledTimes(5);
    });
  });

  describe('Integration - Callback Execution', () => {
    test('All callbacks are called with correct timing', () => {
      const callbacks = {
        onMoveUp: vi.fn(),
        onMoveDown: vi.fn(),
        onMoveLeft: vi.fn(),
        onMoveRight: vi.fn(),
        onQuit: vi.fn(),
        onRestart: vi.fn(),
        onHelp: vi.fn(),
      };
      
      inputHandler = new InputHandler(callbacks);
      
      inputHandler.handleKeypress('w', {});
      expect(callbacks.onMoveUp).toHaveBeenCalledTimes(1);
      
      inputHandler.handleKeypress('s', {});
      expect(callbacks.onMoveDown).toHaveBeenCalledTimes(1);
      
      inputHandler.handleKeypress('a', {});
      expect(callbacks.onMoveLeft).toHaveBeenCalledTimes(1);
      
      inputHandler.handleKeypress('d', {});
      expect(callbacks.onMoveRight).toHaveBeenCalledTimes(1);
      
      inputHandler.handleKeypress('q', {});
      expect(callbacks.onQuit).toHaveBeenCalledTimes(1);
      
      inputHandler.handleKeypress('r', {});
      expect(callbacks.onRestart).toHaveBeenCalledTimes(1);
      
      inputHandler.handleKeypress('h', {});
      expect(callbacks.onHelp).toHaveBeenCalledTimes(1);
    });

    test('Callbacks receive no arguments', () => {
      const onMoveUp = vi.fn();
      inputHandler = new InputHandler({ onMoveUp });
      
      inputHandler.handleKeypress('w', {});
      
      expect(onMoveUp).toHaveBeenCalledWith();
    });

    test('Multiple callbacks can be called in sequence', () => {
      const onMoveUp = vi.fn();
      const onMoveRight = vi.fn();
      inputHandler = new InputHandler({ onMoveUp, onMoveRight });
      
      inputHandler.handleKeypress('w', {});
      inputHandler.handleKeypress('d', {});
      inputHandler.handleKeypress('w', {});
      
      expect(onMoveUp).toHaveBeenCalledTimes(2);
      expect(onMoveRight).toHaveBeenCalledTimes(1);
    });

    test('Callbacks work correctly after restart', () => {
      const onMoveUp = vi.fn();
      inputHandler = new InputHandler({ onMoveUp });
      
      inputHandler.start();
      inputHandler.handleKeypress('w', {});
      expect(onMoveUp).toHaveBeenCalledTimes(1);
      
      inputHandler.stop();
      inputHandler.start();
      inputHandler.handleKeypress('w', {});
      expect(onMoveUp).toHaveBeenCalledTimes(2);
    });
  });
});


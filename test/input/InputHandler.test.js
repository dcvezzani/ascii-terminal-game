import { describe, it, expect, beforeEach, vi } from 'vitest';
import InputHandler from '../../src/input/InputHandler.js';

describe('InputHandler', () => {
  let inputHandler;
  let moveCallback;
  let quitCallback;

  beforeEach(() => {
    inputHandler = new InputHandler();
    moveCallback = vi.fn();
    quitCallback = vi.fn();
    
    inputHandler.onMove(moveCallback);
    inputHandler.onQuit(quitCallback);
  });

  describe('key mapping', () => {
    it('should map arrow up to move up', () => {
      inputHandler.handleInput(Buffer.from('\x1b[A')); // Arrow up
      expect(moveCallback).toHaveBeenCalledWith(0, -1);
    });

    it('should map arrow down to move down', () => {
      inputHandler.handleInput(Buffer.from('\x1b[B')); // Arrow down
      expect(moveCallback).toHaveBeenCalledWith(0, 1);
    });

    it('should map arrow left to move left', () => {
      inputHandler.handleInput(Buffer.from('\x1b[D')); // Arrow left
      expect(moveCallback).toHaveBeenCalledWith(-1, 0);
    });

    it('should map arrow right to move right', () => {
      inputHandler.handleInput(Buffer.from('\x1b[C')); // Arrow right
      expect(moveCallback).toHaveBeenCalledWith(1, 0);
    });

    it('should map W to move up', () => {
      inputHandler.handleInput(Buffer.from('w'));
      expect(moveCallback).toHaveBeenCalledWith(0, -1);
    });

    it('should map S to move down', () => {
      inputHandler.handleInput(Buffer.from('s'));
      expect(moveCallback).toHaveBeenCalledWith(0, 1);
    });

    it('should map A to move left', () => {
      inputHandler.handleInput(Buffer.from('a'));
      expect(moveCallback).toHaveBeenCalledWith(-1, 0);
    });

    it('should map D to move right', () => {
      inputHandler.handleInput(Buffer.from('d'));
      expect(moveCallback).toHaveBeenCalledWith(1, 0);
    });

    it('should map uppercase WASD keys', () => {
      inputHandler.handleInput(Buffer.from('W'));
      expect(moveCallback).toHaveBeenCalledWith(0, -1);
      
      inputHandler.handleInput(Buffer.from('S'));
      expect(moveCallback).toHaveBeenCalledWith(0, 1);
      
      inputHandler.handleInput(Buffer.from('A'));
      expect(moveCallback).toHaveBeenCalledWith(-1, 0);
      
      inputHandler.handleInput(Buffer.from('D'));
      expect(moveCallback).toHaveBeenCalledWith(1, 0);
    });

    it('should map Q to quit', () => {
      inputHandler.handleInput(Buffer.from('q'));
      expect(quitCallback).toHaveBeenCalled();
    });

    it('should map uppercase Q to quit', () => {
      inputHandler.handleInput(Buffer.from('Q'));
      expect(quitCallback).toHaveBeenCalled();
    });

    it('should map ESC to quit', () => {
      inputHandler.handleInput(Buffer.from('\x1b')); // ESC
      expect(quitCallback).toHaveBeenCalled();
    });

    it('should ignore unknown keys', () => {
      inputHandler.handleInput(Buffer.from('x'));
      expect(moveCallback).not.toHaveBeenCalled();
      expect(quitCallback).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('should handle errors in move callback gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      inputHandler.onMove(errorCallback);
      
      expect(() => {
        inputHandler.handleInput(Buffer.from('w'));
      }).not.toThrow();
    });

    it('should handle errors in quit callback gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      inputHandler.onQuit(errorCallback);
      
      expect(() => {
        inputHandler.handleInput(Buffer.from('q'));
      }).not.toThrow();
    });
  });
});

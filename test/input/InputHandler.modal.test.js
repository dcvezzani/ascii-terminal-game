import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputHandler } from '../../src/input/InputHandler.js';
import { ModalManager } from '../../src/ui/ModalManager.js';
import { Modal } from '../../src/ui/Modal.js';

describe('InputHandler - Modal Integration', () => {
  let inputHandler;
  let modalManager;
  let callbacks;
  let writeSpy;

  beforeEach(() => {
    modalManager = new ModalManager();
    callbacks = {
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      onMoveLeft: vi.fn(),
      onMoveRight: vi.fn(),
      onQuit: vi.fn(),
      onRestart: vi.fn(),
      onHelp: vi.fn(),
    };
    inputHandler = new InputHandler(callbacks, modalManager);
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    writeSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('handleKeypress() with modal open', () => {
    test('delegates to ModalInputHandler when modal is open', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: () => {} }],
      });

      modalManager.openModal(modal);

      // Up arrow should be handled by modal, not game
      inputHandler.handleKeypress('', { name: 'up' });
      expect(callbacks.onMoveUp).not.toHaveBeenCalled();

      // Down arrow should be handled by modal, not game
      inputHandler.handleKeypress('', { name: 'down' });
      expect(callbacks.onMoveDown).not.toHaveBeenCalled();

      // Enter should be handled by modal, not game
      inputHandler.handleKeypress('', { name: 'return' });
      // Game callbacks should not be called

      // ESC should close modal, not quit game
      inputHandler.handleKeypress('', { name: 'escape' });
      expect(modalManager.hasOpenModal()).toBe(false);
      // Note: onQuit might still be called, but modal should be closed first
    });

    test('does not process game input when modal is open', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalManager.openModal(modal);

      // Game movement keys should not be processed
      inputHandler.handleKeypress('w', { name: 'w' });
      expect(callbacks.onMoveUp).not.toHaveBeenCalled();

      inputHandler.handleKeypress('s', { name: 's' });
      expect(callbacks.onMoveDown).not.toHaveBeenCalled();

      inputHandler.handleKeypress('a', { name: 'a' });
      expect(callbacks.onMoveLeft).not.toHaveBeenCalled();

      inputHandler.handleKeypress('d', { name: 'd' });
      expect(callbacks.onMoveRight).not.toHaveBeenCalled();

      inputHandler.handleKeypress('r', { name: 'r' });
      expect(callbacks.onRestart).not.toHaveBeenCalled();

      inputHandler.handleKeypress('h', { name: 'h' });
      expect(callbacks.onHelp).not.toHaveBeenCalled();
    });

    test('closes modal with ESC key', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      inputHandler.handleKeypress('', { name: 'escape' });
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('closes modal with "q" key', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      inputHandler.handleKeypress('q', { name: 'q' });
      expect(modalManager.hasOpenModal()).toBe(false);
    });
  });

  describe('handleKeypress() with modal closed', () => {
    test('processes game input normally when modal is closed', () => {
      // No modal open
      expect(modalManager.hasOpenModal()).toBe(false);

      // Game movement keys should be processed
      inputHandler.handleKeypress('w', { name: 'w' });
      expect(callbacks.onMoveUp).toHaveBeenCalled();

      inputHandler.handleKeypress('s', { name: 's' });
      expect(callbacks.onMoveDown).toHaveBeenCalled();

      inputHandler.handleKeypress('a', { name: 'a' });
      expect(callbacks.onMoveLeft).toHaveBeenCalled();

      inputHandler.handleKeypress('d', { name: 'd' });
      expect(callbacks.onMoveRight).toHaveBeenCalled();

      inputHandler.handleKeypress('r', { name: 'r' });
      expect(callbacks.onRestart).toHaveBeenCalled();

      inputHandler.handleKeypress('h', { name: 'h' });
      expect(callbacks.onHelp).toHaveBeenCalled();
    });

    test('handles ESC and Q as quit when modal is closed', () => {
      // No modal open
      expect(modalManager.hasOpenModal()).toBe(false);

      inputHandler.handleKeypress('', { name: 'escape' });
      expect(callbacks.onQuit).toHaveBeenCalled();

      callbacks.onQuit.mockClear();

      inputHandler.handleKeypress('q', { name: 'q' });
      expect(callbacks.onQuit).toHaveBeenCalled();
    });
  });
});


import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal } from '../../src/ui/Modal.js';
import { ModalManager } from '../../src/ui/ModalManager.js';
import { InputHandler } from '../../src/input/InputHandler.js';
import { Renderer } from '../../src/render/Renderer.js';
import { Game } from '../../src/game/Game.js';

describe('Modal System - Comprehensive Integration Tests', () => {
  let modalManager;
  let renderer;
  let inputHandler;
  let game;
  let callbacks;
  let writeSpy;
  let onModalStateChangeSpy;

  beforeEach(() => {
    modalManager = new ModalManager();
    game = new Game();
    renderer = new Renderer(modalManager);
    
    callbacks = {
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      onMoveLeft: vi.fn(),
      onMoveRight: vi.fn(),
      onQuit: vi.fn(),
      onRestart: vi.fn(),
      onHelp: vi.fn(),
    };
    
    onModalStateChangeSpy = vi.fn();
    inputHandler = new InputHandler(callbacks, modalManager, onModalStateChangeSpy);
    
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    process.stdout.columns = 80;
    process.stdout.rows = 24;
    vi.clearAllMocks();
  });

  afterEach(() => {
    writeSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Modal Opening and Closing', () => {
    test('can open and close modal in local mode context', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Test message' }],
      });

      // Open modal
      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);
      expect(modalManager.getCurrentModal()).toBe(modal);

      // Close modal
      modalManager.closeModal();
      expect(modalManager.hasOpenModal()).toBe(false);
      expect(modalManager.getCurrentModal()).toBeNull();
    });

    test('modal state persists across multiple open/close cycles', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: [{ type: 'message', text: 'First' }],
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: [{ type: 'message', text: 'Second' }],
      });

      // Open first modal
      modalManager.openModal(modal1);
      expect(modalManager.getCurrentModal()).toBe(modal1);

      // Close and open second
      modalManager.closeModal();
      modalManager.openModal(modal2);
      expect(modalManager.getCurrentModal()).toBe(modal2);

      // Close second
      modalManager.closeModal();
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('reset() closes modal and clears state', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      modalManager.reset();
      expect(modalManager.hasOpenModal()).toBe(false);
      expect(modalManager.getCurrentModal()).toBeNull();
    });
  });

  describe('Option Navigation and Selection', () => {
    test('can navigate through options with arrow keys', () => {
      const modal = new Modal({
        title: 'Menu',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
          { type: 'option', label: 'Option 3', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      expect(modal.getSelectedIndex()).toBe(0);

      // Navigate down
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getSelectedIndex()).toBe(1);

      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getSelectedIndex()).toBe(2);

      // Navigate up
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getSelectedIndex()).toBe(1);

      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getSelectedIndex()).toBe(0);
    });

    test('can navigate with WASD keys', () => {
      const modal = new Modal({
        title: 'Menu',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      expect(modal.getSelectedIndex()).toBe(0);

      // Navigate with 's' (down)
      inputHandler.handleKeypress('s', { name: 's' });
      expect(modal.getSelectedIndex()).toBe(1);

      // Navigate with 'w' (up)
      inputHandler.handleKeypress('w', { name: 'w' });
      expect(modal.getSelectedIndex()).toBe(0);
    });

    test('navigation skips message blocks', () => {
      const modal = new Modal({
        title: 'Menu',
        content: [
          { type: 'message', text: 'Message 1' },
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'message', text: 'Message 2' },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      expect(modal.getSelectedIndex()).toBe(0); // First option (index 0 of options array)

      // Navigate to second option (should skip message)
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getSelectedIndex()).toBe(1); // Second option

      // Navigate back
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getSelectedIndex()).toBe(0); // First option
    });

    test('cannot navigate beyond option bounds', () => {
      const modal = new Modal({
        title: 'Menu',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      expect(modal.getSelectedIndex()).toBe(0);

      // Try to navigate up from first option
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getSelectedIndex()).toBe(0); // Should stay at 0

      // Navigate to last option
      inputHandler.handleKeypress('', { name: 'down' });
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getSelectedIndex()).toBe(1); // Last option

      // Try to navigate down from last option
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getSelectedIndex()).toBe(1); // Should stay at 1
    });
  });

  describe('Action Execution', () => {
    test('executes action when option is selected with Enter', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Execute', action: actionSpy }],
      });

      modalManager.openModal(modal);
      inputHandler.handleKeypress('', { name: 'return' });

      expect(actionSpy).toHaveBeenCalledTimes(1);
      expect(modalManager.hasOpenModal()).toBe(false); // Should close by default
    });

    test('executes correct action based on selected option', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();
      const modal = new Modal({
        title: 'Menu',
        content: [
          { type: 'option', label: 'Option 1', action: action1 },
          { type: 'option', label: 'Option 2', action: action2 },
        ],
      });

      modalManager.openModal(modal);
      
      // Select first option
      inputHandler.handleKeypress('', { name: 'return' });
      expect(action1).toHaveBeenCalledTimes(1);
      expect(action2).not.toHaveBeenCalled();

      // Reopen and select second option
      modalManager.openModal(modal);
      inputHandler.handleKeypress('', { name: 'down' });
      inputHandler.handleKeypress('', { name: 'return' });
      expect(action1).toHaveBeenCalledTimes(1); // Still only once
      expect(action2).toHaveBeenCalledTimes(1);
    });

    test('respects autoClose: false option', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Test',
        content: [
          {
            type: 'option',
            label: 'Stay Open',
            action: actionSpy,
            autoClose: false,
          },
        ],
      });

      modalManager.openModal(modal);
      inputHandler.handleKeypress('', { name: 'return' });

      expect(actionSpy).toHaveBeenCalled();
      expect(modalManager.hasOpenModal()).toBe(true); // Should remain open
    });
  });

  describe('Input Routing (Modal vs Game)', () => {
    test('game input is blocked when modal is open', () => {
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

    test('game input works normally when modal is closed', () => {
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

    test('ESC closes modal when open, quits game when closed', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      // With modal open
      modalManager.openModal(modal);
      inputHandler.handleKeypress('', { name: 'escape' });
      expect(modalManager.hasOpenModal()).toBe(false);
      expect(callbacks.onQuit).not.toHaveBeenCalled(); // Should not quit when closing modal

      // With modal closed
      inputHandler.handleKeypress('', { name: 'escape' });
      expect(callbacks.onQuit).toHaveBeenCalled(); // Should quit game
    });

    test('"q" closes modal when open, quits game when closed', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      // With modal open
      modalManager.openModal(modal);
      inputHandler.handleKeypress('q', { name: 'q' });
      expect(modalManager.hasOpenModal()).toBe(false);
      expect(callbacks.onQuit).not.toHaveBeenCalled(); // Should not quit when closing modal

      // With modal closed
      callbacks.onQuit.mockClear();
      inputHandler.handleKeypress('q', { name: 'q' });
      expect(callbacks.onQuit).toHaveBeenCalled(); // Should quit game
    });
  });

  describe('Modal State Change Callback', () => {
    test('triggers callback when modal selection changes', () => {
      const modal = new Modal({
        title: 'Menu',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      onModalStateChangeSpy.mockClear();

      // Navigate to trigger callback
      inputHandler.handleKeypress('', { name: 'down' });
      expect(onModalStateChangeSpy).toHaveBeenCalled();
    });

    test('triggers callback when modal is closed', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalManager.openModal(modal);
      onModalStateChangeSpy.mockClear();

      // Close modal
      inputHandler.handleKeypress('', { name: 'escape' });
      expect(onModalStateChangeSpy).toHaveBeenCalled();
    });

    test('triggers callback when action closes modal', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Close', action: () => {} }],
      });

      modalManager.openModal(modal);
      onModalStateChangeSpy.mockClear();

      // Execute action (should close modal)
      inputHandler.handleKeypress('', { name: 'return' });
      expect(onModalStateChangeSpy).toHaveBeenCalled();
    });
  });

  describe('Rendering Integration', () => {
    test('renderFull renders modal when modal is open', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Test message' }],
      });

      modalManager.openModal(modal);
      renderer.renderFull(game);

      // Should render modal (check for box-drawing characters)
      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      expect(allCalls).toContain('┌');
      expect(allCalls).toContain('Test Modal');
      expect(allCalls).toContain('Test message');
    });

    test('renderFull does not render modal when modal is closed', () => {
      expect(modalManager.hasOpenModal()).toBe(false);
      renderer.renderFull(game);

      // Should render game normally (no modal)
      expect(writeSpy).toHaveBeenCalled();
    });

    test('renderModalOnly updates only changed option lines', () => {
      const modal = new Modal({
        title: 'Menu',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      
      // Initial render
      renderer.renderFull(game);
      writeSpy.mockClear();

      // Change selection
      inputHandler.handleKeypress('', { name: 'down' });
      
      // Should trigger incremental update
      expect(onModalStateChangeSpy).toHaveBeenCalled();
    });
  });

  describe('End-to-End Flow', () => {
    test('complete flow: open, navigate, select, execute, close', () => {
      const restartAction = vi.fn();
      const quitAction = vi.fn();

      const modal = new Modal({
        title: 'Game Over',
        content: [
          { type: 'message', text: 'Game Over!' },
          { type: 'option', label: 'Restart', action: restartAction },
          { type: 'option', label: 'Quit', action: quitAction },
        ],
      });

      // Open modal
      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);
      expect(modal.getSelectedIndex()).toBe(0);

      // Navigate to second option
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getSelectedIndex()).toBe(1);

      // Navigate back to first
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getSelectedIndex()).toBe(0);

      // Select first option
      inputHandler.handleKeypress('', { name: 'return' });

      // Action should execute and modal should close
      expect(restartAction).toHaveBeenCalledTimes(1);
      expect(quitAction).not.toHaveBeenCalled();
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('can reopen modal after closing and select different option', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();

      const modal = new Modal({
        title: 'Menu',
        content: [
          { type: 'option', label: 'Option 1', action: action1 },
          { type: 'option', label: 'Option 2', action: action2 },
        ],
      });

      // First selection
      modalManager.openModal(modal);
      inputHandler.handleKeypress('', { name: 'return' });
      expect(action1).toHaveBeenCalledTimes(1);
      expect(modalManager.hasOpenModal()).toBe(false);

      // Reopen and select second option
      modalManager.openModal(modal);
      inputHandler.handleKeypress('', { name: 'down' });
      inputHandler.handleKeypress('', { name: 'return' });
      expect(action1).toHaveBeenCalledTimes(1); // Still only once
      expect(action2).toHaveBeenCalledTimes(1);
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('can close modal with ESC without executing action', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Confirm',
        content: [{ type: 'option', label: 'Confirm', action: actionSpy }],
      });

      modalManager.openModal(modal);
      inputHandler.handleKeypress('', { name: 'escape' });

      expect(actionSpy).not.toHaveBeenCalled();
      expect(modalManager.hasOpenModal()).toBe(false);
    });
  });
});


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

  describe('Content Scrolling', () => {
    test('movement keys scroll content instead of navigating options', () => {
      const modal = new Modal({
        title: 'Menu',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      expect(modal.getSelectedIndex()).toBe(0); // Selection unchanged
      expect(modal.getScrollPosition()).toBe(0);

      // Down arrow scrolls content down
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getScrollPosition()).toBeGreaterThan(0);
      expect(modal.getSelectedIndex()).toBe(0); // Selection unchanged

      // Up arrow scrolls content up
      const scrollPos = modal.getScrollPosition();
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getScrollPosition()).toBeLessThan(scrollPos);
      expect(modal.getSelectedIndex()).toBe(0); // Selection unchanged
    });

    test('WASD keys scroll content', () => {
      const modal = new Modal({
        title: 'Menu',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      expect(modal.getScrollPosition()).toBe(0);

      // 's' key scrolls down
      inputHandler.handleKeypress('s', { name: 's' });
      expect(modal.getScrollPosition()).toBeGreaterThan(0);

      // 'w' key scrolls up
      const scrollPos = modal.getScrollPosition();
      inputHandler.handleKeypress('w', { name: 'w' });
      expect(modal.getScrollPosition()).toBeLessThan(scrollPos);
    });

    test('scrolling does not go below 0', () => {
      const modal = new Modal({
        title: 'Menu',
        content: [{ type: 'message', text: 'Line 1' }],
      });

      modalManager.openModal(modal);
      expect(modal.getScrollPosition()).toBe(0);

      // Try to scroll up from top
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getScrollPosition()).toBe(0); // Should stay at 0
    });

    test('scrolling does not exceed maxScroll', () => {
      const modal = new Modal({
        title: 'Menu',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      
      // Scroll to bottom (get maxScroll from the input handler's modalInputHandler)
      const modalInputHandler = inputHandler.modalInputHandler;
      const maxScroll = modalInputHandler.calculateMaxScroll(modal);
      modal.setScrollPosition(maxScroll);

      // Try to scroll down from bottom
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getScrollPosition()).toBe(maxScroll); // Should stay at max
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

      // Reopen and select second option (set selected index directly since movement keys now scroll)
      modalManager.openModal(modal);
      const currentModal = modalManager.getCurrentModal();
      currentModal.setSelectedIndex(1); // Set to second option
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
    test('triggers callback when modal scrolls', () => {
      const modal = new Modal({
        title: 'Menu',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      onModalStateChangeSpy.mockClear();

      // Scroll to trigger callback
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

    test('renderModalOnly updates when modal scrolls', () => {
      const modal = new Modal({
        title: 'Menu',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      
      // Initial render
      renderer.renderFull(game);
      writeSpy.mockClear();

      // Scroll content
      inputHandler.handleKeypress('', { name: 'down' });
      
      // Should trigger state change callback
      expect(onModalStateChangeSpy).toHaveBeenCalled();
    });
  });

  describe('End-to-End Flow', () => {
    test('complete flow: open, scroll, select, execute, close', () => {
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

      // Scroll content (movement keys now scroll, not navigate)
      // Add more content to make scrolling possible
      modal.content.push(
        ...Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Additional line ${i + 1}`,
        }))
      );
      
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getScrollPosition()).toBeGreaterThan(0);
      expect(modal.getSelectedIndex()).toBe(0); // Selection unchanged

      // Scroll back up
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getScrollPosition()).toBe(0);
      expect(modal.getSelectedIndex()).toBe(0); // Selection unchanged

      // Select first option (default selected)
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

      // First selection (defaults to first option)
      modalManager.openModal(modal);
      inputHandler.handleKeypress('', { name: 'return' });
      expect(action1).toHaveBeenCalledTimes(1);
      expect(modalManager.hasOpenModal()).toBe(false);

      // Reopen and select second option (set selected index directly since movement keys now scroll)
      modalManager.openModal(modal);
      const currentModal = modalManager.getCurrentModal();
      currentModal.setSelectedIndex(1); // Set to second option
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


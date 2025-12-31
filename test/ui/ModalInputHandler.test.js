import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ModalInputHandler } from '../../src/ui/ModalInputHandler.js';
import { ModalManager } from '../../src/ui/ModalManager.js';
import { Modal } from '../../src/ui/Modal.js';

describe('ModalInputHandler', () => {
  let modalInputHandler;
  let modalManager;
  let modal;

  beforeEach(() => {
    modalManager = new ModalManager();
    modalInputHandler = new ModalInputHandler(modalManager);
  });

  describe('Initialization', () => {
    test('ModalInputHandler can be instantiated with ModalManager', () => {
      expect(modalInputHandler).toBeDefined();
    });
  });

  describe('handleKeypress() - Up/Down Navigation', () => {
    test('handles up arrow key to navigate options (skip message blocks)', () => {
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'message', text: 'Message 1' },
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'message', text: 'Message 2' },
          { type: 'option', label: 'Option 2', action: () => {} },
          { type: 'option', label: 'Option 3', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      expect(modal.getSelectedIndex()).toBe(0); // Start at first option

      // Press down arrow - should move to next option (skip message)
      const handled1 = modalInputHandler.handleKeypress('', { name: 'down' }, modal);
      expect(handled1).toBe(true);
      expect(modal.getSelectedIndex()).toBe(1); // Should be at Option 2

      // Press down arrow again - should move to next option
      const handled2 = modalInputHandler.handleKeypress('', { name: 'down' }, modal);
      expect(handled2).toBe(true);
      expect(modal.getSelectedIndex()).toBe(2); // Should be at Option 3

      // Press up arrow - should move back
      const handled3 = modalInputHandler.handleKeypress('', { name: 'up' }, modal);
      expect(handled3).toBe(true);
      expect(modal.getSelectedIndex()).toBe(1); // Back to Option 2
    });

    test('handles "w" key for up navigation', () => {
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      modal.setSelectedIndex(1); // Start at second option

      const handled = modalInputHandler.handleKeypress('w', { name: 'w' }, modal);
      expect(handled).toBe(true);
      expect(modal.getSelectedIndex()).toBe(0); // Should move to first option
    });

    test('handles "s" key for down navigation', () => {
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      expect(modal.getSelectedIndex()).toBe(0); // Start at first option

      const handled = modalInputHandler.handleKeypress('s', { name: 's' }, modal);
      expect(handled).toBe(true);
      expect(modal.getSelectedIndex()).toBe(1); // Should move to second option
    });

    test('does not navigate below last option', () => {
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      modal.setSelectedIndex(1); // At last option

      const handled = modalInputHandler.handleKeypress('', { name: 'down' }, modal);
      expect(handled).toBe(true);
      expect(modal.getSelectedIndex()).toBe(1); // Should stay at last option
    });

    test('does not navigate above first option', () => {
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      expect(modal.getSelectedIndex()).toBe(0); // At first option

      const handled = modalInputHandler.handleKeypress('', { name: 'up' }, modal);
      expect(handled).toBe(true);
      expect(modal.getSelectedIndex()).toBe(0); // Should stay at first option
    });

    test('skips message blocks when navigating', () => {
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'message', text: 'Message 1' },
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'message', text: 'Message 2' },
          { type: 'message', text: 'Message 3' },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      expect(modal.getSelectedIndex()).toBe(0); // At Option 1

      // Down should skip messages and go to Option 2
      modalInputHandler.handleKeypress('', { name: 'down' }, modal);
      expect(modal.getSelectedIndex()).toBe(1); // Should be at Option 2
    });
  });

  describe('handleKeypress() - Enter Key Selection', () => {
    test('handles Enter key to select option', () => {
      const actionSpy = vi.fn();
      modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: actionSpy }],
      });

      modalManager.openModal(modal);

      const handled = modalInputHandler.handleKeypress('', { name: 'return' }, modal);
      expect(handled).toBe(true);
      // Action execution will be tested in Phase 4, but we verify the key was handled
    });

    test('handles Enter key with "enter" name', () => {
      const actionSpy = vi.fn();
      modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: actionSpy }],
      });

      modalManager.openModal(modal);

      const handled = modalInputHandler.handleKeypress('', { name: 'enter' }, modal);
      expect(handled).toBe(true);
    });
  });

  describe('handleKeypress() - Close Keys', () => {
    test('handles ESC key to close modal', () => {
      modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      const handled = modalInputHandler.handleKeypress('', { name: 'escape' }, modal);
      expect(handled).toBe(true);
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('handles "q" key to close modal', () => {
      modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      const handled = modalInputHandler.handleKeypress('q', { name: 'q' }, modal);
      expect(handled).toBe(true);
      expect(modalManager.hasOpenModal()).toBe(false);
    });
  });

  describe('handleKeypress() - Return Value', () => {
    test('returns true when key is handled', () => {
      modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: () => {} }],
      });

      modalManager.openModal(modal);

      expect(modalInputHandler.handleKeypress('', { name: 'up' }, modal)).toBe(true);
      expect(modalInputHandler.handleKeypress('', { name: 'down' }, modal)).toBe(true);
      expect(modalInputHandler.handleKeypress('', { name: 'return' }, modal)).toBe(true);
      expect(modalInputHandler.handleKeypress('', { name: 'escape' }, modal)).toBe(true);
      expect(modalInputHandler.handleKeypress('q', { name: 'q' }, modal)).toBe(true);
    });

    test('returns false when key is not handled', () => {
      modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: () => {} }],
      });

      modalManager.openModal(modal);

      // Keys that should not be handled by modal
      expect(modalInputHandler.handleKeypress('r', { name: 'r' }, modal)).toBe(false);
      expect(modalInputHandler.handleKeypress('h', { name: 'h' }, modal)).toBe(false);
      expect(modalInputHandler.handleKeypress('x', { name: 'x' }, modal)).toBe(false);
    });
  });
});


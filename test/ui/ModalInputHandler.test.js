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

  describe('handleKeypress() - Scrolling', () => {
    test('handles up arrow key to scroll content up', () => {
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'message', text: 'Message 1' },
          { type: 'option', label: 'Option 1', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      modal.setScrollPosition(5); // Start scrolled down
      const initialSelectedIndex = modal.getSelectedIndex();

      // Press up arrow - should scroll up, not change selection
      const handled = modalInputHandler.handleKeypress('', { name: 'up' }, modal);
      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBe(4); // Scrolled up
      expect(modal.getSelectedIndex()).toBe(initialSelectedIndex); // Selection unchanged
    });

    test('handles "w" key to scroll content up', () => {
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      modal.setScrollPosition(3);
      const initialSelectedIndex = modal.getSelectedIndex();

      const handled = modalInputHandler.handleKeypress('w', { name: 'w' }, modal);
      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBe(2); // Scrolled up
      expect(modal.getSelectedIndex()).toBe(initialSelectedIndex); // Selection unchanged
    });

    test('handles "s" key to scroll content down', () => {
      modal = new Modal({
        title: 'Test',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      modal.setScrollPosition(0);
      const initialSelectedIndex = modal.getSelectedIndex();

      const handled = modalInputHandler.handleKeypress('s', { name: 's' }, modal);
      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBeGreaterThan(0); // Scrolled down
      expect(modal.getSelectedIndex()).toBe(initialSelectedIndex); // Selection unchanged
    });

    test('does not scroll below 0', () => {
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      modal.setScrollPosition(0); // At top

      const handled = modalInputHandler.handleKeypress('', { name: 'up' }, modal);
      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBe(0); // Should stay at 0
    });

    test('does not scroll beyond maxScroll', () => {
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      const maxScroll = modalInputHandler.calculateMaxScroll(modal);
      modal.setScrollPosition(maxScroll); // At bottom

      const handled = modalInputHandler.handleKeypress('', { name: 'down' }, modal);
      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBe(maxScroll); // Should stay at max
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


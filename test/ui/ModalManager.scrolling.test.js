import { describe, test, expect, beforeEach } from 'vitest';
import { ModalManager } from '../../src/ui/ModalManager.js';
import { Modal } from '../../src/ui/Modal.js';

describe('ModalManager - Scroll Position Persistence', () => {
  let modalManager;

  beforeEach(() => {
    modalManager = new ModalManager();
  });

  describe('Modal Stacking', () => {
    test('modalStack property exists', () => {
      expect(modalManager.modalStack).toBeDefined();
      expect(Array.isArray(modalManager.modalStack)).toBe(true);
      expect(modalManager.modalStack.length).toBe(0);
    });

    test('openModal() pushes current modal to stack when opening new modal', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: [{ type: 'message', text: 'Content 1' }],
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: [{ type: 'message', text: 'Content 2' }],
      });

      modalManager.openModal(modal1);
      expect(modalManager.getCurrentModal()).toBe(modal1);
      expect(modalManager.modalStack.length).toBe(0);

      modalManager.openModal(modal2);
      expect(modalManager.getCurrentModal()).toBe(modal2);
      expect(modalManager.modalStack.length).toBe(1);
      expect(modalManager.modalStack[0]).toBe(modal1);
    });

    test('closeModal() restores modal from stack', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: [{ type: 'message', text: 'Content 1' }],
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: [{ type: 'message', text: 'Content 2' }],
      });

      modalManager.openModal(modal1);
      modalManager.openModal(modal2);
      expect(modalManager.getCurrentModal()).toBe(modal2);
      expect(modalManager.modalStack.length).toBe(1);

      modalManager.closeModal();
      expect(modalManager.getCurrentModal()).toBe(modal1);
      expect(modalManager.modalStack.length).toBe(0);
    });

    test('closeModal() does nothing if stack is empty', () => {
      const modal = new Modal({
        title: 'Modal',
        content: [{ type: 'message', text: 'Content' }],
      });

      modalManager.openModal(modal);
      expect(modalManager.getCurrentModal()).toBe(modal);

      modalManager.closeModal();
      expect(modalManager.getCurrentModal()).toBeNull();
      expect(modalManager.modalStack.length).toBe(0);
    });

    test('reset() clears both current modal and stack', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: [{ type: 'message', text: 'Content 1' }],
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: [{ type: 'message', text: 'Content 2' }],
      });

      modalManager.openModal(modal1);
      modalManager.openModal(modal2);
      expect(modalManager.getCurrentModal()).toBe(modal2);
      expect(modalManager.modalStack.length).toBe(1);

      modalManager.reset();
      expect(modalManager.getCurrentModal()).toBeNull();
      expect(modalManager.modalStack.length).toBe(0);
    });
  });

  describe('Scroll Position Persistence', () => {
    test('scroll position preserved when modal is hidden (stacking)', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: [
          { type: 'message', text: 'Line 1' },
          { type: 'message', text: 'Line 2' },
          { type: 'message', text: 'Line 3' },
          { type: 'message', text: 'Line 4' },
          { type: 'message', text: 'Line 5' },
        ],
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: [{ type: 'message', text: 'Content' }],
      });

      // Open modal1 and scroll down
      modalManager.openModal(modal1);
      modal1.setScrollPosition(2);
      expect(modal1.getScrollPosition()).toBe(2);

      // Open modal2 (modal1 is pushed to stack)
      modalManager.openModal(modal2);
      expect(modalManager.getCurrentModal()).toBe(modal2);
      expect(modalManager.modalStack.length).toBe(1);

      // Verify modal1's scroll position is preserved
      expect(modal1.getScrollPosition()).toBe(2);
    });

    test('scroll position restored when modal is shown again', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: [
          { type: 'message', text: 'Line 1' },
          { type: 'message', text: 'Line 2' },
          { type: 'message', text: 'Line 3' },
          { type: 'message', text: 'Line 4' },
          { type: 'message', text: 'Line 5' },
        ],
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: [{ type: 'message', text: 'Content' }],
      });

      // Open modal1 and scroll down
      modalManager.openModal(modal1);
      modal1.setScrollPosition(3);
      expect(modal1.getScrollPosition()).toBe(3);

      // Open modal2 (modal1 is pushed to stack)
      modalManager.openModal(modal2);
      expect(modalManager.getCurrentModal()).toBe(modal2);

      // Close modal2 (modal1 is restored)
      modalManager.closeModal();
      expect(modalManager.getCurrentModal()).toBe(modal1);

      // Verify modal1's scroll position is restored
      expect(modal1.getScrollPosition()).toBe(3);
    });

    test('each modal maintains its own scroll position', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: [
          { type: 'message', text: 'Line 1' },
          { type: 'message', text: 'Line 2' },
          { type: 'message', text: 'Line 3' },
        ],
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: [
          { type: 'message', text: 'Line 1' },
          { type: 'message', text: 'Line 2' },
          { type: 'message', text: 'Line 3' },
        ],
      });

      // Open modal1 and scroll
      modalManager.openModal(modal1);
      modal1.setScrollPosition(1);
      expect(modal1.getScrollPosition()).toBe(1);

      // Open modal2 and scroll to different position
      modalManager.openModal(modal2);
      modal2.setScrollPosition(2);
      expect(modal2.getScrollPosition()).toBe(2);

      // Verify modal1's scroll position is still 1
      expect(modal1.getScrollPosition()).toBe(1);

      // Close modal2, restore modal1
      modalManager.closeModal();
      expect(modalManager.getCurrentModal()).toBe(modal1);
      expect(modal1.getScrollPosition()).toBe(1);
    });

    test('new modal starts with scroll position 0', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: [
          { type: 'message', text: 'Line 1' },
          { type: 'message', text: 'Line 2' },
        ],
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: [{ type: 'message', text: 'Content' }],
      });

      // Open modal1 and scroll
      modalManager.openModal(modal1);
      modal1.setScrollPosition(1);
      expect(modal1.getScrollPosition()).toBe(1);

      // Open modal2 (new modal)
      modalManager.openModal(modal2);
      expect(modal2.getScrollPosition()).toBe(0); // New modal starts at 0
    });

    test('multiple modals can be stacked', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: [{ type: 'message', text: 'Content 1' }],
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: [{ type: 'message', text: 'Content 2' }],
      });
      const modal3 = new Modal({
        title: 'Modal 3',
        content: [{ type: 'message', text: 'Content 3' }],
      });

      // Set scroll positions
      modal1.setScrollPosition(1);
      modal2.setScrollPosition(2);

      // Stack modals
      modalManager.openModal(modal1);
      modalManager.openModal(modal2);
      modalManager.openModal(modal3);

      expect(modalManager.getCurrentModal()).toBe(modal3);
      expect(modalManager.modalStack.length).toBe(2);
      expect(modalManager.modalStack[0]).toBe(modal1);
      expect(modalManager.modalStack[1]).toBe(modal2);

      // Verify scroll positions preserved
      expect(modal1.getScrollPosition()).toBe(1);
      expect(modal2.getScrollPosition()).toBe(2);
      expect(modal3.getScrollPosition()).toBe(0);

      // Close modals in reverse order
      modalManager.closeModal();
      expect(modalManager.getCurrentModal()).toBe(modal2);
      expect(modal2.getScrollPosition()).toBe(2);

      modalManager.closeModal();
      expect(modalManager.getCurrentModal()).toBe(modal1);
      expect(modal1.getScrollPosition()).toBe(1);
    });
  });
});


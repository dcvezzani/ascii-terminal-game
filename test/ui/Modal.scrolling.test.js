import { describe, test, expect, beforeEach } from 'vitest';
import { Modal } from '../../src/ui/Modal.js';

describe('Modal Scrolling', () => {
  describe('Scroll Position Initialization', () => {
    test('scrollPosition defaults to 0 when not specified', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      expect(modal.getScrollPosition()).toBe(0);
    });

    test('scrollPosition is initialized to 0 even with content', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'message', text: 'Test message' },
          { type: 'option', label: 'Option 1', action: () => {} },
        ],
      });

      expect(modal.getScrollPosition()).toBe(0);
    });
  });

  describe('Scroll Position Getters and Setters', () => {
    test('getScrollPosition() returns current scroll position', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      expect(modal.getScrollPosition()).toBe(0);
    });

    test('setScrollPosition() sets scroll position', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(5);
      expect(modal.getScrollPosition()).toBe(5);
    });

    test('setScrollPosition() clamps negative values to 0', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(-5);
      expect(modal.getScrollPosition()).toBe(0);
    });

    test('setScrollPosition() allows positive values', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(10);
      expect(modal.getScrollPosition()).toBe(10);
    });
  });

  describe('Scroll Up Method', () => {
    test('scrollUp() decrements scroll position', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(5);
      modal.scrollUp();
      expect(modal.getScrollPosition()).toBe(4);
    });

    test('scrollUp() clamps to 0 at top boundary', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(1);
      modal.scrollUp();
      expect(modal.getScrollPosition()).toBe(0);
    });

    test('scrollUp() does nothing when already at 0', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(0);
      modal.scrollUp();
      expect(modal.getScrollPosition()).toBe(0);
    });

    test('scrollUp() can be called multiple times', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(5);
      modal.scrollUp();
      modal.scrollUp();
      modal.scrollUp();
      expect(modal.getScrollPosition()).toBe(2);
    });

    test('scrollUp() returns true when position changes', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(5);
      const result = modal.scrollUp();
      expect(result).toBe(true);
      expect(modal.getScrollPosition()).toBe(4);
    });

    test('scrollUp() returns false when at top boundary', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(0);
      const result = modal.scrollUp();
      expect(result).toBe(false);
      expect(modal.getScrollPosition()).toBe(0);
    });
  });

  describe('Scroll Down Method', () => {
    test('scrollDown() increments scroll position', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(0);
      modal.scrollDown(10);
      expect(modal.getScrollPosition()).toBe(1);
    });

    test('scrollDown() clamps to maxScroll at bottom boundary', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      const maxScroll = 5;
      modal.setScrollPosition(4);
      modal.scrollDown(maxScroll);
      expect(modal.getScrollPosition()).toBe(5);
    });

    test('scrollDown() does nothing when already at maxScroll', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      const maxScroll = 5;
      modal.setScrollPosition(5);
      modal.scrollDown(maxScroll);
      expect(modal.getScrollPosition()).toBe(5);
    });

    test('scrollDown() can be called multiple times', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      const maxScroll = 10;
      modal.setScrollPosition(0);
      modal.scrollDown(maxScroll);
      modal.scrollDown(maxScroll);
      modal.scrollDown(maxScroll);
      expect(modal.getScrollPosition()).toBe(3);
    });

    test('scrollDown() respects maxScroll boundary', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      const maxScroll = 3;
      modal.setScrollPosition(2);
      modal.scrollDown(maxScroll);
      modal.scrollDown(maxScroll);
      modal.scrollDown(maxScroll);
      expect(modal.getScrollPosition()).toBe(3);
    });

    test('scrollDown() returns true when position changes', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(0);
      const result = modal.scrollDown(10);
      expect(result).toBe(true);
      expect(modal.getScrollPosition()).toBe(1);
    });

    test('scrollDown() returns false when at bottom boundary', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      const maxScroll = 5;
      modal.setScrollPosition(5);
      const result = modal.scrollDown(maxScroll);
      expect(result).toBe(false);
      expect(modal.getScrollPosition()).toBe(5);
    });

    test('scrollDown() returns false when maxScroll is 0', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(0);
      const result = modal.scrollDown(0);
      expect(result).toBe(false);
      expect(modal.getScrollPosition()).toBe(0);
    });
  });

  describe('Scroll Position Boundaries', () => {
    test('scroll position cannot go below 0', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      modal.setScrollPosition(0);
      modal.scrollUp();
      expect(modal.getScrollPosition()).toBe(0);
    });

    test('scroll position cannot exceed maxScroll', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      const maxScroll = 5;
      modal.setScrollPosition(5);
      modal.scrollDown(maxScroll);
      expect(modal.getScrollPosition()).toBe(5);
    });
  });

  describe('Modal-Level Action', () => {
    test('action property is stored when provided', () => {
      const actionFn = () => {};
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
        action: actionFn,
      });

      expect(modal.getAction()).toBe(actionFn);
    });

    test('action property is undefined when not provided', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
      });

      expect(modal.getAction()).toBeUndefined();
    });

    test('getAction() returns the action function', () => {
      const actionFn = () => {
        return 'action executed';
      };
      const modal = new Modal({
        title: 'Test Modal',
        content: [],
        action: actionFn,
      });

      expect(modal.getAction()).toBe(actionFn);
      expect(modal.getAction()()).toBe('action executed');
    });
  });

  describe('Option Action Parameters', () => {
    test('option action receives options parameter with modal reference', () => {
      let receivedOptions = null;
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          {
            type: 'option',
            label: 'Test Option',
            action: (options) => {
              receivedOptions = options;
            },
          },
        ],
      });

      const mockModalManager = {
        closeModal: () => {},
      };

      modal.executeSelectedAction(mockModalManager);

      expect(receivedOptions).toBeDefined();
      expect(receivedOptions.modal).toBe(modal);
    });

    test('option action can access modal via options.modal', () => {
      let accessedModal = null;
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          {
            type: 'option',
            label: 'Test Option',
            action: (options) => {
              accessedModal = options.modal;
            },
          },
        ],
      });

      const mockModalManager = {
        closeModal: () => {},
      };

      modal.executeSelectedAction(mockModalManager);

      expect(accessedModal).toBe(modal);
    });

    test('option action can call modal action via options.modal', () => {
      let modalActionCalled = false;
      const modalAction = () => {
        modalActionCalled = true;
      };

      const modal = new Modal({
        title: 'Test Modal',
        action: modalAction,
        content: [
          {
            type: 'option',
            label: 'Test Option',
            action: (options) => {
              if (options.modal?.action) {
                options.modal.action();
              }
            },
          },
        ],
      });

      const mockModalManager = {
        closeModal: () => {},
      };

      modal.executeSelectedAction(mockModalManager);

      expect(modalActionCalled).toBe(true);
    });
  });
});


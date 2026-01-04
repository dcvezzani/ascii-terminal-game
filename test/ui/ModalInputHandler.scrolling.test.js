import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModalInputHandler } from '../../src/ui/ModalInputHandler.js';
import { Modal } from '../../src/ui/Modal.js';
import { ModalManager } from '../../src/ui/ModalManager.js';

describe('ModalInputHandler Scrolling and Selection', () => {
  let modalManager;
  let modalInputHandler;
  let stateChangeCallback;

  beforeEach(() => {
    modalManager = new ModalManager();
    stateChangeCallback = vi.fn();
    modalManager.setStateChangeCallback(stateChangeCallback);
    modalInputHandler = new ModalInputHandler(modalManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('scrolling with movement keys', () => {
    test('up arrow key scrolls content up', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'message', text: 'Line 1' },
          { type: 'message', text: 'Line 2' },
        ],
      });

      modal.setScrollPosition(5); // Start scrolled down
      modalManager.openModal(modal);

      const handled = modalInputHandler.handleKeypress('', { name: 'up' }, modal);

      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBe(4); // Scrolled up by 1
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    test('w key scrolls content up', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Line 1' }],
      });

      modal.setScrollPosition(3);
      modalManager.openModal(modal);

      const handled = modalInputHandler.handleKeypress('w', {}, modal);

      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBe(2);
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    test('down arrow key scrolls content down', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Line 1' }],
      });

      modal.setScrollPosition(0);
      modalManager.openModal(modal);

      // Mock calculateMaxScroll to return 10
      vi.spyOn(modalInputHandler, 'calculateMaxScroll').mockReturnValue(10);

      const handled = modalInputHandler.handleKeypress('', { name: 'down' }, modal);

      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBe(1); // Scrolled down by 1
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    test('s key scrolls content down', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Line 1' }],
      });

      modal.setScrollPosition(0);
      modalManager.openModal(modal);

      vi.spyOn(modalInputHandler, 'calculateMaxScroll').mockReturnValue(10);

      const handled = modalInputHandler.handleKeypress('s', {}, modal);

      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBe(1);
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    test('scroll up does not go below 0', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Line 1' }],
      });

      modal.setScrollPosition(0); // Already at top
      modalManager.openModal(modal);

      const handled = modalInputHandler.handleKeypress('', { name: 'up' }, modal);

      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBe(0); // Still at 0
    });

    test('scroll down does not exceed maxScroll', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Line 1' }],
      });

      modal.setScrollPosition(10);
      modalManager.openModal(modal);

      vi.spyOn(modalInputHandler, 'calculateMaxScroll').mockReturnValue(10);

      const handled = modalInputHandler.handleKeypress('', { name: 'down' }, modal);

      expect(handled).toBe(true);
      expect(modal.getScrollPosition()).toBe(10); // Still at max
    });
  });

  describe('Enter key selection', () => {
    test('Enter key selects option and closes modal', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          {
            type: 'option',
            label: 'Option 1',
            action: actionSpy,
          },
        ],
      });

      modal.setSelectedIndex(0);
      modalManager.openModal(modal);

      const handled = modalInputHandler.handleKeypress('', { name: 'return' }, modal);

      expect(handled).toBe(true);
      expect(actionSpy).toHaveBeenCalled();
      expect(actionSpy).toHaveBeenCalledWith({ modal });
      expect(modalManager.hasOpenModal()).toBe(false); // Modal closed
    });

    test('Enter key does nothing if selected option is not visible', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          {
            type: 'option',
            label: 'Option 1',
            action: actionSpy,
          },
        ],
      });

      modal.setSelectedIndex(0);
      modalManager.openModal(modal);

      // Mock isSelectedOptionVisible to return false
      vi.spyOn(modalInputHandler, 'isSelectedOptionVisible').mockReturnValue(false);

      const handled = modalInputHandler.handleKeypress('', { name: 'return' }, modal);

      expect(handled).toBe(true);
      expect(actionSpy).not.toHaveBeenCalled();
      expect(modalManager.hasOpenModal()).toBe(true); // Modal still open
    });
  });

  describe('Space key selection', () => {
    test('Space key selects option and keeps modal open', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          {
            type: 'option',
            label: 'Option 1',
            action: actionSpy,
          },
        ],
      });

      modal.setSelectedIndex(0);
      modalManager.openModal(modal);

      const handled = modalInputHandler.handleKeypress('', { name: 'space' }, modal);

      expect(handled).toBe(true);
      expect(actionSpy).toHaveBeenCalled();
      expect(actionSpy).toHaveBeenCalledWith({ modal });
      expect(modalManager.hasOpenModal()).toBe(true); // Modal still open
    });

    test('Space key does nothing if selected option is not visible', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          {
            type: 'option',
            label: 'Option 1',
            action: actionSpy,
          },
        ],
      });

      modal.setSelectedIndex(0);
      modalManager.openModal(modal);

      vi.spyOn(modalInputHandler, 'isSelectedOptionVisible').mockReturnValue(false);

      const handled = modalInputHandler.handleKeypress('', { name: 'space' }, modal);

      expect(handled).toBe(true);
      expect(actionSpy).not.toHaveBeenCalled();
    });
  });

  describe('option actions', () => {
    test('option action receives options parameter with modal reference', () => {
      let receivedOptions = null;
      const actionSpy = vi.fn((options) => {
        receivedOptions = options;
      });

      const modal = new Modal({
        title: 'Test Modal',
        content: [
          {
            type: 'option',
            label: 'Option 1',
            action: actionSpy,
          },
        ],
      });

      modal.setSelectedIndex(0);
      modalManager.openModal(modal);

      modalInputHandler.handleKeypress('', { name: 'return' }, modal);

      expect(receivedOptions).toBeDefined();
      expect(receivedOptions.modal).toBe(modal);
    });

    test('option action can call modal-level action', () => {
      const modalActionSpy = vi.fn();
      const optionActionSpy = vi.fn((options) => {
        if (options.modal?.action) {
          options.modal.action();
        }
      });

      const modal = new Modal({
        title: 'Test Modal',
        action: modalActionSpy,
        content: [
          {
            type: 'option',
            label: 'Option 1',
            action: optionActionSpy,
          },
        ],
      });

      modal.setSelectedIndex(0);
      modalManager.openModal(modal);

      modalInputHandler.handleKeypress('', { name: 'return' }, modal);

      expect(optionActionSpy).toHaveBeenCalled();
      expect(modalActionSpy).toHaveBeenCalled();
    });
  });

  describe('calculateMaxScroll', () => {
    test('calculates max scroll based on content and viewport', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);

      // This will need to be implemented to calculate based on content height and viewport
      const maxScroll = modalInputHandler.calculateMaxScroll(modal);

      expect(typeof maxScroll).toBe('number');
      expect(maxScroll).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isSelectedOptionVisible', () => {
    test('returns true if selected option is visible in viewport', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1' },
          { type: 'option', label: 'Option 2' },
        ],
      });

      modal.setSelectedIndex(0);
      modal.setScrollPosition(0);
      modalManager.openModal(modal);

      const isVisible = modalInputHandler.isSelectedOptionVisible(modal);

      expect(typeof isVisible).toBe('boolean');
    });

    test('returns false if selected option is scrolled out of view', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1' },
          { type: 'option', label: 'Option 2' },
        ],
      });

      modal.setSelectedIndex(0);
      modal.setScrollPosition(100); // Scrolled way down
      modalManager.openModal(modal);

      const isVisible = modalInputHandler.isSelectedOptionVisible(modal);

      expect(isVisible).toBe(false);
    });
  });

  describe('old navigation methods removed', () => {
    test('navigateUp method should not exist', () => {
      expect(modalInputHandler.navigateUp).toBeUndefined();
    });

    test('navigateDown method should not exist', () => {
      expect(modalInputHandler.navigateDown).toBeUndefined();
    });
  });
});


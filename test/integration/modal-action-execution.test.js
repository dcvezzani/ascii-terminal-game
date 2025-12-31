import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Modal } from '../../src/ui/Modal.js';
import { ModalManager } from '../../src/ui/ModalManager.js';
import { ModalInputHandler } from '../../src/ui/ModalInputHandler.js';

describe('Modal Action Execution - Integration', () => {
  let modalManager;
  let modalInputHandler;

  beforeEach(() => {
    modalManager = new ModalManager();
    modalInputHandler = new ModalInputHandler(modalManager);
  });

  describe('End-to-End Action Execution Flow', () => {
    test('complete flow: open modal, navigate, select option, execute action, close modal', () => {
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
      expect(modal.getSelectedIndex()).toBe(0); // First option selected

      // Navigate to second option
      modalInputHandler.handleKeypress('', { name: 'down' }, modal);
      expect(modal.getSelectedIndex()).toBe(1);

      // Navigate back to first option
      modalInputHandler.handleKeypress('', { name: 'up' }, modal);
      expect(modal.getSelectedIndex()).toBe(0);

      // Select first option (Restart) with Enter
      modalInputHandler.handleKeypress('', { name: 'return' }, modal);

      // Action should be executed
      expect(restartAction).toHaveBeenCalledTimes(1);
      expect(quitAction).not.toHaveBeenCalled();

      // Modal should be closed (auto-close by default)
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('action execution with autoClose: false keeps modal open', () => {
      const actionSpy = vi.fn();

      const modal = new Modal({
        title: 'Confirm',
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

      // Select option
      modalInputHandler.handleKeypress('', { name: 'return' }, modal);

      // Action should be executed
      expect(actionSpy).toHaveBeenCalledTimes(1);

      // Modal should remain open
      expect(modalManager.hasOpenModal()).toBe(true);
    });

    test('multiple actions can be executed by reopening modal and selecting different options', () => {
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
      modalInputHandler.handleKeypress('', { name: 'return' }, modal);
      expect(action1).toHaveBeenCalledTimes(1);
      expect(action2).not.toHaveBeenCalled();
      expect(modalManager.hasOpenModal()).toBe(false);

      // Reopen and select second option
      modalManager.openModal(modal);
      modalInputHandler.handleKeypress('', { name: 'down' }, modal);
      modalInputHandler.handleKeypress('', { name: 'return' }, modal);
      expect(action1).toHaveBeenCalledTimes(1); // Still only called once
      expect(action2).toHaveBeenCalledTimes(1);
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('ESC closes modal without executing action', () => {
      const actionSpy = vi.fn();

      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: actionSpy }],
      });

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      // Press ESC
      modalInputHandler.handleKeypress('', { name: 'escape' }, modal);

      // Action should not be executed
      expect(actionSpy).not.toHaveBeenCalled();

      // Modal should be closed
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('"q" key closes modal without executing action', () => {
      const actionSpy = vi.fn();

      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: actionSpy }],
      });

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      // Press 'q'
      modalInputHandler.handleKeypress('q', { name: 'q' }, modal);

      // Action should not be executed
      expect(actionSpy).not.toHaveBeenCalled();

      // Modal should be closed
      expect(modalManager.hasOpenModal()).toBe(false);
    });
  });
});


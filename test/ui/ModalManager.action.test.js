import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ModalManager } from '../../src/ui/ModalManager.js';
import { Modal } from '../../src/ui/Modal.js';

describe('ModalManager - Action Execution', () => {
  let modalManager;

  beforeEach(() => {
    modalManager = new ModalManager();
  });

  describe('executeSelectedAction()', () => {
    test('executes action from currently selected option', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: actionSpy }],
      });

      modalManager.openModal(modal);
      modalManager.executeSelectedAction();

      expect(actionSpy).toHaveBeenCalledTimes(1);
    });

    test('closes modal after action by default', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: actionSpy }],
      });

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      modalManager.executeSelectedAction();

      expect(actionSpy).toHaveBeenCalled();
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('respects autoClose: false option', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Test',
        content: [
          {
            type: 'option',
            label: 'Option 1',
            action: actionSpy,
            autoClose: false,
          },
        ],
      });

      modalManager.openModal(modal);
      modalManager.executeSelectedAction();

      expect(actionSpy).toHaveBeenCalled();
      expect(modalManager.hasOpenModal()).toBe(true);
    });

    test('does nothing when no modal is open', () => {
      // No modal open
      expect(modalManager.hasOpenModal()).toBe(false);

      // Should not throw
      expect(() => {
        modalManager.executeSelectedAction();
      }).not.toThrow();
    });
  });
});


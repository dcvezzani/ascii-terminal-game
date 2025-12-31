import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Modal } from '../../src/ui/Modal.js';
import { ModalManager } from '../../src/ui/ModalManager.js';

describe('Modal - Action Execution', () => {
  let modal;
  let modalManager;

  beforeEach(() => {
    modalManager = new ModalManager();
  });

  describe('executeSelectedAction()', () => {
    test('executes action from selected option', () => {
      const actionSpy = vi.fn();
      modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: actionSpy }],
      });

      modal.executeSelectedAction(modalManager);
      expect(actionSpy).toHaveBeenCalledTimes(1);
    });

    test('executes action from currently selected option index', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'option', label: 'Option 1', action: action1 },
          { type: 'option', label: 'Option 2', action: action2 },
        ],
      });

      // Select second option
      modal.setSelectedIndex(1);
      modal.executeSelectedAction(modalManager);

      expect(action1).not.toHaveBeenCalled();
      expect(action2).toHaveBeenCalledTimes(1);
    });

    test('handles options with autoClose flag set to false', () => {
      const actionSpy = vi.fn();
      modal = new Modal({
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
      modal.executeSelectedAction(modalManager);

      expect(actionSpy).toHaveBeenCalled();
      // Modal should remain open if autoClose is false
      expect(modalManager.hasOpenModal()).toBe(true);
    });

    test('closes modal after action by default (autoClose: true)', () => {
      const actionSpy = vi.fn();
      modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: actionSpy }],
      });

      modalManager.openModal(modal);
      modal.executeSelectedAction(modalManager);

      expect(actionSpy).toHaveBeenCalled();
      // Modal should close by default
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('closes modal after action when autoClose is explicitly true', () => {
      const actionSpy = vi.fn();
      modal = new Modal({
        title: 'Test',
        content: [
          {
            type: 'option',
            label: 'Option 1',
            action: actionSpy,
            autoClose: true,
          },
        ],
      });

      modalManager.openModal(modal);
      modal.executeSelectedAction(modalManager);

      expect(actionSpy).toHaveBeenCalled();
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('skips message blocks when finding selected option', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();
      modal = new Modal({
        title: 'Test',
        content: [
          { type: 'message', text: 'Message 1' },
          { type: 'option', label: 'Option 1', action: action1 },
          { type: 'message', text: 'Message 2' },
          { type: 'option', label: 'Option 2', action: action2 },
        ],
      });

      // Selected index 0 refers to first option (Option 1)
      modal.executeSelectedAction(modalManager);
      expect(action1).toHaveBeenCalled();
      expect(action2).not.toHaveBeenCalled();

      action1.mockClear();

      // Selected index 1 refers to second option (Option 2)
      modal.setSelectedIndex(1);
      modal.executeSelectedAction(modalManager);
      expect(action1).not.toHaveBeenCalled();
      expect(action2).toHaveBeenCalled();
    });

    test('handles modal with no options gracefully', () => {
      modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'No options' }],
      });

      // Should not throw error
      expect(() => {
        modal.executeSelectedAction(modalManager);
      }).not.toThrow();
    });

    test('handles invalid selected index gracefully', () => {
      const actionSpy = vi.fn();
      modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: actionSpy }],
      });

      // Set invalid index
      modal.setSelectedIndex(999);

      // Should not throw error
      expect(() => {
        modal.executeSelectedAction(modalManager);
      }).not.toThrow();
      expect(actionSpy).not.toHaveBeenCalled();
    });
  });
});


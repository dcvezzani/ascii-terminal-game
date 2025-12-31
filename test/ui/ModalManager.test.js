import { describe, test, expect, beforeEach } from 'vitest';
import { ModalManager } from '../../src/ui/ModalManager.js';
import { Modal } from '../../src/ui/Modal.js';

describe('ModalManager', () => {
  let modalManager;

  beforeEach(() => {
    modalManager = new ModalManager();
  });

  describe('Initialization', () => {
    test('ModalManager can be instantiated', () => {
      expect(modalManager).toBeDefined();
    });

    test('ModalManager has no open modal initially', () => {
      expect(modalManager.hasOpenModal()).toBe(false);
      expect(modalManager.getCurrentModal()).toBeNull();
    });
  });

  describe('Opening and Closing Modals', () => {
    test('openModal() opens a modal', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalManager.openModal(modal);

      expect(modalManager.hasOpenModal()).toBe(true);
      expect(modalManager.getCurrentModal()).toBe(modal);
    });

    test('closeModal() closes the current modal', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      modalManager.closeModal();
      expect(modalManager.hasOpenModal()).toBe(false);
      expect(modalManager.getCurrentModal()).toBeNull();
    });

    test('closeModal() when no modal is open does nothing', () => {
      expect(modalManager.hasOpenModal()).toBe(false);

      modalManager.closeModal();

      expect(modalManager.hasOpenModal()).toBe(false);
    });
  });

  describe('Modal State Tracking', () => {
    test('hasOpenModal() returns true when modal is open', () => {
      const modal = new Modal({
        title: 'Test',
        content: [],
      });

      expect(modalManager.hasOpenModal()).toBe(false);

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      modalManager.closeModal();
      expect(modalManager.hasOpenModal()).toBe(false);
    });

    test('getCurrentModal() returns the current modal when open', () => {
      const modal = new Modal({
        title: 'Test',
        content: [],
      });

      expect(modalManager.getCurrentModal()).toBeNull();

      modalManager.openModal(modal);
      expect(modalManager.getCurrentModal()).toBe(modal);

      modalManager.closeModal();
      expect(modalManager.getCurrentModal()).toBeNull();
    });
  });

  describe('Reset', () => {
    test('reset() closes all modals', () => {
      const modal = new Modal({
        title: 'Test',
        content: [],
      });

      modalManager.openModal(modal);
      expect(modalManager.hasOpenModal()).toBe(true);

      modalManager.reset();
      expect(modalManager.hasOpenModal()).toBe(false);
      expect(modalManager.getCurrentModal()).toBeNull();
    });

    test('reset() works when no modal is open', () => {
      expect(modalManager.hasOpenModal()).toBe(false);

      modalManager.reset();

      expect(modalManager.hasOpenModal()).toBe(false);
    });
  });
});


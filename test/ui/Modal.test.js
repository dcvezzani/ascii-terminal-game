import { describe, test, expect, beforeEach } from 'vitest';
import { Modal } from '../../src/ui/Modal.js';

describe('Modal', () => {
  describe('Initialization', () => {
    test('Modal can be instantiated with title and content', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'message', text: 'Test message' },
          { type: 'option', label: 'Option 1', action: () => {} },
        ],
      });

      expect(modal).toBeDefined();
      expect(modal.getTitle()).toBe('Test Modal');
      expect(modal.getContent()).toBeDefined();
      expect(Array.isArray(modal.getContent())).toBe(true);
      expect(modal.getContent().length).toBe(2);
    });

    test('Modal initializes with default selected index of 0', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      expect(modal.getSelectedIndex()).toBe(0);
    });

    test('Modal can be created with message-only content', () => {
      const modal = new Modal({
        title: 'Info Modal',
        content: [{ type: 'message', text: 'Information message' }],
      });

      expect(modal.getContent().length).toBe(1);
      expect(modal.getContent()[0].type).toBe('message');
    });

    test('Modal can be created with option-only content', () => {
      const modal = new Modal({
        title: 'Choice Modal',
        content: [
          { type: 'option', label: 'Yes', action: () => {} },
          { type: 'option', label: 'No', action: () => {} },
        ],
      });

      expect(modal.getContent().length).toBe(2);
      expect(modal.getContent().every(block => block.type === 'option')).toBe(true);
    });

    test('Modal can be created with intermixed messages and options', () => {
      const modal = new Modal({
        title: 'Mixed Modal',
        content: [
          { type: 'message', text: 'Question text' },
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'message', text: 'More info' },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      expect(modal.getContent().length).toBe(4);
      expect(modal.getContent()[0].type).toBe('message');
      expect(modal.getContent()[1].type).toBe('option');
      expect(modal.getContent()[2].type).toBe('message');
      expect(modal.getContent()[3].type).toBe('option');
    });
  });

  describe('Getters', () => {
    test('getTitle() returns the modal title', () => {
      const modal = new Modal({
        title: 'Test Title',
        content: [],
      });

      expect(modal.getTitle()).toBe('Test Title');
    });

    test('getContent() returns the content array', () => {
      const content = [
        { type: 'message', text: 'Message 1' },
        { type: 'option', label: 'Option 1', action: () => {} },
      ];

      const modal = new Modal({
        title: 'Test',
        content,
      });

      expect(modal.getContent()).toBe(content);
      expect(modal.getContent().length).toBe(2);
    });

    test('getSelectedIndex() returns the current selected option index', () => {
      const modal = new Modal({
        title: 'Test',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      expect(modal.getSelectedIndex()).toBe(0);
    });
  });

  describe('Selected Index Management', () => {
    test('setSelectedIndex() updates the selected index', () => {
      const modal = new Modal({
        title: 'Test',
        content: [
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
          { type: 'option', label: 'Option 3', action: () => {} },
        ],
      });

      modal.setSelectedIndex(1);
      expect(modal.getSelectedIndex()).toBe(1);

      modal.setSelectedIndex(2);
      expect(modal.getSelectedIndex()).toBe(2);
    });

    test('setSelectedIndex() only counts option blocks, not message blocks', () => {
      const modal = new Modal({
        title: 'Test',
        content: [
          { type: 'message', text: 'Message' },
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'message', text: 'Another message' },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      // Selected index 0 should select first option (at content index 1)
      expect(modal.getSelectedIndex()).toBe(0);

      modal.setSelectedIndex(1);
      expect(modal.getSelectedIndex()).toBe(1);
    });
  });
});


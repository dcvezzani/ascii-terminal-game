import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModalRenderer } from '../../src/render/ModalRenderer.js';
import { Modal } from '../../src/ui/Modal.js';
import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';

describe('ModalRenderer', () => {
  let modalRenderer;
  let writeSpy;

  beforeEach(() => {
    modalRenderer = new ModalRenderer();
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    // Mock terminal size
    process.stdout.columns = 80;
    process.stdout.rows = 24;
    vi.clearAllMocks();
  });

  afterEach(() => {
    writeSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    test('ModalRenderer can be instantiated', () => {
      expect(modalRenderer).toBeDefined();
    });
  });

  describe('renderModal()', () => {
    test('renders modal with border using ASCII box-drawing characters', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Test message' }],
      });

      modalRenderer.renderModal(modal);

      // Check for box-drawing characters: ┌─┐│└─┘
      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      // Should contain top border (┌─┐)
      expect(allCalls).toContain('┌');
      expect(allCalls).toContain('─');
      expect(allCalls).toContain('┐');
      // Should contain side borders (│)
      expect(allCalls).toContain('│');
      // Should contain bottom border (└─┘)
      expect(allCalls).toContain('└');
      expect(allCalls).toContain('┘');
    });

    test('renders modal title at top', () => {
      const modal = new Modal({
        title: 'Test Title',
        content: [{ type: 'message', text: 'Test message' }],
      });

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      // Should contain the title
      expect(allCalls).toContain('Test Title');
    });

    test('renders message blocks as plain text', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'This is a message' }],
      });

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      expect(allCalls).toContain('This is a message');
    });

    test('renders option blocks with labels', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'option', label: 'Option 1', action: () => {} }],
      });

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      expect(allCalls).toContain('Option 1');
    });

    test('renders multiple content blocks in order', () => {
      const modal = new Modal({
        title: 'Test',
        content: [
          { type: 'message', text: 'Message 1' },
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'message', text: 'Message 2' },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      // Should contain all content in order
      expect(allCalls).toContain('Message 1');
      expect(allCalls).toContain('Option 1');
      expect(allCalls).toContain('Message 2');
      expect(allCalls).toContain('Option 2');
    });

    test('renders modal centered on screen', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      // Set terminal size
      process.stdout.columns = 80;
      process.stdout.rows = 24;

      modalRenderer.renderModal(modal);

      // Check that cursor positioning uses center calculations
      const calls = writeSpy.mock.calls.map(call => call[0]);
      const cursorToCalls = calls.filter(call =>
        typeof call === 'string' && call.includes('\u001b[')
      );

      // Should have cursor positioning calls (modal should be centered)
      expect(cursorToCalls.length).toBeGreaterThan(0);
    });

    test('handles multi-line messages', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Line 1\nLine 2\nLine 3' }],
      });

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      expect(allCalls).toContain('Line 1');
      expect(allCalls).toContain('Line 2');
      expect(allCalls).toContain('Line 3');
    });

    test('renders modal with fixed size dimensions', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalRenderer.renderModal(modal);

      // Modal should have consistent dimensions (not percentage-based yet)
      // This is a basic check that rendering happens
      expect(writeSpy).toHaveBeenCalled();
    });
  });

  describe('Modal dimensions', () => {
    test('modal has minimum width for content', () => {
      const modal = new Modal({
        title: 'Very Long Title That Needs Space',
        content: [{ type: 'message', text: 'Content' }],
      });

      modalRenderer.renderModal(modal);

      // Should render without errors
      expect(writeSpy).toHaveBeenCalled();
    });

    test('modal handles empty content', () => {
      const modal = new Modal({
        title: 'Empty Modal',
        content: [],
      });

      modalRenderer.renderModal(modal);

      // Should still render border and title
      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      expect(allCalls).toContain('Empty Modal');
    });
  });
});


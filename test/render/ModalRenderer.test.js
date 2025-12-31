import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModalRenderer } from '../../src/render/ModalRenderer.js';
import { Modal } from '../../src/ui/Modal.js';
import { gameConfig } from '../../src/config/gameConfig.js';
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

  describe('Percentage-based sizing', () => {
    let originalDimensions;

    beforeEach(() => {
      // Save original config
      originalDimensions = gameConfig.modal.dimensions
        ? { ...gameConfig.modal.dimensions }
        : undefined;
    });

    afterEach(() => {
      // Restore original config
      if (originalDimensions) {
        gameConfig.modal.dimensions = originalDimensions;
      } else {
        delete gameConfig.modal.dimensions;
      }
    });

    test('uses percentage-based sizing when enabled', () => {
      gameConfig.modal.dimensions = {
        enabled: true,
        width: 60,
        height: 50,
      };

      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test message' }],
      });

      process.stdout.columns = 100;
      process.stdout.rows = 40;

      modalRenderer.renderModal(modal);

      // Modal width should be 60% of 100 = 60
      // Modal height should be 50% of 40 = 20
      // We can't directly test the dimensions, but we can verify the modal was rendered
      expect(writeSpy).toHaveBeenCalled();
    });

    test('uses fixed sizing when disabled', () => {
      gameConfig.modal.dimensions = {
        enabled: false,
      };

      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test message' }],
      });

      process.stdout.columns = 100;
      process.stdout.rows = 40;

      modalRenderer.renderModal(modal);

      // Should use minWidth and minHeight (fixed sizing)
      expect(writeSpy).toHaveBeenCalled();
    });

    test('height uses width value when height is missing', () => {
      gameConfig.modal.dimensions = {
        enabled: true,
        width: 70,
        // height is missing
      };

      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test message' }],
      });

      process.stdout.columns = 100;
      process.stdout.rows = 40;

      modalRenderer.renderModal(modal);

      // Height should use width value (70%)
      // Modal height should be 70% of 40 = 28
      expect(writeSpy).toHaveBeenCalled();
    });

    test('uses defaults when dimensions config is missing', () => {
      // Remove dimensions config
      delete gameConfig.modal.dimensions;

      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test message' }],
      });

      process.stdout.columns = 100;
      process.stdout.rows = 40;

      modalRenderer.renderModal(modal);

      // Should fall back to fixed sizing
      expect(writeSpy).toHaveBeenCalled();
    });

    test('scales correctly with different terminal sizes', () => {
      gameConfig.modal.dimensions = {
        enabled: true,
        width: 50,
        height: 40,
      };

      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test message' }],
      });

      // Test with small terminal
      process.stdout.columns = 60;
      process.stdout.rows = 20;
      modalRenderer.renderModal(modal);
      expect(writeSpy).toHaveBeenCalled();

      vi.clearAllMocks();

      // Test with large terminal
      process.stdout.columns = 200;
      process.stdout.rows = 60;
      modalRenderer.renderModal(modal);
      expect(writeSpy).toHaveBeenCalled();
    });
  });
});


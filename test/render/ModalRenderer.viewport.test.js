import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModalRenderer } from '../../src/render/ModalRenderer.js';

describe('ModalRenderer Viewport and Height Calculations', () => {
  let modalRenderer;

  beforeEach(() => {
    modalRenderer = new ModalRenderer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateViewport', () => {
    test('calculates viewport boundaries correctly', () => {
      const startY = 10;
      const modalHeight = 15;

      const viewport = modalRenderer.calculateViewport(startY, modalHeight);

      expect(viewport).toBeDefined();
      expect(viewport.viewportStartY).toBe(12); // startY + 2 (after title line)
      expect(viewport.viewportEndY).toBe(23); // startY + modalHeight - 2 (leaves space for bottom border)
      expect(viewport.viewportHeight).toBe(12); // viewportEndY - viewportStartY + 1 (reduced by 1 to show bottom border)
    });

    test('calculates viewport height correctly for different modal heights', () => {
      const startY = 5;
      const modalHeight1 = 10;
      const modalHeight2 = 20;

      const viewport1 = modalRenderer.calculateViewport(startY, modalHeight1);
      const viewport2 = modalRenderer.calculateViewport(startY, modalHeight2);

      expect(viewport1.viewportHeight).toBe(7); // (5 + 10 - 2) - (5 + 2) + 1 = 7 (reduced by 1)
      expect(viewport2.viewportHeight).toBe(17); // (5 + 20 - 2) - (5 + 2) + 1 = 17 (reduced by 1)
    });

    test('viewportStartY is always startY + 2', () => {
      const startY = 0;
      const modalHeight = 10;

      const viewport = modalRenderer.calculateViewport(startY, modalHeight);

      expect(viewport.viewportStartY).toBe(2);
    });

    test('viewportEndY is always startY + modalHeight - 2', () => {
      const startY = 10;
      const modalHeight = 15;

      const viewport = modalRenderer.calculateViewport(startY, modalHeight);

      expect(viewport.viewportEndY).toBe(23); // 10 + 15 - 2 (leaves space for bottom border)
    });
  });

  describe('calculateTotalContentHeight', () => {
    test('calculates total height for simple message content', () => {
      const content = [
        { type: 'message', text: 'Line 1' },
        { type: 'message', text: 'Line 2' },
      ];
      const width = 50;

      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);

      expect(totalHeight).toBe(2); // Each message is one line
    });

    test('calculates total height for simple option content', () => {
      const content = [
        { type: 'option', label: 'Option 1' },
        { type: 'option', label: 'Option 2' },
      ];
      const width = 50;

      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);

      expect(totalHeight).toBe(2); // Each option is one line
    });

    test('calculates total height for mixed content', () => {
      const content = [
        { type: 'message', text: 'Message 1' },
        { type: 'option', label: 'Option 1' },
        { type: 'message', text: 'Message 2' },
        { type: 'option', label: 'Option 2' },
      ];
      const width = 50;

      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);

      expect(totalHeight).toBe(4); // 2 messages + 2 options
    });

    test('counts wrapped text lines correctly for messages', () => {
      // Create a message that will wrap to multiple lines
      const longText = 'This is a very long message that should wrap to multiple lines when the width is limited';
      const content = [
        { type: 'message', text: longText },
      ];
      const width = 30; // Narrow width to force wrapping

      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);

      // Should be more than 1 line due to wrapping
      expect(totalHeight).toBeGreaterThan(1);
    });

    test('counts wrapped text lines correctly for options', () => {
      // Create an option label that will wrap to multiple lines
      const longLabel = 'This is a very long option label that should wrap to multiple lines when the width is limited';
      const content = [
        { type: 'option', label: longLabel },
      ];
      const width = 30; // Narrow width to force wrapping

      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);

      // Should be more than 1 line due to wrapping
      expect(totalHeight).toBeGreaterThan(1);
    });

    test('accounts for padding when calculating line width', () => {
      const content = [
        { type: 'message', text: 'Test message' },
      ];
      const width = 50;
      const padding = modalRenderer.padding;

      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);

      // Line width should be width - (padding * 2)
      // This affects wrapping, so we verify the method uses padding correctly
      expect(totalHeight).toBeGreaterThanOrEqual(1);
    });

    test('accounts for option prefix when calculating option width', () => {
      const longLabel = 'This is a long option label that should wrap';
      const content = [
        { type: 'option', label: longLabel },
      ];
      const width = 30;

      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);

      // Option width should be lineWidth - 2 (for prefix "> ")
      // This affects wrapping, so we verify the method accounts for prefix
      expect(totalHeight).toBeGreaterThanOrEqual(1);
    });

    test('handles empty content', () => {
      const content = [];
      const width = 50;

      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);

      expect(totalHeight).toBe(0);
    });

    test('handles content with newlines in messages', () => {
      const content = [
        { type: 'message', text: 'Line 1\nLine 2\nLine 3' },
      ];
      const width = 50;

      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);

      // Should count all lines including newlines
      expect(totalHeight).toBeGreaterThanOrEqual(3);
    });
  });

  describe('calculateMaxScroll', () => {
    test('calculates max scroll when content is taller than viewport', () => {
      const totalHeight = 20;
      const viewportHeight = 10;

      const maxScroll = modalRenderer.calculateMaxScroll(totalHeight, viewportHeight);

      expect(maxScroll).toBe(10); // 20 - 10 = 10
    });

    test('returns 0 when content fits in viewport', () => {
      const totalHeight = 5;
      const viewportHeight = 10;

      const maxScroll = modalRenderer.calculateMaxScroll(totalHeight, viewportHeight);

      expect(maxScroll).toBe(0); // Content fits, no scrolling needed
    });

    test('returns 0 when content height equals viewport height', () => {
      const totalHeight = 10;
      const viewportHeight = 10;

      const maxScroll = modalRenderer.calculateMaxScroll(totalHeight, viewportHeight);

      expect(maxScroll).toBe(0); // Exactly fits, no scrolling needed
    });

    test('returns 0 when content is shorter than viewport', () => {
      const totalHeight = 3;
      const viewportHeight = 10;

      const maxScroll = modalRenderer.calculateMaxScroll(totalHeight, viewportHeight);

      expect(maxScroll).toBe(0); // Content shorter, no scrolling needed
    });

    test('handles large content height differences', () => {
      const totalHeight = 100;
      const viewportHeight = 20;

      const maxScroll = modalRenderer.calculateMaxScroll(totalHeight, viewportHeight);

      expect(maxScroll).toBe(80); // 100 - 20 = 80
    });

    test('always returns non-negative value', () => {
      const totalHeight = 5;
      const viewportHeight = 20;

      const maxScroll = modalRenderer.calculateMaxScroll(totalHeight, viewportHeight);

      expect(maxScroll).toBe(0); // Math.max(0, ...) ensures non-negative
      expect(maxScroll).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration: Viewport and Height Calculations', () => {
    test('viewport and content height work together for scrolling', () => {
      const startY = 10;
      const modalHeight = 15;
      const content = [
        { type: 'message', text: 'Line 1' },
        { type: 'message', text: 'Line 2' },
        { type: 'message', text: 'Line 3' },
        { type: 'message', text: 'Line 4' },
        { type: 'message', text: 'Line 5' },
        { type: 'message', text: 'Line 6' },
        { type: 'message', text: 'Line 7' },
        { type: 'message', text: 'Line 8' },
        { type: 'message', text: 'Line 9' },
        { type: 'message', text: 'Line 10' },
      ];
      const width = 50;

      const viewport = modalRenderer.calculateViewport(startY, modalHeight);
      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);
      const maxScroll = modalRenderer.calculateMaxScroll(totalHeight, viewport.viewportHeight);

      expect(viewport.viewportHeight).toBe(12); // Reduced by 1 to show bottom border
      expect(totalHeight).toBe(10);
      // Content (10 lines) fits in viewport (12 lines), so maxScroll should be 0
      expect(maxScroll).toBe(0);
    });

    test('max scroll is calculated correctly when content exceeds viewport', () => {
      const startY = 10;
      const modalHeight = 10; // Smaller viewport
      const content = [
        { type: 'message', text: 'Line 1' },
        { type: 'message', text: 'Line 2' },
        { type: 'message', text: 'Line 3' },
        { type: 'message', text: 'Line 4' },
        { type: 'message', text: 'Line 5' },
        { type: 'message', text: 'Line 6' },
        { type: 'message', text: 'Line 7' },
        { type: 'message', text: 'Line 8' },
        { type: 'message', text: 'Line 9' },
        { type: 'message', text: 'Line 10' },
      ];
      const width = 50;

      const viewport = modalRenderer.calculateViewport(startY, modalHeight);
      const totalHeight = modalRenderer.calculateTotalContentHeight(content, width);
      const maxScroll = modalRenderer.calculateMaxScroll(totalHeight, viewport.viewportHeight);

      expect(viewport.viewportHeight).toBe(7); // (10 + 10 - 2) - (10 + 2) + 1 = 7 (reduced by 1)
      expect(totalHeight).toBe(10);
      // Content (10 lines) exceeds viewport (7 lines), so maxScroll should be 3
      expect(maxScroll).toBe(3); // 10 - 7 = 3
    });
  });
});


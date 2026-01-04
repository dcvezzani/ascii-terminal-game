import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModalRenderer } from '../../src/render/ModalRenderer.js';
import { Modal } from '../../src/ui/Modal.js';
import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';

describe('ModalRenderer Viewport Clipping', () => {
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

  describe('buildContentLines', () => {
    test('builds content lines for simple messages', () => {
      const content = [
        { type: 'message', text: 'Line 1' },
        { type: 'message', text: 'Line 2' },
      ];
      const width = 50;

      const lines = modalRenderer.buildContentLines(content, width);

      expect(lines).toBeDefined();
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBe(2);
      expect(lines[0].type).toBe('message');
      expect(lines[0].text).toBe('Line 1');
      expect(lines[1].type).toBe('message');
      expect(lines[1].text).toBe('Line 2');
    });

    test('builds content lines for simple options', () => {
      const content = [
        { type: 'option', label: 'Option 1' },
        { type: 'option', label: 'Option 2' },
      ];
      const width = 50;

      const lines = modalRenderer.buildContentLines(content, width);

      expect(lines.length).toBe(2);
      expect(lines[0].type).toBe('option');
      expect(lines[0].label).toBe('Option 1');
      expect(lines[0].isFirstLine).toBe(true);
      expect(lines[1].type).toBe('option');
      expect(lines[1].label).toBe('Option 2');
      expect(lines[1].isFirstLine).toBe(true);
    });

    test('builds wrapped lines for long messages', () => {
      const longText = 'This is a very long message that should wrap to multiple lines when the width is limited';
      const content = [
        { type: 'message', text: longText },
      ];
      const width = 30; // Narrow width to force wrapping

      const lines = modalRenderer.buildContentLines(content, width);

      expect(lines.length).toBeGreaterThan(1);
      expect(lines.every(line => line.type === 'message')).toBe(true);
    });

    test('builds wrapped lines for long option labels', () => {
      const longLabel = 'This is a very long option label that should wrap to multiple lines when the width is limited';
      const content = [
        { type: 'option', label: longLabel },
      ];
      const width = 30; // Narrow width to force wrapping

      const lines = modalRenderer.buildContentLines(content, width);

      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0].isFirstLine).toBe(true);
      expect(lines.slice(1).every(line => line.isFirstLine === false)).toBe(true);
    });

    test('tracks option index correctly for multiple options', () => {
      const content = [
        { type: 'message', text: 'Message' },
        { type: 'option', label: 'Option 1' },
        { type: 'message', text: 'Another message' },
        { type: 'option', label: 'Option 2' },
      ];
      const width = 50;

      const lines = modalRenderer.buildContentLines(content, width);

      const optionLines = lines.filter(line => line.type === 'option');
      expect(optionLines[0].optionIndex).toBe(0);
      expect(optionLines[1].optionIndex).toBe(1);
    });

    test('handles empty content', () => {
      const content = [];
      const width = 50;

      const lines = modalRenderer.buildContentLines(content, width);

      expect(lines).toBeDefined();
      expect(lines.length).toBe(0);
    });
  });

  describe('renderContent with scrollPosition', () => {
    test('renders all content when scrollPosition is 0 and content fits in viewport', () => {
      const content = [
        { type: 'message', text: 'Line 1' },
        { type: 'message', text: 'Line 2' },
        { type: 'message', text: 'Line 3' },
      ];
      const startX = 10;
      const startY = 5;
      const width = 50;
      const modalHeight = 10; // Large enough to fit all content
      const selectedIndex = 0;
      const scrollPosition = 0;

      modalRenderer.renderContent(startX, startY, width, content, selectedIndex, scrollPosition, modalHeight);

      // Should render all 3 lines
      const calls = writeSpy.mock.calls;
      const line1Call = calls.find(call => call[0]?.includes('Line 1'));
      const line2Call = calls.find(call => call[0]?.includes('Line 2'));
      const line3Call = calls.find(call => call[0]?.includes('Line 3'));

      expect(line1Call).toBeDefined();
      expect(line2Call).toBeDefined();
      expect(line3Call).toBeDefined();
    });

    test('clips content when scrollPosition is greater than 0', () => {
      const content = [
        { type: 'message', text: 'Line 1' },
        { type: 'message', text: 'Line 2' },
        { type: 'message', text: 'Line 3' },
        { type: 'message', text: 'Line 4' },
        { type: 'message', text: 'Line 5' },
      ];
      const startX = 10;
      const startY = 5;
      const width = 50;
      const modalHeight = 6; // Small viewport (only fits ~3 lines)
      const selectedIndex = 0;
      const scrollPosition = 1; // Scroll down by 1 line

      modalRenderer.renderContent(startX, startY, width, content, selectedIndex, scrollPosition, modalHeight);

      // Should NOT render Line 1 (scrolled out of view)
      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');
      
      expect(allCalls).not.toContain('Line 1');
      // Should render Line 2, 3, 4 (visible in viewport)
      expect(allCalls).toContain('Line 2');
    });

    test('only renders visible lines within viewport', () => {
      const content = Array.from({ length: 20 }, (_, i) => ({
        type: 'message',
        text: `Line ${i + 1}`,
      }));
      const startX = 10;
      const startY = 5;
      const width = 50;
      const modalHeight = 8; // Viewport fits ~5 lines
      const selectedIndex = 0;
      const scrollPosition = 5; // Scroll to show lines 6-10

      modalRenderer.renderContent(startX, startY, width, content, selectedIndex, scrollPosition, modalHeight);

      const calls = writeSpy.mock.calls;
      // Extract all line numbers that were rendered
      const renderedLines = calls
        .map(call => call[0])
        .filter(call => typeof call === 'string')
        .join('')
        .match(/Line (\d+)/g)
        ?.map(match => parseInt(match.match(/\d+/)[0])) || [];

      // Should NOT render lines before scroll position
      expect(renderedLines).not.toContain(1);
      expect(renderedLines).not.toContain(5);
      // Should render lines within viewport (6-11 for scrollPosition=5, viewportHeight~5)
      expect(renderedLines).toContain(6);
      expect(renderedLines.length).toBeGreaterThan(0);
    });

    test('handles wrapped text in clipping correctly', () => {
      const longText = 'This is a very long message that will wrap to multiple lines when rendered';
      const content = [
        { type: 'message', text: longText },
        { type: 'message', text: 'Line 2' },
        { type: 'message', text: 'Line 3' },
      ];
      const startX = 10;
      const startY = 5;
      const width = 30; // Narrow width to force wrapping
      const modalHeight = 6; // Small viewport
      const selectedIndex = 0;
      const scrollPosition = 0;

      modalRenderer.renderContent(startX, startY, width, content, selectedIndex, scrollPosition, modalHeight);

      // Should render wrapped lines correctly
      const calls = writeSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    test('clamps scrollPosition to maxScroll', () => {
      const content = Array.from({ length: 10 }, (_, i) => ({
        type: 'message',
        text: `Line ${i + 1}`,
      }));
      const startX = 10;
      const startY = 5;
      const width = 50;
      const modalHeight = 8; // Viewport fits ~5 lines
      const selectedIndex = 0;
      const scrollPosition = 100; // Way beyond max scroll

      modalRenderer.renderContent(startX, startY, width, content, selectedIndex, scrollPosition, modalHeight);

      // Should clamp to maxScroll and render last visible lines
      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Should render last lines (clamped scroll position)
      expect(allCalls).toContain('Line 10');
    });

    test('renders options correctly with scrolling', () => {
      const content = [
        { type: 'message', text: 'Message 1' },
        { type: 'option', label: 'Option 1' },
        { type: 'message', text: 'Message 2' },
        { type: 'option', label: 'Option 2' },
        { type: 'message', text: 'Message 3' },
        { type: 'option', label: 'Option 3' },
      ];
      const startX = 10;
      const startY = 5;
      const width = 50;
      const modalHeight = 6; // Small viewport
      const selectedIndex = 1; // Select Option 2
      const scrollPosition = 2; // Scroll to show Option 2

      modalRenderer.renderContent(startX, startY, width, content, selectedIndex, scrollPosition, modalHeight);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Should render Option 2 (selected and visible)
      expect(allCalls).toContain('Option 2');
    });
  });

  describe('renderModal with scrollPosition', () => {
    test('passes scrollPosition from modal to renderContent', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'message', text: 'Line 1' },
          { type: 'message', text: 'Line 2' },
        ],
      });

      modal.setScrollPosition(1);

      const renderContentSpy = vi.spyOn(modalRenderer, 'renderContent');

      modalRenderer.renderModal(modal);

      expect(renderContentSpy).toHaveBeenCalled();
      const lastCall = renderContentSpy.mock.calls[renderContentSpy.mock.calls.length - 1];
      const scrollPositionArg = lastCall[5]; // 6th argument (0-indexed: startX, startY, width, content, selectedIndex, scrollPosition)
      expect(scrollPositionArg).toBe(1);
    });

    test('uses modal scrollPosition of 0 by default', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'message', text: 'Line 1' },
        ],
      });

      const renderContentSpy = vi.spyOn(modalRenderer, 'renderContent');

      modalRenderer.renderModal(modal);

      expect(renderContentSpy).toHaveBeenCalled();
      const lastCall = renderContentSpy.mock.calls[renderContentSpy.mock.calls.length - 1];
      const scrollPositionArg = lastCall[5];
      expect(scrollPositionArg).toBe(0);
    });
  });

  describe('buildOptionLinesMap with scroll position', () => {
    test('builds option lines map accounting for scroll position', () => {
      const content = [
        { type: 'message', text: 'Message 1' },
        { type: 'option', label: 'Option 1' },
        { type: 'message', text: 'Message 2' },
        { type: 'option', label: 'Option 2' },
      ];
      const startX = 10;
      const startY = 5;
      const width = 50;
      const scrollPosition = 2;

      const optionLines = modalRenderer.buildOptionLinesMap(startX, startY, content, width, scrollPosition);

      expect(optionLines).toBeDefined();
      expect(optionLines instanceof Map).toBe(true);
      // Should track option positions
      expect(optionLines.has(0)).toBe(true);
      expect(optionLines.has(1)).toBe(true);
    });
  });

  describe('updateSelectionOnly with scrolled content', () => {
    test('updates selection only if option is visible in viewport', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1' },
          { type: 'option', label: 'Option 2' },
          { type: 'option', label: 'Option 3' },
        ],
      });

      // Set up last rendered state
      modalRenderer.lastRenderedState = {
        startX: 10,
        startY: 5,
        width: 50,
        selectedIndex: 0,
        scrollPosition: 0, // Match modal scroll position
        modalHeight: 10, // Needed for viewport calculation
        optionLines: new Map([
          [0, [7]], // Option 1 at Y=7
          [1, [8]], // Option 2 at Y=8
          [2, [9]], // Option 3 at Y=9
        ]),
      };

      modal.setSelectedIndex(1);
      modal.setScrollPosition(0);

      const result = modalRenderer.updateSelectionOnly(modal);

      // Should update if option is visible
      expect(result).toBe(true);
    });
  });
});


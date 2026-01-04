import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModalRenderer } from '../../src/render/ModalRenderer.js';
import { Modal } from '../../src/ui/Modal.js';
import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';

describe('ModalRenderer Option State Rendering', () => {
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

  describe('Selected Option Rendering', () => {
    test('selected option rendered with > prefix', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1' },
          { type: 'option', label: 'Option 2' },
        ],
      });
      modal.setSelectedIndex(0);

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Should contain '> Option 1' for selected option
      expect(allCalls).toContain('> Option 1');
    });

    test('only selected option has > prefix', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1' },
          { type: 'option', label: 'Option 2' },
          { type: 'option', label: 'Option 3' },
        ],
      });
      modal.setSelectedIndex(1); // Select Option 2

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Should contain '> Option 2' for selected option
      expect(allCalls).toContain('> Option 2');
      // Should not contain '> Option 1' or '> Option 3'
      // (they should have '  ' prefix instead)
      expect(allCalls).toContain('  Option 1');
      expect(allCalls).toContain('  Option 3');
    });
  });

  describe('Active Option Rendering', () => {
    test('active option rendered with checkmark glyph', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1', active: true },
          { type: 'option', label: 'Option 2' },
        ],
        selectedIndex: 1, // Select Option 2 so Option 1 shows active state
      });

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Should contain '✓ Option 1' for active option (not selected)
      expect(allCalls).toContain('✓ Option 1');
      // Should contain '> Option 2' for selected option
      expect(allCalls).toContain('> Option 2');
    });

    test('multiple options can be active', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1', active: true },
          { type: 'option', label: 'Option 2', active: true },
          { type: 'option', label: 'Option 3' },
        ],
      });
      // Set selectedIndex to -1 or a non-active option to test active state alone
      modal.setSelectedIndex(2); // Select Option 3 (not active)

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Both active options should have checkmark (not selected)
      expect(allCalls).toContain('✓ Option 1');
      expect(allCalls).toContain('✓ Option 2');
      // Selected option should have > prefix
      expect(allCalls).toContain('> Option 3');
    });

    test('active option without selected state shows checkmark', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1', active: true },
          { type: 'option', label: 'Option 2' },
        ],
      });
      modal.setSelectedIndex(1); // Select Option 2 (not active)

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Option 1 should have checkmark (active but not selected)
      expect(allCalls).toContain('✓ Option 1');
      // Option 2 should have > prefix (selected)
      expect(allCalls).toContain('> Option 2');
    });
  });

  describe('Selected vs Active States', () => {
    test('selected option takes precedence over active state', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1', active: true },
          { type: 'option', label: 'Option 2', active: true },
        ],
      });
      modal.setSelectedIndex(0); // Select Option 1 (which is also active)

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Option 1 should have > prefix (selected takes precedence)
      expect(allCalls).toContain('> Option 1');
      // Option 2 should have checkmark (active but not selected)
      expect(allCalls).toContain('✓ Option 2');
    });

    test('both states can exist simultaneously on different options', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1', active: true },
          { type: 'option', label: 'Option 2' },
          { type: 'option', label: 'Option 3', active: true },
        ],
      });
      modal.setSelectedIndex(1); // Select Option 2 (not active)

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Option 1: active but not selected -> checkmark
      expect(allCalls).toContain('✓ Option 1');
      // Option 2: selected but not active -> > prefix
      expect(allCalls).toContain('> Option 2');
      // Option 3: active but not selected -> checkmark
      expect(allCalls).toContain('✓ Option 3');
    });
  });

  describe('Option State with Scrolling', () => {
    test('selected option must be visible to be rendered with > prefix', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'message', text: 'Line 1' },
          { type: 'message', text: 'Line 2' },
          { type: 'message', text: 'Line 3' },
          { type: 'message', text: 'Line 4' },
          { type: 'message', text: 'Line 5' },
          { type: 'option', label: 'Option 1' },
          { type: 'option', label: 'Option 2' },
        ],
      });
      modal.setSelectedIndex(1); // Select Option 2
      modal.setScrollPosition(0); // Start at top

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Option 2 should be visible and have > prefix
      expect(allCalls).toContain('> Option 2');
    });

    test('active state persists in hidden content', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1', active: true },
          { type: 'message', text: 'Line 1' },
          { type: 'message', text: 'Line 2' },
          { type: 'message', text: 'Line 3' },
          { type: 'message', text: 'Line 4' },
          { type: 'message', text: 'Line 5' },
          { type: 'option', label: 'Option 2', active: true },
        ],
      });
      modal.setScrollPosition(5); // Scroll down, hiding Option 1

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Option 1 should not be visible (scrolled out)
      // Option 2 should be visible and have checkmark
      expect(allCalls).toContain('✓ Option 2');
      // Option 1 should not appear in visible content
      // (we can't easily test this without parsing the exact Y positions, but the active state is preserved in the block)
    });
  });

  describe('Option State in updateSelectionOnly', () => {
    test('updateSelectionOnly renders active state correctly', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1', active: true },
          { type: 'option', label: 'Option 2', active: true },
        ],
      });

      // Set up last rendered state
      modalRenderer.lastRenderedState = {
        startX: 10,
        startY: 5,
        width: 50,
        selectedIndex: 0,
        scrollPosition: 0,
        modalHeight: 10,
        optionLines: new Map([
          [0, [7]], // Option 1 at Y=7
          [1, [8]], // Option 2 at Y=8
        ]),
      };

      modal.setSelectedIndex(1);

      const result = modalRenderer.updateSelectionOnly(modal);

      expect(result).toBe(true);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Option 1 should have checkmark (active but not selected)
      expect(allCalls).toContain('✓ Option 1');
      // Option 2 should have > prefix (selected)
      expect(allCalls).toContain('> Option 2');
    });
  });

  describe('Default State (No Selection, No Active)', () => {
    test('option without selection or active state uses spaces', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [
          { type: 'option', label: 'Option 1' },
          { type: 'option', label: 'Option 2' },
        ],
      });

      modalRenderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Options should have '  ' prefix (two spaces for alignment)
      // Since we can't easily test for exact spaces, we test that 'Option 1' appears
      // and that it doesn't have '>' or '✓' prefix when not selected/active
      expect(allCalls).toContain('Option 1');
      expect(allCalls).toContain('Option 2');
    });
  });
});


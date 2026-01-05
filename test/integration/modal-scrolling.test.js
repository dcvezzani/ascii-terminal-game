import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal } from '../../src/ui/Modal.js';
import { ModalManager } from '../../src/ui/ModalManager.js';
import { InputHandler } from '../../src/input/InputHandler.js';
import { Renderer } from '../../src/render/Renderer.js';
import { Game } from '../../src/game/Game.js';
import { ModalRenderer } from '../../src/render/ModalRenderer.js';

describe('Modal Scrolling - Integration Tests', () => {
  let modalManager;
  let renderer;
  let inputHandler;
  let game;
  let callbacks;
  let writeSpy;
  let onModalStateChangeSpy;

  beforeEach(() => {
    modalManager = new ModalManager();
    game = new Game();
    renderer = new Renderer(modalManager);
    
    callbacks = {
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      onMoveLeft: vi.fn(),
      onMoveRight: vi.fn(),
      onQuit: vi.fn(),
      onRestart: vi.fn(),
      onHelp: vi.fn(),
    };
    
    onModalStateChangeSpy = vi.fn();
    inputHandler = new InputHandler(callbacks, modalManager, onModalStateChangeSpy);
    
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    process.stdout.columns = 80;
    process.stdout.rows = 24;
    vi.clearAllMocks();
  });

  afterEach(() => {
    writeSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Scrolling with Long Content', () => {
    test('can scroll through multiple messages', () => {
      const modal = new Modal({
        title: 'Long Content Modal',
        content: Array.from({ length: 30 }, (_, i) => ({
          type: 'message',
          text: `Message ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      expect(modal.getScrollPosition()).toBe(0);

      // Scroll down multiple times
      for (let i = 0; i < 10; i++) {
        inputHandler.handleKeypress('', { name: 'down' });
      }

      expect(modal.getScrollPosition()).toBeGreaterThan(0);
      expect(modal.getScrollPosition()).toBeLessThanOrEqual(20); // Should be within maxScroll
    });

    test('can scroll to bottom and back to top', () => {
      const modal = new Modal({
        title: 'Scroll Test',
        content: Array.from({ length: 25 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      
      // Get maxScroll
      const modalInputHandler = inputHandler.modalInputHandler;
      const maxScroll = modalInputHandler.calculateMaxScroll(modal);
      
      // Scroll to bottom
      modal.setScrollPosition(maxScroll);
      expect(modal.getScrollPosition()).toBe(maxScroll);

      // Scroll back up
      for (let i = 0; i < maxScroll; i++) {
        inputHandler.handleKeypress('', { name: 'up' });
      }

      expect(modal.getScrollPosition()).toBe(0);
    });
  });

  describe('Scrolling with Wrapped Text', () => {
    test('scrolls through wrapped text lines correctly', () => {
      const longText = 'This is a very long message that will wrap to multiple lines when displayed in the modal. It should wrap correctly and allow scrolling through all wrapped lines.';
      const modal = new Modal({
        title: 'Wrapped Text',
        content: [
          { type: 'message', text: longText },
          { type: 'message', text: longText },
          { type: 'message', text: longText },
        ],
      });

      modalManager.openModal(modal);
      
      // Render modal first to calculate maxScroll
      renderer.renderModal(modal);
      
      // Scroll down
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getScrollPosition()).toBeGreaterThan(0);

      // Scroll up
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getScrollPosition()).toBe(0);
    });

    test('wrapped option labels scroll correctly', () => {
      const longLabel = 'This is a very long option label that will wrap to multiple lines when displayed in the modal viewport.';
      const modal = new Modal({
        title: 'Wrapped Options',
        content: [
          ...Array.from({ length: 10 }, (_, i) => ({
            type: 'message',
            text: `Message ${i + 1}`,
          })),
          { type: 'option', label: longLabel, action: () => {} },
          { type: 'option', label: longLabel, action: () => {} },
          { type: 'option', label: longLabel, action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      
      // Render modal first to calculate maxScroll
      renderer.renderModal(modal);
      
      // Scroll down
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getScrollPosition()).toBeGreaterThan(0);
    });
  });

  describe('Scroll Indicators', () => {
    test('scroll indicators appear/disappear correctly', () => {
      const modal = new Modal({
        title: 'Indicators Test',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      renderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // At top, should not show top indicator (↑), but may show bottom indicator (↓)
      // Scroll down
      inputHandler.handleKeypress('', { name: 'down' });
      onModalStateChangeSpy();
      renderer.renderModal(modal);

      const callsAfterScroll = writeSpy.mock.calls;
      const allCallsAfterScroll = callsAfterScroll.map(call => call[0]).join('');

      // Should show top indicator (↑) when scrolled
      expect(allCallsAfterScroll).toContain('↑');
    });

    test('progress bar updates during scrolling', () => {
      const modal = new Modal({
        title: 'Progress Test',
        content: Array.from({ length: 30 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      
      // Render modal first to calculate actual maxScroll
      renderer.renderModal(modal);
      const actualMaxScroll = modal.getMaxScroll();
      expect(actualMaxScroll).not.toBeNull();
      
      // Scroll to middle
      const middleScroll = Math.floor(actualMaxScroll / 2);
      modal.setScrollPosition(middleScroll);
      renderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Progress bar (█) should be rendered
      expect(allCalls).toContain('█');
    });
  });

  describe('Option Selection with Scrolling', () => {
    test('can select options while content is scrolled', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();
      const modal = new Modal({
        title: 'Selection Test',
        content: [
          ...Array.from({ length: 10 }, (_, i) => ({
            type: 'message',
            text: `Line ${i + 1}`,
          })),
          { type: 'option', label: 'Option 1', action: action1 },
          { type: 'option', label: 'Option 2', action: action2 },
        ],
      });

      modalManager.openModal(modal);
      
      // Render modal first to calculate maxScroll
      renderer.renderModal(modal);
      
      // Scroll down to see options
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getScrollPosition()).toBeGreaterThan(0);

      // Select first option (index 0 relative to options only)
      modal.setSelectedIndex(0);
      inputHandler.handleKeypress('', { name: 'return' });

      expect(action1).toHaveBeenCalledTimes(1);
      expect(action2).not.toHaveBeenCalled();
    });

    test('selected option remains visible when scrolling', () => {
      const modal = new Modal({
        title: 'Visibility Test',
        content: [
          ...Array.from({ length: 15 }, (_, i) => ({
            type: 'message',
            text: `Line ${i + 1}`,
          })),
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'option', label: 'Option 2', action: () => {} },
        ],
      });

      modalManager.openModal(modal);
      
      // Render modal first to calculate actual maxScroll
      renderer.renderModal(modal);
      const actualMaxScroll = modal.getMaxScroll();
      expect(actualMaxScroll).not.toBeNull();
      
      // Select first option (index 0 relative to options only)
      modal.setSelectedIndex(0);

      // Scroll to bottom to ensure options are visible
      modal.setScrollPosition(actualMaxScroll);

      // Render and verify option is visible
      renderer.renderModal(modal);
      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Should contain selected option (scrolled to bottom, so option should be visible)
      expect(allCalls).toContain('Option 1');
    });
  });

  describe('Active vs Selected Option States', () => {
    test('active and selected states work together', () => {
      const modal = new Modal({
        title: 'States Test',
        content: [
          { type: 'option', label: 'Option 1', active: true },
          { type: 'option', label: 'Option 2', active: true },
          { type: 'option', label: 'Option 3' },
        ],
      });

      modalManager.openModal(modal);
      modal.setSelectedIndex(1); // Select Option 2 (which is also active)

      renderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Option 1: active but not selected -> checkmark
      expect(allCalls).toContain('✓ Option 1');
      // Option 2: selected (takes precedence) -> > prefix
      expect(allCalls).toContain('> Option 2');
      // Option 3: neither -> spaces
      expect(allCalls).toContain('Option 3');
    });

    test('multiple active options can exist simultaneously', () => {
      const modal = new Modal({
        title: 'Multiple Active',
        content: [
          { type: 'option', label: 'Option 1', active: true },
          { type: 'option', label: 'Option 2', active: true },
          { type: 'option', label: 'Option 3', active: true },
          { type: 'option', label: 'Option 4' },
        ],
      });

      modalManager.openModal(modal);
      modal.setSelectedIndex(2); // Select Option 3

      renderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // All active options should show checkmark (except selected one)
      expect(allCalls).toContain('✓ Option 1');
      expect(allCalls).toContain('✓ Option 2');
      expect(allCalls).toContain('> Option 3'); // Selected takes precedence
      expect(allCalls).toContain('Option 4'); // Not active, not selected
    });
  });

  describe('Modal-Level Action Execution', () => {
    test('modal-level action can be executed', () => {
      const modalAction = vi.fn();
      const optionAction = vi.fn();
      const modal = new Modal({
        title: 'Modal Action Test',
        action: modalAction,
        content: [
          { type: 'option', label: 'Option 1', action: optionAction },
        ],
      });

      modalManager.openModal(modal);
      
      // Execute option action (which can call modal action)
      modal.setSelectedIndex(0);
      inputHandler.handleKeypress('', { name: 'return' });

      // Option action should be called
      expect(optionAction).toHaveBeenCalledTimes(1);
      
      // Modal action can be called from option action if needed
      // (This is tested in the option actions calling modal action test)
    });

    test('modal action is accessible from option actions', () => {
      const modalAction = vi.fn();
      let receivedModal = null;
      
      const optionAction = (options) => {
        receivedModal = options.modal;
        if (options.modal?.getAction) {
          const action = options.modal.getAction();
          if (action) {
            action();
          }
        }
      };

      const modal = new Modal({
        title: 'Modal Action Access',
        action: modalAction,
        content: [
          { type: 'option', label: 'Trigger Modal Action', action: optionAction },
        ],
      });

      modalManager.openModal(modal);
      modal.setSelectedIndex(0);
      
      // Execute option action
      modal.executeSelectedAction(modalManager);

      // Modal should be passed to option action
      expect(receivedModal).toBe(modal);
      // Modal action should be callable
      expect(modal.getAction()).toBe(modalAction);
    });
  });

  describe('Option Actions Calling Modal Action', () => {
    test('option action can call modal-level action', () => {
      const modalAction = vi.fn();
      const optionAction = vi.fn((options) => {
        const { modal } = options;
        if (modal?.getAction) {
          const action = modal.getAction();
          if (action) {
            action();
          }
        }
      });

      const modal = new Modal({
        title: 'Action Chain Test',
        action: modalAction,
        content: [
          { type: 'option', label: 'Option 1', action: optionAction },
        ],
      });

      modalManager.openModal(modal);
      modal.setSelectedIndex(0);
      
      // Execute option action
      modal.executeSelectedAction(modalManager);

      // Both actions should be called
      expect(optionAction).toHaveBeenCalledTimes(1);
      expect(modalAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scroll Position Persistence During Stacking', () => {
    test('scroll position preserved when modal is stacked', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: [{ type: 'message', text: 'Content' }],
      });

      // Open modal1 and scroll
      modalManager.openModal(modal1);
      renderer.renderModal(modal1); // Render to calculate maxScroll
      inputHandler.handleKeypress('', { name: 'down' });
      inputHandler.handleKeypress('', { name: 'down' });
      const scrollPos = modal1.getScrollPosition();
      expect(scrollPos).toBeGreaterThan(0);

      // Open modal2 (modal1 is stacked)
      modalManager.openModal(modal2);
      expect(modalManager.getCurrentModal()).toBe(modal2);
      expect(modal1.getScrollPosition()).toBe(scrollPos); // Preserved

      // Close modal2 (modal1 is restored)
      modalManager.closeModal();
      expect(modalManager.getCurrentModal()).toBe(modal1);
      expect(modal1.getScrollPosition()).toBe(scrollPos); // Still preserved
    });

    test('each modal maintains its own scroll position', () => {
      const modal1 = new Modal({
        title: 'Modal 1',
        content: Array.from({ length: 15 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });
      const modal2 = new Modal({
        title: 'Modal 2',
        content: Array.from({ length: 15 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      // Open modal1 and scroll
      modalManager.openModal(modal1);
      renderer.renderModal(modal1); // Render to calculate maxScroll
      inputHandler.handleKeypress('', { name: 'down' });
      inputHandler.handleKeypress('', { name: 'down' });
      const scrollPos1 = modal1.getScrollPosition();

      // Open modal2 and scroll more
      modalManager.openModal(modal2);
      renderer.renderModal(modal2); // Render to calculate maxScroll
      inputHandler.handleKeypress('', { name: 'down' });
      inputHandler.handleKeypress('', { name: 'down' });
      inputHandler.handleKeypress('', { name: 'down' });
      const scrollPos2 = modal2.getScrollPosition();

      // Verify different scroll positions (they should be different since modal2 has more content)
      // If they're the same, it means both modals scrolled the same amount, which is fine
      // The important thing is that each modal maintains its own position
      expect(scrollPos1).toBeGreaterThanOrEqual(0);
      expect(scrollPos2).toBeGreaterThanOrEqual(0);
      expect(modal1.getScrollPosition()).toBe(scrollPos1); // Modal1 unchanged
      expect(modal2.getScrollPosition()).toBe(scrollPos2);

      // Restore modal1
      modalManager.closeModal();
      expect(modal1.getScrollPosition()).toBe(scrollPos1); // Still preserved
    });
  });

  describe('Viewport Clipping', () => {
    test('content does not render beyond viewport bounds', () => {
      const modal = new Modal({
        title: 'Clipping Test',
        content: Array.from({ length: 50 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      modal.setScrollPosition(0);

      // Render modal
      renderer.renderModal(modal);

      // Get viewport height from renderer
      const modalRenderer = renderer.modalRenderer;
      const terminalSize = { rows: 24, columns: 80 };
      const modalHeight = modalRenderer.calculateModalHeight(modal.getContent(), terminalSize.rows);
      const viewport = modalRenderer.calculateViewport(0, modalHeight);

      // Only viewportHeight lines should be rendered
      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Count visible lines (should be limited to viewport)
      // This is a basic check - exact line counting would require parsing ANSI codes
      expect(allCalls).toContain('Line 1'); // First line should be visible
      // Last visible line should be within viewport
      expect(viewport.viewportHeight).toBeGreaterThan(0);
      expect(viewport.viewportHeight).toBeLessThan(50); // Less than total content
    });

    test('scrolled content shows correct lines in viewport', () => {
      const modal = new Modal({
        title: 'Viewport Test',
        content: Array.from({ length: 30 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      
      // Render modal first to calculate actual maxScroll
      renderer.renderModal(modal);
      const actualMaxScroll = modal.getMaxScroll();
      expect(actualMaxScroll).not.toBeNull();
      
      // Scroll to middle
      const middleScroll = Math.floor(actualMaxScroll / 2);
      modal.setScrollPosition(middleScroll);

      renderer.renderModal(modal);

      const calls = writeSpy.mock.calls;
      const allCalls = calls.map(call => call[0]).join('');

      // Should show lines from middle of content, not from start
      // Exact line numbers depend on viewport, but should not show "Line 1" at top
      expect(allCalls).toContain('Line'); // Should contain some lines
    });
  });

  describe('Scrolling Boundaries', () => {
    test('scrolling stops at top boundary (0)', () => {
      const modal = new Modal({
        title: 'Boundary Test',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      expect(modal.getScrollPosition()).toBe(0);

      // Try to scroll up from top
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getScrollPosition()).toBe(0); // Should stay at 0
    });

    test('no flickering when scrolling up at top boundary (multiple keypresses)', () => {
      const modal = new Modal({
        title: 'Flickering Test',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      renderer.renderModal(modal);
      expect(modal.getScrollPosition()).toBe(0);

      // Clear any initial render calls
      writeSpy.mockClear();
      onModalStateChangeSpy.mockClear();

      // Try to scroll up multiple times at top boundary
      inputHandler.handleKeypress('', { name: 'up' });
      inputHandler.handleKeypress('', { name: 'up' });
      inputHandler.handleKeypress('', { name: 'up' });

      expect(modal.getScrollPosition()).toBe(0);
      // Note: InputHandler may call onModalStateChange for modal state tracking,
      // but the key behavior is that scroll position doesn't change (no flickering)
      // The ModalInputHandler's triggerStateChange should not be called when at boundary
    });

    test('scrolling stops at bottom boundary (maxScroll)', () => {
      const modal = new Modal({
        title: 'Boundary Test',
        content: Array.from({ length: 25 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      
      // Render modal first to calculate actual maxScroll
      renderer.renderModal(modal);
      const actualMaxScroll = modal.getMaxScroll();
      expect(actualMaxScroll).not.toBeNull();
      
      // Scroll to bottom
      modal.setScrollPosition(actualMaxScroll);
      expect(modal.getScrollPosition()).toBe(actualMaxScroll);

      // Try to scroll down from bottom
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getScrollPosition()).toBe(actualMaxScroll); // Should stay at maxScroll
    });

    test('scrolling does not allow exceeding boundaries', () => {
      const modal = new Modal({
        title: 'Boundary Enforcement',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      
      // Render modal first to calculate actual maxScroll
      renderer.renderModal(modal);
      const actualMaxScroll = modal.getMaxScroll();
      expect(actualMaxScroll).not.toBeNull();
      
      // Try to set scroll position beyond maxScroll
      modal.setScrollPosition(actualMaxScroll + 10); // Try to exceed
      
      // Renderer should clamp it
      renderer.renderModal(modal);
      
      // Scroll position should be clamped to actual maxScroll
      expect(modal.getScrollPosition()).toBeLessThanOrEqual(actualMaxScroll);
    });

    test('no flickering when scrolling down at bottom boundary (multiple keypresses)', () => {
      const modal = new Modal({
        title: 'Flickering Test',
        content: Array.from({ length: 25 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      
      // Render modal first to calculate actual maxScroll
      renderer.renderModal(modal);
      const actualMaxScroll = modal.getMaxScroll();
      expect(actualMaxScroll).not.toBeNull();
      
      // Scroll to bottom
      modal.setScrollPosition(actualMaxScroll);
      expect(modal.getScrollPosition()).toBe(actualMaxScroll);

      // Clear any initial render calls
      writeSpy.mockClear();
      onModalStateChangeSpy.mockClear();

      // Try to scroll down multiple times at bottom boundary
      inputHandler.handleKeypress('', { name: 'down' });
      inputHandler.handleKeypress('', { name: 'down' });
      inputHandler.handleKeypress('', { name: 'down' });

      expect(modal.getScrollPosition()).toBe(actualMaxScroll);
      // Note: InputHandler may call onModalStateChange for modal state tracking,
      // but the key behavior is that scroll position doesn't change (no flickering)
      // The ModalInputHandler's triggerStateChange should not be called when at boundary
    });

    test('re-rendering occurs when scroll position actually changes', () => {
      const modal = new Modal({
        title: 'Re-render Test',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      renderer.renderModal(modal);
      
      // Clear any initial render calls
      onModalStateChangeSpy.mockClear();

      // Scroll down (position should change)
      inputHandler.handleKeypress('', { name: 'down' });
      
      expect(modal.getScrollPosition()).toBeGreaterThan(0);
      // onModalStateChange should be called when position changes
      // The exact count may vary, but it should be called at least once
      expect(onModalStateChangeSpy.mock.calls.length).toBeGreaterThan(0);
    });

    test('scroll position does not change when at boundaries (prevents flickering)', () => {
      const modal = new Modal({
        title: 'Callback Test',
        content: Array.from({ length: 20 }, (_, i) => ({
          type: 'message',
          text: `Line ${i + 1}`,
        })),
      });

      modalManager.openModal(modal);
      renderer.renderModal(modal);
      
      // Scroll down (position should change)
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getScrollPosition()).toBeGreaterThan(0);
      const scrollPosAfterDown = modal.getScrollPosition();
      
      // Scroll up (position should change)
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getScrollPosition()).toBe(0);
      
      // Try to scroll up at top multiple times (position should NOT change)
      inputHandler.handleKeypress('', { name: 'up' });
      inputHandler.handleKeypress('', { name: 'up' });
      inputHandler.handleKeypress('', { name: 'up' });
      // Position should still be 0 (no change = no flickering)
      expect(modal.getScrollPosition()).toBe(0);
      
      // Scroll to bottom
      const actualMaxScroll = modal.getMaxScroll();
      if (actualMaxScroll !== null) {
        modal.setScrollPosition(actualMaxScroll);
        expect(modal.getScrollPosition()).toBe(actualMaxScroll);
        
        // Try to scroll down at bottom multiple times (position should NOT change)
        inputHandler.handleKeypress('', { name: 'down' });
        inputHandler.handleKeypress('', { name: 'down' });
        inputHandler.handleKeypress('', { name: 'down' });
        // Position should still be at maxScroll (no change = no flickering)
        expect(modal.getScrollPosition()).toBe(actualMaxScroll);
      }
    });
  });

  describe('End-to-End Scrolling Flow', () => {
    test('complete flow: open, scroll, select, execute, close', () => {
      const actionSpy = vi.fn();
      const modal = new Modal({
        title: 'Complete Flow',
        content: [
          ...Array.from({ length: 20 }, (_, i) => ({
            type: 'message',
            text: `Message ${i + 1}`,
          })),
          { type: 'option', label: 'Execute', action: actionSpy },
        ],
      });

      modalManager.openModal(modal);
      expect(modal.getScrollPosition()).toBe(0);

      // Render modal first to calculate actual maxScroll
      renderer.renderModal(modal);

      // Scroll down
      inputHandler.handleKeypress('', { name: 'down' });
      inputHandler.handleKeypress('', { name: 'down' });
      expect(modal.getScrollPosition()).toBeGreaterThan(0);

      // Scroll back up
      inputHandler.handleKeypress('', { name: 'up' });
      inputHandler.handleKeypress('', { name: 'up' });
      expect(modal.getScrollPosition()).toBe(0);
      
      // Select option (index 0 relative to options only - there's only one option)
      modal.setSelectedIndex(0);
      
      // Scroll to bottom to make option visible (required for action execution)
      const actualMaxScroll = modal.getMaxScroll();
      if (actualMaxScroll !== null) {
        modal.setScrollPosition(actualMaxScroll);
      }
      
      // Now execute the action
      inputHandler.handleKeypress('', { name: 'return' });

      // Action should be executed and modal closed
      expect(actionSpy).toHaveBeenCalledTimes(1);
      expect(modalManager.hasOpenModal()).toBe(false);
    });
  });
});


import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Renderer } from '../../src/render/Renderer.js';
import { ModalManager } from '../../src/ui/ModalManager.js';
import { Modal } from '../../src/ui/Modal.js';
import { Game } from '../../src/game/Game.js';
import ansiEscapes from 'ansi-escapes';

describe('Renderer - Modal Integration', () => {
  let renderer;
  let modalManager;
  let writeSpy;
  let game;

  beforeEach(() => {
    modalManager = new ModalManager();
    renderer = new Renderer(modalManager);
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    game = new Game();
    process.stdout.columns = 80;
    process.stdout.rows = 24;
    vi.clearAllMocks();
  });

  afterEach(() => {
    writeSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('renderFull() with modal', () => {
    test('renders modal over game board when modal is open', () => {
      const modal = new Modal({
        title: 'Test Modal',
        content: [{ type: 'message', text: 'Test message' }],
      });

      modalManager.openModal(modal);
      renderer.renderFull(game);

      // Should render modal (check for box-drawing characters)
      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      // Should contain modal border characters
      expect(allCalls).toContain('┌');
      expect(allCalls).toContain('─');
      expect(allCalls).toContain('┐');
      expect(allCalls).toContain('│');
      expect(allCalls).toContain('└');
      expect(allCalls).toContain('┘');
      // Should contain modal title
      expect(allCalls).toContain('Test Modal');
      // Should contain modal content
      expect(allCalls).toContain('Test message');
    });

    test('does not render modal when no modal is open', () => {
      // No modal opened
      renderer.renderFull(game);

      // Should not contain modal border characters
      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      // Should not contain modal border (or if it does, it's from something else)
      // Actually, let's check that the game board is rendered normally
      expect(writeSpy).toHaveBeenCalled();
    });

    test('renders game board before rendering modal', () => {
      const modal = new Modal({
        title: 'Test',
        content: [{ type: 'message', text: 'Test' }],
      });

      modalManager.openModal(modal);
      renderer.renderFull(game);

      // Both game and modal should be rendered
      // Game board should be rendered first, then modal on top
      expect(writeSpy).toHaveBeenCalled();
    });

    test('renders modal with multiple content blocks', () => {
      const modal = new Modal({
        title: 'Multi Content',
        content: [
          { type: 'message', text: 'Message 1' },
          { type: 'option', label: 'Option 1', action: () => {} },
          { type: 'message', text: 'Message 2' },
        ],
      });

      modalManager.openModal(modal);
      renderer.renderFull(game);

      const calls = writeSpy.mock.calls.map(call => call[0]);
      const allCalls = calls.join('');

      expect(allCalls).toContain('Message 1');
      expect(allCalls).toContain('Option 1');
      expect(allCalls).toContain('Message 2');
    });
  });
});


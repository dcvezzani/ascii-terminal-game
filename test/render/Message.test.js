import { describe, it, expect, beforeEach } from 'vitest';
import Message from '../../src/render/Message.js';

describe('Message', () => {
  let canvas;

  beforeEach(() => {
    canvas = { grid: null };
  });

  describe('terminal too small', () => {
    it('writes two-line message into canvas.grid (terminal is too small / please resize)', () => {
      Message.apply(canvas, { terminalColumns: 40, terminalRows: 24 });
      expect(canvas.grid).toBeDefined();
      expect(canvas.grid.length).toBe(24);
      expect(canvas.grid[0].length).toBe(40);
      const line1Row = canvas.grid[11].map(c => c.character).join('').trim();
      const line2Row = canvas.grid[12].map(c => c.character).join('').trim();
      expect(line1Row).toBe(Message.TERMINAL_TOO_SMALL_LINE1);
      expect(line2Row).toBe(Message.TERMINAL_TOO_SMALL_LINE2);
      const firstCharCol = canvas.grid[11].findIndex(c => c.character !== ' ');
      expect(canvas.grid[11][firstCharCol].color).toBe(Message.TERMINAL_TOO_SMALL_COLOR);
    });

    it('sets grid size to terminalRows x terminalColumns', () => {
      Message.apply(canvas, { terminalColumns: 80, terminalRows: 30 });
      expect(canvas.grid.length).toBe(30);
      expect(canvas.grid[0].length).toBe(80);
    });
  });
});

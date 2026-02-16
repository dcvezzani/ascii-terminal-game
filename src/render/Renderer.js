import chalk from 'chalk';
import { cursorHide, cursorShow, cursorTo, clearScreen } from 'ansi-escapes';
import hideCursor from 'cli-cursor';
import process from 'process';
import {
  wrapAtSpaces,
  buildLine1,
  buildLine2,
  buildSimplifiedLine,
  formatBoxTopBottom,
  formatBoxRow
} from './statusBarUtils.js';
import { truncateTitleToWidth, BLANK_LINES_BEFORE_STATUS_BAR, TITLE_AND_STATUS_BAR_WIDTH } from './layout.js';

const TITLE_HEIGHT = 2;

/**
 * Renderer class for terminal rendering
 */
export class Renderer {
  constructor() {
    this.stdout = process.stdout;
  }

  /**
   * Move cursor to home (1, 1). No-op when rendering to grid; cursor position is not stored in this.grid.
   * Call after each complete frame per spec §3.6 if writing to terminal elsewhere.
   */
  moveCursorToHome() {
    this.stdout.write(cursorTo(1, 1));
  }

  /**
   * Hide terminal cursor
   */
  hideCursor() {
    hideCursor.hide();
  }

  /**
   * Show terminal cursor
   */
  showCursor() {
    hideCursor.show();
  }

  clearScreen(canvas) {
    canvas.clearScreen();
    this.render(canvas);
  }

  /**
   * Get color function from hex color string
   * @param {string} hex - Hex color string (e.g., "FF0000")
   * @returns {Function} Chalk color function
   */
  getColorFunction(hex) {
    if (!hex) {
      return chalk.white;
    }

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return chalk.rgb(r, g, b);
  }

  render(canvas) {
    if (!canvas || !canvas.grid || canvas.grid.length === 0) {
      return;
    }
    this.moveCursorToHome();
    this.stdout.write(clearScreen);

    // Render each cell in the Canvas grid to the terminal
    for (let y = 0; y < canvas.grid.length; y++) {
      const row = canvas.grid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const cell = row[x];
        this.stdout.write(this.getColorFunction(cell.color)(cell.character));
      }
      if (y < canvas.grid.length - 1) {
        this.stdout.write('\n');
      }
    }
  }
}

// Default export
export default Renderer;

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
/**
 * Deep-copy a canvas grid (array of rows of { character, color }).
 * @param {Array<Array<{character: string, color: string}>>} grid
 * @returns {Array<Array<{character: string, color: string}>>}
 */
function copyGrid(grid) {
  if (!grid || grid.length === 0) return [];
  const out = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) {
      out[y] = [];
      continue;
    }
    out[y] = row.map((cell) => (cell ? { character: cell.character, color: cell.color } : { character: ' ', color: 'FFFFFF' }));
  }
  return out;
}

export class Renderer {
  constructor() {
    this.stdout = process.stdout;
    /** @type {Array<Array<{character: string, color: string}>|null} */
    this._lastRenderedGrid = null;
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

  renderFull(canvas) {
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
    this._lastRenderedGrid = copyGrid(canvas.grid);
  }

  /**
   * Render only cells that differ from the last full render.
   * Uses cursor positioning to update individual cells. Falls back to full render
   * if there is no previous grid or the grid shape changed.
   * @param {import('./Canvas.js').default} canvas
   */
  renderIncremental(canvas) {
    if (!canvas || !canvas.grid || canvas.grid.length === 0) {
      return;
    }
    const grid = canvas.grid;
    const last = this._lastRenderedGrid;

    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const lastRows = last?.length ?? 0;
    const lastCols = last?.[0]?.length ?? 0;

    if (!last || lastRows !== rows || lastCols !== cols) {
      this.renderFull(canvas);
      return;
    }

    for (let y = 0; y < rows; y++) {
      const row = grid[y];
      const lastRow = last[y];
      if (!row || !lastRow) continue;
      for (let x = 0; x < row.length; x++) {
        const cell = row[x];
        const prev = lastRow[x];
        if (!cell) continue;
        const same = prev && prev.character === cell.character && prev.color === cell.color;
        if (!same) {
          this.stdout.write(cursorTo(x, y));
          this.stdout.write(this.getColorFunction(cell.color)(cell.character));
        }
      }
    }
    this._lastRenderedGrid = copyGrid(canvas.grid);
  }

  render(canvas) {
    if (!canvas || !canvas.grid || canvas.grid.length === 0) {
      return;
    }
    // No previous frame: always full render (avoids calling hasLittleToNoChanges with undefined)
    if (!this._lastRenderedGrid) {
      this.renderFull(canvas);
      return;
    }
    const prevCanvas = { grid: this._lastRenderedGrid };
    if (canvas.hasLittleToNoChanges(prevCanvas, canvas)) {
      this.renderIncremental(canvas);
    } else {
      this.renderFull(canvas);
    }
  }
}

// Default export
export default Renderer;

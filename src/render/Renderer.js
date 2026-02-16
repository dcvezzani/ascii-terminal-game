import chalk from 'chalk';
import { cursorHide, cursorShow, cursorTo, clearScreen } from 'ansi-escapes';
import hideCursor from 'cli-cursor';
import process from 'process';
// import {
//   wrapAtSpaces,
//   buildLine1,
//   buildLine2,
//   buildSimplifiedLine,
//   formatBoxTopBottom,
//   formatBoxRow
// } from './statusBarUtils.js';
// import { truncateTitleToWidth, BLANK_LINES_BEFORE_STATUS_BAR, TITLE_AND_STATUS_BAR_WIDTH } from './layout.js';

// const TITLE_HEIGHT = 2;

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

function noLogger() {
  const _noLogger = () => {};
  return {
    info: _noLogger,
    error: _noLogger,
    warn: _noLogger,
    debug: _noLogger
  };
}

export class Renderer {
  constructor(options={}) {
    this.logger = options.logger || noLogger();
    this.stdout = process.stdout;
    /** @type {Array<Array<{character: string, color: string}>|null} */
    this._lastRenderedGrid = null;
    this.horizOffset = 0;
  }

  /**
   * Move cursor to home (1, 1). No-op when rendering to grid; cursor position is not stored in this.grid.
   * Call after each complete frame per spec §3.6 if writing to terminal elsewhere.
   */
  moveCursorToHome() {
    this.stdout.write(cursorTo(0, 0));
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

  clearScreen() {
    this.moveCursorToHome();

    const columns = process.stdout.columns ?? 80;
    const rows = process.stdout.rows ?? 20;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        this.stdout.write(cursorTo(x, y));
        this.stdout.write(' ');
      }
    }

    this._lastRenderedGrid = null;
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

    this.clearScreen();

    // center the canvas (grid) in the terminal by adding horizontal offset
    const columns = process.stdout.columns ?? 80;
    const gridWidth = canvas.grid[0] ? canvas.grid[0].length : 0;
    this.horizOffset = Math.max(0, Math.floor((columns - gridWidth) / 2));

    // Render each cell in the Canvas grid to the terminal
    for (let y = 0; y < canvas.grid.length; y++) {
      const row = canvas.grid[y];
      if (!row) continue;

      this.stdout.write(cursorTo(this.horizOffset, y));

      for (let x = 0; x < row.length; x++) {
        const cell = row[x];
        this.stdout.write(this.getColorFunction(cell.color)(cell.character));
      }
      if (y < canvas.grid.length - 1) {
        this.stdout.write('\n');
      }
    }

    if (process.env.DEBUG_CANVAS === 'true') {
      this.moveCursorToHome();

      // Render a red '*' for the first and last rows, and the first and last characters of every row
      const redStar = this.getColorFunction('FF0000')('*');
      for (let y = 0; y < canvas.grid.length; y++) {
        const row = canvas.grid[y];

        this.stdout.write(cursorTo(this.horizOffset, y));

        // First and last rows: overwrite entire row with red '*'
        if (y === 0 || y === canvas.grid.length - 1) {
          for (let x = 0; x < row.length; x++) {
            this.stdout.write(redStar);
          }
        } else {
          // For other rows: first and last characters as red '*', rest leave as normal
          for (let x = 0; x < row.length; x++) {
            if (x === 0 || x === row.length - 1) {
              this.stdout.write(redStar);
            } else {
              // Re-render the original cell content
              const cell = row[x];
              this.stdout.write(this.getColorFunction(cell.color)(cell.character));
            }
          }
        }

        if (y < canvas.grid.length - 1) {
          this.stdout.write('\n');
        }
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
    this.logger.debug(">>>dcv (Renderer.js, , renderIncremental:122)", )
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
          this.stdout.write(cursorTo(x + this.horizOffset, y));
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
    if (canvas.hasNoChanges(prevCanvas, canvas)) {
      this.logger.debug("No changes, skipping render");
      return;
    }
    if (canvas.hasFewChanges(prevCanvas, canvas)) {
      this.renderIncremental(canvas);
    } else {
      this.renderFull(canvas);
    }
  }
}

// Default export
export default Renderer;

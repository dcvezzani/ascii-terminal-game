/**
 * Layout constants for centering the game block in the terminal.
 * @see docs/development/specs/center-board-in-terminal/center-board-in-terminal_SPECS.md
 */
export const TITLE_AND_STATUS_BAR_WIDTH = 60;
export const BLANK_LINES_AFTER_TITLE = 1;
export const BLANK_LINES_BEFORE_STATUS_BAR = 1;

const TITLE_HEIGHT = 2; // one title line + one blank line

/**
 * Compute layout for the game block (title + board + status bar).
 * All coordinates are 1-based (ANSI cursor positioning).
 * @param {number} terminalColumns - Terminal width in columns
 * @param {number} terminalRows - Terminal height in rows
 * @param {number} boardWidth - Board width in cells
 * @param {number} boardHeight - Board height in cells
 * @param {number} statusBarHeight - Number of lines used by status bar box
 * @param {{ centerBoard?: boolean }} [options] - Options; centerBoard defaults to true
 * @returns {{ startRow: number, startColumn: number, boardStartColumn: number, blockWidth: number, blockHeight: number, fitsInTerminal: boolean, minColumns: number, minRows: number }}
 */
export function computeLayout(terminalColumns, terminalRows, boardWidth, boardHeight, statusBarHeight, options = {}) {
  const centerBoard = options.centerBoard !== false;
  const blockWidth = Math.max(TITLE_AND_STATUS_BAR_WIDTH, boardWidth);
  const blockHeight = TITLE_HEIGHT + boardHeight + BLANK_LINES_BEFORE_STATUS_BAR + statusBarHeight;
  const minColumns = blockWidth;
  const minRows = blockHeight;

  let startColumn;
  let startRow;
  let boardStartColumn;

  if (centerBoard) {
    startColumn = Math.max(1, Math.floor((terminalColumns - blockWidth) / 2) + 1);
    startRow = Math.max(1, Math.floor((terminalRows - blockHeight) / 2) + 1);
    if (boardWidth < TITLE_AND_STATUS_BAR_WIDTH) {
      boardStartColumn = startColumn + Math.floor((TITLE_AND_STATUS_BAR_WIDTH - boardWidth) / 2);
    } else {
      boardStartColumn = startColumn;
    }
  } else {
    startColumn = 1;
    startRow = 1;
    if (boardWidth < TITLE_AND_STATUS_BAR_WIDTH) {
      boardStartColumn = 1 + Math.floor((TITLE_AND_STATUS_BAR_WIDTH - boardWidth) / 2);
    } else {
      boardStartColumn = 1;
    }
  }

  const fitsInTerminal = terminalColumns >= minColumns && terminalRows >= minRows;

  return {
    startRow,
    startColumn,
    boardStartColumn,
    blockWidth,
    blockHeight,
    fitsInTerminal,
    minColumns,
    minRows
  };
}

/**
 * Truncate title to at most maxWidth characters; append '...' when truncated.
 * @param {string} title - Title string
 * @param {number} [maxWidth=60] - Maximum length
 * @returns {string} Title of length at most maxWidth
 */
export function truncateTitleToWidth(title, maxWidth = 60) {
  if (title.length <= maxWidth) {
    return title;
  }
  return title.slice(0, maxWidth - 3) + '...';
}

/**
 * Content region shape for clear-then-draw (1-based row/column).
 * @typedef {{ startRow: number, startColumn: number, rows: number, columns: number }} ContentRegion
 */

/**
 * Compute content region rectangle from layout (title + board + status bar block).
 * @param {object} layout - Result of computeLayout()
 * @returns {ContentRegion}
 */
export function getContentRegionFromLayout(layout) {
  if (!layout) return null;
  return {
    startRow: layout.startRow,
    startColumn: layout.startColumn,
    rows: layout.blockHeight,
    columns: layout.blockWidth
  };
}

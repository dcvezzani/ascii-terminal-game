/**
 * Terminal utilities for checking size and managing terminal state
 */

/**
 * Get the current terminal size
 * @returns {{rows: number, columns: number}} Terminal dimensions
 */
export function getTerminalSize() {
  return {
    rows: process.stdout.rows || 24,
    columns: process.stdout.columns || 80,
  };
}

/**
 * Check if terminal meets minimum size requirements
 * @param {number} minRows - Minimum number of rows required
 * @param {number} minColumns - Minimum number of columns required
 * @returns {{valid: boolean, rows: number, columns: number, message?: string}}
 */
export function validateTerminalSize(minRows = 25, minColumns = 30) {
  const size = getTerminalSize();
  
  if (size.rows < minRows || size.columns < minColumns) {
    return {
      valid: false,
      rows: size.rows,
      columns: size.columns,
      message: `Terminal size too small. Required: ${minRows}x${minColumns}, Current: ${size.rows}x${size.columns}`,
    };
  }
  
  return {
    valid: true,
    rows: size.rows,
    columns: size.columns,
  };
}

/**
 * Get the offset for centering content horizontally
 * @param {number} contentWidth - Width of content to center
 * @param {number} terminalWidth - Width of terminal (defaults to current)
 * @returns {number} Column offset for centering
 */
export function getHorizontalCenter(contentWidth, terminalWidth = null) {
  const width = terminalWidth || getTerminalSize().columns;
  return Math.max(0, Math.floor((width - contentWidth) / 2));
}

/**
 * Get the offset for centering content vertically
 * @param {number} contentHeight - Height of content to center
 * @param {number} terminalHeight - Height of terminal (defaults to current)
 * @returns {number} Row offset for centering
 */
export function getVerticalCenter(contentHeight, terminalHeight = null) {
  const height = terminalHeight || getTerminalSize().rows;
  return Math.max(0, Math.floor((height - contentHeight) / 2));
}


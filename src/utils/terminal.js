import process from 'process';

/**
 * Check terminal size and warn if too small
 * @param {number} minWidth - Minimum width required
 * @param {number} minHeight - Minimum height required
 * @returns {boolean} True if terminal is large enough
 */
export function checkTerminalSize(minWidth, minHeight) {
  const { columns, rows } = getTerminalSize();
  
  if (columns < minWidth || rows < minHeight) {
    console.warn(`Warning: Terminal size is ${columns}x${rows}, minimum recommended is ${minWidth}x${minHeight}`);
    return false;
  }
  
  return true;
}

/**
 * Get terminal dimensions
 * @returns {object} Object with columns and rows
 */
export function getTerminalSize() {
  return {
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24
  };
}

import process from 'process';
import logger from './logger.js';

/**
 * Check terminal size and warn if too small
 * @param {number} minWidth - Minimum width required
 * @param {number} minHeight - Minimum height required
 * @returns {boolean} True if terminal is large enough
 */
export function checkTerminalSize(minWidth, minHeight) {
  const { columns, rows } = getTerminalSize();

  if (columns < minWidth || rows < minHeight) {
    logger.warn(`Terminal size is ${columns}x${rows}, minimum recommended is ${minWidth}x${minHeight}`);
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

/**
 * One-time startup clear: scroll terminal by writing newlines (spec §2.1).
 * Only runs when stream is TTY and has rows; otherwise no-op.
 * If stream.write() returns false, waits for 'drain' before resolving.
 * @param {NodeJS.WritableStream} stream - Typically process.stdout
 * @returns {Promise<void>}
 */
export function startupClear(stream) {
  if (!stream?.isTTY || stream.rows == null || stream.rows < 1) {
    return Promise.resolve();
  }
  const rows = stream.rows;
  const chunk = '\n'.repeat(rows);
  const ok = stream.write(chunk);
  if (ok) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    stream.once('drain', resolve);
  });
}

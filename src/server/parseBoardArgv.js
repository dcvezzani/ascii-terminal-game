const DEFAULT_BOARD_PATH = './boards/classic.json';

/**
 * Parse board file path from argv (e.g. process.argv).
 * @param {string[]} argv - Command-line arguments (e.g. ['node', 'index.js', '--board', 'boards/foo.json'])
 * @returns {string} Board file path, or default ./boards/classic.json when --board is not present
 */
export function parseBoardPath(argv) {
  const idx = argv.indexOf('--board');
  if (idx !== -1 && idx + 1 < argv.length) {
    return argv[idx + 1];
  }
  return DEFAULT_BOARD_PATH;
}

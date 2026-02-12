const DEFAULT_BOARD_PATH = 'boards/classic.json';

/**
 * Parse board file path from argv (e.g. process.argv).
 * @param {string[]} argv - Command-line arguments (e.g. ['node', 'index.js', '--board', 'boards/foo.json'])
 * @param {string} [configDefaultPath] - Default path when --board is not present (e.g. from server config)
 * @returns {string} Board file path, or configDefaultPath or DEFAULT_BOARD_PATH when --board is not present
 */
export function parseBoardPath(argv, configDefaultPath) {
  const idx = argv.indexOf('--board');
  if (idx !== -1 && idx + 1 < argv.length) {
    return argv[idx + 1];
  }
  return configDefaultPath ?? DEFAULT_BOARD_PATH;
}

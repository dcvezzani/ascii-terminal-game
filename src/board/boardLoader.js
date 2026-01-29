import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Get the dimensions config file path for a board file path.
 * Replaces the file extension with .config.json.
 * @param {string} boardFilePath - Path to board JSON (e.g. boards/level.json)
 * @returns {string} Path to config file (e.g. boards/level.config.json)
 */
export function getConfigPath(boardFilePath) {
  return boardFilePath.replace(/\.json$/i, '.config.json');
}

/**
 * Load and decode board from JSON files (board + dimensions config).
 * @param {string} boardFilePath - Path to board JSON (run-length encoded cells), relative to cwd
 * @returns {{ width: number, height: number, grid: string[][] }}
 * @throws {Error} If file missing, invalid JSON, invalid entity, or cell count mismatch.
 */
export function loadBoardFromFiles(boardFilePath) {
  const resolvedBoardPath = resolve(boardFilePath);
  const configPath = resolve(getConfigPath(boardFilePath));

  if (!existsSync(resolvedBoardPath)) {
    throw new Error(`Board file not found: ${boardFilePath}`);
  }

  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${getConfigPath(boardFilePath)}`);
  }

  readFileSync(resolvedBoardPath, 'utf-8');
  readFileSync(configPath, 'utf-8');
}

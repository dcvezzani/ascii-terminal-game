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

  const boardContent = readFileSync(resolvedBoardPath, 'utf-8');
  const configContent = readFileSync(configPath, 'utf-8');

  let boardArray;
  try {
    boardArray = JSON.parse(boardContent);
  } catch (err) {
    throw new Error(`Invalid JSON in board file: ${err.message}`);
  }
  if (!Array.isArray(boardArray)) {
    throw new Error('Board file must contain a JSON array');
  }

  let config;
  try {
    config = JSON.parse(configContent);
  } catch (err) {
    throw new Error(`Invalid JSON in config file: ${err.message}`);
  }
  if (config === null || typeof config !== 'object') {
    throw new Error('Config file must contain a JSON object');
  }

  const width = config.width;
  const height = config.height;
  if (width === undefined) {
    throw new Error('Config is missing width');
  }
  if (height === undefined) {
    throw new Error('Config is missing height');
  }
  if (typeof width !== 'number' || typeof height !== 'number') {
    throw new Error('Config width and height must be numbers');
  }
  if (width < 1 || height < 1) {
    throw new Error('Config width and height must be at least 1');
  }

  return { width, height, boardArray };
}

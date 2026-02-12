import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/** Default path to the shared board dimensions config (used by all boards). */
export const DEFAULT_DIMENSIONS_PATH = 'boards/dimensions.json';

/** Default board layout file when no board is provided (e.g. to Game constructor). */
export const DEFAULT_BOARD_PATH = 'boards/classic.json';

/**
 * Load width and height from the dimensions JSON file (no board layout).
 * @param {string} [dimensionsFilePath] - Path to dimensions JSON; defaults to DEFAULT_DIMENSIONS_PATH
 * @returns {{ width: number, height: number }}
 * @throws {Error} If file missing or invalid.
 */
export function loadDimensionsFromFile(dimensionsFilePath = DEFAULT_DIMENSIONS_PATH) {
  const resolvedPath = resolve(dimensionsFilePath);
  if (!existsSync(resolvedPath)) {
    throw new Error(`Dimensions file not found: ${dimensionsFilePath}`);
  }
  const content = readFileSync(resolvedPath, 'utf-8');
  let config;
  try {
    config = JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid JSON in dimensions file: ${err.message}`);
  }
  if (config === null || typeof config !== 'object') {
    throw new Error('Dimensions file must contain a JSON object');
  }
  const width = config.width;
  const height = config.height;
  if (width === undefined) {
    throw new Error('Dimensions config is missing width');
  }
  if (height === undefined) {
    throw new Error('Dimensions config is missing height');
  }
  if (typeof width !== 'number' || typeof height !== 'number') {
    throw new Error('Dimensions config width and height must be numbers');
  }
  if (width < 1 || height < 1) {
    throw new Error('Dimensions config width and height must be at least 1');
  }
  return { width, height };
}

/**
 * Load and decode board from JSON files (board layout + shared dimensions config).
 * @param {string} boardFilePath - Path to board JSON (run-length encoded cells), relative to cwd
 * @param {string} [dimensionsFilePath] - Path to dimensions JSON; defaults to DEFAULT_DIMENSIONS_PATH
 * @returns {{ width: number, height: number, grid: string[][] }}
 * @throws {Error} If file missing, invalid JSON, invalid entity, or cell count mismatch.
 */
export function loadBoardFromFiles(boardFilePath, dimensionsFilePath = DEFAULT_DIMENSIONS_PATH) {
  const resolvedBoardPath = resolve(boardFilePath);
  const resolvedDimensionsPath = resolve(dimensionsFilePath);

  // check if the board file exists
  if (!existsSync(resolvedBoardPath)) {
    throw new Error(`Board file not found: ${boardFilePath}`);
  }

  // check if the dimensions file exists
  if (!existsSync(resolvedDimensionsPath)) {
    throw new Error(`Dimensions file not found: ${dimensionsFilePath}`);
  }

  const boardContent = readFileSync(resolvedBoardPath, 'utf-8');
  const dimensionsContent = readFileSync(resolvedDimensionsPath, 'utf-8');

  // parse the board file
  let boardArray;
  try {
    boardArray = JSON.parse(boardContent);
  } catch (err) {
    throw new Error(`Invalid JSON in board file: ${err.message}`);
  }
  if (!Array.isArray(boardArray)) {
    throw new Error('Board file must contain a JSON array');
  }

  // parse the dimensions file
  let config;
  try {
    config = JSON.parse(dimensionsContent);
  } catch (err) {
    throw new Error(`Invalid JSON in dimensions file: ${err.message}`);
  }
  if (config === null || typeof config !== 'object') {
    throw new Error('Dimensions file must contain a JSON object');
  }

  // validate the dimensions
  const width = config.width;
  const height = config.height;
  if (width === undefined) {
    throw new Error('Dimensions config is missing width');
  }
  if (height === undefined) {
    throw new Error('Dimensions config is missing height');
  }
  if (typeof width !== 'number' || typeof height !== 'number') {
    throw new Error('Dimensions config width and height must be numbers');
  }
  if (width < 1 || height < 1) {
    throw new Error('Dimensions config width and height must be at least 1');
  }

  const ENTITY_TO_CHAR = { 0: ' ', 1: '#', 2: ' ' };
  const cells = [];

  // decode the board
  for (let i = 0; i < boardArray.length; i++) {
    
    // validate the entry; is it a valid object with an entity property?
    const entry = boardArray[i];
    if (entry === null || typeof entry !== 'object') {
      throw new Error(`Invalid board entry at index ${i}: must be object with entity`);
    }

    // validate the entity; is it a supported entity value?
    const entity = entry.entity;
    if (entity !== 0 && entity !== 1 && entity !== 2) {
      throw new Error(`Unsupported entity value: ${entity}. Only 0, 1, 2 are valid.`);
    }

    // validate the repeat; is it a number and at least 1?
    let repeat = 1;
    if (entry.repeat !== undefined) {
      repeat = entry.repeat;
      if (typeof repeat !== 'number' || repeat < 1) {
        throw new Error(`Invalid repeat value: ${repeat}. Must be at least 1.`);
      }
    }

    // map the entity to a character
    const char = ENTITY_TO_CHAR[entity];
    for (let r = 0; r < repeat; r++) {
      cells.push(char);
    }
  }

  // validate the cell count; is it the same as the width and height?
  const expectedCells = width * height;
  if (cells.length !== expectedCells) {
    throw new Error(
      `Cell count mismatch: decoded ${cells.length} cells, but width×height is ${expectedCells}.`
    );
  }

  // create the grid
  const grid = [];
  for (let y = 0; y < height; y++) {
    grid.push(cells.slice(y * width, (y + 1) * width));
  }

  return { width, height, grid };
}

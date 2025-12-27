import { gameConfig } from '../config/gameConfig.js';
import { EMPTY_SPACE_CHAR, WALL_CHAR } from '../constants/gameConstants.js';
/**
 * Board class represents the game board as a grid
 */
export class Board {
  constructor() {
    this.width = gameConfig.board.width;
    this.height = gameConfig.board.height;
    this.grid = this._initializeGrid();
  }

  /**
   * Initialize the grid with outer walls and empty interior
   * @returns {string[][]} 2D array representing the board
   */
  _initializeGrid() {
    const grid = [];

    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        // Outer walls on all sides
        if (y === 0 || y === this.height - 1 || x === 0 || x === this.width - 1) {
          row.push(WALL_CHAR.char);
        } else {
          // Empty space in interior
          row.push(EMPTY_SPACE_CHAR.char);
        }
      }
      grid.push(row);
    }

    return grid;
  }

  /**
   * Get the content of a cell at the given position
   * @param {number} x - X coordinate (0-based)
   * @param {number} y - Y coordinate (0-based)
   * @returns {string|null} Cell content or null if invalid position
   */
  getCell(x, y) {
    if (!this.isValidPosition(x, y)) {
      return null;
    }
    return this.grid[y][x];
  }

  /**
   * Set the content of a cell at the given position
   * @param {number} x - X coordinate (0-based)
   * @param {number} y - Y coordinate (0-based)
   * @param {string} value - Value to set
   * @returns {boolean} True if successful, false if invalid position
   */
  setCell(x, y, value) {
    if (!this.isValidPosition(x, y)) {
      return false;
    }
    this.grid[y][x] = value;
    return true;
  }

  /**
   * Check if a position contains a wall
   * @param {number} x - X coordinate (0-based)
   * @param {number} y - Y coordinate (0-based)
   * @returns {boolean} True if position is a wall
   */
  isWall(x, y) {
    const cell = this.getCell(x, y);
    return cell === WALL_CHAR.char;
  }

  /**
   * Check if a position is within the board bounds
   * @param {number} x - X coordinate (0-based)
   * @param {number} y - Y coordinate (0-based)
   * @returns {boolean} True if position is valid
   */
  isValidPosition(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}


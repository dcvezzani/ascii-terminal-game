import { gameConfig } from '../config/gameConfig.js';
import { EMPTY_SPACE_CHAR, WALL_CHAR } from '../constants/gameConstants.js';
import { Cell } from './Cell.js';

/**
 * Board class represents the game board as a grid with cell queues
 */
export class Board {
  constructor() {
    this.width = gameConfig.board.width;
    this.height = gameConfig.board.height;
    this.grid = this._initializeGrid();
  }

  /**
   * Initialize the grid with outer walls and empty interior
   * Each cell is a Cell object with a queue
   * @returns {Cell[][]} 2D array of Cell objects
   */
  _initializeGrid() {
    const grid = [];

    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        // Outer walls on all sides
        if (y === 0 || y === this.height - 1 || x === 0 || x === this.width - 1) {
          row.push(new Cell(WALL_CHAR.char));
        } else {
          // Empty space in interior
          row.push(new Cell(EMPTY_SPACE_CHAR.char));
        }
      }
      grid.push(row);
    }

    return grid;
  }

  /**
   * Get the cell object at the given position
   * @param {number} x - X coordinate (0-based)
   * @param {number} y - Y coordinate (0-based)
   * @returns {Cell|null} Cell object or null if invalid position
   */
  getCell(x, y) {
    if (!this.isValidPosition(x, y)) {
      return null;
    }
    return this.grid[y][x];
  }

  /**
   * Get the base cell character (for backward compatibility)
   * @param {number} x - X coordinate (0-based)
   * @param {number} y - Y coordinate (0-based)
   * @returns {string|null} Base cell character or null if invalid position
   */
  getCellChar(x, y) {
    const cell = this.getCell(x, y);
    return cell ? cell.getBaseChar() : null;
  }

  /**
   * Set the base cell character (for backward compatibility)
   * @param {number} x - X coordinate (0-based)
   * @param {number} y - Y coordinate (0-based)
   * @param {string} value - Value to set
   * @returns {boolean} True if successful, false if invalid position
   */
  setCell(x, y, value) {
    if (!this.isValidPosition(x, y)) {
      return false;
    }
    this.grid[y][x].baseChar = value;
    return true;
  }

  /**
   * Add an entity to a cell's queue
   * Validates: only one solid entity per cell, multiple non-solid allowed
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} entity - Entity to add { char, color, id, solid }
   * @throws {Error} If validation fails (invalid position, solid entity conflict, etc.)
   */
  addEntity(x, y, entity) {
    if (!this.isValidPosition(x, y)) {
      throw new Error(`Invalid position for entity: (${x}, ${y})`);
    }

    if (this.isWall(x, y)) {
      throw new Error(`Cannot add entity to wall at position: (${x}, ${y})`);
    }

    const cell = this.getCell(x, y);
    if (!cell) {
      throw new Error(`Cell not found at position: (${x}, ${y})`);
    }

    cell.addEntity(entity);
  }

  /**
   * Remove an entity from a cell's queue by ID
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} id - ID of the entity to remove
   * @returns {boolean} True if entity was found and removed
   */
  removeEntity(x, y, id) {
    const cell = this.getCell(x, y);
    if (!cell) {
      return false;
    }
    return cell.removeEntity(id);
  }

  /**
   * Get what should be displayed at a cell (prioritized: solid entity > non-solid entity > base cell)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} { char, color } or null if invalid position
   */
  getDisplay(x, y) {
    const cell = this.getCell(x, y);
    if (!cell) {
      return null;
    }
    return cell.getDisplay();
  }

  /**
   * Check if a cell has a solid entity (for collision detection)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if cell has a solid entity
   */
  hasSolidEntity(x, y) {
    const cell = this.getCell(x, y);
    return cell ? cell.hasSolidEntity() : false;
  }

  /**
   * Check if a position contains a wall
   * @param {number} x - X coordinate (0-based)
   * @param {number} y - Y coordinate (0-based)
   * @returns {boolean} True if position is a wall
   */
  isWall(x, y) {
    const cell = this.getCell(x, y);
    return cell ? cell.getBaseChar() === WALL_CHAR.char : false;
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

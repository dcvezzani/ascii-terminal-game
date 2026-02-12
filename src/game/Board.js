/**
 * Board class representing the game board grid.
 * @param {{ width: number, height: number, grid?: string[][] }} boardData - Board data: width, height, and optional grid (when present, board is ready; when omitted, call initialize() or initializeFromGrid() after)
 */
export class Board {
  constructor(boardData) {
    const { width, height, grid } = boardData;
    this.width = width;
    this.height = height;
    this.grid = grid != null ? grid.map((row) => [...row]) : null;
  }

  /**
   * Initialize the board from a pre-decoded 2D grid (e.g. from JSON loader).
   * Caller must ensure grid dimensions match this.width and this.height.
   * @param {string[][]} grid - 2D array of characters (grid[y][x])
   */
  initializeFromGrid(grid) {
    this.grid = grid.map(row => [...row]);
  }

  /**
   * Initialize the board with walls on perimeter and empty interior
   */
  initialize() {
    this.grid = [];
    
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Set walls on perimeter (first row, last row, first column, last column)
        if (y === 0 || y === this.height - 1 || x === 0 || x === this.width - 1) {
          this.grid[y][x] = '#';
        } else {
          this.grid[y][x] = '.';
        }
      }
    }
  }

  /**
   * Get the character at the specified position
   * @param {number} x - X coordinate (0-based)
   * @param {number} y - Y coordinate (0-based)
   * @returns {string} Character at position
   */
  getCell(x, y) {
    if (!this.grid) {
      throw new Error('Board not initialized. Call initialize() first.');
    }
    return this.grid[y][x];
  }

  /**
   * Check if the cell at the specified position is a wall
   * @param {number} x - X coordinate (0-based)
   * @param {number} y - Y coordinate (0-based)
   * @returns {boolean} True if cell is a wall
   */
  isWall(x, y) {
    return this.getCell(x, y) === '#';
  }

  /**
   * Serialize the board to a 2D array of base characters
   * @returns {string[][]} 2D array of characters
   */
  serialize() {
    if (!this.grid) {
      throw new Error('Board not initialized. Call initialize() first.');
    }
    
    // Return a copy of the grid
    return this.grid.map(row => [...row]);
  }
}

// Default export
export default Board;

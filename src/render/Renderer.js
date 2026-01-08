import chalk from 'chalk';
import { cursorHide, cursorShow, eraseScreen, cursorTo } from 'ansi-escapes';
import hideCursor from 'cli-cursor';
import process from 'process';

/**
 * Renderer class for terminal rendering
 */
export class Renderer {
  constructor(config = null) {
    this.stdout = process.stdout;
    // Default rendering config
    this.config = config || {
      playerGlyph: '@',
      playerColor: '00FF00'
    };
  }

  /**
   * Clear the screen
   */
  clearScreen() {
    this.stdout.write(eraseScreen);
    this.stdout.write(cursorTo(1, 1));
  }

  /**
   * Render game title
   */
  renderTitle() {
    const title = '=== Multiplayer Terminal Game ===';
    this.stdout.write(chalk.bold.cyan(title) + '\n\n');
  }

  /**
   * Render the game board with players
   * @param {Board} board - Board instance
   * @param {Array} players - Array of player objects
   */
  renderBoard(board, players) {
    const serialized = board.serialize();
    
    for (let y = 0; y < serialized.length; y++) {
      let line = '';
      for (let x = 0; x < serialized[y].length; x++) {
        const cellContent = this.getCellContent(x, y, board, players);
        const colorFn = this.getColorFunction(cellContent.color);
        line += colorFn(cellContent.character);
      }
      this.stdout.write(line + '\n');
    }
  }

  /**
   * Render status bar
   * @param {number} score - Current score
   * @param {object} position - Position object {x, y}
   * @param {number} boardHeight - Height of the board (to position status bar below it)
   */
  renderStatusBar(score, position, boardHeight = 20) {
    // Position cursor below the board
    // Title is 2 lines (title + blank), board is boardHeight lines
    // So status bar should be at row: 2 (title) + boardHeight + 1 (1-indexed)
    const statusBarRow = 2 + boardHeight + 1;
    this.stdout.write(cursorTo(1, statusBarRow));
    
    const posStr = position ? `Position: (${position.x}, ${position.y})` : 'Position: (?, ?)';
    const status = `Score: ${score} | ${posStr} | Arrow keys/WASD to move, Q/ESC to quit`;
    this.stdout.write(chalk.gray(status));
  }

  /**
   * Hide terminal cursor
   */
  hideCursor() {
    hideCursor.hide();
  }

  /**
   * Show terminal cursor
   */
  showCursor() {
    hideCursor.show();
  }

  /**
   * Get cell content at position (player > board cell)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Board} board - Board instance
   * @param {Array} players - Array of player objects
   * @returns {object} Object with character and color
   */
  getCellContent(x, y, board, players) {
    // Check for player at position
    const player = players.find(p => p.x === x && p.y === y);
    if (player) {
      return {
        character: this.config.playerGlyph,
        color: this.config.playerColor
      };
    }

    // Return board cell
    const cellChar = board.getCell(x, y);
    let color = 'FFFFFF'; // White default
    
    if (cellChar === '#') {
      color = '808080'; // Gray for walls
    }

    return {
      character: cellChar,
      color
    };
  }

  /**
   * Get color function from hex color string
   * @param {string} hex - Hex color string (e.g., "FF0000")
   * @returns {Function} Chalk color function
   */
  getColorFunction(hex) {
    if (!hex) {
      return chalk.white;
    }

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return chalk.rgb(r, g, b);
  }

  /**
   * Update a single cell at the specified position
   * @param {number} x - X coordinate (0-indexed)
   * @param {number} y - Y coordinate (0-indexed)
   * @param {string} character - Character to render
   * @param {string} color - Hex color string (e.g., "FF0000")
   */
  updateCell(x, y, character, color) {
    // Handle out-of-bounds gracefully
    if (x < 0 || y < 0) {
      return;
    }

    // Calculate screen coordinates
    // Title is 2 lines (title + blank line), so offset is 2
    // ANSI escape codes are 1-indexed
    const screenX = x + 1;
    const screenY = y + 2 + 1; // +2 for title offset, +1 for 1-indexed

    // Position cursor
    this.stdout.write(cursorTo(screenX, screenY));
    
    // Write character with color
    const colorFn = this.getColorFunction(color);
    this.stdout.write(colorFn(character));
  }

  /**
   * Restore cell content at position (what was underneath)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Board} board - Board instance
   * @param {Array} players - Array of player objects
   * @param {Array} entities - Array of entity objects (for future use)
   */
  restoreCellContent(x, y, board, players, entities) {
    // Handle out-of-bounds gracefully
    if (x < 0 || y < 0) {
      return;
    }

    // Check for entities at position (future: top-most visible)
    // For MVP, entities array is empty, so skip

    // Check for other players at position
    const otherPlayer = players.find(p => p.x === x && p.y === y);
    if (otherPlayer) {
      this.updateCell(x, y, this.config.playerGlyph, this.config.playerColor);
      return;
    }

    // Fall back to board cell
    const cellChar = board.getCell(x, y);
    if (cellChar === null) {
      return; // Out of bounds
    }

    let color = 'FFFFFF'; // White default
    if (cellChar === '#') {
      color = '808080'; // Gray for walls
    }

    this.updateCell(x, y, cellChar, color);
  }

  /**
   * Render incremental updates based on state changes
   * @param {object} changes - Change detection object from compareStates
   * @param {Board} board - Board instance
   * @param {Array} players - Array of player objects (excluding local player)
   * @param {Array} entities - Array of entity objects (for future use)
   * @param {string} localPlayerId - ID of local player
   * @param {number} score - Current score
   * @param {object} position - Local player position {x, y}
   */
  renderIncremental(changes, board, players, entities, localPlayerId, score, position) {
    // Process moved players
    for (const moved of changes.players.moved) {
      // Clear old position
      this.restoreCellContent(
        moved.oldPos.x,
        moved.oldPos.y,
        board,
        players,
        entities
      );
      
      // Draw at new position
      this.updateCell(
        moved.newPos.x,
        moved.newPos.y,
        this.config.playerGlyph,
        this.config.playerColor
      );
    }

    // Process joined players
    for (const joined of changes.players.joined) {
      this.updateCell(
        joined.pos.x,
        joined.pos.y,
        this.config.playerGlyph,
        this.config.playerColor
      );
    }

    // Process left players
    for (const left of changes.players.left) {
      this.restoreCellContent(
        left.pos.x,
        left.pos.y,
        board,
        players,
        entities
      );
    }

    // Update status bar if score changed
    if (changes.scoreChanged) {
      this.renderStatusBar(score, position);
    }
  }
}

// Default export
export default Renderer;

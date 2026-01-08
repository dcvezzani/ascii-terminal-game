import chalk from 'chalk';
import { cursorHide, cursorShow, eraseScreen, cursorTo } from 'ansi-escapes';
import hideCursor from 'cli-cursor';
import process from 'process';

/**
 * Renderer class for terminal rendering
 */
export class Renderer {
  constructor() {
    this.stdout = process.stdout;
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
   */
  renderStatusBar(score, position) {
    const posStr = position ? `Position: (${position.x}, ${position.y})` : 'Position: (?, ?)';
    const status = `Score: ${score} | ${posStr} | Arrow keys/WASD to move, Q/ESC to quit`;
    this.stdout.write('\n' + chalk.gray(status) + '\n');
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
        character: '@',
        color: '00FF00' // Green
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
}

// Default export
export default Renderer;

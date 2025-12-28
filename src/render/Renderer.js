import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import cliCursor from 'cli-cursor';
import { getHorizontalCenter } from '../utils/terminal.js';
import { gameConfig } from '../config/gameConfig.js';
import { EMPTY_SPACE_CHAR, WALL_CHAR, PLAYER_CHAR } from '../constants/gameConstants.js';
/**
 * Renderer class handles all terminal rendering for the game
 */
export class Renderer {
  constructor() {
    this.titleOffset = gameConfig.renderer.titleOffset;
    this.boardOffset = gameConfig.renderer.boardOffset;
    this.statusBarOffset = gameConfig.renderer.statusBarOffset;
    this.boardWidth = gameConfig.board.width;
    this.boardHeight = gameConfig.board.height;
  }

  /**
   * Converts a hex color string to a chalk color function
   * @param {string|null} hexColor - Hex color string (e.g., "FF0000") or null
   * @returns {Function} Chalk color function, defaults to white if hexColor is null
   */
  getColorFunction(hexColor) {
    if (!hexColor) {
      return chalk.white;
    }
    // Chalk accepts hex with or without # prefix
    return chalk.hex(`#${hexColor}`);
  }

  /**
   * Initialize renderer - hide cursor and prepare terminal
   */
  initialize() {
    cliCursor.hide();
    process.stdout.write(ansiEscapes.cursorHide);
  }

  /**
   * Clear entire screen
   */
  clearScreen() {
    process.stdout.write(ansiEscapes.clearScreen);
    process.stdout.write(ansiEscapes.cursorTo(0, 0));
  }

  /**
   * Render title/header at top of screen
   */
  renderTitle() {
    const title = 'Terminal Game';
    const centerOffset = getHorizontalCenter(title.length);

    process.stdout.write(ansiEscapes.cursorTo(centerOffset, this.titleOffset));
    process.stdout.write(chalk.bold.cyan(title));
  }

  /**
   * Render the game board
   * @param {Board} board - Board instance
   * @param {number} playerX - Player X position
   * @param {number} playerY - Player Y position
   * @param {Array} [players] - Optional array of all players for multiplayer mode
   * @param {string} [localPlayerId] - Optional local player ID to highlight
   */
  renderBoard(board, playerX, playerY, players = null, localPlayerId = null) {
    const boardStartX = getHorizontalCenter(this.boardWidth);

    for (let y = 0; y < this.boardHeight; y++) {
      process.stdout.write(ansiEscapes.cursorTo(boardStartX, this.boardOffset + y));

      for (let x = 0; x < this.boardWidth; x++) {
        let glyph;

        // Check if any player is at this position
        let playerAtPosition = null;
        if (players && Array.isArray(players)) {
          playerAtPosition = players.find(p => p.x === x && p.y === y);
        }

        if (playerAtPosition) {
          // Player position (use local player position if no players array provided)
          glyph = PLAYER_CHAR;
        } else if (x === playerX && y === playerY && !players) {
          // Single player mode - use provided position
          glyph = PLAYER_CHAR;
        } else {
          const cell = board.getCell(x, y);
          if (cell === WALL_CHAR.char) {
            // Wall
            glyph = WALL_CHAR;
          } else {
            // Empty space
            glyph = EMPTY_SPACE_CHAR;
          }
        }

        const colorFn = this.getColorFunction(glyph.color);
        process.stdout.write(colorFn(glyph.char));
      }
    }
  }

  /**
   * Render status bar at bottom
   * @param {number} score - Current score
   * @param {number} x - Player X position
   * @param {number} y - Player Y position
   */
  renderStatusBar(score, x, y) {
    const statusText = `Score: ${score} | Position: (${x}, ${y}) | Controls: Arrow/WASD to move, Q/ESC to quit, R to restart, H/? for help`;
    const centerOffset = getHorizontalCenter(statusText.length);

    process.stdout.write(ansiEscapes.cursorTo(centerOffset, this.statusBarOffset));
    // Clear the line first to remove any trailing characters
    process.stdout.write(ansiEscapes.eraseEndLine);
    process.stdout.write(chalk.dim(statusText));
  }

  /**
   * Render complete game state (initial render)
   * @param {Game} game - Game instance
   */
  renderFull(game) {
    this.clearScreen();
    this.renderTitle();

    const position = game.getPlayerPosition();
    this.renderBoard(game.board, position.x, position.y);
    this.renderStatusBar(game.getScore(), position.x, position.y);

    // Move cursor out of the way
    process.stdout.write(ansiEscapes.cursorTo(0, this.statusBarOffset + 2));
  }

  /**
   * Update a single cell (for incremental updates)
   * @param {number} x - X coordinate on board
   * @param {number} y - Y coordinate on board
   * @param {string} char - Character to display
   * @param {Function} colorFn - Chalk color function
   */
  updateCell(x, y, char, colorFn) {
    const boardStartX = getHorizontalCenter(this.boardWidth);
    const screenX = boardStartX + x;
    const screenY = this.boardOffset + y;

    process.stdout.write(ansiEscapes.cursorTo(screenX, screenY));
    process.stdout.write(colorFn(char));
  }

  /**
   * Update player position (incremental update)
   * @param {number} oldX - Old player X position
   * @param {number} oldY - Old player Y position
   * @param {number} newX - New player X position
   * @param {number} newY - New player Y position
   * @param {Board} board - Board instance
   */
  updatePlayerPosition(oldX, oldY, newX, newY, board) {
    // Clear old position (restore cell content)
    const oldCell = board.getCell(oldX, oldY);
    const oldGlyph = oldCell === WALL_CHAR.char ? WALL_CHAR : EMPTY_SPACE_CHAR;
    const oldColorFn = this.getColorFunction(oldGlyph.color);
    const boardStartX = getHorizontalCenter(this.boardWidth);
    const oldScreenX = boardStartX + oldX;
    const oldScreenY = this.boardOffset + oldY;

    process.stdout.write(ansiEscapes.cursorTo(oldScreenX, oldScreenY));
    process.stdout.write(oldColorFn(oldGlyph.char));

    // Draw new position
    const newScreenX = boardStartX + newX;
    const newScreenY = this.boardOffset + newY;
    const playerColorFn = this.getColorFunction(PLAYER_CHAR.color);
    process.stdout.write(ansiEscapes.cursorTo(newScreenX, newScreenY));
    process.stdout.write(playerColorFn(PLAYER_CHAR.char));

    // Update status bar position
    this.renderStatusBar(0, newX, newY);

    // Move cursor out of the way to prevent scrolling
    process.stdout.write(ansiEscapes.cursorTo(0, this.statusBarOffset + 1));
  }

  /**
   * Render help screen
   */
  renderHelp() {
    this.clearScreen();

    const helpLines = [
      'Terminal Game - Help',
      '',
      'Movement:',
      '  Arrow Keys: ↑ ↓ ← →',
      '  WASD: W (up), S (down), A (left), D (right)',
      '',
      'Controls:',
      '  Q or ESC - Quit game',
      '  R - Restart game',
      '  H or ? - Show this help',
      '',
      'Press any key to return to game...',
    ];

    const centerOffset = getHorizontalCenter(Math.max(...helpLines.map(l => l.length)));
    const startRow = Math.floor((process.stdout.rows || 24) / 2) - Math.floor(helpLines.length / 2);

    helpLines.forEach((line, index) => {
      process.stdout.write(ansiEscapes.cursorTo(centerOffset, startRow + index));
      if (index === 0) {
        // Title
        process.stdout.write(chalk.bold.cyan(line));
      } else if (line.startsWith('  ')) {
        // Instructions
        process.stdout.write(chalk.white(line));
      } else if (line === '') {
        // Empty line
        process.stdout.write(line);
      } else {
        // Section headers
        process.stdout.write(chalk.yellow(line));
      }
    });

    // Move cursor out of the way
    process.stdout.write(ansiEscapes.cursorTo(0, startRow + helpLines.length + 1));
  }

  /**
   * Cleanup and restore terminal state
   */
  cleanup() {
    cliCursor.show();
    process.stdout.write(ansiEscapes.cursorShow);
    this.clearScreen();
    process.stdout.write(ansiEscapes.cursorTo(0, 0));
  }
}

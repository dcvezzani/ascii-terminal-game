import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import cliCursor from 'cli-cursor';
import { getHorizontalCenter } from '../utils/terminal.js';
import { gameConfig } from '../config/gameConfig.js';
import {
  EMPTY_SPACE_CHAR,
  WALL_CHAR,
  PLAYER_CHAR,
  toZZTCharacterGlyph,
  toColorHexValue,
} from '../constants/gameConstants.js';
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
   * @param {object} [networkState] - Optional network game state for multiplayer mode
   * @param {string} [localPlayerId] - Optional local player ID for multiplayer mode
   */
  renderFull(game, networkState = null, localPlayerId = null) {
    this.clearScreen();
    this.renderTitle();

    if (networkState) {
      // Networked mode - render from server state
      const board = {
        width: networkState.board.width,
        height: networkState.board.height,
        grid: networkState.board.grid,
        getCell: (x, y) => {
          if (
            y >= 0 &&
            y < networkState.board.grid.length &&
            x >= 0 &&
            x < networkState.board.grid[y].length
          ) {
            return networkState.board.grid[y][x];
          }
          return null;
        },
      };
      const localPlayer = networkState.players.find(p => p.playerId === localPlayerId);
      const playerX = localPlayer ? localPlayer.x : 0;
      const playerY = localPlayer ? localPlayer.y : 0;
      this.renderBoard(board, playerX, playerY, networkState.players, localPlayerId);
      this.renderStatusBar(networkState.score || 0, playerX, playerY);
    } else {
      // Local mode - render from game instance
      const position = game.getPlayerPosition();
      this.renderBoard(game.board, position.x, position.y);
      this.renderStatusBar(game.getScore(), position.x, position.y);
    }

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
   * Update players incrementally based on change detection
   * @param {Array} previousPlayers - Previous player array
   * @param {Array} currentPlayers - Current player array
   * @param {Object} board - Board instance or adapter with getCell method
   * @param {Object} changes - Change detection result from comparePlayers()
   */
  updatePlayersIncremental(previousPlayers, currentPlayers, board, changes) {
    // Handle moved players
    for (const moved of changes.moved) {
      // Clear old position (restore cell content from board)
      const oldCell = board.getCell(moved.oldX, moved.oldY);
      const oldGlyph = oldCell === WALL_CHAR.char ? WALL_CHAR : EMPTY_SPACE_CHAR;
      const oldColorFn = this.getColorFunction(oldGlyph.color);
      this.updateCell(moved.oldX, moved.oldY, oldGlyph.char, oldColorFn);

      // Draw player at new position
      const playerColorFn = this.getColorFunction(PLAYER_CHAR.color);
      this.updateCell(moved.newX, moved.newY, PLAYER_CHAR.char, playerColorFn);
    }

    // Handle joined players
    for (const joined of changes.joined) {
      const playerColorFn = this.getColorFunction(PLAYER_CHAR.color);
      this.updateCell(joined.x, joined.y, PLAYER_CHAR.char, playerColorFn);
    }

    // Handle left players
    for (const left of changes.left) {
      // Clear player position (restore cell content from board)
      const oldCell = board.getCell(left.x, left.y);
      const oldGlyph = oldCell === WALL_CHAR.char ? WALL_CHAR : EMPTY_SPACE_CHAR;
      const oldColorFn = this.getColorFunction(oldGlyph.color);
      this.updateCell(left.x, left.y, oldGlyph.char, oldColorFn);
    }

    // Move cursor out of the way to prevent it from being visible on screen
    process.stdout.write(ansiEscapes.cursorTo(0, this.statusBarOffset + 1));
  }

  /**
   * Get entity glyph - uses entity.glyph if provided, otherwise maps entityType
   * @param {Object} entity - Entity object
   * @returns {string} Character to render
   */
  getEntityGlyph(entity) {
    // If glyph is provided, use it directly
    if (entity.glyph) {
      return entity.glyph;
    }

    // Otherwise, try to map entityType using toZZTCharacterGlyph
    if (entity.entityType) {
      const glyph = toZZTCharacterGlyph(entity.entityType);
      if (glyph) {
        return glyph.char;
      }
    }

    // Fallback to empty space if no glyph found
    return EMPTY_SPACE_CHAR.char;
  }

  /**
   * Get entity color - uses entity.color if provided, otherwise defaults to white
   * @param {Object} entity - Entity object
   * @returns {string|null} Color hex value or null
   */
  getEntityColor(entity) {
    if (entity.color) {
      return toColorHexValue(entity.color);
    }
    return toColorHexValue('white');
  }

  /**
   * Update entities incrementally based on change detection
   * @param {Array} previousEntities - Previous entity array
   * @param {Array} currentEntities - Current entity array
   * @param {Object} board - Board instance or adapter with getCell method
   * @param {Object} changes - Change detection result from compareEntities()
   */
  updateEntitiesIncremental(previousEntities, currentEntities, board, changes) {
    // Handle moved entities
    for (const moved of changes.moved) {
      // Find entity in currentEntities to get glyph/color
      const entity = currentEntities.find(e => e.entityId === moved.entityId);
      if (!entity) continue;

      // Clear old position (restore cell content from board)
      const oldCell = board.getCell(moved.oldX, moved.oldY);
      const oldGlyph = oldCell === WALL_CHAR.char ? WALL_CHAR : EMPTY_SPACE_CHAR;
      const oldColorFn = this.getColorFunction(oldGlyph.color);
      this.updateCell(moved.oldX, moved.oldY, oldGlyph.char, oldColorFn);

      // Draw entity at new position
      const entityChar = this.getEntityGlyph(entity);
      const entityColor = this.getEntityColor(entity);
      const entityColorFn = this.getColorFunction(entityColor);
      this.updateCell(moved.newX, moved.newY, entityChar, entityColorFn);
    }

    // Handle spawned entities
    for (const spawned of changes.spawned) {
      // Find entity in currentEntities to get glyph/color
      const entity = currentEntities.find(e => e.entityId === spawned.entityId);
      if (!entity) continue;

      const entityChar = this.getEntityGlyph(entity);
      const entityColor = this.getEntityColor(entity);
      const entityColorFn = this.getColorFunction(entityColor);
      this.updateCell(spawned.x, spawned.y, entityChar, entityColorFn);
    }

    // Handle despawned entities
    for (const despawned of changes.despawned) {
      // Clear entity position (restore cell content from board)
      const oldCell = board.getCell(despawned.x, despawned.y);
      const oldGlyph = oldCell === WALL_CHAR.char ? WALL_CHAR : EMPTY_SPACE_CHAR;
      const oldColorFn = this.getColorFunction(oldGlyph.color);
      this.updateCell(despawned.x, despawned.y, oldGlyph.char, oldColorFn);
    }

    // Handle animated entities (glyph change at same position)
    for (const animated of changes.animated) {
      // Find entity in currentEntities to get new glyph/color
      const entity = currentEntities.find(e => e.entityId === animated.entityId);
      if (!entity) continue;

      const entityChar = this.getEntityGlyph(entity);
      const entityColor = this.getEntityColor(entity);
      const entityColorFn = this.getColorFunction(entityColor);
      this.updateCell(animated.x, animated.y, entityChar, entityColorFn);
    }

    // Move cursor out of the way to prevent it from being visible on screen
    process.stdout.write(ansiEscapes.cursorTo(0, this.statusBarOffset + 1));
  }

  /**
   * Update status bar only if score or position changed
   * @param {number} score - Current score
   * @param {number} x - Current player X position
   * @param {number} y - Current player Y position
   * @param {number} previousScore - Previous score
   * @param {number} previousX - Previous player X position
   * @param {number} previousY - Previous player Y position
   */
  updateStatusBarIfChanged(score, x, y, previousScore, previousX, previousY) {
    // Only update if score or position changed (per Q6: Option B)
    if (score !== previousScore || x !== previousX || y !== previousY) {
      this.renderStatusBar(score, x, y);
    }
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

import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import cliCursor from 'cli-cursor';
import { getHorizontalCenter, getTerminalSize } from '../utils/terminal.js';
import { gameConfig } from '../config/gameConfig.js';
import { Board } from '../game/Board.js';
import { ModalRenderer } from './ModalRenderer.js';
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
  constructor(modalManager = null) {
    this.titleOffset = gameConfig.renderer.titleOffset;
    this.boardOffset = gameConfig.renderer.boardOffset;
    this.statusBarOffset = gameConfig.renderer.statusBarOffset;
    this.boardWidth = gameConfig.board.width;
    this.boardHeight = gameConfig.board.height;
    this.modalManager = modalManager;
    this.modalRenderer = new ModalRenderer();
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
   * @param {Array} [entities] - Optional array of all entities
   */
  renderBoard(board, playerX, playerY, players = null, localPlayerId = null, entities = []) {
    const boardStartX = getHorizontalCenter(this.boardWidth);

    for (let y = 0; y < this.boardHeight; y++) {
      process.stdout.write(ansiEscapes.cursorTo(boardStartX, this.boardOffset + y));

      for (let x = 0; x < this.boardWidth; x++) {
        // Use getCellContent to determine what to render (player > entity > board cell)
        const content = this.getCellContent(x, y, board, entities, players || [], playerX, playerY);
        const colorFn = this.getColorFunction(content.color);
        process.stdout.write(colorFn(content.glyph.char));
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

    // Pre-allocate space for the status bar to ensure all trailing characters are cleared
    // Calculate maximum possible status text width (with largest position values)
    const maxStatusText = `Score: 999 | Position: (99, 99) | Controls: Arrow/WASD to move, Q/ESC to quit, R to restart, H/? for help`;
    const terminalWidth = getTerminalSize().columns;
    const preAllocWidth = Math.max(maxStatusText.length, terminalWidth);
    const preAllocSpaces = ' '.repeat(preAllocWidth);

    // Move to the status bar line and write spaces to clear/overwrite entire line
    process.stdout.write(ansiEscapes.cursorTo(0, this.statusBarOffset));
    process.stdout.write(preAllocSpaces);
    // Now move to center position and write the new text
    process.stdout.write(ansiEscapes.cursorTo(centerOffset, this.statusBarOffset));
    process.stdout.write(chalk.dim(statusText));
  }

  /**
   * Render complete game state (initial render)
   * @param {Game} game - Game instance
   * @param {object} [networkState] - Optional network game state for multiplayer mode
   * @param {string} [localPlayerId] - Optional local player ID for multiplayer mode
   */
  renderFull(game, networkState = null, localPlayerId = null) {
    // Hide cursor to prevent visual artifacts
    cliCursor.hide();
    
    this.clearScreen();
    this.renderTitle();

    if (networkState) {
      // Networked mode - render from server state
      const board = Board.fromSerialized(networkState.board);
      const localPlayer = networkState.players.find(p => p.playerId === localPlayerId);
      const playerX = localPlayer ? localPlayer.x : 0;
      const playerY = localPlayer ? localPlayer.y : 0;
      this.renderBoard(
        board,
        playerX,
        playerY,
        networkState.players,
        localPlayerId,
        networkState.entities || []
      );
      this.renderStatusBar(networkState.score || 0, playerX, playerY);
    } else {
      // Local mode - render from game instance
      const position = game.getPlayerPosition();
      this.renderBoard(game.board, position.x, position.y);
      this.renderStatusBar(game.getScore(), position.x, position.y);
    }

    // Render modal if one is open
    if (this.modalManager && this.modalManager.hasOpenModal()) {
      const modal = this.modalManager.getCurrentModal();
      this.renderModal(modal);
    }

    // Move cursor out of the way
    process.stdout.write(ansiEscapes.cursorTo(0, this.statusBarOffset + 2));
  }

  /**
   * Render a modal over the game board
   * @param {Modal} modal - Modal instance to render
   */
  renderModal(modal) {
    // Simple background dimming (not full shadow effect yet)
    this.dimBackground();
    // Render modal using ModalRenderer helper
    this.modalRenderer.renderModal(modal);
  }

  /**
   * Dim the background behind the modal
   * Renders a dimmed overlay over the entire screen to obscure the game board
   */
  dimBackground() {
    const terminalSize = getTerminalSize();
    // Render a dimmed overlay over the entire screen to hide game board
    // Use a dark gray character to create dimming effect
    const dimChar = '░'; // Light shade character for dimming
    
    for (let y = 0; y < terminalSize.rows; y++) {
      for (let x = 0; x < terminalSize.columns; x++) {
        process.stdout.write(ansiEscapes.cursorTo(x, y));
        process.stdout.write(chalk.dim(dimChar));
      }
    }
  }

  /**
   * Re-render just the modal (for when selection changes)
   * Uses incremental rendering to only update changed option lines
   * @param {Modal} modal - Modal instance to render
   */
  renderModalOnly(modal) {
    if (!modal) {
      return;
    }
    // Try incremental update first (only updates changed option lines)
    const updated = this.modalRenderer.updateSelectionOnly(modal);
    if (!updated) {
      // Fallback to full render if incremental update not possible
      // Re-render background dimming
      this.dimBackground();
      // Re-render modal (cursor will be hidden during rendering)
      this.modalRenderer.renderModal(modal);
    }
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
   * @param {Board|Object} board - Board instance (with getDisplay) or adapter
   * @param {Array} [entities] - Optional array of all entities (for board adapters)
   * @param {Array} [players] - Optional array of all players (for board adapters)
   */
  updatePlayerPosition(oldX, oldY, newX, newY, board, entities = [], players = []) {
    // Clear old position - use board.getDisplay if available (Board handles prioritization)
    let oldContent;
    if (board && typeof board.getDisplay === 'function') {
      const display = board.getDisplay(oldX, oldY);
      if (display) {
        oldContent = { glyph: { char: display.char }, color: display.color };
      } else {
        oldContent = { glyph: EMPTY_SPACE_CHAR, color: EMPTY_SPACE_CHAR.color };
      }
    } else {
      // Fallback for board adapters (networked mode)
      oldContent = this.getCellContent(oldX, oldY, board, entities, players);
    }

    const oldColorFn = this.getColorFunction(oldContent.color);
    const boardStartX = getHorizontalCenter(this.boardWidth);
    const oldScreenX = boardStartX + oldX;
    const oldScreenY = this.boardOffset + oldY;

    process.stdout.write(ansiEscapes.cursorTo(oldScreenX, oldScreenY));
    process.stdout.write(oldColorFn(oldContent.glyph.char));

    // Draw new position (player)
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
    // Hide cursor to prevent visual artifacts
    cliCursor.hide();
    
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
   * @param {Board|Object} board - Board instance (with getDisplay) or adapter with getCell method
   * @param {Object} changes - Change detection result from comparePlayers()
   * @param {Array} [entities] - Optional array of all entities (for board adapters)
   */
  updatePlayersIncremental(previousPlayers, currentPlayers, board, changes, entities = []) {
    // Handle moved players
    for (const moved of changes.moved) {
      // Clear old position - use board.getDisplay if available (Board handles prioritization)
      let oldContent;
      if (board && typeof board.getDisplay === 'function') {
        const display = board.getDisplay(moved.oldX, moved.oldY);
        if (display) {
          oldContent = { glyph: { char: display.char }, color: display.color };
        } else {
          oldContent = { glyph: EMPTY_SPACE_CHAR, color: EMPTY_SPACE_CHAR.color };
        }
      } else {
        // Fallback for board adapters (networked mode)
        const otherPlayers = currentPlayers.filter(p => p.playerId !== moved.playerId);
        oldContent = this.getCellContent(moved.oldX, moved.oldY, board, entities, otherPlayers);
      }
      const oldColorFn = this.getColorFunction(oldContent.color);
      this.updateCell(moved.oldX, moved.oldY, oldContent.glyph.char, oldColorFn);

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
      // Clear player position - use board.getDisplay if available (Board handles prioritization)
      let oldContent;
      if (board && typeof board.getDisplay === 'function') {
        const display = board.getDisplay(left.x, left.y);
        if (display) {
          oldContent = { glyph: { char: display.char }, color: display.color };
        } else {
          oldContent = { glyph: EMPTY_SPACE_CHAR, color: EMPTY_SPACE_CHAR.color };
        }
      } else {
        // Fallback for board adapters (networked mode)
        const otherPlayers = currentPlayers.filter(p => p.playerId !== left.playerId);
        oldContent = this.getCellContent(left.x, left.y, board, entities, otherPlayers);
      }
      const oldColorFn = this.getColorFunction(oldContent.color);
      this.updateCell(left.x, left.y, oldContent.glyph.char, oldColorFn);
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
   * Get the top-most visible entity at a position (not hidden by player)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} entities - Array of all entities
   * @param {Array} players - Array of all players (to check if position is occupied)
   * @returns {Object|null} Top-most visible entity or null
   */
  getTopVisibleEntityAt(x, y, entities = [], players = []) {
    // Check if a player is at this position - if so, no entity is visible
    const playerAtPosition = players.some(p => p.x === x && p.y === y);
    if (playerAtPosition) {
      return null; // Player is on top, entity not visible
    }

    // Find all entities at this position
    const entitiesAtPosition = entities.filter(e => e.x === x && e.y === y);
    if (entitiesAtPosition.length === 0) {
      return null;
    }

    // Sort by zOrder (higher = on top), default to 0 if not specified
    // If zOrder is same, use entityId for consistent ordering
    entitiesAtPosition.sort((a, b) => {
      const aZ = a.zOrder ?? a.priority ?? 0;
      const bZ = b.zOrder ?? b.priority ?? 0;
      if (aZ !== bZ) {
        return bZ - aZ; // Higher zOrder first
      }
      // If same zOrder, use entityId for stable sort
      return (a.entityId || '').localeCompare(b.entityId || '');
    });

    // Return the top-most entity
    return entitiesAtPosition[0];
  }

  /**
   * Get what should be rendered at a position (player > entity > board cell)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} board - Board instance with getCell method
   * @param {Array} entities - Array of all entities
   * @param {Array} players - Array of all players
   * @param {number} playerX - Single player X (for local mode)
   * @param {number} playerY - Single player Y (for local mode)
   * @returns {Object} { glyph: Glyph, color: string }
   */
  getCellContent(x, y, board, entities = [], players = [], playerX = null, playerY = null) {
    // Check for player at position (highest priority)
    const playerAtPosition = players.find(p => p.x === x && p.y === y);
    if (playerAtPosition || (playerX === x && playerY === y && !players.length)) {
      return { glyph: PLAYER_CHAR, color: PLAYER_CHAR.color };
    }

    // Check for entity at position
    const entity = this.getTopVisibleEntityAt(x, y, entities, players);
    if (entity) {
      const entityChar = this.getEntityGlyph(entity);
      const entityColor = this.getEntityColor(entity);
      return { glyph: { char: entityChar, color: entityColor }, color: entityColor };
    }

    // Fall back to board cell - use getDisplay to get what should be displayed
    const display = board.getDisplay(x, y);
    if (display) {
      // Convert color hex to the format expected (or use directly if already correct)
      return { glyph: { char: display.char, color: display.color }, color: display.color };
    }
    // Fallback if getDisplay returns null
    return { glyph: EMPTY_SPACE_CHAR, color: EMPTY_SPACE_CHAR.color };
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

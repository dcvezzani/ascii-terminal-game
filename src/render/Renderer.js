import chalk from 'chalk';
import { cursorHide, cursorShow, eraseScreen, cursorTo, eraseEndLine } from 'ansi-escapes';
import hideCursor from 'cli-cursor';
import process from 'process';
import {
  wrapAtSpaces,
  buildLine1,
  buildLine2,
  buildSimplifiedLine,
  formatBoxTopBottom,
  formatBoxRow
} from './statusBarUtils.js';
import { truncateTitleToWidth, BLANK_LINES_BEFORE_STATUS_BAR } from './layout.js';

const TITLE_HEIGHT = 2;

/**
 * Renderer class for terminal rendering
 */
export class Renderer {
  constructor(config = null) {
    this.stdout = process.stdout;
    // Default rendering config
    this.config = config || {
      playerGlyph: '☻',
      playerColor: '00FF00',
      spaceGlyph: '.',
      wallGlyph: '#'
    };
    this._lastStatusBarContent = null;
    this._lastStatusBarBoardWidth = null;
    this._lastStatusBarBoardHeight = null;
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
   * @param {string} [titleString] - Title text (default: '=== Multiplayer Terminal Game ===')
   * @param {object} [layout] - Optional layout { startRow, startColumn }; when provided, draw at position with 60-char truncation
   */
  renderTitle(titleString, layout) {
    const title = titleString ?? '=== Multiplayer Terminal Game ===';
    if (layout) {
      this.stdout.write(cursorTo(layout.startColumn, layout.startRow));
      this.stdout.write(chalk.bold.cyan(truncateTitleToWidth(title, 60)));
    } else {
      this.stdout.write(chalk.bold.cyan(title) + '\n\n');
    }
  }

  /**
   * Render the game board with players
   * @param {Board} board - Board instance
   * @param {Array} players - Array of player objects
   * @param {object} [layout] - Optional layout { startRow, boardStartColumn }; when provided, draw each row at position
   */
  renderBoard(board, players, layout) {
    const serialized = board.serialize();

    for (let y = 0; y < serialized.length; y++) {
      let line = '';
      for (let x = 0; x < serialized[y].length; x++) {
        const cellContent = this.getCellContent(x, y, board, players);
        const colorFn = this.getColorFunction(cellContent.color);
        line += colorFn(cellContent.character);
      }
      if (layout) {
        this.stdout.write(cursorTo(layout.boardStartColumn, layout.startRow + TITLE_HEIGHT + y));
      }
      this.stdout.write(line + '\n');
    }
  }

  /**
   * Render status bar in a box (top/bottom # border, content lines "# content #").
   * Two-line full or one-line simplified by board width. Redraws when content or layout changes.
   * @param {number} score - Current score
   * @param {object} position - Position object {x, y} or null
   * @param {number} boardWidth - Board width (for format selection and box width)
   * @param {number} boardHeight - Board height (for vertical positioning)
   * @param {object} [layout] - Optional layout { startRow, startColumn }; when provided, use position and box width 60
   */
  renderStatusBar(score, position, boardWidth = 80, boardHeight = 20, layout) {
    const effectiveWidth = layout ? 60 : boardWidth;
    const threshold = this.config?.statusBar?.widthThreshold ?? 25;
    const fullFormat = effectiveWidth > threshold;
    const contentWidth = Math.max(1, effectiveWidth - 4);

    let logicalContents;
    let segments1;
    let segments2;

    if (fullFormat) {
      const line1Str = buildLine1(score, position);
      const line2Str = buildLine2();
      segments1 = wrapAtSpaces(line1Str, contentWidth);
      segments2 = wrapAtSpaces(line2Str, contentWidth);
      logicalContents = [line1Str, line2Str];
    } else {
      const lineStr = buildSimplifiedLine(score, position);
      segments1 = wrapAtSpaces(lineStr, contentWidth);
      segments2 = [];
      logicalContents = [lineStr];
    }

    const topBorder = formatBoxTopBottom(effectiveWidth);
    const bottomBorder = formatBoxTopBottom(effectiveWidth);
    const boxedRows = [
      topBorder,
      ...segments1.map(s => formatBoxRow(s, effectiveWidth)),
      ...segments2.map(s => formatBoxRow(s, effectiveWidth)),
      bottomBorder
    ];

    const layoutChanged =
      this._lastStatusBarBoardWidth !== effectiveWidth ||
      this._lastStatusBarBoardHeight !== boardHeight;
    const contentChanged =
      !this._lastStatusBarContent ||
      this._lastStatusBarContent.length !== logicalContents.length ||
      logicalContents.some((c, i) => this._lastStatusBarContent[i] !== c);
    const contentShortened =
      this._lastStatusBarContent &&
      logicalContents.some(
        (c, i) =>
          this._lastStatusBarContent[i] != null &&
          c.length < this._lastStatusBarContent[i].length
      );
    const needUpdate =
      layoutChanged || contentChanged || contentShortened;

    if (needUpdate) {
      const statusBarStartRow = layout
        ? layout.startRow + TITLE_HEIGHT + boardHeight + BLANK_LINES_BEFORE_STATUS_BAR
        : 2 + boardHeight + 1;
      const statusBarStartCol = layout ? layout.startColumn : 0;
      for (let r = 0; r < boxedRows.length; r++) {
        this.stdout.write(cursorTo(statusBarStartCol, statusBarStartRow + r));
        this.stdout.write(chalk.gray(boxedRows[r]));
        this.stdout.write(eraseEndLine);
      }
      const lastRowCount = this._lastStatusBarRowCount ?? 0;
      if (lastRowCount > boxedRows.length) {
        for (let r = boxedRows.length; r < lastRowCount; r++) {
          this.stdout.write(cursorTo(statusBarStartCol, statusBarStartRow + r));
          this.stdout.write(eraseEndLine);
        }
      }
    }

    this._lastStatusBarContent = logicalContents.slice();
    this._lastStatusBarRowCount = boxedRows.length;
    this._lastStatusBarBoardWidth = effectiveWidth;
    this._lastStatusBarBoardHeight = boardHeight;
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
    let character = cellChar;
    let color = 'FFFFFF'; // White default
    
    // Map server characters to configured glyphs
    if (cellChar === '#') {
      character = this.config.wallGlyph || '#';
      color = '808080'; // Gray for walls
    } else if (cellChar === '.') {
      character = this.config.spaceGlyph || '.';
    }

    return {
      character,
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
    const screenX = x;
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

    let character = cellChar;
    let color = 'FFFFFF'; // White default
    
    // Map server characters to configured glyphs
    if (cellChar === '#') {
      character = this.config.wallGlyph || '#';
      color = '808080'; // Gray for walls
    } else if (cellChar === '.') {
      character = this.config.spaceGlyph || '.';
    }

    this.updateCell(x, y, character, color);
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
      // Safeguard: Skip local player (should be filtered out, but double-check)
      if (moved.playerId === localPlayerId) {
        continue;
      }
      
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
      // Safeguard: Skip local player (should be filtered out, but double-check)
      if (joined.playerId === localPlayerId) {
        continue;
      }
      
      this.updateCell(
        joined.pos.x,
        joined.pos.y,
        this.config.playerGlyph,
        this.config.playerColor
      );
    }

    // Process left players
    for (const left of changes.players.left) {
      // Safeguard: Skip local player (should be filtered out, but double-check)
      if (left.playerId === localPlayerId) {
        continue;
      }
      
      this.restoreCellContent(
        left.pos.x,
        left.pos.y,
        board,
        players,
        entities
      );
    }

    // Update status bar if score changed (position changes are handled by caller, which also calls renderStatusBar)
    if (changes.scoreChanged) {
      const boardWidth = board.width ?? 80;
      const boardHeight = board.height ?? 20;
      this.renderStatusBar(score, position, boardWidth, boardHeight);
    }
  }
}

// Default export
export default Renderer;

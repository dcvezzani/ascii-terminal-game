import process from 'process';
import {
    wrapAtSpaces,
    buildLine1,
    buildLine2,
    buildSimplifiedLine,
    formatBoxTopBottom,
    formatBoxRow
} from './statusBarUtils.js';
import { truncateTitleToWidth, BLANK_LINES_BEFORE_STATUS_BAR, TITLE_AND_STATUS_BAR_WIDTH } from './layout.js';

const TITLE_HEIGHT = 2;

/**
 * Renderer class for terminal rendering
 */
export class Canvas {
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

        this.grid = null; // Grid of entities
        this.emptyGrid = null;
        this.logger = config?.logger ?? null;
        this._statusBarStartRow = null;
    }

    /** Default cell when clearing (space, white) */
    static _BLANK_CELL = Object.freeze({ character: ' ', color: 'FFFFFF' });

    /**
     * Clear the screen by filling this.grid with spaces. No-op if grid is null/empty.
     * Does not write to the terminal.
     */
    clearScreen() {
        if (!this.grid || this.grid.length === 0) {
            return;
        }
        for (let y = 0; y < this.grid.length; y++) {
            const row = this.grid[y];
            if (!row) continue;
            for (let x = 0; x < row.length; x++) {
                this.grid[y][x] = { ...Canvas._BLANK_CELL };
            }
        }
    }

    emptyCopy() {
        if (this.emptyGrid) return this.emptyGrid;

        const height = this.grid?.length ?? 0;
        const width = height > 0 ? this.grid[0].length : 0;
        this.emptyGrid = [];

        for (let y = 0; y < height; y++) {
            this.emptyGrid[y] = [];
            for (let x = 0; x < width; x++) {
                this.emptyGrid[y][x] = { ...Canvas._BLANK_CELL };
            }
        }
        return this.emptyGrid;
    }    

    /**
     * Clear a content region in this.grid by overwriting with spaces (1-based row/column).
     * No-op if region is null/undefined or grid is null. Does not write to the terminal.
     * @param {{ startRow: number, startColumn: number, rows: number, columns: number } | null} region
     */
    clearContentRegion(region) {
        if (!region || region.rows < 1 || region.columns < 1 || !this.grid) {
            return;
        }
        const { startRow, startColumn, rows, columns } = region;
        const baseRow = startRow - 1;
        const baseCol = startColumn - 1;
        for (let r = 0; r < rows; r++) {
            const row = baseRow + r;
            if (row < 0 || row >= this.grid.length) continue;
            const gridRow = this.grid[row];
            if (!gridRow) continue;
            for (let c = 0; c < columns; c++) {
                const col = baseCol + c;
                if (col >= 0 && col < gridRow.length) {
                    gridRow[col] = { ...Canvas._BLANK_CELL };
                }
            }
        }
    }

    /** Hex color for title (cyan) when stored in grid */
    static TITLE_COLOR = '00FFFF';

    /** Hex color for status bar (gray) when stored in grid */
    static STATUS_BAR_COLOR = '808080';

    /**
     * Render game title into this.grid (row 0 = title, row 1 = blank).
     * Does not write to the terminal. Uses 60-char truncation when layout is provided.
     * @param {string} [titleString] - Title text (default: '=== Multiplayer Terminal Game ===')
     * @param {object} [layout] - Optional layout { startRow, startColumn }; when provided, title truncated to 60 chars
     */
    renderTitle(titleString, layout) {
        const raw = titleString ?? '=== Multiplayer Terminal Game ===';
        const title = layout
            ? truncateTitleToWidth(raw, TITLE_AND_STATUS_BAR_WIDTH)
            : raw;
        const width = Math.max(TITLE_AND_STATUS_BAR_WIDTH, title.length);
        const startCol = Math.max(0, Math.floor((width - title.length) / 2));
        const titleRow = [];
        for (let i = 0; i < width; i++) {
            const inTitle = i >= startCol && i < startCol + title.length;
            titleRow.push({
                character: inTitle ? title[i - startCol] : ' ',
                color: Canvas.TITLE_COLOR
            });
        }
        const blankRow = Array.from({ length: width }, () => ({
            character: ' ',
            color: 'FFFFFF'
        }));
        const titleRows = [titleRow, blankRow];
        this._boardOffset = 2;
        this.grid = this.grid && this.grid.length >= 2
            ? [...titleRows, ...this.grid.slice(2)]
            : titleRows;
    }

    /**
     * Render the game board with players into this.grid (2D array of { character, color }).
     * Does not write to the terminal.
     * @param {Board} board - Board instance
     * @param {Array} players - Array of player objects
     * @param {object} [layout] - Optional layout { startRow, boardStartColumn }; stored for incremental updates
     */
    renderBoard(board, players, layout) {
        this._currentLayout = layout || null;
        const serialized = board.serialize();
        const height = serialized.length;
        const width = height > 0 ? serialized[0].length : 0;

        const titleRows =
            this.grid && this.grid.length >= 2 ? this.grid.slice(0, 2) : [];
        const boardRows = [];
        for (let y = 0; y < height; y++) {
            boardRows[y] = [];
            for (let x = 0; x < width; x++) {
                const cellContent = this.getCellContent(x, y, board, players);
                boardRows[y][x] = {
                    character: cellContent.character,
                    color: cellContent.color
                };
            }
        }
        this._boardOffset = titleRows.length;
        this.grid = [...titleRows, ...boardRows];
    }

    /**
     * Render status bar into this.grid (box with top/bottom border and content lines).
     * Does not write to the terminal. Appends or replaces status bar rows at the end of this.grid.
     * @param {number} score - Current score
     * @param {object} position - Position object {x, y} or null
     * @param {number} boardWidth - Board width (for format selection and box width)
     * @param {number} boardHeight - Board height (for vertical positioning)
     * @param {object} [layout] - Optional layout { startRow, startColumn }; when provided, use box width 60
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

        const gray = Canvas.STATUS_BAR_COLOR;
        const statusBarRows = boxedRows.map((line) =>
            line.split('').map((c) => ({ character: c, color: gray }))
        );

        if (!this.grid) return false;

        if (this._statusBarStartRow !== null) {
            this.grid = this.grid.slice(0, this._statusBarStartRow)
        } else {
            this._statusBarStartRow = this.grid.length
        }

        this.grid.push(...statusBarRows);

        this._lastStatusBarContent = logicalContents.slice();
        this._lastStatusBarRowCount = boxedRows.length;
        this._lastStatusBarBoardWidth = effectiveWidth;
        this._lastStatusBarBoardHeight = boardHeight;
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
     * Update a single cell at the specified position in this.grid.
     * Does not write to the terminal.
     * @param {number} x - X coordinate (0-indexed)
     * @param {number} y - Y coordinate (0-indexed)
     * @param {string} character - Character to render
     * @param {string} color - Hex color string (e.g., "FF0000")
     */
    updateCell(x, y, character, color) {
        const offset = this._boardOffset ?? 0;
        if (x < 0 || y < 0 || !this.grid || this.grid.length <= offset || !this.grid[offset]) {
            return;
        }
        const row = offset + y;
        if (row >= this.grid.length || x >= this.grid[offset].length) {
            return;
        }
        this.grid[row][x] = { character, color };
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

    /**
     * Maximum number of changes to allow for incremental render
     */
    static MAX_DIFF_COUNT = 10;

    /**
     * Compare the grid of the two canvases; return diff count (force full render if invalid)
     * @param {import('./Canvas.js').default} canvasPrevious
     * @param {import('./Canvas.js').default} canvasCurrent
     * @returns {number}
     */
    compareStates(canvasPrevious, canvasCurrent) {
        try {
            // compare the grid of the two canvases; return diff count (force full render if invalid)
            if (!canvasPrevious?.grid || !canvasCurrent?.grid) {
                return Canvas.MAX_DIFF_COUNT + 1;
            }
            if (canvasPrevious.grid.length !== canvasCurrent.grid.length) {
                return Canvas.MAX_DIFF_COUNT + 1;
            }

            let diffCount = 0;
            for (let y = 0; y < canvasPrevious.grid.length; y++) {
                const rowPrevious = canvasPrevious.grid[y];
                const rowCurrent = canvasCurrent.grid[y];
                if (rowPrevious.length !== rowCurrent.length) {
                    diffCount++;
                }
                for (let x = 0; x < rowPrevious.length; x++) {
                    const cellPrevious = rowPrevious[x];
                    const cellCurrent = rowCurrent[x];
                    if (cellPrevious.character !== cellCurrent.character || cellPrevious.color !== cellCurrent.color) {
                        diffCount++;
                    }
                }
            }
            return diffCount;
        } catch (error) {
            console.warn('Error during compareStates:', error);
            return Canvas.MAX_DIFF_COUNT + 1;
        }
    }

    /**
     * Check if the two canvases have little to no changes
     * @param {import('./Canvas.js').default} canvasPrevious
     * @param {import('./Canvas.js').default} canvasCurrent
     * @returns {boolean}
     */
    hasFewChanges(canvasPrevious, canvasCurrent) {
        const totalChanges = this.compareStates(canvasPrevious, canvasCurrent);
        return (totalChanges <= Canvas.MAX_DIFF_COUNT);
    }

    /**
     * Check if the two canvases have no changes
     * @param {import('./Canvas.js').default} canvasPrevious
     * @param {import('./Canvas.js').default} canvasCurrent
     * @returns {boolean}
     */
    hasNoChanges(canvasPrevious, canvasCurrent) {
        return this.compareStates(canvasPrevious, canvasCurrent) === 0;
    }    
}

export default Canvas;

export class Message {
    /** Two-line message per spec §3.5 */
    static TERMINAL_TOO_SMALL_LINE1 = 'terminal is too small';
    static TERMINAL_TOO_SMALL_LINE2 = 'please resize';

    /** Hex color for terminal-too-small message (yellow) when stored in grid */
    static TERMINAL_TOO_SMALL_COLOR = 'FFFF00';

    /**
     * Render the terminal-too-small message into this.grid (two lines, centered).
     * Does not write to the terminal. Grid size is terminalRows x terminalColumns.
     * @param {number} terminalColumns - Current terminal columns
     * @param {number} terminalRows - Current terminal rows
     */
    static apply(canvas, options = {}) {
        const { terminalColumns, terminalRows } = options;

        const line1 = Message.TERMINAL_TOO_SMALL_LINE1;
        const line2 = Message.TERMINAL_TOO_SMALL_LINE2;
        const cols = Math.max(1, terminalColumns);
        const rows = Math.max(1, terminalRows);
        const startCol1 = Math.max(0, Math.floor((cols - line1.length) / 2));
        const startCol2 = Math.max(0, Math.floor((cols - line2.length) / 2));
        const midRow = Math.max(1, Math.floor(rows / 2));
        const row1 = midRow - 1;
        const row2 = midRow;

        const emptyCell = () => ({ character: ' ', color: 'FFFFFF' });
        canvas.grid = [];
        for (let y = 0; y < rows; y++) {
            canvas.grid[y] = Array.from({ length: cols }, emptyCell);
        }
        const yellow = Message.TERMINAL_TOO_SMALL_COLOR;
        for (let i = 0; i < line1.length && startCol1 + i < cols; i++) {
            canvas.grid[row1][startCol1 + i] = { character: line1[i], color: yellow };
        }
        for (let i = 0; i < line2.length && startCol2 + i < cols; i++) {
            canvas.grid[row2][startCol2 + i] = { character: line2[i], color: yellow };
        }
        canvas._boardOffset = null;
    }
}

export default Message;
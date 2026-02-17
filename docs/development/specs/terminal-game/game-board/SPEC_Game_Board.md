# Spec: Game Board (Display)

## Purpose

The **Game Board** spec defines how the playable grid is **displayed** in the terminal: its position, dimensions, cell characters, and how players and board cells are combined for rendering. Board **data** (layout, parsing, RLE) is defined in [Board Parsing](../board-parsing/SPEC_Board_Parsing.md); this spec covers the visual representation and layout placement.

**Consolidated from:** center-board-in-terminal_SPECS.md (board position), terminal-rendering (content dimensions), reduce-screen-flicker (cell content, incremental cell updates).

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| Board position (from Canvas: startRow + titleHeight, boardStartColumn) | Board data source and parsing (Board Parsing spec) |
| Board dimensions (width × height in cells) | Layout computation (Canvas spec) |
| Cell characters: empty `' '`, wall `'#'`, spawn (displayed as space) | Actual ANSI/cursor calls (Renderer spec) |
| Drawing order: board cells; players drawn on top per Renderer | Game logic (movement, collision) |

---

## 2. Layout (contract)

- **First row:** `startRow + titleHeight` (1-based).
- **Start column:** `boardStartColumn` (from Canvas; centers board in 60-char strip when board width < 60).
- **Dimensions:** Each row has `boardWidth` characters; there are `boardHeight` rows.
- **Coordinate convention:** Board cells are (x, y); renderer maps to terminal row/col using layout and 1-based cursor positioning.

---

## 3. Cell content

### 3.1 Base characters (from board)

- Empty: `' '` (space).
- Wall: `'#'`.
- Spawn: displayed as `' '` (same as empty).

### 3.2 Layering

- **Board** is the base layer. **Players** (and optionally entities) are drawn on top; priority is defined in [Renderer](../renderer/SPEC_Renderer.md) (player → entity → board cell).

---

## 4. Rendering

- **Full render:** For each row y in [0, boardHeight), move cursor to (boardStartColumn, startRow + titleHeight + y) and write each cell (or use batch positioning). Use colors (e.g. chalk) per cell type (wall gray, space white, player green).
- **Incremental:** Only cells that changed (e.g. player moved, joined, left) are updated; see [Renderer](../renderer/SPEC_Renderer.md). When clearing a cell, restore board cell or other player at that position.

---

## 5. Success criteria

- [ ] Board is drawn at the position and dimensions given by Canvas.
- [ ] Cell characters match board data (space, #, spawn as space).
- [ ] Players (and entities) render on top of board cells; restoration order correct.

---

## 6. Related specs

| Spec | Relation |
|------|----------|
| [Canvas](../canvas/SPEC_Canvas.md) | Provides boardStartColumn, startRow, titleHeight; board width/height are layout inputs. |
| [Renderer](../renderer/SPEC_Renderer.md) | Performs full and incremental board drawing; cell content resolution. |
| [Board Parsing](../board-parsing/SPEC_Board_Parsing.md) | Source of board grid and dimensions. |
| [Overall](../SPEC_Overall.md) | How Game Board fits in the terminal game stack. |

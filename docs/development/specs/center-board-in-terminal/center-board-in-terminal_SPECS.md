# Specification: Center Game Board in Terminal

## Overview

This specification defines centering the game block (title + board + status bar) in the terminal window, with a fixed width of 60 characters for the title and status bar, configurable layout options, and resize handling that keeps the display empty during resize and re-renders when resizing finishes. When the terminal is too small, a single message is shown instead of the game.

**Purpose:** Improve layout and UX by centering the game in the terminal and adapting to terminal size changes without drawing a broken or misaligned display.

## Problem Statement

**Current behavior:**
- The game board and status bar are drawn starting at row 1 (after the title) and column 1 (left edge). There is no horizontal or vertical centering.
- Terminal size is available via `getTerminalSize()` but is not used for layout positioning.
- When the user resizes the terminal, the board does not re-center; the layout can look misaligned or cramped.

**Impact:** Game appears small and off to the side on large terminals; resize does not adapt; no consistent “too small” behavior.

## Solution Summary

1. **Center the entire block:** The whole game block (title + board + status bar) is centered as one unit horizontally and vertically. Title and status bar share the same start column as the board; the block is one aligned rectangle.
2. **Fixed widths:** Title and status bar are **60 characters** wide regardless of board width. Title is configurable (server config); if longer than 60, truncate and append ellipses. Status bar uses the same 60-character box format.
3. **Block width and board offset:** Block width for centering is `max(60, boardWidth)`. When `boardWidth < 60`, the board is centered within the 60-character strip (offset from block start). When `boardWidth >= 60`, the board starts at the same column as the block.
4. **Resize:** Listen for terminal resize (TTY only). **Debounce** (configurable, default 200 ms). **While resizing:** clear screen and do not render. **When resize finished:** full re-render with new layout.
5. **Terminal too small:** Reuse existing minimum from `src/utils/terminal.js`. If terminal width or rows are below the required minimum: do not render title, board, or status bar; show only a single message (width message or “terminal too small” as below).
6. **Config:** Client config: `rendering.centerBoard` (default true), `rendering.resizeDebounceMs` (default 200). Server config: title string. No padding/margin configurability.

---

## Data Model and Configuration

### Constants

| Name | Value | Description |
|------|--------|-------------|
| `TITLE_AND_STATUS_BAR_WIDTH` | 60 | Fixed character width for title line and status bar box. |
| `TITLE_MAX_LENGTH` | 60 | Title string is truncated to this length (with ellipses) when longer. |
| `BLANK_LINES_AFTER_TITLE` | 1 | Number of blank lines between title line and board. |
| `BLANK_LINES_BEFORE_STATUS_BAR` | 1 | Number of blank lines between last board row and first status bar line (layout contract). |

### Client config (layout and resize)

Config is read from `config/clientConfig.js` (which loads `config/clientConfig.json`). The following keys are used. If missing, defaults apply.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `rendering.centerBoard` | boolean | true | When true, center the game block in the terminal. When false, use top-left placement (current behavior). |
| `rendering.resizeDebounceMs` | number | 200 | Debounce duration in milliseconds for terminal resize. While debounce is active, the display is cleared and not re-rendered; when the debounce fires, a full re-render is performed. |

**Placement:** Under the existing `rendering` object (or equivalent) in client config. Example:

```json
{
  "rendering": {
    "centerBoard": true,
    "resizeDebounceMs": 200
  }
}
```

Default in code when keys are absent: `centerBoard === true`, `resizeDebounceMs === 200`.

### Server config (title)

The **title string** displayed above the board is **configurable in server config**. The client may receive it from the server (e.g. in CONNECT or game state) or from a local default when not in networked mode. If the title is longer than 60 characters, the client **truncates** it to 60 characters and appends ellipses (`...`) so the displayed title length is at most 60. Truncation is client-side at render time.

(Exact server config key name is left to implementation; e.g. `game.title` or `server.title`. When the server does not send a title, the client uses a default, e.g. `"=== Multiplayer Terminal Game ==="`.)

### Minimum terminal size

- **Reuse** the existing mechanism from `src/utils/terminal.js`: `getTerminalSize()` and `checkTerminalSize(minWidth, minHeight)`.
- **Required minimum columns:** `minColumns = max(60, boardWidth)` (same as block width). For “too narrow” messaging we require at least 60 so the block can be drawn.
- **Required minimum rows:** `minRows = titleHeight + boardHeight + blankBeforeStatusBar + statusBarHeight`.
  - `titleHeight = 1 + BLANK_LINES_AFTER_TITLE` (e.g. 2: one title line + one blank).
  - `statusBarHeight` = number of lines used by the status bar box (top border + content lines + bottom border), which depends on content and wrap; use the same height as computed for layout.
- When `terminal.columns < minColumns` or `terminal.rows < minRows`, the client does **not** draw the game block and instead shows only the appropriate message (see below).

### Messages (terminal too small)

| Condition | Message |
|-----------|---------|
| Terminal **width** too narrow (columns &lt; minColumns, with minColumns ≥ 60) | *"Please increase the width of your terminal window in order to play this game."* |
| Terminal **rows** too small | A single “terminal too small” message; exact text may match existing `checkTerminalSize` warning or a short phrase such as *"Terminal too small; please resize."* |

Only one message is shown at a time (e.g. if both dimensions are too small, prefer showing the width message when width &lt; 60, otherwise the rows message). Implementation may choose which message takes precedence.

---

## Layout Formulas

All coordinates are **1-based** (row 1 is the first row, column 1 is the first column), consistent with ANSI cursor positioning.

### Inputs

- `terminalColumns`, `terminalRows`: from `getTerminalSize()`.
- `boardWidth`, `boardHeight`: board dimensions in characters (cells).
- `titleHeight`: number of lines used by the title block (title line + blank line(s) after). **Fixed at 2** for MVP (one title line + one blank).
- `statusBarHeight`: number of lines used by the status bar box (top border + content lines + bottom border). Computed from status bar content and 60-char width (wrap, etc.).

### Block dimensions

- **Block width:** `blockWidth = Math.max(60, boardWidth)`.
- **Block height:** `blockHeight = titleHeight + boardHeight + BLANK_LINES_BEFORE_STATUS_BAR + statusBarHeight`.

### Centering (when `centerBoard === true`)

- **Start column (1-based):**  
  `startColumn = Math.max(1, Math.floor((terminalColumns - blockWidth) / 2) + 1)`  
  (Use floor so that when terminal columns are even, the block is slightly left-of-center.)

- **Start row (1-based):**  
  `startRow = Math.max(1, Math.floor((terminalRows - blockHeight) / 2) + 1)`  
  (Center the entire block vertically; use floor for even terminal rows.)

### Row and column assignments

- **Title:** Row `startRow`, column `startColumn`. Length **60** characters (truncate + ellipses if title string &gt; 60).
- **Board:** Rows `startRow + titleHeight` through `startRow + titleHeight + boardHeight - 1`.  
  - **Board start column:** When `boardWidth < 60`: `boardStartColumn = startColumn + Math.floor((60 - boardWidth) / 2)` (center board within the 60-char strip). When `boardWidth >= 60`: `boardStartColumn = startColumn`.
- **Blank line(s) before status bar:** Row(s) `startRow + titleHeight + boardHeight` through `startRow + titleHeight + boardHeight + BLANK_LINES_BEFORE_STATUS_BAR - 1`.
- **Status bar:** First line of the status bar box at row `startRow + titleHeight + boardHeight + BLANK_LINES_BEFORE_STATUS_BAR`. Column `startColumn`. Box width **60** characters.

### When `centerBoard === false`

- Use **top-left** placement: `startColumn = 1`, `startRow = 1`. Title, board, and status bar positions are unchanged relative to each other (title then board then blank then status bar). Block width and title/status bar 60-char width still apply; only the origin changes.

---

## Functional Requirements

### 1. Layout computation

- **Location:** Renderer or a dedicated layout helper (e.g. `src/render/layout.js` or methods on Renderer).
- **Inputs:** Terminal columns and rows, board width and height, title height (fixed 2 for MVP), status bar height (from status bar content and 60-char wrap).
- **Outputs:** `startRow`, `startColumn`, `boardStartColumn`, and any other values needed to draw the title, board, and status bar at the correct positions.
- **When centering is disabled:** `startColumn = 1`, `startRow = 1`; `boardStartColumn` still computed from board width vs 60 so the board is centered within the strip when `boardWidth < 60`.

### 2. Title rendering

- **Position:** Row `startRow`, column `startColumn`.
- **Width:** Exactly **60** characters. If the configured title string (from server config or default) is longer than 60, **truncate** to 57 characters and append `"..."` so total length is 60. If title is shorter than 60, padding is optional (spec does not require padding to 60; implementation may pad for consistency).
- **Content:** Title string is configurable (server config); client uses default when not provided.

### 3. Board rendering

- **Position:** First row at `startRow + titleHeight`, start column `boardStartColumn` (see Layout Formulas). Each board row is drawn at the same `boardStartColumn`.
- **Dimensions:** Board keeps its fixed cell dimensions (`boardWidth` × `boardHeight`). No change to board content or cell rendering; only the origin is determined by layout.

### 4. Status bar rendering

- **Position:** First line of the status bar box at row `startRow + titleHeight + boardHeight + BLANK_LINES_BEFORE_STATUS_BAR`, column `startColumn`.
- **Width:** **60** characters. Existing box format (top/bottom border, `| content |` rows) and content logic apply; only the box width is fixed at 60 and the origin is from layout.
- **Blank line:** Exactly **one** blank line between the last board row and the first status bar line (layout contract).

### 5. Resize handling

- **Resize event:** When `process.stdout` is a TTY, listen for the `'resize'` event (e.g. `process.stdout.on('resize', ...)`).
- **Debounce:** Use a debounce with duration from client config (`rendering.resizeDebounceMs`, default 200 ms). On each resize event, clear any existing debounce timer and start a new one.
- **While resizing (during debounce):** On the **first** resize in a debounce window: **clear the screen** and do **not** draw the game block (display remains empty). Do not update layout or re-render until the debounce fires.
- **When resize finished (debounce fired):** Recompute layout from current `getTerminalSize()` and board dimensions, then perform a **full re-render** (clear and draw title, board, status bar) so the block is centered in the new terminal size.
- **Non-TTY:** When stdout is not a TTY, do **not** listen for resize. Use initial terminal size (or default columns/rows from `getTerminalSize()`) for layout and do not react to resize.

### 6. Terminal too small

- **Check:** Before drawing the game block, compute `minColumns` and `minRows` as in “Minimum terminal size” above. If `terminal.columns < minColumns` or `terminal.rows < minRows`, do **not** draw title, board, or status bar.
- **Width too narrow:** When `terminal.columns < minColumns` (and thus at least when &lt; 60), show **only** the message: *"Please increase the width of your terminal window in order to play this game."* (e.g. centered or at a fixed position; exact placement is implementation-defined.)
- **Rows too small:** When terminal rows are insufficient but width is OK, show only a single “terminal too small” message (e.g. *"Terminal too small; please resize."*) and do not draw the board.
- **Reuse:** Where possible, reuse `checkTerminalSize(minWidth, minHeight)` or the same minimum values so behavior is consistent with existing startup checks.

### 7. Integration with existing behavior

- **Incremental rendering:** When only game state (e.g. player position) changes, incremental updates must use the **current layout** (start row, start column, board start column) for all cursor positioning so that cell updates and status bar updates remain correctly aligned. Layout is cached and invalidated when resize debounce fires or when `centerBoard` is toggled.
- **Status bar content:** Existing status bar content and box format (see `src/render/Renderer.js` and `src/render/statusBarUtils.js`) remain; only the origin and fixed width (60) are defined by this spec.

### 8. Configurability summary

- **Centering:** Configurable via client config (`rendering.centerBoard`). Default: **true**. When false, top-left placement.
- **Resize debounce:** Configurable via client config (`rendering.resizeDebounceMs`). Default: **200** ms.
- **No padding/margin:** No configurable padding or margin; the block is placed using only the centering (or top-left) formula.

---

## Non-Functional Requirements

- **Layout computation:** O(1), integer math only (no floating point required).
- **Resize handling:** Must not block the main loop; attach listener and schedule redraw on next tick or in the existing render path when debounce fires.
- **Generality:** Layout formulas work for any board dimensions that fit in the terminal; no hard-coded board sizes in the centering logic.

---

## Implementation Notes

1. **Layout helper:** A small module (e.g. `computeLayout(terminalColumns, terminalRows, boardWidth, boardHeight, statusBarHeight, options)`) can return `{ startRow, startColumn, boardStartColumn }` and whether the terminal is too small. Options include `centerBoard` and possibly `titleHeight` if it ever becomes configurable.
2. **Title truncation:** If `title.length > 60`, use `title.slice(0, 57) + '...'`. Ensure the result is exactly 60 characters (or at most 60).
3. **Status bar height:** The status bar box height depends on content and wrap at 60 characters. The same logic that builds the status bar lines (for 60-char width) should be used to compute `statusBarHeight` for layout so that the block height is accurate.
4. **Blank line:** The single blank line between board and status bar is part of the layout contract; renderers must leave one blank row between the last board row and the first status bar line.
5. **Modals/overlays:** Centering or layout for future modals/overlays is **out of scope** for this spec; a future Modal component may be developed separately.

---

## References

- **Enhancement card:** `docs/development/cards/enhancements/ENHANCEMENT_center_board_in_terminal.md`
- **Status bar (content and box format):** `docs/development/specs/status-bar-two-lines-wrap/status-bar-two-lines-wrap_SPECS.md`; implementation in `src/render/Renderer.js`, `src/render/statusBarUtils.js`
- **Terminal size:** `src/utils/terminal.js` (`getTerminalSize()`, `checkTerminalSize()`)
- **Renderer:** `src/render/Renderer.js` (renderTitle, renderBoard, renderStatusBar)

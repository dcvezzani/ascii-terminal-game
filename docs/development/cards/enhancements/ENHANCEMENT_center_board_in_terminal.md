# Enhancement Card: Center Game Board in Terminal

## Status

- **Status**: NOT STARTED
- **Priority**: LOW (UX improvement)
- **Created**: 2026-02-14

## Context

**Current State**:
- The game board and status bar are rendered by `src/render/Renderer.js`. The board is drawn starting at **row 1** (after the title) and **column 1** (left edge). There is no horizontal or vertical centering.
- `src/utils/terminal.js` exposes `getTerminalSize()` returning `{ columns, rows }`. Terminal size is checked at startup for minimum dimensions but is not used for layout positioning.
- The status bar is drawn **below** the board per `docs/development/specs/status-bar-two-lines-wrap/`: it starts at the same column as the board and uses title height + board height for vertical position. The status bar’s positioning is relative to the board, not to the terminal.
- The board has **fixed dimensions** (e.g. from loaded map or dimensions config); the board’s width and height do not change with terminal size. Only placement within the terminal should change.

**Location**:
- Client: `src/render/Renderer.js` (board, title, status bar positioning), `src/modes/networkedMode.js` (render loop)
- Utilities: `src/utils/terminal.js` (terminal size)

## Problem

- The board is always drawn at the top-left of the terminal. On large terminals the game looks small and off to the side; there is no centering for a better visual layout.
- When the user **resizes the terminal**, the board does not re-center. The board keeps the same logical dimensions (e.g. 20×20) but its on-screen position does not adapt, so after resize the layout can look misaligned or cramped.

## Desired Feature

1. **Center the game block in the terminal**  
   The **entire block** (title + board + status bar) is centered as one unit horizontally and vertically in the terminal. Title is aligned with the board (same start column); the whole block is one aligned rectangle.

2. **Fixed block widths**  
   - **Title and status bar**: Fixed width of **60 characters** regardless of board width. Title and status bar content are truncated/wrapped to fit within 60 characters (title truncated with ellipses if too long). The title string is **configurable** (server config).
   - **Board**: The board’s **defined dimensions** (width × height in cells) do not change with terminal size. Only the **placement** (starting row and column) of the block changes so the block remains centered.

3. **Resize behavior**  
   When the terminal is **resized**:
   - **While resizing**: Keep the display **empty** (clear, no render).
   - **When resizing is finished**: Recompute layout and perform a **full re-render** so the block is again centered. Resize is **debounced**; debounce duration is **configurable in client config**, **default 200 ms**.

4. **Terminal too narrow (width)**  
   If the terminal **width** is too narrow to fit the block (minimum width 60 for title/status bar, or existing minimum from `src/utils/terminal.js`—reuse existing minimum for MVP): **do not render** title, board, or status bar. Render **only** the message: *“Please increase the width of your terminal window in order to play this game.”*

5. **Terminal too small (rows)**  
   If the terminal has insufficient **rows** to fit the block, show a single “terminal too small” message and do not draw the board (exact message and behavior to align with existing minimum from `src/utils/terminal.js`).

## Functional Requirements

### 1. Layout computation
- **Location**: Renderer or a dedicated layout helper (e.g. `src/render/layout.js` or Renderer methods).
- **Inputs**: Terminal columns, terminal rows, board width (cells), board height (cells), title height (lines), status bar height (lines). **Block width** for centering is the wider of **60** (title/status bar fixed width) and board width (in character columns).
- **Outputs**: Starting column and starting row for the **entire game block** (title + board + status bar) so that the **block** is centered horizontally and vertically in the terminal. Title and status bar share the same start column as the board; whole block is one aligned unit.

### 2. Centering rules
- **Horizontal**: Center the **block** in terminal columns. Use block width = max(60, boardWidth) for layout. For example: `startColumn = max(1, floor((terminalColumns - blockWidth) / 2) + 1)` (1-based; use floor for even terminal columns). Title and status bar are each 60 characters wide (truncate/wrap to 60); board is drawn at an offset within the block so the board is centered within the 60‑character strip, or board extends the block width when board width > 60—exact rule in SPECS.
- **Vertical**: Center the **entire block** (title + board + status bar) in terminal rows. Compute start row so the block as a whole is vertically centered. Title starts at start row; board immediately after title; status bar immediately after board (blank line between board and status bar per layout contract; status bar uses current box format per `Renderer.js` / `statusBarUtils.js`).

### 3. Title and status bar width
- **Fixed width**: Title and status bar are **60 characters** wide regardless of board width. Content longer than 60 is truncated with ellipses (title) or wrapped (status bar per existing logic, within 60).
- **Title**: Configurable in **server config** (title string). If title exceeds 60 characters, truncate and append ellipses so total length ≤ 60.
- **Status bar**: Same 60‑character width; existing box format and content logic apply, with box width 60.

### 4. Renderer usage of layout
- **Title**: Rendered at the computed block start row and start column, width 60 (truncate + ellipses if needed).
- **Board**: Rendered at the computed board start row and start column. Each board row at the same start column; board keeps its fixed cell dimensions.
- **Status bar**: Drawn **below** the board (with optional blank line per layout contract), same start column as block, **width 60** (box format per current implementation). Vertical position = board start row + board height + (1 if blank line).

### 5. Resize handling
- **Resize event**: Listen for terminal **resize** (e.g. `process.stdout.on('resize', ...)` where TTY). **Debounce**: configurable in client config, **default 200 ms**.
- **While resizing (during debounce)**: **Clear screen and do not render** (display empty).
- **When resize finished (after debounce)**: Recompute layout and perform a **full re-render** so the block is centered in the new terminal size.

### 6. Minimum terminal size and “too small” behavior
- **Minimum**: Reuse the **existing minimum** from `src/utils/terminal.js` for MVP.
- **Terminal width too narrow**: If terminal columns < minimum width (at least 60 for the block): **do not render** title, board, or status bar. Render **only**: *“Please increase the width of your terminal window in order to play this game.”*
- **Terminal rows too small**: Show a single “terminal too small” message and do not draw the board (reuse existing minimum / messaging approach).

### 7. Integration with existing behavior
- **Incremental rendering**: Use the **current layout** (start row/column) for all cursor positioning so incremental updates remain correct after resize. Layout cached and invalidated on resize.
- **Status bar**: Current status bar **box format** (top/bottom border, `| content |` rows) and content logic remain; width is 60 and origin is from layout. Blank line between board and status bar is part of the layout contract (SPECS).

### 8. Configurability
- **Centering**: **Configurable** in client config (e.g. `clientConfig.rendering.centerBoard`). **Default: true** (center the board). When false, use top-left placement as today.
- **Resize debounce**: Configurable in client config; **default 200 ms**.
- **No padding/margin**: No configurable padding; block is placed with no extra margin beyond centering.

## Non-Functional Requirements

- Layout computation is O(1) and uses integer math (no floating point required).
- Resize handling must not block the main loop; attach listener and redraw on next tick or in the existing render path.
- Centering should work for any board dimensions that fit in the terminal; no hard-coded sizes in the centering logic.

## Open Questions & Answers

### Layout and centering

1. **Vertical centering**: Center the board’s middle row in the terminal, or center the whole block (title + board + status bar) as one unit?  
   **Answer:** Center the **entire block** as one unit.

2. **Title alignment**: Should the title be centered in the terminal independently, or aligned with the board (so the whole block is one aligned unit)?  
   **Answer:** Keep the **whole block as one aligned unit** (title same start column as board).

3. **Title longer than board / title and status bar width**:
   **Answer:** Title and status bar have a **fixed width of 60 characters** regardless of board width. The title is **configurable** (server config). If the title is too long, **truncate and add ellipses**; title and truncated title with ellipses must not be wider than 60 (the fixed width). If terminal width is too narrow to fit the block (minimum 60), **do not render** title, board, or status bar; render **only**: *"Please increase the width of your terminal window in order to play this game."* Content wraps/truncates to title/status bar width to keep the block rectangular.

4. **Blank line between board and status bar**:  
   **Answer:** Status bar rendering format has been updated (box with top/bottom border and `| content |` rows per `Renderer.js` / `statusBarUtils.js`). Whether there is exactly one blank line between the last board row and the first status bar line is part of the **layout contract** to be defined in SPECS.

5. **Odd vs even dimensions**: When terminal columns or rows are even, "center" has two possible interpretations.
   **Answer:** Use **floor** (board/block slightly left-of-center when terminal is even); that's fine.

### Resize and performance

6. **Resize debounce**: Debounce resize (e.g. 100–200 ms) to avoid flicker during drag-resize? If yes, what default debounce duration? Should it be configurable in client config?  
   **Answer:** **Configurable in client config**, **default 200 ms**.

7. **Full re-render on resize**: On resize we currently assume a full clear + redraw. Is that acceptable, or do we want to try to only redraw the "moved" regions to reduce flicker?
   **Answer:** **While resizing**: keep the display **empty** (clear, no render). **Once resizing is finished**, do a **full render** again.

8. **Non-TTY or no resize event**: In environments where stdout is not a TTY, or resize isn't emitted, should we still center using initial terminal size (or a default), and simply not react to resize?
   **Answer:** **Simply do not react to resize**; center using initial terminal size (or default) and do not listen for resize.

### Scope and behavior

9. **Single-player / other modes**: Does this apply only to networked mode or to all client modes that use the same Renderer?  
   **Answer:** **All modes** using this Renderer benefit from centering; implementation in Renderer + shared layout keeps behavior consistent.

10. **Minimum size definition**: What is the exact minimum (columns × rows) we require? Should we reuse the existing minimum from `src/utils/terminal.js`?
   **Answer:** **Reuse the existing minimum** from `src/utils/terminal.js`. Keep it simple for MVP. Minimum effectively includes "title height + board height + status bar height" and at least 60 columns for block width.

11. **"Terminal too small" UX**: When the terminal is below minimum, should we: (a) show a single message and no board, (b) draw the board anyway and allow clipping, or (c) show the message and a minimal placeholder?
   **Answer:** **Show a single message** (e.g. "Terminal too small; please resize") and **do not draw** the board. For width too narrow: show only *"Please increase the width of your terminal window in order to play this game."*

12. **Modals / overlays**: If we later add help or other overlays that take over the screen, should they be centered using the same layout helper, or is that out of scope for this card?
   **Answer:** **Out of scope** for this card. A future **Modal** component may be developed for viewing more content and receiving user input.

### Configurability

13. **Disable centering**: Should centering be configurable (e.g. `clientConfig.rendering.centerBoard: true/false`) so we can fall back to top-left placement for debugging or user preference?  
   **Answer:** **Yes**; configurable (e.g. `clientConfig.rendering.centerBoard`). **Default: center the board** (true).

14. **Padding / margin**: Do we want configurable padding (e.g. minimum empty rows above/below or columns left/right) so the board isn't flush against the terminal edge when barely fitting?
   **Answer:** **No** padding/margin configurability.

## References

- **Status bar specs**: `docs/development/specs/status-bar-two-lines-wrap/status-bar-two-lines-wrap_SPECS.md` (positioning below board, board width confinement). Current implementation uses a **box format** (top/bottom border, `| content |` rows) in `src/render/Renderer.js` and `src/render/statusBarUtils.js`.
- **Renderer**: `src/render/Renderer.js` (renderTitle, renderBoard, renderStatusBar).
- **Terminal size**: `src/utils/terminal.js` (`getTerminalSize()`).

## Dependencies

- Existing Renderer (title, board, status bar) and status bar behavior. No new dependencies on other features.
- Terminal resize is supported in Node.js via `process.stdout` (resize event on TTY).

## Documentation

- **SPECS**: To be created under `docs/development/specs/center-board-in-terminal/` (exact formulas, minimum size behavior, debounce).
- **GAMEPLAN**: To be created under `docs/development/gameplans/` after SPECS.

## Related Cards

- **FEATURE_status_bar_two_lines_wrap**: Status bar is drawn below the board; this enhancement only changes the origin (row/column) of the whole block so the board is centered; status bar stays below and follows its specs.
- **X_ENHANCEMENT_reduce_screen_flicker**: Incremental rendering uses cursor positioning; layout (start row/column) must be used for all cursor positions so incremental updates remain aligned after resize.

## Tags

- `enhancement`
- `renderer`
- `layout`
- `terminal`
- `ux`

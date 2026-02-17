# Gameplan: Center Game Board in Terminal

## Overview

This gameplan breaks down the center-board-in-terminal enhancement into logical phases. Implementation follows Test-Driven Development (TDD): write tests first, run tests (expect failure), implement code to make tests pass, then commit after each step.

**Approach:** Add client config for centering and resize debounce; implement a layout computation module (pure function) and title truncation utility; extend the Renderer to use layout for title, board, and status bar positions and to support 60-character title/status bar width; add terminal-too-small checks and messaging; implement resize handling with debounce (clear during resize, full re-render when done); update callers to pass layout or terminal size and to integrate with incremental rendering.

**Reference:** `docs/development/specs/center-board-in-terminal/center-board-in-terminal_SPECS.md`

## Progress Summary

- [ ] **Phase 1: Client config – rendering.centerBoard, rendering.resizeDebounceMs**
- [ ] **Phase 2: Layout computation module**
- [ ] **Phase 3: Title truncation and status bar height for 60-char width**
- [ ] **Phase 4: Renderer – use layout for title, board, status bar positions; 60-char width**
- [ ] **Phase 5: Terminal too small – check and message-only display**
- [ ] **Phase 6: Resize handling – listen, debounce, clear during resize, full re-render when done**
- [ ] **Phase 7: Callers and integration – layout in render path and incremental rendering**
- [ ] **Phase 8: Tests and verification**

## Prerequisites

- [ ] All existing tests passing (`npm test`)
- [ ] SPECS and enhancement card reviewed
- [ ] Renderer (renderTitle, renderBoard, renderStatusBar) and status bar box format in place
- [ ] `getTerminalSize()` and `checkTerminalSize()` in `src/utils/terminal.js` available

---

## Phase 1: Client config – rendering.centerBoard, rendering.resizeDebounceMs (~15 min)

**Goal:** Add `rendering.centerBoard` (default true) and `rendering.resizeDebounceMs` (default 200) to client config so the Renderer and resize handler can use them.

### Step 1.1: Add rendering layout keys to client config

**Location:** `config/clientConfig.js` (fallback default object). Optionally `config/clientConfig.json` if it exists.

**Action (TDD):**
1. **Add tests** in `test/config/clientConfig.test.js` (create file if missing):
   - When config is loaded (or defaults used), `config.rendering.centerBoard` is defined and is boolean (default true).
   - When config is loaded, `config.rendering.resizeDebounceMs` is defined and is a number (default 200).
   - When `clientConfig.json` includes `"rendering": { "centerBoard": false, "resizeDebounceMs": 150 }`, those values are used.
2. **Run tests** — expect failures (keys not in defaults yet).
3. **Implement:** In the fallback default object in `clientConfig.js`, ensure `rendering` (or equivalent) includes `centerBoard: true` and `resizeDebounceMs: 200`. If `rendering` is merged from JSON, preserve these keys with defaults when absent.
4. **Run tests** — pass.

**Verification:**
- [ ] `clientConfig.rendering.centerBoard` is true by default
- [ ] `clientConfig.rendering.resizeDebounceMs` is 200 by default
- [ ] Custom values from JSON are used when present
- [ ] `npm test` passes for client config

**Commit:** e.g. `Enhancement: Add client config rendering.centerBoard and rendering.resizeDebounceMs`

---

**Phase 1 Completion Checklist:**
- [ ] Step 1.1 completed
- [ ] Config tests passing
- [ ] No regressions

---

## Phase 2: Layout computation module (~30 min)

**Goal:** Implement a pure function that, given terminal size, board dimensions, status bar height, and options (centerBoard), returns startRow, startColumn, boardStartColumn, and whether the terminal is too small. Constants (60, title height 2, blank line) are defined in one place.

### Step 2.1: Layout constants and computeLayout function

**Location:** New file `src/render/layout.js` (or `src/utils/layout.js`). Export constants and `computeLayout(terminalColumns, terminalRows, boardWidth, boardHeight, statusBarHeight, options)`.

**Action (TDD):**
1. **Write tests** in `test/render/layout.test.js`:
   - Constants: TITLE_AND_STATUS_BAR_WIDTH === 60, BLANK_LINES_AFTER_TITLE === 1, BLANK_LINES_BEFORE_STATUS_BAR === 1.
   - When centerBoard is true, terminal 80×24, board 20×20, statusBarHeight 5: blockWidth 60, blockHeight 2+20+1+5=28; startColumn = max(1, floor((80-60)/2)+1) = 11; startRow = max(1, floor((24-28)/2)+1) = 1 (block doesn't fit; still return layout). boardStartColumn = 11 + floor((60-20)/2) = 11+20 = 31.
   - When centerBoard is true, terminal 100×30, board 20×20, statusBarHeight 5: blockHeight 28; startRow = floor((30-28)/2)+1 = 2; startColumn = floor((100-60)/2)+1 = 21; boardStartColumn = 21+20 = 41.
   - When centerBoard is false: startColumn 1, startRow 1; boardStartColumn = 1 + floor((60-20)/2) = 21 when boardWidth 20.
   - When boardWidth >= 60 (e.g. 80): blockWidth 80; boardStartColumn = startColumn (no offset).
   - fitsInTerminal: when terminal.rows < blockHeight or terminal.columns < blockWidth, return fitsInTerminal: false (and still return layout for optional use). When large enough, fitsInTerminal: true.
2. **Run tests** — expect failures (module/function do not exist).
3. **Implement:** Constants as in SPECS. computeLayout returns { startRow, startColumn, boardStartColumn, blockWidth, blockHeight, fitsInTerminal, minColumns, minRows }. Use integer math only (floor). titleHeight = 2 (fixed for MVP).
4. **Run tests** — pass.

**Verification:**
- [ ] computeLayout returns correct values per SPECS formulas
- [ ] centerBoard false yields startRow 1, startColumn 1
- [ ] fitsInTerminal reflects minColumns/minRows vs terminal size
- [ ] `npm test` passes for layout

**Commit:** e.g. `Enhancement: Add layout computation module (computeLayout, constants)`

---

**Phase 2 Completion Checklist:**
- [ ] Step 2.1 completed
- [ ] layout tests passing
- [ ] No regressions

---

## Phase 3: Title truncation and status bar height for 60-char width (~25 min)

**Goal:** (1) Title string truncated to 60 chars with ellipses when longer (testable utility). (2) Ability to compute status bar box height when width is 60 (so layout can use it for blockHeight).

### Step 3.1: Title truncation utility

**Location:** `src/render/layout.js` or `src/render/statusBarUtils.js`. Export e.g. `truncateTitleToWidth(title, maxWidth = 60)` returning string of length at most maxWidth (truncate to maxWidth-3 and append '...' when title.length > maxWidth).

**Action (TDD):**
1. **Write tests:**
   - truncateTitleToWidth('Short') → 'Short'.
   - truncateTitleToWidth('A'.repeat(60)) → 'A'.repeat(60).
   - truncateTitleToWidth('A'.repeat(70)) → 'A'.repeat(57) + '...' (length 60).
   - truncateTitleToWidth('Title', 10) → 'Title'; when 20 chars and maxWidth 10 → 7 chars + '...'.
2. **Implement:** If title.length <= maxWidth return title; else return title.slice(0, maxWidth - 3) + '...'.
3. **Run tests** — pass.

**Verification:**
- [ ] Truncation produces at most 60 characters (or specified maxWidth)
- [ ] `npm test` passes

**Commit:** e.g. `Enhancement: Add truncateTitleToWidth for title display`

---

### Step 3.2: Status bar height for given width

**Location:** `src/render/statusBarUtils.js` or Renderer. Export a function that, given score, position, and content width (60), returns the number of lines the status bar box would use (top border + content lines + bottom border). This is used by computeLayout so blockHeight is accurate.

**Action (TDD):**
1. **Write tests:**
   - For width 60, full format (e.g. score 0, position (10,12)): line1 and line2 wrapped at 60-4 = 56 (content width inside box); count physical lines; add top + bottom border → total line count.
   - For simplified format (narrow), single line; total line count = 1 + 2 borders = 3 or similar. (Match actual statusBarUtils box format: top border, then formatBoxRow for each content line, then bottom border.)
2. **Implement:** Reuse wrapAtSpaces and content builders; build the same box rows as Renderer but with width 60; return array length or a function getStatusBarHeight(score, position, width). If status bar format uses boardWidth for content width, use contentWidth = width - 4 (for "| " and " |").
3. **Run tests** — pass.

**Verification:**
- [ ] Status bar height for width 60 matches actual box line count
- [ ] `npm test` passes

**Commit:** e.g. `Enhancement: Add status bar height computation for layout (60-char width)`

---

**Phase 3 Completion Checklist:**
- [ ] Steps 3.1 and 3.2 completed
- [ ] Title truncation and status bar height tests passing
- [ ] No regressions

---

## Phase 4: Renderer – use layout for title, board, status bar; 60-char width (~45 min)

**Goal:** Renderer uses layout when centerBoard is true: title at (startRow, startColumn), 60 chars, truncated; board at (startRow+titleHeight, boardStartColumn); one blank line; status bar at (startRow+titleHeight+boardHeight+1, startColumn), width 60. When centerBoard is false, use startRow 1, startColumn 1, boardStartColumn per formula. Status bar box width is 60 when using centered layout (or always 60 per spec; align with existing status bar behavior for non-centered mode if needed).

### Step 4.1: Renderer accepts layout and draws title at position

**Location:** `src/render/Renderer.js`.

**Action (TDD):**
1. **Add/update tests:**
   - When Renderer is given config with centerBoard: true and a layout object (startRow, startColumn, etc.), renderTitle(layout, titleString) writes title at cursorTo(startColumn, startRow) and writes truncated title (60 chars max). Stub stdout and assert cursor position and written content length.
   - When centerBoard: false or no layout, renderTitle() uses row 1, column 1 (current behavior) and optional truncation.
2. **Implement:** renderTitle(layout, titleString) or renderTitle(titleString) with layout from instance/context. If layout present, cursorTo(layout.startColumn, layout.startRow); write truncateTitleToWidth(titleString, 60). Else current behavior (row 1, column 1).
3. **Run tests** — pass.

**Verification:**
- [ ] Title drawn at layout position when layout provided
- [ ] Title truncated to 60 chars with ellipses when needed
- [ ] `npm test` passes

**Commit:** e.g. `Enhancement: Renderer draw title using layout and 60-char truncation`

---

### Step 4.2: Renderer draws board at boardStartColumn and layout row

**Location:** `src/render/Renderer.js`.

**Action (TDD):**
1. **Add tests:**
   - When layout provided, renderBoard(board, players, layout) draws each row starting at (layout.boardStartColumn, layout.startRow + titleHeight + rowIndex). Stub stdout, assert cursorTo called with correct column/row for first and last board row.
   - When layout not provided, current behavior (column 1, row 2 + rowIndex or similar).
2. **Implement:** For each board row y, cursorTo(layout.boardStartColumn, layout.startRow + titleHeight + y) then write line. Ensure no trailing logic assumes column 1.
3. **Run tests** — pass.

**Verification:**
- [ ] Board drawn at layout.boardStartColumn and correct start row
- [ ] `npm test` passes

**Commit:** e.g. `Enhancement: Renderer draw board at layout position`

---

### Step 4.3: Renderer draws status bar at layout position with width 60

**Location:** `src/render/Renderer.js`.

**Action (TDD):**
1. **Add tests:**
   - When layout provided, renderStatusBar(score, position, 60, boardHeight, layout) draws status bar box at row layout.startRow + titleHeight + boardHeight + BLANK_LINES_BEFORE_STATUS_BAR, column layout.startColumn; box width 60. Assert cursorTo and written lines use 60-char width (e.g. formatBoxTopBottom(60), formatBoxRow(..., 60)).
   - When layout not provided, existing behavior (boardWidth from argument; row 2+boardHeight+1, column 1). Optional: keep backward compat by using boardWidth when layout absent.
2. **Implement:** When layout present, status bar first row = layout.startRow + titleHeight + boardHeight + 1; column = layout.startColumn; use fixed width 60 for box (content width 56). When layout absent, keep current statusBarStartRow and boardWidth-based box. Update statusBarUtils or Renderer to accept optional layout and width 60.
3. **Run tests** — pass.

**Verification:**
- [ ] Status bar at correct row/column when layout provided
- [ ] Status bar box width 60 when using layout
- [ ] `npm test` passes

**Commit:** e.g. `Enhancement: Renderer draw status bar at layout position with 60-char width`

---

**Phase 4 Completion Checklist:**
- [ ] Steps 4.1–4.3 completed
- [ ] Title, board, status bar all use layout when centerBoard true
- [ ] No regressions

---

## Phase 5: Terminal too small – check and message-only display (~20 min)

**Goal:** Before drawing the game block, compute minColumns and minRows; if terminal is too small, do not draw title/board/status bar and show only the appropriate message (width message or rows message).

### Step 5.1: Too-small check and message rendering

**Location:** Renderer or the mode that drives rendering (e.g. networkedMode). Layout already returns fitsInTerminal, minColumns, minRows.

**Action (TDD):**
1. **Add tests:**
   - When terminal columns < minColumns (e.g. 40), render path does not call renderTitle/renderBoard/renderStatusBar with game content; instead a single message is written (e.g. "Please increase the width of your terminal window in order to play this game."). Stub stdout or capture output.
   - When terminal rows < minRows but columns OK, render path shows "terminal too small" message and does not draw board/title/status bar.
   - When terminal is large enough, normal render (title, board, status bar) is used.
2. **Implement:** In the render path, after computing layout, if !layout.fitsInTerminal: clear screen (or leave clear), determine whether width or rows is the problem (e.g. columns < minColumns → width message; else rows message), write message (e.g. centered at row floor(terminalRows/2) or at (1,1)); return without drawing game block. Else proceed with full render.
3. **Run tests** — pass.

**Verification:**
- [ ] Width too narrow → only width message shown
- [ ] Rows too small → only rows message shown
- [ ] Terminal large enough → full game block drawn
- [ ] `npm test` passes

**Commit:** e.g. `Enhancement: Show message only when terminal too small (no game block)`

---

**Phase 5 Completion Checklist:**
- [ ] Step 5.1 completed
- [ ] Too-small behavior per SPECS
- [ ] No regressions

---

## Phase 6: Resize handling – listen, debounce, clear during resize, full re-render when done (~35 min)

**Goal:** When stdout is a TTY, listen for 'resize'. On resize, (1) clear screen and do not draw game block (display empty). (2) Debounce with configurable ms (default 200). (3) When debounce fires, recompute layout and perform full re-render. When not TTY, do not listen for resize.

### Step 6.1: Resize listener and debounce

**Location:** Where the render loop and event loop live (e.g. `src/modes/networkedMode.js`). Alternatively a small helper that attaches the listener and invokes a callback when debounce fires.

**Action (TDD):**
1. **Add tests:**
   - When process.stdout is TTY and 'resize' is emitted, after debounce delay a callback is invoked (e.g. "redraw" or "recomputeLayoutAndRender"). Use fake timers or mock stdout.isTTY and emit resize.
   - When resize is emitted multiple times within debounce window, callback is invoked only once after the last resize (debounce).
   - When stdout is not TTY, attaching listener does not throw and callback is not required to be invoked on resize (or listener not attached).
2. **Implement:** In networkedMode (or equivalent), if process.stdout.isTTY: process.stdout.on('resize', () => { clear previous debounce timer; set new timer with config.rendering.resizeDebounceMs; on first resize in window: clearScreen and set a flag "display empty"; when timer fires: recompute layout, set "display empty" false, call full render }). Ensure timer is cleared and re-set on each resize.
3. **Run tests** — pass.

**Verification:**
- [ ] Resize debounced; callback once after delay
- [ ] During debounce, screen cleared and not re-rendered (display empty)
- [ ] When debounce fires, full re-render with new layout
- [ ] Non-TTY: no resize listener or no reaction
- [ ] `npm test` passes

**Commit:** e.g. `Enhancement: Resize handling – debounce, clear during resize, full re-render when done`

---

**Phase 6 Completion Checklist:**
- [ ] Step 6.1 completed
- [ ] Resize behavior per SPECS
- [ ] No regressions

---

## Phase 7: Callers and integration – layout in render path and incremental rendering (~30 min)

**Goal:** The main render path (e.g. in networkedMode) computes layout (or gets it from a cached value invalidated on resize), passes it to Renderer for title/board/status bar. Incremental rendering (cell updates, status bar updates) uses the same layout for cursor positions so that after resize, incremental updates remain aligned. Title string comes from server when available (CONNECT or state); otherwise default.

### Step 7.1: Compute and pass layout in full render path

**Location:** `src/modes/networkedMode.js` (and any other mode that uses Renderer).

**Action (TDD):**
1. **Identify full-render call sites:** Where clearScreen + renderTitle + renderBoard + renderStatusBar are called, compute layout first: getTerminalSize(), get status bar height for width 60, computeLayout(..., { centerBoard: config.rendering.centerBoard }). If !layout.fitsInTerminal, show message only and return. Else pass layout to renderTitle, renderBoard, renderStatusBar.
2. **Implement:** Before first render and after resize debounce fires, compute layout; cache it (e.g. in closure or module state). Pass layout into Renderer methods. Ensure Renderer is constructed with config that includes rendering.centerBoard and statusBar (for 60-char status bar when centered).
3. **Run tests** — pass.

**Verification:**
- [ ] Full render uses layout from getTerminalSize and computeLayout
- [ ] Layout is passed to Renderer for title, board, status bar
- [ ] `npm test` passes

**Commit:** e.g. `Enhancement: Compute and pass layout in full render path`

---

### Step 7.2: Incremental rendering uses current layout

**Location:** `src/render/Renderer.js` (renderIncremental or equivalent), `src/modes/networkedMode.js`.

**Action (TDD):**
1. **Add tests:**
   - When incremental update runs (e.g. player moved), cursorTo positions for cell updates use layout.boardStartColumn and layout.startRow + titleHeight + cellY (and cellX offset). Stub stdout, trigger incremental update with a layout (e.g. startRow 2, boardStartColumn 21), assert cursorTo called with column 21 + cellX (or similar) and correct row.
   - When layout is invalidated (e.g. after resize), next full render gets new layout; incremental updates thereafter use new layout.
2. **Implement:** Renderer stores last used layout (or receives it each time). When rendering a cell at (x, y), use layout.boardStartColumn + x and layout.startRow + titleHeight + y. Status bar row in incremental path uses layout.startRow + titleHeight + boardHeight + 1 + lineIndex. Invalidate cached layout when resize debounce fires.
3. **Run tests** — pass.

**Verification:**
- [ ] Incremental cell updates use layout for cursor position
- [ ] Status bar incremental update uses layout
- [ ] Layout invalidation on resize
- [ ] `npm test` passes

**Commit:** e.g. `Enhancement: Incremental rendering uses layout for cursor positions`

---

### Step 7.3: Title from server (optional / follow-up)

**Location:** Server may send title in CONNECT or state; client uses it when rendering title. If server does not send title, client uses default (e.g. "=== Multiplayer Terminal Game ===").

**Action:** When server config supports a title and it is sent to the client (e.g. in gameState or CONNECT response), client passes that string to renderTitle. Otherwise use default. This step can be minimal for MVP (default title only) and extended when server config is added.

**Verification:**
- [ ] Title string can be passed to renderTitle (default or from state)
- [ ] No regressions

**Commit:** e.g. `Enhancement: Use title from state when available (default otherwise)`

---

**Phase 7 Completion Checklist:**
- [ ] Steps 7.1 and 7.2 completed (7.3 optional for MVP)
- [ ] Full and incremental render use layout
- [ ] No regressions

---

## Phase 8: Tests and verification (~25 min)

**Goal:** Ensure all SPECS requirements are covered by tests; full suite green; manual smoke check.

### Step 8.1: Layout and constants tests

**Location:** `test/render/layout.test.js`.

**Action:**
- All layout formulas: various terminal sizes, board sizes, centerBoard true/false; assert startRow, startColumn, boardStartColumn, fitsInTerminal.
- Board offset when boardWidth < 60 vs >= 60.
- Edge cases: terminal exactly min size; terminal 1x1 (fitsInTerminal false).

**Verification:** [ ] Layout tests cover SPECS formulas and edge cases

---

### Step 8.2: Title truncation and status bar height tests

**Location:** `test/render/statusBarUtils.test.js` or layout tests.

**Action:**
- Title truncation: 60 chars, 57+ellipses, short string, custom maxWidth.
- Status bar height: full format and simplified format for width 60; match actual box line count.

**Verification:** [ ] Truncation and status bar height tests pass

---

### Step 8.3: Renderer layout integration tests

**Location:** `test/render/Renderer.test.js`.

**Action:**
- Title at (startRow, startColumn), 60 chars max.
- Board at boardStartColumn, correct start row.
- Status bar at correct row/column, width 60.
- When layout not provided (centerBoard false or legacy), positions match current behavior (row 1, column 1 for title; etc.).
- Terminal too small: only message written; no title/board/status bar.

**Verification:** [ ] Renderer layout and too-small tests pass

---

### Step 8.4: Resize and integration tests

**Location:** `test/modes/networkedMode.test.js` or integration tests.

**Action:**
- Resize debounce: mock stdout.isTTY and resize event; assert after debounce delay full render or layout recompute is triggered.
- Optional: end-to-end with small terminal size to assert message-only display.

**Verification:** [ ] Resize and integration tests pass

---

### Step 8.5: Full suite and manual check

**Action:**
1. Run `npm test` — all tests pass.
2. Manual: start server and client; verify game block is centered in terminal. Resize terminal: during resize display is empty; after resize stops, block re-centers. Shrink terminal width below 60: only width message. Shrink rows: only rows message. Toggle centerBoard false (if UI or config change): block at top-left.

**Verification:**
- [ ] All automated tests pass
- [ ] Manual: centering, resize, and too-small behavior as specified

---

**Phase 8 Completion Checklist:**
- [ ] Layout, truncation, status bar height, Renderer, resize, and integration tests cover SPECS
- [ ] Full test suite green
- [ ] No regressions in rendering or modes

---

## Completion Checklist

- [ ] Phase 1: Client config centerBoard, resizeDebounceMs
- [ ] Phase 2: Layout computation module
- [ ] Phase 3: Title truncation and status bar height for 60-char width
- [ ] Phase 4: Renderer use layout for title, board, status bar; 60-char width
- [ ] Phase 5: Terminal too small – message only
- [ ] Phase 6: Resize handling
- [ ] Phase 7: Callers and integration (layout in render path, incremental uses layout)
- [ ] Phase 8: Tests and verification
- [ ] All tests passing (`npm test`)
- [ ] Enhancement card status updated when complete (optional)
- [ ] Gameplan directory renamed with `X_` prefix when enhancement is closed (optional)

---

## Notes

- **ANSI cursor positioning:** `cursorTo(column, row)` in ansi-escapes is 1-based; use layout values directly.
- **Layout cache:** Cache layout in the render loop closure (or Renderer instance). Invalidate on resize debounce fire and when centerBoard config changes. Recompute when doing full render after resize or when terminal-too-small check runs.
- **Status bar width 60:** Existing status bar uses boardWidth for box width; when using centered layout, pass 60 as the width so title and status bar are consistently 60 characters. The status bar content (score, position, instructions) is unchanged; only the box width and origin come from layout.
- **Blank line:** Ensure one blank line between last board row and first status bar line in both centered and non-centered modes when using the new layout contract.

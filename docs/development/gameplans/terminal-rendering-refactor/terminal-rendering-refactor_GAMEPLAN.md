# Gameplan: Terminal Rendering Refactor (Spec-Aligned)

## Overview

This gameplan refactors terminal rendering so behavior matches `terminal-rendering_SPECS.md`. The result is **consistent behavior** for startup, resize, and “terminal too small,” and it **fixes the resize bug** (board not redrawing after resize).

**Approach:** Add config (env/CLI) for resize debounce; introduce one-time startup clear by newline scroll; add content-region tracking and clear-then-draw; unify a single “normal render path” used for first render and resize; tighten terminal-too-small handling (including “was too small” → clear once when large again). Incremental rendering remains for state-only updates; full redraws use the normal path.

**References:**
- `docs/development/specs/terminal-rendering/terminal-rendering_SPECS.md`
- `docs/development/specs/terminal-rendering/current-vs-desired-rendering.md`
- `docs/development/cards/bugs/BUG_resize_board_not_rendering.md`

## Progress Summary

- [ ] **Phase 1: Resize debounce config (env + CLI)**
- [ ] **Phase 2: One-time startup clear (newline scroll)**
- [ ] **Phase 3: Content region tracking and clear-then-draw**
- [ ] **Phase 4: Unified normal render path and resize fix**
- [ ] **Phase 5: Terminal too small (wasTooSmall, two-line message)**
- [ ] **Phase 6: Tests and verification**

## Prerequisites

- [ ] All existing tests passing (`npm test`)
- [ ] Spec and current-vs-desired doc reviewed
- [ ] Layout module and Renderer (renderTitle, renderBoard, renderStatusBar) in place
- [ ] Resize handler and debounce already present in `networkedMode.js` (will be adapted)

---

## Phase 1: Resize debounce config (env + CLI) (~20 min)

**Goal:** Resize debounce is configurable via env `RESIZE_DEBOUNCE_MS` and CLI `--resize-debounce=N`; CLI overrides env. Default 250 ms when neither is set or both invalid.

### Step 1.1: Parse CLI and env for resize debounce

**Location:** Client entry (e.g. `src/index.js` or wherever argv is read) and config resolution (e.g. `config/clientConfig.js` or a small `src/config/resolveRendering.js`).

**Action:**
1. **Parse CLI:** Detect `--resize-debounce=N` (N in milliseconds). If present and valid (positive number), use it.
2. **Env:** Read `RESIZE_DEBOUNCE_MS`; treat as number (parseInt/parseFloat); invalid or missing → skip.
3. **Precedence:** CLI overrides env; if neither valid, use default 250.
4. **Expose:** Ensure the value used by the resize handler is this resolved value (e.g. pass into networked mode or set on a shared config object). Keep existing `clientConfig.rendering.resizeDebounceMs` as a fallback when env/CLI are not set (so config file still works); document precedence as: CLI → env → config file → 250.

**Verification:**
- [ ] `--resize-debounce=100` results in 100 ms debounce
- [ ] `RESIZE_DEBOUNCE_MS=300` (no CLI) results in 300 ms
- [ ] CLI overrides env when both set
- [ ] Invalid or missing values fall back to next source, then 250; no crash

**Commit:** e.g. `Config: Add RESIZE_DEBOUNCE_MS and --resize-debounce for terminal resize debounce`

---

**Phase 1 Completion Checklist:**
- [ ] Step 1.1 completed
- [ ] Default 250 ms when neither env nor CLI set
- [ ] No regressions

---

## Phase 2: One-time startup clear (newline scroll) (~25 min)

**Goal:** Before the first content render, perform a **one-time** clear by writing `'\n'.repeat(rows)` to stdout and waiting for `drain` if `stream.write()` returns false. This is the only time the app uses newlines to scroll.

### Step 2.1: Startup clear function and call site

**Location:** New helper (e.g. `src/utils/terminal.js` or `src/render/startupClear.js`). Call from `networkedMode.js` after terminal size is available and before the first `render()` (e.g. after input/resize setup, before WebSocket connect or before first paint).

**Action:**
1. **Implement** `startupClear(stream)` (or `clearTerminalWithNewlines(stream)`):
   - Get `stream.rows` (or use existing `getTerminalSize(stream)` if available).
   - Write `'\n'.repeat(rows)` to stream.
   - If `stream.write(...)` returns `false`, wait for `'drain'` (wrap in Promise and await, or use callback) before resolving.
   - Only run when stream is TTY and has `rows`; otherwise no-op.
2. **Call** this once at startup in networked mode, **before** the first possible render (e.g. after `renderer.hideCursor()` and `inputHandler.start()`, before `wsClient.connect()` so that first STATE_UPDATE triggers first render after a clean screen).
3. **Tests:** Unit test the helper: mock stream with `rows` and `write` returning true/false and `drain` emission.

**Verification:**
- [ ] On startup, terminal is cleared by newline scroll; first frame is not mixed with prior shell output
- [ ] Backpressure: when `write` returns false, implementation waits for drain
- [ ] No crash when not TTY or rows missing

**Commit:** e.g. `Rendering: Add one-time startup clear by newline scroll per spec`

---

**Phase 2 Completion Checklist:**
- [ ] Step 2.1 completed
- [ ] Startup clear runs once before first content
- [ ] No regressions

---

## Phase 3: Content region tracking and clear-then-draw (~45 min)

**Goal:** Renderer (or rendering path) stores the **last drawn content region** (startRow, startCol, rows, cols). When doing a **full redraw**, we (1) clear the **previous** content region (overwrite with spaces via cursor positioning), (2) draw the new content, (3) store the new content region. Do not clear “last drawn region” to null before re-rendering.

### Step 3.1: Content region shape and Renderer API

**Location:** `src/render/Renderer.js` (and optionally layout module for computing region from layout).

**Action:**
1. **Define content region:** e.g. `{ startRow, startColumn, rows, columns }` (1-based if that matches existing convention).
2. **Add `clearContentRegion(region)`** to Renderer: given a region, move cursor to each row/column in that rectangle and write spaces (and optionally erase-to-end-of-line per row to be safe). Only clear if `region` is non-null.
3. **Add helper** to compute content region from current layout (title height + board height + status bar height, block width); e.g. `getContentRegionFromLayout(layout)` returning the rectangle the current frame will occupy.
4. **Store last region:** Caller (networkedMode) or Renderer holds `lastContentRegion`; update it after every full draw.

**Verification:**
- [ ] clearContentRegion(region) overwrites the rectangle with spaces
- [ ] Content region is derived from layout (block width, total height)
- [ ] lastContentRegion is updated after each full draw

### Step 3.2: Use clear-then-draw in full-redraw paths

**Location:** `src/modes/networkedMode.js` (render path).

**Action:**
1. In the **first render** branch (currently `previousState === null`): instead of `renderer.clearScreen()`, call `renderer.clearContentRegion(lastContentRegion)` (no-op first time since no previous region). Then draw title, board, status bar. Then set `lastContentRegion = getContentRegionFromLayout(layout)`.
2. In the **“too many changes”** full redraw branch: same—clear previous content region, then draw, then store new region.
3. Do **not** set `lastContentRegion = null` before drawing; only update it after a successful full draw.

**Verification:**
- [ ] First render: no previous region to clear; draw; store region
- [ ] Full redraw (too many changes): clear previous region, draw, store new region
- [ ] No full clearScreen() in these paths (startup clear is separate; resize still clears screen in handler)

**Commit:** e.g. `Rendering: Add content region tracking and clear-then-draw for full redraws`

---

**Phase 3 Completion Checklist:**
- [ ] Step 3.1 and 3.2 completed
- [ ] Full redraws clear previous content region then draw then store region
- [ ] No regressions

---

## Phase 4: Unified normal render path and resize fix (~40 min)

**Goal:** A single **normal render path** runs: size check → if terminal too small, show message and set “was too small” state; else clear previous content region (if any), draw content (title, board, status bar), store content region. This path is used for **first render** and for **resize debounce callback**. Resize no longer calls the incremental path, fixing the bug where the board does not appear after resize.

### Step 4.1: Extract or define normal render path

**Location:** `src/modes/networkedMode.js` (or a small helper used by it).

**Action:**
1. **Define** a function (e.g. `runNormalRenderPath()` or `fullRender()`) that:
   - Gets current terminal size and layout (computeLayout with current board dimensions).
   - If `!layout.fitsInTerminal`: call renderer’s “terminal too small” path (clear screen, show message), set `wasTooSmall = true`, return. Do not draw game content.
   - Else: call `renderer.clearContentRegion(lastContentRegion)`; then call `renderTitle`, `renderBoard`, `renderStatusBar` with current state and layout; set `lastContentRegion = getContentRegionFromLayout(layout)`; set `wasTooSmall = false` if desired when we successfully draw.
   - This path does **not** depend on `previousState`; it always does a full draw when the terminal fits.
2. **First render:** When we get the first state and need to paint (e.g. on first STATE_UPDATE), call `runNormalRenderPath()` instead of the current “if (previousState === null)” block. Then set `previousState = currentState`.
3. **Resize debounce callback:** When the resize debounce timer fires, call `runNormalRenderPath()` (and do **not** call the generic `render()` that might take the incremental path). Optionally also set `previousState = currentState` so the next state update still does change detection; or leave previousState as-is so the next state update does a full draw—either is acceptable as long as resize always gets a full draw.
4. **Too many changes:** When change count exceeds threshold, call `runNormalRenderPath()` instead of duplicating clear + draw logic. Then set `previousState = currentState`.

**Verification:**
- [ ] First render uses normal render path; board, title, status bar appear
- [ ] Resize: after debounce, normal render path runs → board, title, status bar appear again (resize bug fixed)
- [ ] “Too many changes” uses same path
- [ ] Incremental path still used for state-only updates when not resizing and change count below threshold

**Commit:** e.g. `Fix: Resize triggers full re-render via unified normal render path (fix BUG_resize_board_not_rendering)`

---

**Phase 4 Completion Checklist:**
- [ ] Step 4.1 completed
- [ ] Resize debounce callback invokes normal render path only
- [ ] Manual test: resize terminal → board reappears after debounce
- [ ] No regressions

---

## Phase 5: Terminal too small (wasTooSmall, two-line message) (~30 min)

**Goal:** When the terminal is too small, clear screen and show a **centered two-line message** (“terminal is too small” / “please resize”). Track **wasTooSmall**. When the terminal becomes large enough again, **clear screen once** then draw content and store region (so we don’t leave “too small” text on screen).

### Step 5.1: Two-line message and wasTooSmall

**Location:** `src/render/Renderer.js` (message), `src/modes/networkedMode.js` (wasTooSmall state).

**Action:**
1. **Renderer:** Add or adjust “terminal too small” so it shows two lines (e.g. “terminal is too small” and “please resize”), centered. Reuse or add a method that takes (terminalColumns, terminalRows) and draws both lines centered in the visible area.
2. **State:** In networked mode (or wherever the render path lives), add a boolean `wasTooSmall` (or `lastRenderWasTooSmall`). Set it to `true` when we show the “too small” message. Set it to `false` when we successfully run the normal render path (draw content).
3. **When large again:** In `runNormalRenderPath()`, when `layout.fitsInTerminal` and `wasTooSmall` was true, call `renderer.clearScreen()` once before drawing content (so we remove the “too small” message), then draw and store region, then set `wasTooSmall = false`.

**Verification:**
- [ ] When terminal is too small, two-line message is shown and wasTooSmall is set
- [ ] When user resizes so terminal is large enough, we clear screen once then draw; no leftover “too small” text
- [ ] Resize debounce still runs normal render path, so “large again” is handled there too

**Commit:** e.g. `Rendering: Terminal too small two-line message and clear-once when large again`

---

**Phase 5 Completion Checklist:**
- [ ] Step 5.1 completed
- [ ] wasTooSmall tracked and used for clear-once when large again
- [ ] No regressions

---

## Phase 6: Tests and verification (~30 min)

**Goal:** Automated tests for new behavior; manual verification of startup, resize, and too-small flows.

### Step 6.1: Unit tests

**Action:**
1. **Resize debounce config:** Test that CLI and env are parsed and precedence is correct (CLI → env → default 250); invalid values fall back without throwing.
2. **Startup clear:** Test that with a mock stream (rows, write, drain), startup clear writes the correct number of newlines and waits for drain when write returns false.
3. **Content region / clearContentRegion:** Test that a mock region is cleared (e.g. mock stdout and assert cursor positions and space writes, or test with a small buffer).
4. **Layout / getContentRegionFromLayout:** Test that the content region matches layout dimensions.

### Step 6.2: Manual verification

**Checklist:**
- [ ] **Startup:** Run client; previous shell output is scrolled away; first frame shows title, board, status bar only.
- [ ] **Resize:** Resize terminal; screen clears; after debounce delay, full game view reappears (title, board, status bar). No empty screen.
- [ ] **Terminal too small:** Make terminal smaller than minimum; “too small” message appears. Resize larger; screen clears once and game view appears.
- [ ] **Config:** `RESIZE_DEBOUNCE_MS=500` and `--resize-debounce=100`; verify 100 ms wins. Verify default 250 when neither set.

**Commit:** e.g. `Tests: Add tests for terminal rendering refactor (config, startup clear, content region)`

---

**Phase 6 Completion Checklist:**
- [ ] Unit tests added and passing
- [ ] Manual verification checklist completed
- [ ] No regressions

---

## Optional / Future

- **No newlines after startup (§3.1):** The spec says all updates after startup use cursor positioning and overwrite only. Currently the board is drawn with newlines at end of each row. A strict spec alignment would draw each cell with cursor-to + write (no `\n`). This can be a later refactor if desired; it may reduce flicker further and is not required to fix the resize bug.
- **LOG_FILE (§6.2):** Optional env `LOG_FILE` for appending timestamped log lines; implement when needed for debugging.

---

## Success Criteria (from spec §9, relevant subset)

- [ ] **Startup:** One-time newline scroll clears previous terminal content; first frame is not mixed with prior output.
- [ ] **Resize:** Each resize clears the screen; one full re-render after debounce. Board and UI reappear. RESIZE_DEBOUNCE_MS and --resize-debounce work; CLI overrides env; default 250 ms.
- [ ] **Terminal too small:** When too small, clear screen and show centered “too small” message (two lines). When resized to sufficient size, clear screen once then show content.
- [ ] **Clear-then-draw:** Full redraws clear the previous content region (spaces) then draw new content and store the new region.
- [ ] **Bug fixed:** After terminal resize, the game board (and title, status bar) consistently render (BUG_resize_board_not_rendering).

---

## Relation to Other Docs

| Document | Relation |
|----------|----------|
| `terminal-rendering_SPECS.md` | Target behavior for this refactor. |
| `current-vs-desired-rendering.md` | Gap analysis; use to double-check phases. |
| `BUG_resize_board_not_rendering.md` | Fixed by Phase 4 (unified normal render path for resize). |

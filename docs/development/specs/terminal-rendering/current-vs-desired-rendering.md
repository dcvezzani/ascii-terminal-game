# Current vs Desired Terminal Rendering

This document compares **current** terminal rendering behavior in the game client with the **desired** behavior defined in `terminal-rendering_SPECS.md`. Use it to plan refactors and fix the resize rendering bug.

---

## 1. Startup

| Aspect | Current | Desired (Spec §2) |
|--------|---------|-------------------|
| **One-time clear** | No dedicated startup clear. First paint happens on first `render()` after CONNECT/STATE_UPDATE: `renderer.clearScreen()` (ANSI `\x1b[2J` + cursor to 1,1). | **One-time clear by scrolling**: Write `'\n'.repeat(rows)` to stdout (rows from terminal size). Wait for `drain` if `stream.write()` returns false. This is the **only** time newlines are used to scroll. |
| **After startup** | Subsequent updates use cursor positioning and overwrite; also use `clearScreen()` on first render and when doing full redraws. | No scroll after startup. All updates use cursor positioning and overwrite only. |

---

## 2. Rendering – General

| Aspect | Current | Desired (Spec §3) |
|--------|---------|-------------------|
| **Scroll after startup** | We do not intentionally scroll; we use ANSI clear and cursor positioning. We do emit newlines when drawing the board (each row ends with `\n`). | **No newlines** to scroll after startup. All updates: move cursor (ANSI `\x1b[row;colH`) and write characters to overwrite. |
| **Content dimensions** | Application-defined (board width/height, title, status bar). Size check before draw: `layout.fitsInTerminal` (minColumns, minRows). | Same idea: app provides content rectangle; size check before drawing (§3.2). |
| **Centering** | When `centerBoard` is true: `computeLayout()` returns `startRow`, `startColumn`, `boardStartColumn`; title/board/status bar drawn at those positions. Block width = max(60, boardWidth). | Centered top-left for content rectangle: e.g. `startRow = floor((terminalRows - contentRows)/2) + 1`, `startCol = floor((terminalCols - contentCols)/2) + 1` (§3.3). |

---

## 3. Clear-then-draw on Content Change

| Aspect | Current | Desired (Spec §3.4) |
|--------|---------|---------------------|
| **When content changes** | **First render** (previousState === null): we call `clearScreen()` then draw title, board, status bar. **Incremental** path: we do *not* clear the whole content region; we only update changed cells (moved/joined/left players) and status bar. **Resize**: we clear the screen on resize, then when debounce fires we call `render()` — but we take the **incremental** path (because previousState !== null), so we **do not** redraw the full content. | **Clear-then-draw**: (1) Clear the **previous** content region (overwrite with spaces via cursor positioning). (2) Draw the new content at its (possibly new) position. (3) Store the new content region for the next clear. Do **not** clear "last drawn region" to null before re-rendering; avoid new content drawn on top of old when dimensions/position change. |
| **After resize** | Screen is cleared; then `render()` runs incremental only → **board does not redraw** (bug). | Resize triggers the **same** normal render path: size check → "too small" message or **clear region + draw content**. So resize always gets a full clear-then-draw. |

---

## 4. Terminal Too Small

| Aspect | Current | Desired (Spec §3.5) |
|--------|---------|---------------------|
| **When too small** | If `!layout.fitsInTerminal`: `renderer.renderTerminalTooSmallMessage(columns, rows, minColumns, minRows)` — clear screen, show one centered message (width or rows message). | Clear screen (e.g. ANSI `\x1b[2J\x1b[H`). Show centered message (e.g. two lines: "terminal is too small" / "please resize"). Store state as "too small" so next re-render clears screen first if size becomes sufficient. |
| **When large again** | We recompute layout each time; if fits we draw. We do not explicitly "clear screen once when coming from too small." | When terminal is large enough again: **clear screen once** if coming from "too small", then draw content and store the content region. |

---

## 5. Resize

| Aspect | Current | Desired (Spec §4) |
|--------|---------|-------------------|
| **Debounce** | On each resize: set `displayEmptyDuringResize = true`, `renderer.clearScreen()`, (re)set debounce timer (default 200 ms from `clientConfig.rendering.resizeDebounceMs`). | **Debounced** re-render (e.g. 250 ms default). Configurable via env `RESIZE_DEBOUNCE_MS` and/or CLI `--resize-debounce=N`; CLI overrides env. Default 250 ms. |
| **On every resize** | Clear the screen immediately; do **not** run full render yet. | **On every resize**: clear the screen immediately. Do **not** run the full render yet. |
| **When debounce fires** | We set `displayEmptyDuringResize = false` and call `render()`. **Bug**: `render()` does **incremental** path (because previousState !== null), so full content is never redrawn. | Invoke debounced function that runs the **normal render path**: size check → "too small" message **or** clear region + draw content. So resize always results in one **full** re-render after the delay. |
| **Initial render** | First render (previousState === null) is not debounced; it runs on first STATE_UPDATE. | Initial render on startup is not debounced; only resize-driven re-renders are debounced. |

---

## 6. Configuration

| Aspect | Current | Desired (Spec §6) |
|--------|---------|-------------------|
| **Resize debounce** | `clientConfig.rendering.resizeDebounceMs` (default 200). From config file / clientConfig.js. | Default 250 ms. Env `RESIZE_DEBOUNCE_MS`; CLI `--resize-debounce=N` (CLI overrides env). |
| **Debug** | Logger; no LOG_FILE in this spec. | Env `LOG_FILE`: when set, append timestamped log lines to that file. |

---

## 7. High-Level Flow

| Step | Current | Desired (Spec §7) |
|------|---------|-------------------|
| **Start** | Load clientConfig. Initialize WebSocket, Renderer, InputHandler. No CLI parsing for resize debounce. | Parse CLI (e.g. `--resize-debounce=N`). Resolve resize debounce (CLI → env → default). Initialize application state. |
| **Startup clear** | None (no newline scroll). First frame uses ANSI clear on first render. | Get terminal rows; write that many newlines; wait for drain if needed. |
| **Setup** | Attach resize handler (clear screen + debounced render). Attach input (InputHandler). | Attach resize handler (clear screen + debounced render). Attach input (TTY raw + readline). Error handlers on stdin and readline. |
| **First render** | On first STATE_UPDATE: size check → "too small" message or clearScreen + draw title/board/status bar. Store previousState. | Size check → "too small" message or clear-then-draw content. Store content region. |
| **On resize** | Clear screen, set displayEmptyDuringResize, debounce. When timer fires: displayEmptyDuringResize = false, **render()** — but render() does **incremental** path → **no full redraw** (bug). | Clear screen, debounce. When timer fires: run **normal render path** (size check → too small or **clear region + draw content**). |
| **On state update** | render() with full or incremental path depending on previousState and change count. | Application updates state and re-renders if needed; same clear-then-draw discipline when content/position changes. |

---

## 8. Summary of Gaps

1. **Resize does not trigger full redraw**  
   After resize, the code calls `render()` but uses the incremental path, so the full content (title, board, status bar) is never redrawn. **Fix**: After resize debounce, force the same full clear-then-draw path used on first render (or a dedicated "full content draw" path).

2. **No clear-then-draw discipline for content region**  
   We do not explicitly "clear the previous content region with spaces" before drawing new content; we use full `clearScreen()` on first render and on some fallbacks. The spec wants: clear *previous* content region (spaces), then draw new content, then store new region.

3. **Startup clear**  
   Spec uses one-time newline scroll for startup; we use ANSI clear on first render. Aligning with the spec would mean adding a startup newline scroll and avoiding newlines for board rows (cursor-position only) if we want strict no-scroll-after-startup.

4. **Resize debounce config**  
   Spec: env + CLI (default 250 ms). Current: client config file only (default 200 ms). Optional to add env/CLI.

5. **"Too small" → "large again"**  
   Spec: when becoming large again, clear screen once if coming from "too small", then draw. We don’t explicitly track "was too small" for that one-time clear.

---

## Reference

- **Target spec**: `docs/development/specs/terminal-rendering/terminal-rendering_SPECS.md`
- **Bug**: `docs/development/cards/bugs/BUG_resize_board_not_rendering.md`

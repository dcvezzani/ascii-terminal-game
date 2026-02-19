# Terminal App Base – Specification (No Carousel)

## Purpose

This specification describes **terminal rendering and interaction patterns** for applications that draw a single view in the terminal—for example **games**, dashboards, or single-scene viewers. It **excludes carousel/slideshow features** (no map list, next/previous, auto-advance). Use this as a base when building terminal apps that have their own content model and key bindings (e.g. game state, movement keys, quit).

Derived from the terminal-rendering reference and the screen-renderer prototype; carousel-specific behavior has been removed so the spec stays focused on startup, rendering, resize, and input infrastructure.

---

## 1. Overview

### 1.1 Scope

| Area | In scope |
|------|----------|
| **Startup** | One-time clear of previous terminal content (scroll with newlines); then no scroll. |
| **Rendering** | Single content view; centered when possible; clear-then-draw on update; no newlines after startup. |
| **Terminal too small** | Clear screen, show centered message; re-check on resize. |
| **Resize** | Clear on each resize; debounced single re-render; configurable delay (env/CLI). |
| **Input** | TTY raw keypresses + readline fallback; application-defined key bindings and actions; stream error handling. |
| **Configuration** | Resize debounce (env, CLI); optional debug file (LOG_FILE). No application-specific config file required. |
| **Debug** | Optional file logging when LOG_FILE is set. |

### 1.2 Out of scope

- **Carousel/slideshow**: No multi-item list, next/previous, or auto-advance. Content and navigation are defined by the application (e.g. one game screen, one dashboard).
- **Specific key bindings**: This spec does not define which keys do what; the application defines actions and key mappings (e.g. quit, move, pause).
- **Content format**: Content (e.g. game grid, ASCII art, UI) is defined by the application; this spec defines how to present it (centering, clear-then-draw, size check).

### 1.3 Target applications

- Terminal **games** (single view, game loop, custom keys).
- **Dashboards** or status views (single screen, refresh in place).
- **Single-scene** viewers or tools that render one logical view and respond to keys/resize.

---

## 2. Startup

### 2.1 One-time clear by scrolling

- **When**: Once, before the first content render.
- **How**: Get terminal height (rows) from the terminal size API (e.g. `process.stdout.rows` or `getTerminalSize(stream).rows`). Write `'\n'.repeat(rows)` to stdout.
- **Backpressure**: If `stream.write()` returns `false`, wait for the `'drain'` event before continuing.
- **Rule**: This is the **only** time the application uses newlines to cause scrolling. All subsequent output uses cursor positioning and overwriting only.

**Rationale**: Removes shell output and previous run from view so the first frame is clean. Avoiding scroll afterward keeps the view stable for games and real-time updates.

---

## 3. Rendering

### 3.1 No scroll after startup

- After the one-time startup clear, **do not** use newlines to scroll.
- All updates: move the cursor (e.g. ANSI `\x1b[row;colH`) and write characters to overwrite existing content.
- The application may redraw the same logical view (e.g. game frame) or change content (e.g. new screen); in all cases the viewport does not scroll.

### 3.2 Content and dimensions

- **Application-defined**: The app provides a content rectangle (e.g. game grid, text buffer): a width (columns) and height (rows), and a way to produce the lines/cells to draw.
- **Size check**: Before drawing, ensure `terminalColumns >= contentColumns` and `terminalRows >= contentRows`. If not, follow §3.4 (terminal too small).

### 3.3 Centering

- When the terminal is large enough, compute a **centered** top-left (row, col) for the content rectangle.
- Example (1-based): `startRow = floor((terminalRows - contentRows) / 2) + 1`, `startCol = floor((terminalCols - contentCols) / 2) + 1`. Document your coordinate convention.

### 3.4 Clear-then-draw on content change

- When content changes (e.g. new frame, new screen):
  - **Do not** clear “last drawn region” to null before re-rendering.
  - Re-render must: (1) clear the **previous** content region (overwrite with spaces using cursor positioning), (2) draw the new content at its (possibly new) position, (3) store the new content region (startRow, startCol, rows, cols) for the next clear.
- This avoids new content being drawn on top of old when dimensions or position change.

### 3.5 Terminal too small

- If `terminalColumns < contentColumns` OR `terminalRows < contentRows`:
  - Clear the screen (e.g. ANSI `\x1b[2J\x1b[H`).
  - Show a centered message (e.g. two lines: `terminal is too small` / `please resize`).
  - Store state as “too small” so the next re-render (e.g. after resize) clears screen first if size becomes sufficient.
- When the terminal is large enough again: clear screen once if coming from “too small”, then draw content and store the content region.

### 3.6 ANSI usage

- Use ANSI for: clear screen, cursor position, character output. No reliance on terminal scroll for normal operation.
- Row/column in cursor positioning are typically 1-based; document your convention.

---

## 4. Resize

### 4.1 Debounced re-render

- On terminal **resize**, **debounce** the re-render (e.g. 250 ms default) so rapid resize does not thrash.
- **Configurable**: Debounce delay via env `RESIZE_DEBOUNCE_MS` and/or CLI `--resize-debounce=N`; CLI overrides env. Default 250 ms when neither is set or both invalid.

### 4.2 Resize behavior

- On **every** resize event: clear the screen immediately. Do **not** run the full render yet.
- Invoke a **debounced** function that runs the normal render path (size check → “too small” message or clear region + draw content) after the delay. If another resize occurs before the delay elapses, reset the timer (trailing debounce).
- **Initial render** on startup is not debounced; only resize-driven re-renders are debounced.
- Do not use newlines to scroll on resize; use clear screen + cursor-based redraw.

---

## 5. Input

### 5.1 TTY vs non-TTY

- When **stdin is a TTY**: Use **raw mode** (`process.stdin.setRawMode(true)`), resume stdin, set encoding to `null` (for Buffers), and listen for `'data'` to get keypresses. Parse chunks into **application-defined actions** (e.g. quit, move, pause). The application decides which keys map to which actions.
- When **stdin is not a TTY** (e.g. run via `npm run` or in an IDE): Do not set raw mode. Use **line-based** input (e.g. Node `readline`): read lines and interpret them (e.g. “q” + Enter for quit). The application defines which line commands are supported.

### 5.2 Fallback when TTY does not deliver keypresses

- In some environments, stdin may be a TTY but keypresses are not delivered. **Recommendation**: When stdin is a TTY, attach **both** (1) a raw `'data'` listener and (2) a readline interface. Handle both: instant keys from `'data'` and line-based commands from readline, so the app works when the environment swallows raw keypresses.

### 5.3 Key/input parsing

- Parser should accept **Buffer or string** (stdin may emit either when readline is attached). Use a single “byte at index” helper (e.g. `buffer[i]` for Buffer, `buffer.charCodeAt(i)` for string) so comparisons to byte values work for both.
- **Application-defined**: Which key codes or line strings map to which actions (e.g. quit, move up/down/left/right, pause, confirm). This spec does not prescribe specific bindings.

### 5.4 Stream error handling

- Attach `'error'` listeners to the readline interface and to `process.stdin`. In the handler, log or ignore; do **not** rethrow. Avoids unhandled EIO (or similar) when the process is killed or stdin is closed and the user later presses a key in the terminal.

### 5.5 Quit (or other exit action)

- When the application’s “quit” (or exit) action is triggered: clear any timers (e.g. game loop, debounce), restore stdin (e.g. `setRawMode(false)` if it was set), then `process.exit(0)` (or the app’s exit path). Application may optionally clear the screen before exit.

---

## 6. Configuration

### 6.1 Resize debounce

- **Default**: 250 ms.
- **Env**: `RESIZE_DEBOUNCE_MS` (positive number, milliseconds).
- **CLI**: `--resize-debounce=N` (N in milliseconds). CLI overrides env when both apply.
- Invalid or missing values: fall back to next source, then default 250. Parsing must not crash the app.

### 6.2 Debug logging

- **Env**: `LOG_FILE`. When set to a path, append timestamped log lines to that file (e.g. TTY state, input path, key events, errors). When not set, no file logging.
- Implementation should not crash if the file cannot be written.

### 6.3 Application config (optional)

- The application may add its own config file, env vars, or CLI flags (e.g. game difficulty, theme). This base spec does not require them; document precedence (e.g. CLI over env over config file) if used.

---

## 7. High-Level Flow

1. **Start**: Parse CLI (e.g. `--resize-debounce=N`). Resolve resize debounce (CLI → env → default). Initialize application state (e.g. load level, set up game).
2. **Startup clear**: Get terminal rows; write that many newlines; wait for drain if needed.
3. **Setup**: Attach resize handler (clear screen + debounced render). Attach input (TTY raw + readline, or readline only). Error handlers on stdin and readline.
4. **First render**: Size check → “terminal too small” message or clear-then-draw content. Store content region.
5. **Run**: On input → application handles action (update state, re-render if needed). On resize → clear screen, debounced render. On quit action → restore TTY, exit. If the app has a loop (e.g. game loop), it drives re-renders; resize still uses the same debounced render.

---

## 8. Components (Suggested)

| Component | Responsibility |
|-----------|----------------|
| **Entry / CLI** | Parse argv (e.g. `--resize-debounce=N`). Resolve resize debounce. Start app. |
| **Terminal** | `getTerminalSize(stream)` → columns, rows. |
| **Layout** | Compute centered top-left for content rectangle in terminal. |
| **Renderer** | Clear screen, clear region (spaces), “terminal too small” message, draw content (cursor + output). Handle backpressure (drain). |
| **Debounce** | `debounce(fn, delayMs)` → trailing debounce; used for resize. |
| **Input** | TTY raw + readline; parse chunks/lines into application actions; error handling. |
| **Application** | Content model (e.g. game state), key/line bindings, render callback (what to draw), quit and other actions. |
| **Debug log** | When LOG_FILE set, append timestamped lines. |

---

## 9. Success Criteria

- [ ] **Startup**: One-time newline scroll clears previous terminal content; first frame is not mixed with prior output.
- [ ] **No scroll after startup**: All updates use cursor positioning and overwrite only.
- [ ] **Centering**: Content is centered when terminal is large enough (or positioned per application rules).
- [ ] **Clear-then-draw**: When content changes, the previous content region is cleared before the new content is drawn.
- [ ] **Terminal too small**: When terminal is too small, clear screen and show a centered “too small” message; when resized to sufficient size, show content again without scroll.
- [ ] **Resize**: Each resize clears the screen; one re-render after debounce (default 250 ms). RESIZE_DEBOUNCE_MS and --resize-debounce=N work; CLI overrides env.
- [ ] **Input**: Keys work when stdin is a real TTY; when not, or when TTY does not deliver keys, line-based input works. No unhandled stdin/readline errors after process kill.
- [ ] **Application actions**: Key bindings and actions (e.g. quit, move) are defined and implemented by the application.
- [ ] **Debug**: When LOG_FILE is set, log to file; when not set, no file logging.

---

## 10. Relation to Other Specs

| Spec | Relation |
|------|----------|
| **Terminal rendering reference** | This base spec is a subset: same startup, rendering, resize, and input *patterns*; no carousel, no prescribed keys. |
| **Screen renderer combined** | The combined spec adds carousel (map list, next/prev, auto-advance, config.json). Use the combined spec for the full screen-renderer app; use this base spec for games or other single-view apps. |
| **Terminal renderer** | Core rendering (centering, “too small”, clear-then-draw) aligns; this base spec generalizes content to “application-defined.” |

Use this document when building **terminal games** or other **single-view terminal applications** that need robust rendering and input without carousel behavior.

---

**End of terminal-app-base_SPECS.md**

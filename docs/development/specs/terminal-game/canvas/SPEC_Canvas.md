# Spec: Canvas (Terminal Viewport and Layout)

## Purpose

The **Canvas** determines how the title, board, and status bar are **organized and prepared** before anything is drawn. It represents the terminal viewport (dimensions, whether content fits, where the content block is placed), computes layout, and composes the content into a **prepared Canvas** that the [Renderer](../renderer/SPEC_Renderer.md) then renders to the terminal. It handles one-time startup clear, size checks, centering, resize debouncing, and the “terminal too small” condition. The Canvas does **not** draw to the terminal—it prepares; the Renderer renders.

**Consolidated from:** terminal-rendering_SPECS.md (§2 Startup, §3.2–3.5, §4 Resize, §8 Layout/Terminal), center-board-in-terminal_SPECS.md (layout formulas, resize).

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| Organizing and preparing title, board, status bar (composition) | Actual drawing to terminal (Renderer spec) |
| Terminal dimensions (columns, rows) | Key bindings (User Inputs spec) |
| One-time startup clear (newline scroll + drain) | Board data source (Board Parsing spec) |
| Size check: content fits in terminal | |
| Layout computation: startRow, startColumn, boardStartColumn | |
| Centering vs top-left placement (configurable) | |
| Resize: clear screen immediately, debounced re-render | |
| “Terminal too small” state and message trigger | |
| Producing the prepared Canvas for the Renderer | |

---

## 2. Startup

### 2.1 One-time clear by scrolling

- **When:** Once, before the first content render.
- **How:** Get terminal rows from terminal size API (e.g. `process.stdout.rows` or `getTerminalSize(stream).rows`). Write `'\n'.repeat(rows)` to stdout.
- **Backpressure:** If `stream.write()` returns `false`, wait for the `'drain'` event before continuing.
- **Rule:** This is the **only** time the application uses newlines to cause scrolling. All subsequent output uses cursor positioning and overwriting only.

---

## 3. Layout

### 3.1 Inputs

- `terminalColumns`, `terminalRows` — from `getTerminalSize()`.
- `boardWidth`, `boardHeight` — board dimensions in characters.
- `titleHeight` — lines used by title block (e.g. 2: one title line + one blank).
- `statusBarHeight` — lines used by the status bar (from Status Bar spec).
- Options: `centerBoard` (boolean, default true), optional constants (blank lines after title, before status bar).

### 3.2 Block dimensions

- **Block width:** `blockWidth = max(60, boardWidth)` (title and status bar are 60 chars; board may be narrower or wider).
- **Block height:** `blockHeight = titleHeight + boardHeight + blankBeforeStatusBar + statusBarHeight`.

### 3.3 Size check

- Before drawing: `terminalColumns >= contentColumns` and `terminalRows >= contentRows` (e.g. contentColumns = blockWidth, contentRows = blockHeight).
- If **not** satisfied: treat as “terminal too small” (see §5).

### 3.4 Centering (when `centerBoard === true`)

- **Start column (1-based):**  
  `startColumn = max(1, floor((terminalColumns - blockWidth) / 2) + 1)`
- **Start row (1-based):**  
  `startRow = max(1, floor((terminalRows - blockHeight) / 2) + 1)`

### 3.5 Board start column

- When `boardWidth < 60`: center board within the 60-character strip:  
  `boardStartColumn = startColumn + floor((60 - boardWidth) / 2)`
- When `boardWidth >= 60`: `boardStartColumn = startColumn`.

### 3.6 When `centerBoard === false`

- Top-left placement: `startColumn = 1`, `startRow = 1`. Block width and board offset logic still apply.

---

## 4. Resize

### 4.1 Debounced re-render

- On terminal **resize**: **debounce** the re-render (e.g. 250 ms default). Configurable via env `RESIZE_DEBOUNCE_MS` and/or CLI `--resize-debounce=N`; CLI overrides env.
- On **every** resize event: **clear the screen immediately**. Do **not** run the full render yet.
- Invoke a **debounced** function that runs the normal render path (size check → “too small” message **or** clear region + draw content) after the delay. Trailing debounce: if another resize occurs before the delay elapses, reset the timer.
- **Initial render** on startup is not debounced; only resize-driven re-renders are debounced.

---

## 5. Terminal too small

- If terminal is too small: clear the screen and show a centered message (e.g. two lines: “terminal is too small” / “please resize”). Store state as “too small.”
- When the terminal becomes large enough again: **clear screen once** if coming from “too small”, then draw content and store the content region (Renderer).

---

## 6. Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `rendering.centerBoard` | boolean | true | When true, center the game block; when false, top-left. |
| Resize debounce | number (ms) | 250 | Env `RESIZE_DEBOUNCE_MS`; CLI `--resize-debounce=N`. |

---

## 7. Success criteria

- [ ] One-time newline scroll at startup; first frame not mixed with prior output.
- [ ] Layout computes correct startRow, startColumn, boardStartColumn for any board dimensions that fit.
- [ ] Size check prevents drawing when terminal is too small; “too small” message shown.
- [ ] Resize: screen cleared immediately; one full re-render after debounce (no incremental-only path after resize).
- [ ] Resize debounce configurable via env and CLI.

---

## 8. Related specs

| Spec | Relation |
|------|----------|
| [Renderer](../renderer/SPEC_Renderer.md) | Renders the Canvas to the terminal; does not organize or prepare content. |
| [Game Title](../game-title/SPEC_Game_Title.md) | Title height and width (60) affect block dimensions. |
| [Game Board](../game-board/SPEC_Game_Board.md) | Board width/height are layout inputs. |
| [Status Bar](../status-bar/SPEC_Status_Bar.md) | Status bar height affects block height. |
| [Overall](../SPEC_Overall.md) | How Canvas fits in the terminal game stack. |

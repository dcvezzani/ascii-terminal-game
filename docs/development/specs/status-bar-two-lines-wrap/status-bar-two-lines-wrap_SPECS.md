# Specification: Status Bar (Two Lines, Wrap, Simplified for Narrow Boards)

## Overview

This specification defines the enhanced status bar at the bottom of the game window: two-line layout when the board is wide enough (score + position on line 1, instructions on line 2), with wrapping at spaces to stay within board width; a simplified one-line format for narrow boards; configurable width threshold in client config; and clean display when content shortens (no leftover text to the right).

**Purpose:** Improve readability and fit of the status bar across different board widths, keep instructions visible on wide boards, and avoid visual artifacts when score or position use fewer characters.

## Problem Statement

**Current behavior:**
- The client renders a single-line status bar via `Renderer.renderStatusBar(score, position, boardHeight)` in `src/render/Renderer.js`.
- Content: `Score: 0 | Position: (x, y) | Arrow keys/WASD to move, Q/ESC to quit`. No board width is passed; there is no wrapping or width-aware layout.
- On narrow boards the line can overflow or be cut off. When score or position shrink (e.g. 100 → 0), old characters can remain visible to the right.

**Impact:** Status bar overflows or is unreadable on narrow boards; no distinction between wide and narrow layouts; leftover text when dynamic content shortens.

## Solution Summary

1. **Full format (board width > threshold):** Two lines. Line 1 = Score + Position (dynamic). Line 2 = Instructions (static). If either line exceeds board width, wrap at spaces within segments.
2. **Simplified format (board width ≤ threshold):** One line only, e.g. `S: 0 | P: (10, 12)`. No instructions.
3. **Threshold:** Configurable in client config (default 25). When `board.width > threshold` use full format; when `board.width <= threshold` use simplified.
4. **Clean display:** When drawing a status line, clear to end of line (or overwrite with padding) only when that line is actually being updated, so that when content shortens, no old text remains. **Render only when necessary:** if no changes are apparent for a given line, do not clear or render that line.
5. **Caller contract:** `renderStatusBar` receives `score`, `position`, `boardWidth`, and `boardHeight`. Redraw when score or position changes; per-line rendering only when that line’s content changed or clear is needed.
6. **Instructions:** Fixed for MVP: `Arrow keys/WASD to move, Q/ESC to quit`.

---

## Data Model and Configuration

### Client config (status bar)

Config is read from `config/clientConfig.js` (which loads `config/clientConfig.json`). The following key is used for this feature. If missing, the default is used.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `statusBar.widthThreshold` | number | 25 | Board width cutoff. When `boardWidth > widthThreshold`, use full format (two lines). When `boardWidth <= widthThreshold`, use simplified format (one line). |

**Placement:** Under a `statusBar` object in the existing client config. Example `clientConfig.json`:

```json
{
  "websocket": { "url": "ws://localhost:3000" },
  "logging": { "level": "info" },
  "rendering": { ... },
  "statusBar": {
    "widthThreshold": 25
  }
}
```

Default in code (when `clientConfig.statusBar` or `clientConfig.statusBar.widthThreshold` is absent): **25**.

### Fixed strings (MVP)

- **Line 1 (full format):** `Score: ${score} | Position: (${x}, ${y})`. If position is null/undefined: `Position: (?, ?)`.
- **Line 2 (full format):** `Arrow keys/WASD to move, Q/ESC to quit`.
- **Simplified (one line):** `S: ${score} | P: (${x}, ${y})`. If position is null/undefined: `P: (?, ?)`.

---

## Functional Requirements

### 1. Format selection

- **Location:** Renderer (or a small helper used by the renderer).
- **Rule:** Compare `boardWidth` to threshold (from client config, default 25).
  - If `boardWidth > threshold`: use **full format** (two lines: score+position, then instructions).
  - If `boardWidth <= threshold`: use **simplified format** (one line: `S: 0 | P: (x, y)`).
- **Threshold source:** `clientConfig.statusBar?.widthThreshold ?? 25`.

### 2. Full format (two lines)

- **Line 1:** `Score: ${score} | Position: (${position.x}, ${position.y})` (or `Position: (?, ?)` if position is null/undefined). This line is **dynamic** — it changes when score or position changes.
- **Line 2:** `Arrow keys/WASD to move, Q/ESC to quit`. This line is **static** for MVP (fixed string).
- **Wrapping:** If line 1 or line 2 (as a single string) is longer than `boardWidth` characters, **wrap at spaces** within the string so that no wrapped line exceeds `boardWidth` characters. Break at space boundaries; do not break mid-word. If a single token (e.g. a long number) is longer than `boardWidth`, place it on its own line and accept that it may exceed width (edge case; MVP can break at spaces only). Result: one or more lines for line 1 content, one or more lines for line 2 content, each segment ≤ `boardWidth`.

### 3. Simplified format (one line)

- **Single line:** `S: ${score} | P: (${position.x}, ${position.y})` (or `P: (?, ?)` if position is null/undefined).
- No instructions. If this line exceeds `boardWidth`, wrap at spaces as above so all content stays within board width (rare for simplified form).

### 4. Clean display when content shortens / render only when necessary

- **Render only when necessary:** For each status bar line, **only render and/or clear that line when it is necessary** — i.e. when that line’s content has changed, or when the new content is shorter than the previous (so clear-to-end-of-line is required to remove leftover text). If no changes are apparent for a given line, do **not** clear or render it.
- When a line *is* updated: after writing the new content for that line, **clear to end of line** for that line so that no previous content remains to the right. Use ANSI "erase in line" after writing the status text, or overwrite to `boardWidth` with spaces. Requirement: when score or position use fewer digits (e.g. 100 → 0, or (10, 12) → (1, 2)), the *affected* line(s) are redrawn and cleared so no leftover characters remain.
- **Per-line rule:** Apply this logic to every logical line used by the status bar (one line in simplified mode, two or more in full format if wrapped). For each such line: only write and clear when that line’s content changed or when its new content is shorter than before; otherwise skip that line.

### 5. Positioning

- The status bar is drawn **below** the game board.
- **Vertical:** First line of the status bar starts at row `titleHeight + boardHeight + 1` (1-based). Title is 2 lines (title text + blank), so `titleHeight = 2`. Thus first status bar row = `2 + boardHeight + 1`.
- **Horizontal:** Start at column 1 (same as the board). No content may extend past column `boardWidth`.

### 6. Caller contract

- **Signature:** The renderer exposes a method (e.g. `renderStatusBar(score, position, boardWidth, boardHeight)`) that accepts:
  - `score` (number): current score.
  - `position` (object `{ x, y }` or null/undefined): current player position.
  - `boardWidth` (number): width of the board in characters (used for format selection, wrap, and clear width).
  - `boardHeight` (number): height of the board in lines (used for vertical positioning).
- **Callers** (e.g. `networkedMode.js`) must pass `board.width` and `board.height` (in addition to score and position) when calling the status bar render function. The renderer must receive client config (or the threshold value) to perform format selection; this may be passed in constructor or as an option.

### 7. When to redraw

- The status bar is **invoked** whenever **score** or **position** changes (so that line 1 in full format, or the single line in simplified format, can stay correct). Line 2 (instructions) is static and typically drawn once on first render.
- **Per-line rendering:** Only **render and/or clear a given line when necessary** — when that line’s content has changed, or when the new content is shorter and clear-to-end-of-line is needed. If a line’s content is unchanged, do not clear or render that line. So: line 1 (dynamic) is re-rendered only when score or position changed; line 2 (static) is rendered once (or when format/layout changes); wrapped continuation lines follow the same rule.

---

## Non-Functional Requirements

- **Deterministic:** Format selection and wrap are deterministic from `boardWidth`, threshold, score, and position.
- **Performance:** Building status strings and wrap segments is O(length of string). No full-screen redraw for status bar updates; only status bar lines that have changed (or need clearing) are written and cleared.
- **Config:** Threshold read from client config at render time (or when Renderer is constructed with config); no runtime config reload required for MVP.

---

## Implementation Details

### Files and responsibilities

- **`config/clientConfig.js` / `config/clientConfig.json`**
  - Support optional `statusBar.widthThreshold` (number, default 25). If `clientConfig.json` exists, add the key; in the fallback default object in `clientConfig.js`, add `statusBar: { widthThreshold: 25 }` so defaults work without a file.

- **`src/render/Renderer.js`**
  - **Constructor:** Accept config that may include `statusBar.widthThreshold` (or read from a shared client config). Store threshold for use in `renderStatusBar`.
  - **`renderStatusBar(score, position, boardWidth, boardHeight)`:**  
    - Resolve threshold: `this.config?.statusBar?.widthThreshold ?? 25`.  
    - Build the current status content (line 1, line 2, or simplified line; with wrap). Compare each logical line’s new content to the **previously rendered** content for that line (store last-rendered content per line, e.g. in instance state).  
    - **Only for lines that changed or shortened:** move cursor to that line’s row, write the new content, then clear to end of line (ANSI erase in line or spaces to `boardWidth`). Skip writing/clearing for lines whose content is unchanged.  
    - If `boardWidth > threshold`: line 1 (score + position), then line 2 (instructions). Line 2 is static — render once on first paint; on later calls, skip line 2 unless format/layout changed.  
    - If `boardWidth <= threshold`: single simplified line; update only when score or position changed.  
    - Use existing styling (e.g. `chalk.gray`) for status bar text.
  - **Clear to end of line:** When a line *is* updated, after writing its content send ANSI "Erase in Line" from cursor to end of line (or write spaces to `boardWidth`) so that no old content remains. Do not clear lines that are not being updated.

- **Callers (e.g. `src/modes/networkedMode.js`)**
  - When calling the status bar render function, pass `currentState.board.width` and `currentState.board.height` (in addition to score and position). Ensure the renderer instance has access to client config (e.g. Renderer is constructed with `clientConfig.rendering` and optionally `clientConfig.statusBar` or full `clientConfig` so it can read `statusBar.widthThreshold`).

### Wrap algorithm (at spaces)

- **Input:** A string (e.g. line 1 or line 2 content) and `maxWidth` (board width).
- **Output:** Array of strings, each of length ≤ `maxWidth`, with breaks only at space boundaries.
- **Algorithm:** Split string by spaces into tokens. Build lines by appending tokens with a space until adding the next token would exceed `maxWidth`; then start a new line. Single token longer than `maxWidth`: place on its own line (MVP: no mid-token break).
- **Usage:** For each logical line (line 1 content, line 2 content, or simplified line), run the wrap. Only if that line’s content changed (or shortened): for each resulting segment, write the segment, then clear to end of line. If the line is unchanged, skip it.

### ANSI "erase in line"

- Use `ansi-escapes` or equivalent: erase from cursor to end of line so that after writing status text, any previous content to the right is removed. Alternative: move to start of line, write spaces for `boardWidth` characters, then move back to start and write the new content (simpler but may flicker; erase in line is preferred).

---

## Testing Requirements

- **Format selection**
  - `boardWidth > threshold` (e.g. 30, threshold 25): full format used (two lines: score+position, then instructions).
  - `boardWidth <= threshold` (e.g. 25 or 20): simplified format used (one line: S: 0 | P: (x, y)).
  - Threshold from config: when `clientConfig.statusBar.widthThreshold` is set (e.g. 30), simplified is used for boardWidth 25; full for boardWidth 35.
  - Default: when config has no `statusBar` or no `widthThreshold`, default 25 is used.

- **Line content**
  - Full format line 1: "Score: 0 | Position: (10, 12)" (or (?, ?) when position is null).
  - Full format line 2: "Arrow keys/WASD to move, Q/ESC to quit".
  - Simplified: "S: 0 | P: (10, 12)" (or P: (?, ?) when position is null).

- **Wrapping**
  - Long line 1 or line 2 that exceeds `boardWidth`: wrapped at spaces; no segment exceeds `boardWidth`.
  - Very narrow board (e.g. width 10): simplified line may wrap; segments ≤ width.

- **Clean display**
  - When score changes from two digits to one (e.g. 10 → 0), or position from (10, 12) to (1, 2), the rendered output does not leave trailing digits or characters from the old value. (Test by rendering once with long content, then again with short content, and comparing the second output to a baseline that has no trailing text.)

- **Render only when necessary**
  - When `renderStatusBar` is called and a given line’s content is unchanged from the previous call, that line is not written and not cleared (no cursor move, no write, no erase for that line). Line 2 (instructions) in full format is not re-rendered on subsequent calls once it has been drawn. Line 1 (or simplified line) is re-rendered only when score or position changed.

- **Positioning**
  - First status bar line is at row `2 + boardHeight + 1`; second at `2 + boardHeight + 2`. Content starts at column 1; no character past column `boardWidth`.

- **Caller contract**
  - `renderStatusBar(score, position, boardWidth, boardHeight)` is called with all four arguments; renderer uses board dimensions and does not assume a fixed size.

- **Integration**
  - Networked mode: on first render and on state updates that change score or position, status bar updates and shows correct score/position; no leftover text when value shortens; two lines on wide board, one line on narrow board when threshold is 25 and board width is e.g. 20.

---

## Success Criteria

- When board width > threshold (default 25), status bar shows two lines: line 1 = Score + Position (dynamic), line 2 = Instructions (static). When board width ≤ threshold, status bar shows one line in simplified form (S: 0 | P: (x, y)).
- Threshold is configurable via client config (`statusBar.widthThreshold`), default 25.
- No status bar content extends past board width; wrapping breaks at spaces when a line would exceed board width.
- When score or position shorten, no old content remains visible to the right (clear to end of line).
- Only lines whose content changed (or that need clearing because content shortened) are rendered and cleared; unchanged lines are not written or cleared.
- Status bar is redrawn when score or position changes; callers pass `boardWidth` and `boardHeight`.
- Instructions string is fixed for MVP: "Arrow keys/WASD to move, Q/ESC to quit".
- All new and existing tests pass; no regressions in rendering or networked mode.

---

## Related Documents

- **Feature card:** `docs/development/cards/features/FEATURE_status_bar_two_lines_wrap.md`
- **Renderer:** `src/render/Renderer.js`
- **Networked mode:** `src/modes/networkedMode.js`
- **Client config:** `config/clientConfig.js`, `config/clientConfig.json`

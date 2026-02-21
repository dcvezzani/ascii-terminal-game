# Spec: Status Bar

## Purpose

The **Status Bar** is the area below the game board that shows score, position, and control instructions. It supports a two-line layout (score + position on line 1, instructions on line 2) when the board is wide enough, and a simplified one-line format for narrow boards. Content wraps at spaces to stay within board width; when content shortens, lines are cleared to end-of-line so no leftover text remains.

**Supersedes:** status-bar-two-lines-wrap_SPECS.md (removed); this spec is the single source of truth.

---

## Problem

A single-line status bar with no board-width awareness can overflow or be cut off on narrow boards, and when score or position use fewer characters (e.g. 100 → 0), old characters can remain visible to the right. The two-line/wrap/simplified behavior improves readability across board widths, keeps instructions visible on wide boards, and avoids leftover text when dynamic content shortens.

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| Format selection (full vs simplified by board width threshold) | Layout position (Canvas spec) |
| Line 1: Score + Position (dynamic); Line 2: Instructions (static) | Actual cursor/output (Renderer spec) |
| Wrap at spaces within board width | Key bindings text (fixed for MVP) |
| Clean display: clear to end of line when content shortens | |
| Per-line render only when that line's content changed | |

---

## 2. Data and configuration

### 2.1 Config

The threshold is read from client config (e.g. `config/defaults.js` or client config); resolve with `config?.statusBar?.widthThreshold ?? 25` when absent.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `statusBar.widthThreshold` | number | 25 | When `boardWidth > threshold` use full format (two lines). When `boardWidth <= threshold` use simplified (one line). |

**Example** (client config): `"statusBar": { "widthThreshold": 25 }`

### 2.2 Fixed strings (MVP)

- **Line 1 (full):** `Score: ${score} | Position: (${x}, ${y})`. If position is null/undefined: `Position: (?, ?)`.
- **Line 2 (full):** `Arrow keys/WASD to move, Q/ESC to quit`.
- **Simplified (one line):** `S: ${score} | P: (${x}, ${y})`. If position null: `P: (?, ?)`.

---

## 3. Format selection

- Compare `boardWidth` to threshold (from client config, default 25).
- If `boardWidth > threshold`: **full format** (two lines: score+position, then instructions).
- If `boardWidth <= threshold`: **simplified format** (one line).

---

## 4. Wrapping

- If a status line (as a single string) is longer than `boardWidth`, **wrap at spaces** so no wrapped segment exceeds `boardWidth`. Break at space boundaries; do not break mid-word. Single token longer than `boardWidth`: place on its own line (MVP: no mid-token break).

---

## 5. Clean display / render only when necessary

- For each status bar line: **only render and/or clear that line when necessary** — when that line's content has changed, or when the new content is shorter (so clear-to-end-of-line is required).
- When a line *is* updated: after writing the new content, **clear to end of line** (ANSI "erase in line" or spaces to `boardWidth`) so no previous content remains to the right.
- Line 2 (instructions) in full format is static — render once on first paint; on later calls, skip unless format/layout changed.

---

## 6. Positioning (contract)

- **Vertical:** First line of the status bar starts at row `startRow + titleHeight + boardHeight + blankBeforeStatusBar` (from Canvas).
- **Horizontal:** Start at column `startColumn`; no content may extend past column `startColumn + boardWidth - 1` (or the block width used for the status bar; see Canvas — status bar box is 60 chars when board width < 60).

---

## 7. Caller contract

- **Signature:** `renderStatusBar(score, position, boardWidth, boardHeight)` (and layout start row/column from Canvas).
- **Callers** must pass `boardWidth` and `boardHeight` so the renderer can select format and wrap. Redraw when score or position changes.
- The component that renders the status bar must have access to client config (or the threshold value) for format selection (e.g. via constructor or config).

---

## 8. Implementation notes

- **Threshold:** Resolve with `config?.statusBar?.widthThreshold ?? 25`.
- **Wrap:** Split at spaces; form segments ≤ `boardWidth`; break only at space boundaries. A single token longer than `boardWidth` stays on its own line (MVP: no mid-token break).
- **Clear:** When a line is updated, clear to end of line (ANSI "erase in line" or spaces to `boardWidth`) so no previous content remains.

---

## 9. Non-functional requirements

- **Deterministic:** Format selection and wrap are determined by `boardWidth`, threshold, score, and position.
- **Performance:** Only status bar lines that changed (or need clearing) are written and cleared; no full-screen redraw for status bar updates.
- **Config:** Threshold is read from config at startup/render; no runtime config reload required for MVP.

---

## 10. Testing requirements

- **Format selection:** boardWidth > threshold → full format; boardWidth ≤ threshold → simplified; threshold from config; default 25 when key absent.
- **Line content:** Full line 1/2 and simplified strings; null/undefined position shows `(?, ?)` or `P: (?, ?)`.
- **Wrapping:** Long line wraps at spaces; no segment exceeds `boardWidth`.
- **Clean display:** When score or position shorten, no trailing characters remain (clear to end of line).
- **Render only when necessary:** Unchanged line is not written or cleared; line 2 (instructions) is static, drawn once.
- **Caller:** `boardWidth` and `boardHeight` are passed; component has access to config for threshold.

---

## 11. Success criteria

- [ ] Full format when board width > threshold; simplified when ≤ threshold; threshold configurable (default 25).
- [ ] No content extends past board width; wrapping at spaces when needed.
- [ ] When score or position shorten, no old content remains (clear to end of line).
- [ ] Only lines whose content changed (or that need clearing) are written/cleared.

---

## 12. Related specs and implementation

| Spec / reference | Relation |
|------------------|----------|
| [Canvas](../canvas/SPEC_Canvas.md) | Provides start row/column; status bar height affects block height. Canvas implements `renderStatusBar`. |
| [Renderer](../renderer/SPEC_Renderer.md) | Draws the status bar at the given position; calls status bar logic. |
| [Overall](../SPEC_Overall.md) | How Status Bar fits in the terminal game stack. |
| `src/render/statusBarUtils.js` | Status bar helpers (wrap, format, height). |
| `src/modes/networkedMode.js` | Caller: passes score, position, board dimensions to status bar render. |
| `config/defaults.js`, client config | `statusBar.widthThreshold` (default 25). |
| Feature card (archived) | `FEATURE_status_bar_two_lines_wrap`. |

# Spec: Renderer

## Purpose

The **Renderer** renders the **Canvas** to the terminal. It does not compute layout or compose content (title, board, status bar)—the [Canvas](../canvas/SPEC_Canvas.md) determines how those are organized and prepared. The Renderer’s role is to output whatever the Canvas provides: clear-then-draw or incremental updates, using cursor positioning and ANSI escape codes without scrolling.

**Consolidated from:** terminal-rendering_SPECS.md (§3 Rendering, §8 Components), reduce-screen-flicker_SPECS.md, center-board-in-terminal (layout usage).

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| Rendering the Canvas to the terminal (whatever is in the Canvas) | Terminal size detection (Canvas spec) |
| Clear screen, clear content region (spaces), output prepared content | Layout computation (Canvas spec) |
| Cursor positioning (ANSI), overwrite-only after startup | Organizing or preparing content (Canvas spec) |
| Full render: clear region + draw the prepared Canvas | Content model (game state; application) |
| Incremental render: update only changed cells (when Canvas provides deltas) | Key bindings (User Inputs spec) |
| “Terminal too small” message (when Canvas reports too small) | Board data source (Board Parsing spec) |
| Backpressure (drain) when writing to stdout | |

---

## 2. Rendering Rules

### 2.1 No scroll after startup

- After the one-time startup clear (see [Canvas](../canvas/SPEC_Canvas.md)), **do not** use newlines to scroll.
- All updates: move the cursor (e.g. ANSI `\x1b[row;colH`) and write characters to overwrite existing content.
- Row/column in cursor positioning are typically **1-based**; document your convention.

### 2.2 Clear-then-draw on content change

When content changes (new frame, resize finished, first paint):

1. Clear the **previous** content region (overwrite with spaces via cursor positioning).
2. Draw the new content at its (possibly new) position.
3. Store the new content region (startRow, startCol, rows, cols) for the next clear.

Do **not** clear “last drawn region” to null before re-rendering; this avoids new content drawn on top of old when dimensions or position change.

### 2.3 Terminal too small

When the application determines the terminal is too small (see [Canvas](../canvas/SPEC_Canvas.md)):

- Clear the screen (e.g. ANSI `\x1b[2J\x1b[H`).
- Show a centered message (e.g. two lines: “terminal is too small” / “please resize”).
- When the terminal becomes large enough again: clear screen once if coming from “too small”, then draw content and store the content region.

### 2.4 ANSI usage

- Use ANSI for: clear screen, cursor position, character output.
- No reliance on terminal scroll for normal operation.

---

## 3. Full vs incremental render

### 3.1 Full render

- **When:** First render (`previousState === null`), resize (after debounce), “too many” changes (e.g. > 10), or error during incremental render.
- **What:** Clear previous content region (or full screen on first paint), then render the **prepared Canvas** to the terminal. The Canvas supplies the organized content and layout; the Renderer only outputs it.

### 3.2 Incremental render

- **When:** Subsequent state updates with a small number of changes (e.g. ≤ 10).
- **What:** Compare previous and current state; only update cells that changed (players moved, joined, left). Restore cell content when clearing a position (board cell, then other players, then entities). Update status bar only when score or relevant position changed.
- **Cell update:** `updateCell(x, y, character, color)` using cursor positioning and chalk for color.

### 3.3 Cell content resolution

When drawing or restoring a cell:

1. **Player** (highest priority) — if a player is at (x, y), draw player glyph/color.
2. **Entity** (if present).
3. **Board cell** (base character from board) — lowest priority.

---

## 4. Components (Renderer responsibilities)

| Responsibility | Description |
|----------------|-------------|
| Clear screen | ANSI clear; used on startup path, “too small”, resize. |
| Clear region | Overwrite previous content rectangle with spaces (cursor + write). |
| Render the Canvas | Output the prepared Canvas to the terminal (positioning and write). The Canvas determines what is drawn; Renderer does not compose title/board/status bar. |
| “Terminal too small” message | Centered message when Canvas reports terminal too small. |
| Incremental updates | When Canvas provides incremental data (e.g. changed cells), update only those cells. |
| Backpressure | If `stream.write()` returns `false`, wait for `'drain'` before continuing. |

---

## 5. Dependencies

- **Canvas:** The Renderer receives the **prepared Canvas** from the Canvas (organized content + layout). It does not compute layout, terminal size, or compose title/board/status bar—it only renders what the Canvas provides.
- **Config:** Rendering glyphs/colors may be used when outputting (e.g. player, wall, space); config can be supplied by the application or the Canvas along with the prepared content.

---

## 6. Success criteria

- [ ] All updates use cursor positioning and overwrite only (no scroll after startup).
- [ ] Clear-then-draw: previous content region cleared before new content is drawn.
- [ ] “Terminal too small”: show centered message when instructed; on resize to sufficient size, clear once then draw content.
- [ ] Full render used on first paint, after resize debounce, and when too many changes or on error.
- [ ] Incremental render updates only changed cells; cell restoration order correct (player → entity → board).
- [ ] Backpressure handled when writing to stdout.

---

## 7. Related specs

| Spec | Relation |
|------|----------|
| [Canvas](../canvas/SPEC_Canvas.md) | Organizes and prepares the Canvas; provides it to the Renderer for output. Size check, “too small” decision. |
| [Game Title](../game-title/SPEC_Game_Title.md) | Content used by Canvas to prepare the Canvas; Renderer does not consume directly. |
| [Game Board](../game-board/SPEC_Game_Board.md) | Content used by Canvas to prepare the Canvas; Renderer does not consume directly. |
| [Status Bar](../status-bar/SPEC_Status_Bar.md) | Content used by Canvas to prepare the Canvas; Renderer does not consume directly. |
| [Overall](../SPEC_Overall.md) | How Renderer fits in the terminal game stack. |

# Spec: Renderer

## Purpose

The **Renderer** renders the **Canvas** to the terminal. It does not compute layout or compose content (title, board, status bar)—the [Canvas](../canvas/SPEC_Canvas.md) determines how those are organized and prepared. The Renderer’s role is to output whatever the Canvas provides: clear-then-draw or incremental updates, using cursor positioning and ANSI escape codes without scrolling.

**Consolidated from:** terminal-rendering_SPECS.md (§3 Rendering, §8 Components; rendering and resize behavior), current-vs-desired-rendering.md (fully merged here), reduce-screen-flicker_SPECS.md (fully merged here), center-board-in-terminal (merged into [Canvas](../canvas/SPEC_Canvas.md)).

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

### 2.5 Resize

On each resize event the application clears the screen immediately; the full render is run only after the debounce delay. When the debounced callback runs, the Renderer is invoked with the **full** clear-then-draw path (same as first paint). Debounce timing and size check are defined in [Canvas](../canvas/SPEC_Canvas.md).

---

## 3. Full vs incremental render

**Why incremental:** Reduces flicker and terminal I/O by updating only changed cells instead of redrawing the full content on every state update. Full render remains for first paint, resize, large change sets, and errors.

### 3.1 Full render

- **When (fallback to full render):** First render (`previousState === null`), after resize (debounce), too many changes (e.g. configurable threshold > 10), or error during incremental render. The **post-resize frame** must use this full render path (clear region + draw content), not the incremental path.
- **What:** Clear previous content region (or full screen on first paint), then render the **prepared Canvas** to the terminal. The Canvas supplies the organized content and layout; the Renderer only outputs it.

### 3.2 Incremental render

- **When:** Subsequent state updates with a small number of changes (e.g. ≤ 10).
- **What:** The Renderer receives a **change object** (produced by the application or a utility such as `compareStates(previousState, currentState)`). Only update cells that changed (players moved, joined, left).
- **Process order:** Handle moved players first (clear old position, draw new), then joined (draw at position), then left (clear and restore position).
- **Cell restoration:** When clearing a position, restore the cell using the same priority as in section 3.4 (player → entity → board). A `restoreCellContent(x, y, ...)` helper can determine what to draw and use `updateCell` for the chosen character/color.
- **Status bar:** Update only when `scoreChanged` or when the local player's position changes (if applicable).
- **Local player:** When rendering from server state, the caller may pass players excluding the local player (e.g. by `localPlayerId`); the local player may be drawn separately (e.g. from client-side prediction).
- **Cell update:** `updateCell(x, y, character, color)` using cursor positioning and chalk for color.

### 3.3 Change detection and change object

The Renderer consumes a **change object**; it does not compare states itself. State comparison can live in a separate utility (e.g. `src/utils/stateComparison.js`).

**Change object shape:**

- `players.moved`: `Array<{ playerId, oldPos: {x,y}, newPos: {x,y} }>` — same player, position changed.
- `players.joined`: `Array<{ playerId, pos: {x,y}, playerName }>` — player in current state only.
- `players.left`: `Array<{ playerId, pos: {x,y} }>` — player in previous state only.
- `scoreChanged`: `boolean`.

### 3.4 Cell content resolution

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
- **Optional:** When `LOG_FILE` env is set, the application may append timestamped debug log lines (see Client or application config); the Renderer itself does not perform file logging.

---

## 6. Success criteria

- [ ] All updates use cursor positioning and overwrite only (no scroll after startup).
- [ ] Clear-then-draw: previous content region cleared before new content is drawn.
- [ ] “Terminal too small”: show centered message when instructed; on resize to sufficient size, clear once then draw content.
- [ ] Full render used on first paint and after resize debounce; post-resize frame must not use incremental path. Full render also when too many changes or on error.
- [ ] Incremental render updates only changed cells; cell restoration order correct (player → entity → board).
- [ ] Backpressure handled when writing to stdout.

---

## 7. Related specs

| Spec | Relation |
|------|----------|
| [Canvas](../canvas/SPEC_Canvas.md) | Organizes and prepares the Canvas; provides it to the Renderer for output. Size check, “too small” decision. Resize debounce and when to invoke full vs incremental are coordinated with Canvas (§4, §6). |
| [Game Title](../game-title/SPEC_Game_Title.md) | Content used by Canvas to prepare the Canvas; Renderer does not consume directly. |
| [Game Board](../game-board/SPEC_Game_Board.md) | Content used by Canvas to prepare the Canvas; Renderer does not consume directly. |
| [Status Bar](../status-bar/SPEC_Status_Bar.md) | Content used by Canvas to prepare the Canvas; Renderer does not consume directly. |
| [Overall](../SPEC_Overall.md) | How Renderer fits in the terminal game stack. |
| [Client](../client/SPEC_Client.md) | Incremental rendering and state comparison patterns (reference). |

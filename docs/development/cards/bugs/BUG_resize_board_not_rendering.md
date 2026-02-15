# Bug Report: Game Board Does Not Render After Terminal Resize

## Status
**OPEN**

## Bug Summary

When the user resizes the terminal window, the game board usually does not render. Sometimes a brief "blip" of the game board appears, but most of the time the terminal remains empty after resize.

## Context

**Feature**: Center Game Board in Terminal (ENHANCEMENT_center_board_in_terminal)  
**Location**: `src/modes/networkedMode.js` (resize handler, render path), `src/render/Renderer.js`  
**Related**: Resize handling clears the screen on each resize and uses a debounced callback to call `render()` when the debounce fires.

## The Bug

**Detailed Description**:

1. User resizes the terminal (e.g. drags the window edge).
2. The resize handler runs: screen is cleared, `displayEmptyDuringResize` is set to `true`, and a debounce timer is started.
3. When the debounce delay elapses, `displayEmptyDuringResize` is set to `false` and `render()` is invoked.
4. **Expected**: Full re-render (title, board, status bar) so the game appears again, centered in the new terminal size.
5. **Actual**: The board typically does not appear. Occasionally a small part of the content (e.g. a few cells or a brief flash) may appear, but the full game view is missing.

**Root Cause**:

After resize, `render()` is called but **does not perform a full redraw**. The render path treats this as a normal state update:

- `previousState !== null` (game has been running), so the code does **not** take the "first render" branch that does `clearScreen()` + `renderTitle()` + `renderBoard()` + `renderStatusBar()`.
- Instead it takes the **incremental render** path: it compares `previousState` to `currentState` and only updates *changed* cells (moved/joined/left players) and the status bar if score/position changed.
- The screen was already cleared on resize, so the incremental path only draws those deltas. The title, full board grid, and full status bar are never redrawn, leaving the screen mostly empty.

So the resize debounce correctly calls `render()`, but the render logic does not distinguish "render after resize" from "render after game state change". After a resize we need a **full** re-render (clear-then-draw of the entire content region), not an incremental update.

## How to Reproduce

1. Start the server and connect a client.
2. Confirm the game board, title, and status bar are visible.
3. Resize the terminal window (e.g. make it larger or smaller).
4. Wait for the debounce delay (default 200 ms) to pass.
5. **Observe**: The terminal usually remains empty (or only a small fragment of the board appears).

## Desired Behavior

- After terminal resize, once the debounce fires, the application performs a **full** re-render: clear (or clear content region), then draw title, board, and status bar at the new layout. The game view should appear again, centered (or positioned per layout) in the new terminal size.

## Possible Fixes

1. **Force full render after resize**: When the resize debounce fires, set a flag (e.g. `forceFullRenderAfterResize`) or temporarily set `previousState = null` so that the next `render()` call takes the full-render path (clear + title + board + status bar). Ensure layout is recomputed so content is centered in the new size.
2. **Align with terminal-rendering spec**: Refactor so that resize always triggers the same "normal render path" that does size check → clear-then-draw content (see `docs/development/specs/terminal-rendering/terminal-rendering_SPECS.md`). That may require a dedicated "full content draw" path that is used both on first render and on resize, separate from incremental updates.

## Related Documentation

- **Terminal rendering spec (target)**: `docs/development/specs/terminal-rendering/terminal-rendering_SPECS.md` — §4 Resize: clear on every resize, debounced single re-render; §3.4 clear-then-draw on content change.
- **Current vs desired rendering**: `docs/development/specs/terminal-rendering/current-vs-desired-rendering.md` (comparison document).

## Tags

- `bug`
- `rendering`
- `resize`
- `terminal`

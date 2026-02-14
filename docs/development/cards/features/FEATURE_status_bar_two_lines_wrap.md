# Feature Card: Status Bar (Two Lines, Wrap, Simplified for Narrow Boards)

## Context

**Current State**:
- The client has a status bar rendered at the bottom of the game window via `Renderer.renderStatusBar(score, position, boardHeight)` in `src/render/Renderer.js`.
- It is a **single line**: `Score: 0 | Position: (x, y) | Arrow keys/WASD to move, Q/ESC to quit`.
- The status bar does not receive **board width**; it only uses `boardHeight` for vertical positioning. There is no wrapping or width-aware layout.
- Rendering is used in networked mode (e.g. `src/modes/networkedMode.js`), which passes `currentState.board.height` but the board width is available from `currentState.board.width`.

**Location**:
- Client: `src/render/Renderer.js` (`renderStatusBar`), and any callers (e.g. `networkedMode.js`).

## Problem

- The status bar is one long line. On narrow terminals or narrow game boards, it can overflow or be cut off, and there is no guidance for new players if the instructions are not visible.
- There is no distinction between wide and narrow boards; a single format is used regardless of board width, which can make the status bar unreadable or spill outside the game “window” when the board is narrow.

## Desired Feature

A status bar at the bottom of the game window that:

1. **Full format (board width > threshold)**: Two lines.
   - **Line 1**: Score + Position (e.g. `Score: 0 | Position: (10, 12)`). Dynamic — updates when score or position changes.
   - **Line 2**: Instructions only (e.g. `Arrow keys/WASD to move, Q/ESC to quit`). Static for MVP.
   - If line 1 or line 2 exceeds board width, wrap at **spaces** within segments so content stays within the board.

2. **Simplified format (board width ≤ threshold)**: One line only, e.g. `S: 0 | P: (10, 12)`. No instructions. Used when the board is narrow so the status bar fits.

3. **Threshold**: The width cutoff between full (two-line) and simplified (one-line) format is **configurable in client config** (default 25).

4. **Confinement**: All status bar text must stay within the **game board width** (no characters past the right edge). When a line shortens (e.g. score or position uses fewer digits), the display must be **cleaned** so no old content remains to the right (e.g. clear to end of line).

## Requirements

### Functional Requirements

1. **Full format (two lines, when board width > threshold)**  
   - **Line 1 (dynamic)**: Score and position only, e.g. `Score: 0 | Position: (10, 12)`. Redraw when score or position changes.  
   - **Line 2 (static)**: Instructions only, e.g. `Arrow keys/WASD to move, Q/ESC to quit`. Fixed for MVP; may be made configurable later.  
   - If either line would exceed board width, **wrap at spaces** within segments so no line extends past the board width.

2. **Simplified format (one line, when board width ≤ threshold)**  
   Single line with abbreviated labels, e.g. `S: 0 | P: (10, 12)`. No instructions. Used so the status bar fits on narrow boards.

3. **Width threshold**  
   The cutoff between full (two-line) and simplified (one-line) format is **configurable in client config**, default **25**. When board width > threshold, use full format; when width ≤ threshold, use simplified.

4. **Clean display when content shortens**  
   When the rendered line becomes shorter (e.g. score goes from 100 to 0, or position uses fewer digits), **clear to end of line** (or equivalent) so that no old content remains visible to the right. Both status bar lines must be cleared/overwritten in a way that leaves no leftover text.

5. **Positioning**  
   The status bar is drawn **below** the game board, starting at the same column as the board (e.g. column 1). Vertical position uses title height + board height so the status bar sits at the bottom of the game “window.”

6. **Caller contract**  
   `renderStatusBar` (or equivalent) must receive **board width** and **board height** so it can choose full vs simplified, perform wrapping, and clear to board width. Callers (e.g. networked mode) must pass `board.width` and `board.height`.

7. **When to redraw**  
   Redraw the status bar when **score** or **position** changes (line 1 is dynamic). Line 2 is static and can be drawn once or redrawn with line 1 for simplicity; either way, both lines must be kept clean (no leftover content).

### Non-Functional Requirements

- Wrapping and format selection deterministic and simple; status bar updates only when score/position/state change.
- Performance: building the status string and wrap O(length of string); no impact on frame rate.

## Open Questions & Answers

1. **Exact layout of the two lines (full format)**  
   - Should line 1 be “Score + Position” and line 2 be “Instructions”? **Yes.**  
   - Wrap a single long line at board width? **No.**  
   - Prefer “score and position on line 1, instructions on line 2”? **Yes.**  
   - “One line that wraps wherever it fits”? **No.**  
   **Answer:** Line 1 = Score + Position; Line 2 = Instructions. No single-line wrap.

2. **Wrap strategy**  
   - Break only at `|` separators? **No, not necessarily.**  
   - Allow breaking at spaces within a segment? **Yes.**  
   - Strict character wrap at board width? **No.**  
   **Answer:** When wrapping is needed, break at spaces within segments.

3. **Simplified format and threshold**  
   - Simplified format: **one line** when board width ≤ threshold (e.g. `S: 0 | P: (10, 12)`). **Two lines** (full format) when width > threshold.  
   - Threshold 25: **Configurable in client config** (not fixed).  
   - Where: **Client config.**  
   **Answer:** Full format (two lines) when width > threshold; simplified (one line) when width ≤ threshold. Threshold configurable in client config, default 25.

4. **Instructions text**  
   **Answer:** Leave the instructions fixed for MVP (“Arrow keys/WASD to move, Q/ESC to quit”). A more dynamic or configurable approach can be considered later.

5. **Incremental updates**  
   **Answer:** Keep all dynamic content on line 1 (score, position). Line 2 (instructions) is static. Redraw the status bar when score or position changes so line 1 stays correct; line 2 can be drawn once or redrawn with line 1. No need to redraw line 2 for content change, but both lines must be kept clean (no leftover text when line 1 shortens).

## Related Features

- **X_FEATURE_mvp_multiplayer_game**: Client renderer and status bar exist; this feature enhances the status bar layout and behavior.
- **X_ENHANCEMENT_reduce_screen_flicker**: Incremental rendering; status bar updates should remain minimal (no full-screen redraw for status-only changes).

## Dependencies

- Existing `Renderer.renderStatusBar(score, position, boardHeight)` and its callers. No new dependencies on other features.

## Status

- **Status**: READY FOR IMPLEMENTATION
- **Priority**: LOW (UX improvement)
- **Created**: 2026-02-14

## Documentation

- **SPECS**: `docs/development/specs/status-bar-two-lines-wrap/status-bar-two-lines-wrap_SPECS.md` ✅ Created
- **GAMEPLAN**: `docs/development/gameplans/status-bar-two-lines-wrap/status-bar-two-lines-wrap_GAMEPLAN.md` ✅ Created

## Tags

- `feature`
- `status-bar`
- `renderer`
- `client`
- `ux`

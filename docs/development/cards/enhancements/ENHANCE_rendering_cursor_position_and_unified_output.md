# Enhancement Card: Rendering Cursor Position and Unified Output

## Status

- **Status**: COMPLETE
- **Priority**: MEDIUM (correctness and consistency)
- **Created**: 2026-02-16

## Documentation

- **SPECS**: `docs/development/specs/terminal-rendering/terminal-rendering_SPECS.md` (§3.6 Cursor position, §3.7 Unified output)
- **GAMEPLAN**: `docs/development/gameplans/rendering-cursor-position-and-unified-output/rendering-cursor-position-and-unified-output_GAMEPLAN.md` ✅ Created

## Context

**Current implementation**:
- Terminal rendering is done in `src/render/Renderer.js` using `this.stdout.write()` (cursor positioning, title, board, status bar, “terminal too small” message).
- After a full redraw (e.g. first frame, resize debounce, “too many changes”), the cursor is left at the **end of the last line** written (e.g. last status bar row or last board row).
- Some code paths (e.g. `src/utils/terminal.js`) use `console.warn` for terminal size warnings; other diagnostic or legacy paths may use `console.*`.
- Layout can be centered (content block has a computed `startRow`/`startColumn`), so the “start” of the logical frame is not necessarily at terminal (1,1). The cursor is not explicitly reset to a known position before or after each frame.

**References**:
- `docs/development/specs/terminal-rendering/terminal-rendering_SPECS.md`
- `docs/development/specs/terminal-rendering/newlines-audit-report.md`

## Problem

1. **Cursor not returned after render**  
   When a rendering action finishes for a given frame, the cursor is left at the end of the last line. Some terminals then show a new line on the next write or redraw, so content appears to be **added** instead of **replaced**, and the display can look like extra blank lines or scrolling.

2. **Cursor not guaranteed at frame start**  
   For some use cases, rendering may start without the cursor having been returned to a known position (e.g. home). That can cause the next frame to be drawn in the wrong place, again making content look appended rather than replaced.

3. **Mixed output mechanisms**  
   Using `console.log`, `console.warn`, or `console.error` anywhere in the render path or related helpers (e.g. terminal size checks) is inconsistent with a single, atomic “render via stdout” model. Console output can interleave with our cursor-based output and produce extra lines or confusing layout.

## Desired Enhancement

1. **Cursor at (0,0) after each frame**  
   When a rendering action finishes for a given frame, **always** place the cursor at a known position. Use **position (0,0)** in the application’s coordinate convention; in ANSI (1-based) terms that is **(1,1)** (home). This applies after every full redraw and after any atomic render that completes a frame (e.g. normal render path, “terminal too small” message).

2. **Frame content starts at (0,0)**  
   When rendering a frame, the **collective** content (title, board, status bar) should be considered to **start** at position **(0,0)** / **(1,1)**. That is:
   - Either the content block’s top-left is at (1,1), or
   - The cursor is moved to (1,1) (or the block’s start) **before** drawing the frame, so that every frame render begins from a well-defined position and never “appends” to an unknown cursor location.

3. **Unified output: no console.* for rendering**  
   All visible terminal output that is part of the “render” (title, game board, status bar, and any text messages such as “terminal too small”) must be done the **same way**:
   - **Do not** use `console.log`, `console.warn`, `console.error`, or any other `console.*` function for content that is part of the game frame or user-facing messages.
   - The atomic “render” should be done via **printf-style** output: i.e. writing to the same stream (e.g. `process.stdout` or the Renderer’s `this.stdout`) using `stream.write(...)` (cursor moves and text). So: one output channel, cursor positioning + write only; no console for render path.

4. **Diagnostics**  
   Any remaining use of `console.*` (e.g. for startup warnings) should be identified and either removed from the client render path or replaced with a single, explicit “diagnostic output” mechanism (e.g. logger or a dedicated stderr writer) that is clearly separate from the render stream, so that the rule “all rendering via stdout write” is easy to enforce and audit.

## Requirements

### Cursor position

- After every **full frame render** (normal render path, resize redraw, “too many changes” redraw): call a single helper (e.g. `renderer.moveCursorToHome()` or equivalent) so the cursor is at **(1,1)** (ANSI home) when the frame is done.
- After showing the **“terminal too small”** message: move the cursor to **(1,1)** so the next render or resize starts from a known position.
- **Before** starting to draw a frame (e.g. at the start of the normal render path), ensure the cursor is at the intended start position (e.g. home (1,1) or the content block’s top-left). If the previous frame always ended with cursor at (1,1), the next frame can start from there; otherwise, explicitly move to the frame start before drawing.

### Unified output

- **Renderer** and any code that contributes to the visible frame (title, board, status bar, “terminal too small” message) must use only `this.stdout.write(...)` (or the same stream) with ANSI cursor positioning and text. No `console.*` in the render path.
- **Client startup / helpers** (e.g. `src/utils/terminal.js`): Replace `console.warn` (e.g. terminal size warning) with either:
  - Logger (file-only in client), or
  - A single, explicit stderr writer used only for non-render diagnostics,
  so that no `console.*` is used for anything that could be confused with or interleave with the main render output.
- Document the rule: “All rendering is done via the Renderer’s stdout write; no console.* for frame or message content.”

### Layout / start position

- Keep existing layout (e.g. centered block) as-is; “start at (0,0)” means the logical frame origin (cursor at home or at block start before drawing). Centering can still compute `startRow`/`startColumn` from (1,1) as the reference.

## Benefits

- **Predictable display**: Cursor always at (1,1) after a frame avoids terminals “adding” a line on next keypress or redraw.
- **Replace instead of append**: Starting each frame from a known position ensures content is overwritten consistently, reducing stray blank lines or scroll-like behavior after resize or redraw.
- **Single output model**: All rendering via one stream and one method makes it easier to reason about and audit; no interleaving from console.*.
- **Easier debugging**: Clear separation between “render output” (stdout) and “diagnostics” (logger or explicit stderr) simplifies tracing and future tooling.

## Approach

1. **Renderer**
   - Add a method to move the cursor to home (1,1), e.g. `moveCursorToHome()` using `cursorTo(1, 1)`.
   - At the end of every path that completes a full frame: call `moveCursorToHome()` (after `renderTitle`/`renderBoard`/`renderStatusBar`, and after `renderTerminalTooSmallMessage`).
   - At the start of the normal render path (and any path that does a full draw), ensure cursor is at (1,1) or at the content block start before drawing (if not already guaranteed by previous frame).

2. **Call sites** (`networkedMode.js` or wherever the render path is invoked)
   - Ensure `runNormalRenderPath()` (and any other full-redraw path) does not return before the Renderer has moved the cursor to home; the Renderer can do it as the last step of each “complete frame” draw.

3. **Remove console.* from render path**
   - Audit `src/utils/terminal.js`, `src/render/*.js`, and client entry/mode code for `console.log`/`console.warn`/`console.error`.
   - Replace terminal-size or other user-facing warnings with logger (client logs to file) or an explicit stderr writer, and document that the render path uses only stdout write.

4. **Tests**
   - Add or update tests to assert that after a full render, the last write (or one of the last) is cursor-to-home, and that no console.* is used in the render path for frame or message content.

## Related Files

- `src/render/Renderer.js` – cursor home after frame; no console.*
- `src/modes/networkedMode.js` – ensure full redraw path ends with cursor at home (via Renderer)
- `src/utils/terminal.js` – replace `console.warn` with logger or explicit stderr
- `docs/development/specs/terminal-rendering/terminal-rendering_SPECS.md` – align with “no scroll after startup” and cursor-based updates
- `docs/development/specs/terminal-rendering/newlines-audit-report.md` – cursor position recommendation

## Dependencies

- Existing terminal rendering refactor (cursor positioning, clear-then-draw, no newlines after startup) should be in place.
- Logger configured for client (file-only) so that replacing `console.warn` does not add console output.

*(Documentation references are in the Status section above.)*

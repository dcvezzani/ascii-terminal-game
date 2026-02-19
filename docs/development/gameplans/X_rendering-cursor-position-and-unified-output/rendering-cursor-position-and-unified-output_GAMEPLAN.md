# Gameplan: Rendering Cursor Position and Unified Output

## Overview

This gameplan implements the enhancement in `ENHANCE_rendering_cursor_position_and_unified_output.md` and aligns behavior with the updated `terminal-rendering_SPECS.md` (§3.6 Cursor position, §3.7 Unified output). The result is: (1) the cursor is always moved to home (1,1) after each complete frame and after the “terminal too small” message, so the next frame replaces content instead of appending; (2) all rendering and user-facing messages use a single stream write only—no `console.*` in the render path.

**Approach:** Add `moveCursorToHome()` to the Renderer and call it at the end of every path that completes a frame (normal full draw, “terminal too small”, and the `render()` branch that shows “too small”). Optionally move cursor to home at the start of a frame draw for consistency. Replace `console.warn` in `terminal.js` with the logger so no console output is used in the client render/startup path.

**References:**
- `docs/development/specs/terminal-rendering/terminal-rendering_SPECS.md` (§3.6, §3.7)
- `docs/development/cards/enhancements/ENHANCE_rendering_cursor_position_and_unified_output.md`

## Progress Summary

- [x] **Phase 1: Cursor to home after each frame** - COMPLETE
- [x] **Phase 2: Cursor at frame start (optional hardening)** - COMPLETE
- [x] **Phase 3: Remove console.* from client render path** - COMPLETE
- [x] **Phase 4: Tests and verification** - COMPLETE

## Prerequisites

- [x] All existing tests passing (`npm test`)
- [x] Terminal rendering refactor in place (clear-then-draw, no newlines after startup, runNormalRenderPath, etc.)
- [x] Client logger configured (file-only) so replacing console.warn does not add console output

---

## Phase 1: Cursor to home after each frame (~25 min)

**Goal:** When a rendering action finishes for a given frame, the cursor is always at (1,1) (ANSI home). Applies after every full redraw and after showing the “terminal too small” message.

### Step 1.1: Add moveCursorToHome() to Renderer

**Location:** `src/render/Renderer.js`

**Action:**
1. Add a method `moveCursorToHome()` that writes `cursorTo(1, 1)` to `this.stdout` (ANSI 1-based home).
2. Export or keep as a public instance method so `networkedMode.js` (or any caller) can call it, or call it internally at the end of Renderer methods that complete a frame. Per the card, the **call sites** (e.g. `runNormalRenderPath`) will call it after a complete frame; so the Renderer only needs to expose the method.

**Verification:**
- [ ] Method exists and writes the same sequence as `cursorTo(1, 1)` (e.g. `\x1b[1;1H` or equivalent).
- [ ] No newlines or other output.

**Commit:** e.g. `Rendering: Add moveCursorToHome() to Renderer (spec §3.6)`

---

### Step 1.2: Call moveCursorToHome() at end of runNormalRenderPath

**Location:** `src/modes/networkedMode.js`

**Action:**
1. In `runNormalRenderPath()`:
   - In the **“terminal too small”** branch: after `renderer.renderTerminalTooSmallMessage(...)` and before `return false`, call `renderer.moveCursorToHome()`.
   - In the **full-draw** branch: after the last `renderer.renderStatusBar(...)` (and after setting `lastContentRegion`, `cachedLayout`, `renderer._currentLayout`), call `renderer.moveCursorToHome()` before `return true`.
2. Ensure no other early return in `runNormalRenderPath` skips the cursor-home call when that path completes a frame.

**Verification:**
- [ ] After a full draw (first frame, resize redraw, “too many changes”), cursor is at (1,1).
- [ ] After showing “terminal too small”, cursor is at (1,1).
- [ ] All tests pass.

**Commit:** e.g. `Rendering: Move cursor to home after each frame in runNormalRenderPath (spec §3.6)`

---

### Step 1.3: Call moveCursorToHome() in render() when showing “terminal too small”

**Location:** `src/modes/networkedMode.js`

**Action:**
1. In `render()`, there is a branch that checks `!layout.fitsInTerminal` and calls `renderer.renderTerminalTooSmallMessage(...)` then `return`. Before the `return`, call `renderer.moveCursorToHome()` so that path also leaves the cursor at home (this path is used when layout is computed but doesn’t fit, before first frame or when terminal is too small mid-session).

**Verification:**
- [ ] When terminal is too small and this branch runs, cursor is at (1,1) before returning.
- [ ] No regressions.

**Commit:** e.g. `Rendering: Move cursor to home after terminal-too-small message in render() (spec §3.6)`

---

**Phase 1 Completion Checklist:**
- [ ] moveCursorToHome() added and used in both “too small” and full-draw paths
- [ ] Cursor at (1,1) after every complete frame and after “terminal too small”
- [ ] No regressions

---

## Phase 2: Cursor at frame start (optional hardening) (~10 min)

**Goal:** Ensure every frame draw starts with the cursor at a known position (e.g. home). If the previous frame always ended with cursor at (1,1), the next frame can start from there; optionally call `moveCursorToHome()` at the start of the draw to be robust against any other code moving the cursor.

### Step 2.1: Move cursor to home at start of full draw in runNormalRenderPath

**Location:** `src/modes/networkedMode.js`

**Action:**
1. In `runNormalRenderPath()`, in the **full-draw** branch, immediately after determining `layout.fitsInTerminal` (and after `if (wasTooSmall) { renderer.clearScreen(); }` and `wasTooSmall = false`), and before `renderer.clearContentRegion(lastContentRegion)`, call `renderer.moveCursorToHome()`. This guarantees the frame always starts from (1,1) before drawing, so content is replaced consistently.

**Verification:**
- [ ] First draw and resize redraw still render correctly; no double-home needed if clearScreen already moves to (1,1)—moveCursorToHome() is idempotent.
- [ ] No regressions.

**Commit:** e.g. `Rendering: Move cursor to home at start of frame draw (spec §3.6 hardening)`

---

**Phase 2 Completion Checklist:**
- [ ] Cursor moved to home at start of full draw
- [ ] No regressions

---

## Phase 3: Remove console.* from client render path (~20 min)

**Goal:** All rendering and user-facing messages use a single stream write only. No `console.log`, `console.warn`, or `console.error` in the client render path or in helpers used at startup (e.g. terminal size check).

### Step 3.1: Replace console.warn in terminal.js with logger

**Location:** `src/utils/terminal.js`

**Action:**
1. **Audit:** The only `console.*` in the client render/startup path is `src/utils/terminal.js` line 13: `console.warn(...)` in `checkTerminalSize()`.
2. **Change:** Import the project logger (e.g. `import logger from './logger.js'` or the appropriate path). Replace `console.warn(...)` with `logger.warn(...)` using the same message (or a structured message). Ensure the logger is configured for the client (file-only) so this does not add console output when running the client.
3. **Note:** If `terminal.js` is used in a context where the logger is not yet configured, use a guard or ensure the client configures the logger before any code that calls `checkTerminalSize()` (this is already the case: `networkedMode` is entered after `configureLogger('client')` in `index.js`).

**Verification:**
- [ ] No `console.log`/`console.warn`/`console.error` remain in `src/utils/terminal.js`, `src/render/*.js`, or in the client entry/mode code paths that run before or during rendering.
- [ ] Terminal size warning still appears in log files when the terminal is too small (if logger level includes warn).
- [ ] No new console output when running the client.
- [ ] All tests pass.

**Commit:** e.g. `Rendering: Replace console.warn with logger in terminal.js (spec §3.7 unified output)`

---

### Step 3.2: Document the rule (optional)

**Location:** `docs/development/specs/terminal-rendering/spec-vs-implementation.md` or a short note in the spec

**Action:**
1. Add a one-line note: “All rendering is done via the Renderer’s stdout write; no console.* for frame or message content.” This can be in the spec-vs-implementation doc or in the terminal-rendering spec itself (already in spec §3.7).

**Verification:**
- [ ] Rule is documented where the team will see it.

**Commit:** Optional; can be folded into Step 3.1 commit.

---

**Phase 3 Completion Checklist:**
- [ ] No console.* in client render path or terminal.js
- [ ] Warnings go through logger (file-only in client)
- [ ] No regressions

---

## Phase 4: Tests and verification (~25 min)

**Goal:** Automated tests for cursor-to-home and no console in render path; manual verification of behavior.

### Step 4.1: Unit tests for moveCursorToHome and cursor after frame

**Location:** `test/render/Renderer.test.js`

**Action:**
1. **moveCursorToHome():**
   - Test that `renderer.moveCursorToHome()` writes the ANSI sequence for cursor to (1,1) (e.g. `\x1b[1;1H` or whatever `cursorTo(1, 1)` produces in the test environment). Mock stdout and assert the last write (or a write) contains that sequence.
2. **Cursor after full frame (integration-style):**
   - In a test that performs a full draw (e.g. renderTitle + renderBoard + renderStatusBar with layout), optionally call `moveCursorToHome()` after and assert that the mock stdout received a cursor-to-home write. Alternatively, add a test in `networkedMode.test.js` or a small render-path test that after “runNormalRenderPath” or equivalent, the renderer was asked to move to home (if the test has access to the renderer mock).

**Verification:**
- [ ] Tests pass; cursor-to-home is exercised.

**Commit:** e.g. `Tests: Add tests for moveCursorToHome and cursor after frame (spec §3.6)`

---

### Step 4.2: Assert no console.* in render path (optional)

**Action:**
1. Optionally add a test or a lint-style check: in the Renderer and in `terminal.js` (and any module used only by the client render path), ensure no direct call to `console.log`, `console.warn`, or `console.error`. This can be a simple grep in CI or a small test that imports the modules and checks they don’t assign or use `console` for output. If the team prefers to rely on code review and the spec, this step can be skipped.

**Verification:**
- [ ] No console.* in the files that are part of the render path (or test documents the rule).

**Commit:** Optional.

---

### Step 4.3: Manual verification

**Checklist:**
- [ ] **Full frame:** Run client; connect; confirm one clean frame. Resize the terminal; after debounce, confirm the frame redraws and no extra blank lines appear below. Cursor should be at home after each frame.
- [ ] **Terminal too small:** Make terminal too small; “terminal too small” message appears. Resize to sufficient size; frame redraws. No stray lines from console.
- [ ] **No console output:** Run client and perform resize and “too small” flow; confirm no unexpected lines in the terminal (only the game frame or the “too small” message).

**Commit:** e.g. `Docs: Update gameplan verification for cursor position and unified output`

---

**Phase 4 Completion Checklist:**
- [ ] Unit tests added and passing
- [ ] Manual verification checklist completed
- [ ] No regressions

---

## Completion Checklist (full gameplan)

- [ ] Phase 1–4 complete
- [ ] All tests pass (`npm test`)
- [ ] Spec §3.6 (cursor position) and §3.7 (unified output) satisfied
- [ ] Card `ENHANCE_rendering_cursor_position_and_unified_output.md` updated: Status set to COMPLETE; card file renamed to `X_ENHANCE_rendering_cursor_position_and_unified_output.md` when closing
- [ ] Gameplan directory renamed to `X_rendering-cursor-position-and-unified-output` when closing

---

## Success Criteria (from spec §9)

- [ ] **Cursor position:** Each frame starts from a known position; after each complete frame (full render, “terminal too small” message), the cursor is at home (1,1).
- [ ] **Unified output:** All rendering (title, board, status bar, messages) is done via a single stream write; no console.log, console.warn, or console.error for frame or message content.

---

## Relation to Other Docs

| Document | Relation |
|----------|----------|
| `terminal-rendering_SPECS.md` | Spec §3.6 (cursor position), §3.7 (unified output). |
| `ENHANCE_rendering_cursor_position_and_unified_output.md` | Enhancement card this gameplan implements. |
| `newlines-audit-report.md` | Recommends cursor-at-home after frame. |

# Gameplan: Status Bar (Two Lines, Wrap, Simplified for Narrow Boards)

## Overview

This gameplan breaks down the status bar feature into logical phases. Implementation follows Test-Driven Development (TDD): write tests first, run tests (expect failure), implement code to make tests pass, then commit after each step.

**Approach:** Add client config for the width threshold; implement a wrap-at-spaces utility and status line content builders (testable pure functions); extend the Renderer with the new `renderStatusBar(score, position, boardWidth, boardHeight)` behavior, last-rendered state, and render-only-when-necessary logic; update callers to pass board dimensions and statusBar config; add tests and verify.

**Reference:** `docs/development/specs/status-bar-two-lines-wrap/status-bar-two-lines-wrap_SPECS.md`

## Progress Summary

- [x] **Phase 1: Client config – statusBar.widthThreshold** – COMPLETE
- [x] **Phase 2: Wrap utility and status content builders** – COMPLETE
- [x] **Phase 3: Renderer – renderStatusBar signature, format selection, per-line update, clear to EOL** – COMPLETE
- [x] **Phase 4: Callers – boardWidth/boardHeight, statusBar config** – COMPLETE
- [x] **Phase 5: Tests and verification** – COMPLETE

## Prerequisites

- [x] All existing tests passing (`npm test`)
- [x] SPECS and feature card reviewed
- [x] Renderer and networkedMode existing (current single-line status bar in place)

---

## Phase 1: Client config – statusBar.widthThreshold (~15 min)

**Goal:** Add optional `statusBar.widthThreshold` to client config (default 25) so the Renderer can choose full vs simplified format.

### Step 1.1: Add statusBar to client config defaults and JSON support

**Location:** `config/clientConfig.js` (fallback default object). Optionally add to `config/clientConfig.json` if the file exists.

**Action (TDD):**
1. **Add tests** in `test/config/clientConfig.test.js` (create file if missing):
   - When config is loaded (or defaults used), `config.statusBar` is defined and `config.statusBar.widthThreshold` is a number (default 25).
   - When `clientConfig.json` includes `"statusBar": { "widthThreshold": 30 }`, the value 30 is used.
2. **Run tests** — expect failures (statusBar not in defaults yet).
3. **Implement:** In the fallback default object in `clientConfig.js`, add `statusBar: { widthThreshold: 25 }`. Ensure that when loading from JSON, the parsed object can contain `statusBar.widthThreshold` and it is preserved (no special merge needed if the whole config is replaced by the JSON).
4. **Run tests** — pass.

**Verification:**
- [x] `clientConfig.statusBar.widthThreshold` is 25 by default
- [x] When present in JSON, custom value is used
- [x] `npm test` passes for client config

**Commit:** e.g. `Feature: Add client config statusBar.widthThreshold (default 25)`

---

**Phase 1 Completion Checklist:**
- [x] Step 1.1 completed
- [x] Config tests passing
- [x] No regressions

---

## Phase 2: Wrap utility and status content builders (~30 min)

**Goal:** Implement pure functions: wrap a string at spaces to a max width; build line 1 string (score + position); build line 2 string (instructions); build simplified line. These will be used by the Renderer and are easy to unit test.

### Step 2.1: Wrap-at-spaces utility

**Location:** New file `src/render/statusBarUtils.js` (or `src/render/statusBar.js`). Export a function `wrapAtSpaces(str, maxWidth)` that returns an array of strings, each ≤ `maxWidth`, breaking only at spaces.

**Action (TDD):**
1. **Write tests** in `test/render/statusBarUtils.test.js`:
   - Short string (e.g. "Hi") with maxWidth 10 → `["Hi"]`.
   - Long string that fits on one line (length ≤ maxWidth) → one element.
   - String longer than maxWidth: split at spaces; each segment ≤ maxWidth (e.g. "Score: 0 | Position: (10, 12)" with maxWidth 15 → multiple segments).
   - Single token longer than maxWidth: that token is its own line (MVP: no mid-token break).
   - Empty string → `[""]` or `[]` (specify one; e.g. `[""]` for consistency).
2. **Run tests** — expect failures (module/function do not exist).
3. **Implement:** Split `str` by spaces; build lines by appending tokens with a space until adding the next would exceed `maxWidth`; then start a new line. Return array of lines.
4. **Run tests** — pass.

**Verification:**
- [x] `wrapAtSpaces(str, maxWidth)` returns array of strings, each ≤ maxWidth (except a single overlong token)
- [x] `npm test` passes for statusBarUtils

**Commit:** e.g. `Feature: Add wrapAtSpaces utility for status bar`

---

### Step 2.2: Status line content builders

**Location:** Same file `src/render/statusBarUtils.js`. Export: `buildLine1(score, position)`, `buildLine2()`, `buildSimplifiedLine(score, position)`. Use fixed strings from SPECS (line 1: "Score: X | Position: (x, y)" or "(?, ?)"; line 2: "Arrow keys/WASD to move, Q/ESC to quit"; simplified: "S: X | P: (x, y)" or "P: (?, ?)").

**Action (TDD):**
1. **Add tests:**
   - `buildLine1(0, { x: 10, y: 12 })` → `"Score: 0 | Position: (10, 12)"`; `buildLine1(0, null)` → contains "Position: (?, ?)".
   - `buildLine2()` → `"Arrow keys/WASD to move, Q/ESC to quit"`.
   - `buildSimplifiedLine(0, { x: 10, y: 12 })` → `"S: 0 | P: (10, 12)"`; with null position → contains "P: (?, ?)".
2. **Implement:** Three functions as above; position null/undefined → use (?, ?) in both full and simplified.
3. **Run tests** — pass.

**Verification:**
- [x] All three builders return correct strings per SPECS
- [x] `npm test` passes for statusBarUtils

**Commit:** e.g. `Feature: Add status bar line content builders (line1, line2, simplified)`

---

**Phase 2 Completion Checklist:**
- [x] Steps 2.1 and 2.2 completed
- [x] statusBarUtils tests passing
- [x] No regressions

---

## Phase 3: Renderer – renderStatusBar signature, format selection, per-line update, clear to EOL (~45 min)

**Goal:** Renderer accepts config that may include `statusBar.widthThreshold`; `renderStatusBar(score, position, boardWidth, boardHeight)` uses full vs simplified format based on threshold; builds wrapped lines; keeps last-rendered content per line; only writes and clears lines that changed or shortened; uses ANSI erase in line when updating a line.

### Step 3.1: Constructor and renderStatusBar signature

**Location:** `src/render/Renderer.js`.

**Action (TDD):**
1. **Add/update tests** in `test/render/Renderer.test.js`:
   - Constructor with `config.statusBar = { widthThreshold: 30 }`: stored (or threshold 30 used later). Default config (no statusBar): threshold 25 is used when calling renderStatusBar.
   - `renderStatusBar(score, position, boardWidth, boardHeight)` accepts four arguments; when called with e.g. `(0, { x: 10, y: 12 }, 30, 20)` it does not throw and uses boardWidth/boardHeight (can assert via stub stdout and check cursor position or written output includes "Score" for full format).
2. **Implement:** Ensure constructor stores `this.config` (already does). Add instance state for last-rendered lines, e.g. `this._lastStatusBarLines = null` or `this._lastStatusBarContent = {}`. Change `renderStatusBar(score, position, boardHeight)` to `renderStatusBar(score, position, boardWidth, boardHeight)`; if `boardWidth === undefined` treat as legacy and use a default (e.g. 80 or current single-line behavior) so existing callers don’t break until Phase 4. Or require boardWidth/boardHeight and update callers in same phase — SPECS say callers must pass them. Prefer: add required params and update callers in Phase 4; in Phase 3 just implement the new signature and use default threshold from config.
3. **Run tests** — pass.

**Verification:**
- [x] renderStatusBar(score, position, boardWidth, boardHeight) exists and uses boardWidth/boardHeight
- [x] Threshold from config or default 25
- [x] `npm test` passes for Renderer

**Commit:** e.g. `Feature: Renderer renderStatusBar(score, position, boardWidth, boardHeight), config.statusBar`

---

### Step 3.2: Format selection and line building with wrap

**Location:** `src/render/Renderer.js`.

**Action (TDD):**
1. **Add tests:**
   - When `boardWidth > threshold` (e.g. 30, threshold 25): output includes two logical lines (score+position on first, instructions on second). Use stub stdout and parse written chunks or cursorTo calls.
   - When `boardWidth <= threshold` (e.g. 20): output is simplified (e.g. "S: 0 | P: (10, 12)") and no instructions line.
   - When line 1 content is longer than boardWidth: wrapped at spaces; no segment exceeds boardWidth (check via wrapAtSpaces used or output length).
2. **Implement:** Resolve threshold `this.config?.statusBar?.widthThreshold ?? 25`. If `boardWidth > threshold`: line1Str = buildLine1(score, position), line2Str = buildLine2(); wrap each with wrapAtSpaces(..., boardWidth). If `boardWidth <= threshold`: simplifiedStr = buildSimplifiedLine(score, position); wrap if needed. Store result as array of logical lines (each logical line may be multiple physical lines after wrap). Do not yet implement "render only when necessary"; in this step just always write all lines (so tests can assume full redraw). Clear to end of line after each written line (ANSI erase in line).
3. **Run tests** — pass.

**Verification:**
- [x] Full format when boardWidth > threshold; simplified when <= threshold
- [x] Wrapping applied; segments ≤ boardWidth
- [x] `npm test` passes

**Commit:** e.g. `Feature: Status bar format selection and wrap (full vs simplified)`

---

### Step 3.3: Last-rendered state and render only when necessary

**Location:** `src/render/Renderer.js`.

**Action (TDD):**
1. **Add tests:**
   - First call to renderStatusBar: all lines (line 1 and, in full format, line 2) are written.
   - Second call with same score/position/boardWidth/boardHeight: no write for line 2 (static line unchanged); line 1 unchanged so no write for line 1 either (or only line 1 written once). Prefer: stub stdout, call renderStatusBar twice with same args; second call should not write line 2 content again (or total writes should be less). Easiest: assert that when score and position unchanged, the number of write calls is reduced (e.g. only cursor moves and clear, or nothing). Simpler test: call with (0, {x:1,y:1}, 30, 20) then with (0, {x:1,y:1}, 30, 20); second time line 1 content is same, line 2 is same — so implementation should skip both (or at least skip line 2). Assert stdout.write not called for line content on second call, or called only for line 1 once (if we consider "same content" as no change).
   - Call with score 10 then score 0 (position same): line 1 is updated and cleared (shorter); no leftover "10". Assert clear/erase happens and new content is "Score: 0 | ...".
2. **Implement:** Before writing, build current line contents (array of strings per logical line, with wrap). Compare each to `this._lastStatusBarContent[lineIndex]` (or similar). Only for lines where newContent !== lastContent or newContent.length < lastContent.length (shortened): move cursor to that line’s row(s), write each segment, clear to end of line. Store `this._lastStatusBarContent` = new content after this render. When format switches (full ↔ simplified), treat all lines as changed (reset or compare by layout).
3. **Run tests** — pass.

**Verification:**
- [x] Unchanged lines are not written/cleared on second call
- [x] When content shortens, line is redrawn and cleared to EOL
- [x] `npm test` passes

**Commit:** e.g. `Feature: Status bar render only when necessary, clear to EOL when updated`

---

**Phase 3 Completion Checklist:**
- [x] Steps 3.1–3.3 completed
- [x] Renderer uses statusBarUtils, threshold, last-rendered state, per-line update
- [x] No regressions

---

## Phase 4: Callers – boardWidth/boardHeight, statusBar config (~15 min)

**Goal:** Networked mode (and any other caller) passes `board.width` and `board.height` to `renderStatusBar`; Renderer receives config that includes `statusBar` so threshold is available.

### Step 4.1: Pass board dimensions and merge statusBar into Renderer config

**Location:** `src/modes/networkedMode.js`. Optionally `src/index.js` or other entry if they create a Renderer.

**Action (TDD):**
1. **Identify call sites:** All calls to `renderer.renderStatusBar(...)` must pass four arguments: score, position, boardWidth, boardHeight. Currently they pass (score, position, boardHeight) and no boardWidth.
2. **Add tests:** In integration or Renderer tests, assert that when Renderer is constructed with `{ ...rendering, statusBar: { widthThreshold: 25 } }`, renderStatusBar(0, {x:10,y:12}, 30, 20) produces full format. And when called with (0, {x:10,y:12}, 20, 20) produces simplified format.
3. **Implement:** In `networkedMode.js`, construct Renderer with config that includes statusBar: `const renderer = new Renderer({ ...clientConfig.rendering, statusBar: clientConfig.statusBar });`. At every call to `renderer.renderStatusBar(...)`, pass `currentState.board.width` and `currentState.board.height` as the third and fourth arguments (e.g. `renderer.renderStatusBar(score, position, currentState.board.width, currentState.board.height)`). Update any logic that triggers status bar redraw (e.g. when score or position changes) to pass board dimensions from current state.
4. **Run tests** — pass.

**Verification:**
- [x] Renderer is constructed with statusBar from client config
- [x] renderStatusBar is called with (score, position, boardWidth, boardHeight) everywhere
- [x] `npm test` passes
- [x] Manual: run client with wide and narrow board; status bar shows two lines vs one line

**Commit:** e.g. `Feature: Callers pass boardWidth/boardHeight and statusBar config to Renderer`

---

**Phase 4 Completion Checklist:**
- [x] All renderStatusBar call sites updated
- [x] Renderer receives statusBar config
- [x] No regressions

---

## Phase 5: Tests and verification (~25 min)

**Goal:** Ensure all SPECS testing requirements are covered; full test suite green; manual smoke check.

### Step 5.1: Format selection and line content tests

**Location:** `test/render/statusBarUtils.test.js`, `test/render/Renderer.test.js`.

**Action:**
- Format selection: boardWidth > threshold → full format (two lines); boardWidth <= threshold → simplified (one line). Threshold from config (e.g. 30) used when set.
- Line content: line 1 "Score: 0 | Position: (10, 12)" or "(?, ?)"; line 2 "Arrow keys/WASD to move, Q/ESC to quit"; simplified "S: 0 | P: (10, 12)" or "P: (?, ?)".

**Verification:** [x] All format and content cases covered and passing

---

### Step 5.2: Wrapping and clean display tests

**Location:** `test/render/statusBarUtils.test.js`, `test/render/Renderer.test.js`.

**Action:**
- Wrap: long line 1 or line 2 with boardWidth small → wrapped at spaces; no segment > boardWidth.
- Clean display: render once with score 10, position (10, 12); then render with score 0, position (1, 2); assert second render updates line 1 and clears to EOL (no leftover digits).
- Render only when necessary: two consecutive calls with same (score, position, boardWidth, boardHeight) → second call does not write line 2; and does not write line 1 if content identical.

**Verification:** [x] Wrap and clean-display tests pass

---

### Step 5.3: Positioning and caller contract

**Location:** `test/render/Renderer.test.js`.

**Action:**
- First status bar line at row `2 + boardHeight + 1`; second at `2 + boardHeight + 2`. Content starts at column 1. (Assert via cursorTo calls or written output structure.)
- renderStatusBar(score, position, boardWidth, boardHeight) is invoked with all four arguments in tests and in callers.

**Verification:** [x] Positioning and contract tests pass

---

### Step 5.4: Full suite and manual check

**Action:**
1. Run `npm test` — all tests pass.
2. Manual: start server and client; play with different board sizes (if configurable) or terminal width; confirm two-line status bar when wide, one-line when narrow; confirm no leftover text when score/position shorten.

**Verification:**
- [x] All automated tests pass
- [x] Manual: status bar layout and clean display as specified

---

**Phase 5 Completion Checklist:**
- [x] statusBarUtils and Renderer tests cover SPECS cases
- [x] Full test suite green
- [x] No regressions in rendering or networked mode

---

## Completion Checklist

- [x] Phase 1: Client config statusBar.widthThreshold
- [x] Phase 2: Wrap utility and status content builders
- [x] Phase 3: Renderer renderStatusBar (signature, format, per-line update, clear to EOL)
- [x] Phase 4: Callers pass boardWidth/boardHeight and statusBar config
- [x] Phase 5: Tests and verification
- [x] All tests passing (`npm test`)
- [ ] Feature card status updated when product complete (optional)
- [ ] Gameplan directory renamed with `X_` prefix when feature is closed (optional)

---

## Notes

- **ANSI erase in line:** Use `ansi-escapes` (e.g. `eraseLine`) or equivalent so that after writing a status line, cursor-to-end-of-line is erased. Prevents leftover text when content shortens.
- **Last-rendered storage:** Store by logical line index (0 = line 1 or simplified line, 1 = line 2 in full format). When format switches (e.g. board resized or threshold change), clear last-rendered so all lines are redrawn.
- **Line 2 static:** Line 2 is only drawn once in full format; on subsequent renderStatusBar calls with same format, skip line 2 unless layout/format changed.

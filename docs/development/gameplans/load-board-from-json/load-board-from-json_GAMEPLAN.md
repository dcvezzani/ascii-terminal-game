# Gameplan: Load Game Board from JSON

## Overview

This gameplan breaks down the load-board-from-JSON enhancement into logical phases. Implementation follows Test-Driven Development (TDD): write tests first, run tests (expect failure), implement code to make tests pass, then commit after each step.

**Approach:** Build the board loader and Board/Game wiring first, then integrate CLI and server startup. Add a default board file so the server can start without `--board`.

**Reference:** `docs/development/specs/load-board-from-json/load-board-from-json_SPECS.md`

## Progress Summary

- ✅ **Phase 1: Board Loader Module** - COMPLETE
- ✅ **Phase 2: Board.initializeFromGrid** - COMPLETE
- ✅ **Phase 3: Game / GameServer Accept Pre-built Board** - COMPLETE
- ✅ **Phase 4: Server CLI and Startup Integration** - COMPLETE
- ✅ **Phase 5: Default Board and Integration Verification** - COMPLETE

## Prerequisites

- [ ] All existing tests passing (`npm test`)
- [ ] Enhancement card and SPECS reviewed
- [ ] `boards/my-board.json` and dimensions config available (example; create `boards/my-board.config.json` with `{ "width": 60, "height": 25 }` if not present)

---

## Phase 1: Board Loader Module (~45 min)

**Goal:** Create a module that reads board JSON + dimensions config, validates, decodes RLE to a 2D grid, and returns `{ width, height, grid }`. No fallback; throw on any error.

### Step 1.1: Config path resolution and file read

**Location:** New file `src/board/boardLoader.js` (or `src/game/boardLoader.js`).

**Action (TDD):**
1. **Write tests** in `test/board/boardLoader.test.js` (or `test/game/boardLoader.test.js`):
   - `getConfigPath(boardFilePath)` returns path with extension replaced by `.config.json` (e.g. `boards/level.json` → `boards/level.config.json`).
   - `loadBoardFromFiles(boardFilePath)` when board file is missing: throws with a clear message (e.g. file not found).
   - `loadBoardFromFiles(boardFilePath)` when config file is missing: throws with a clear message.
2. **Run tests** — expect failures (module/function do not exist yet).
3. **Implement:** Create `boardLoader.js` with `getConfigPath(boardFilePath)` and `loadBoardFromFiles(boardFilePath)` that:
   - Resolve config path via `getConfigPath` (replace extension with `.config.json`).
   - Use `readFileSync` to read board file and config file (UTF-8).
   - If either file is missing, throw `Error` with message including the path.
4. **Run tests** — expect pass for config path and missing-file cases.

**Verification:**
- [x] `boardLoader.js` created with `getConfigPath` and `loadBoardFromFiles`
- [x] Test file created; tests for config path and missing files
- [x] `npm test` passes

**Commit:** e.g. `Enhancement: Add board loader module (config path, file read, missing file throws)`

---

### Step 1.2: Parse JSON and validate dimensions config

**Action (TDD):**
1. **Add tests:**
   - Invalid JSON in board file (e.g. `{` only): throws with clear message.
   - Invalid JSON in config file: throws with clear message.
   - Config missing `width`: throws.
   - Config missing `height`: throws.
   - Config `width` or `height` not a number or < 1: throws.
   - Valid config (numbers ≥ 1): parsed and used (next step will use them).
2. **Implement:** In `loadBoardFromFiles`, after reading files:
   - `JSON.parse` board content and config content; on syntax error, throw with message.
   - Validate config: require `width` and `height` to be numbers ≥ 1; otherwise throw with clear message.
   - Store `width` and `height` for use in decode step.
3. **Run tests** — pass.

**Verification:**
- [x] JSON parse and config validation in loader
- [x] Tests for invalid JSON and invalid/missing width/height
- [x] `npm test` passes

**Commit:** e.g. `Enhancement: Board loader parse JSON and validate dimensions config`

---

### Step 1.3: Decode RLE and validate entities / cell count

**Action (TDD):**
1. **Add tests:**
   - Valid board + config: `loadBoardFromFiles` returns `{ width, height, grid }`; `grid` is 2D array; dimensions match; entity 0 → `' '`, 1 → `'#'`, 2 → `' '`.
   - Board entry with `entity: 3` (or -1, or "1"): throws and message includes invalid value.
   - Board entry with `repeat: 0` or negative: throw (invalid repeat).
   - Decoded cell count &lt; width×height: throws with clear message.
   - Decoded cell count &gt; width×height: throws with clear message.
   - Single-cell entry without `repeat`: decodes correctly.
2. **Implement:** Decode RLE:
   - Iterate board array; for each entry read `entity` and `repeat` (default 1).
   - Validate `entity` is 0, 1, or 2; else throw with value in message.
   - Validate `repeat >= 1` if present.
   - Map entity to char: 0 → `' '`, 1 → `'#'`, 2 → `' '`.
   - Flatten to 1D list of characters, then chunk into rows of length `width`, number of rows `height`.
   - If total decoded cells !== width×height, throw with clear message.
   - Return `{ width, height, grid }` where `grid[y][x]` is the character.
3. **Run tests** — pass.

**Verification:**
- [x] RLE decode and entity/cell-count validation in loader
- [x] Tests cover valid decode, invalid entity, invalid repeat, cell count mismatch
- [x] `npm test` passes

**Commit:** e.g. `Enhancement: Board loader RLE decode and validation (entity 0/1/2, cell count)`

---

**Phase 1 Completion Checklist:**
- [x] All steps 1.1–1.3 completed
- [x] All loader tests passing
- [x] No regressions in existing tests

---

## Phase 2: Board.initializeFromGrid (~20 min)

**Goal:** Add `initializeFromGrid(grid)` to `Board` so a pre-decoded 2D grid can be set without calling the hard-coded `initialize()`.

### Step 2.1: Add initializeFromGrid and tests

**Location:** `src/game/Board.js`.

**Action (TDD):**
1. **Write tests** in `test/game/Board.test.js`:
   - After `board.initializeFromGrid(grid)` with a valid grid (e.g. 2×2), `getCell(x, y)` returns the character at that position.
   - `isWall(x, y)` returns true only where grid has `'#'`.
   - `serialize()` returns a copy of the grid with same dimensions and contents.
   - Grid dimensions must match `board.width` and `board.height` (loader guarantees this; Board can assume valid input or throw if dimensions don’t match — specify in SPECS: caller ensures match; optional: Board throws if grid.length !== height or row length !== width).
2. **Implement:** Add `initializeFromGrid(grid)` that sets `this.grid = grid` (or a copy if you want to avoid mutation from outside). Do not change `getCell`, `isWall`, or `serialize`.
3. **Run tests** — pass.

**Verification:**
- [x] `Board.initializeFromGrid(grid)` implemented
- [x] Tests for getCell, isWall, serialize after initializeFromGrid
- [x] `npm test` passes

**Commit:** e.g. `Enhancement: Board.initializeFromGrid(grid) for JSON-loaded boards`

---

**Phase 2 Completion Checklist:**
- [x] Step 2.1 completed
- [x] All Board tests passing
- [x] No regressions

---

## Phase 3: Game / GameServer Accept Pre-built Board (~30 min)

**Goal:** Allow server to pass a pre-built `Board` (from loader) into `Game`, and a pre-built `Game` into `GameServer` / `Server`, so the server uses the loaded board instead of creating one from dimensions.

### Step 3.1: Game constructor accepts optional Board

**Location:** `src/game/Game.js`.

**Action (TDD):**
1. **Write tests** in `test/game/Game.test.js`:
   - `new Game(20, 20)` still works: board is 20×20 and initialized (existing behavior).
   - `new Game(board.width, board.height, board)` with a Board instance: `game.board` is that instance; dimensions and grid match the passed board.
2. **Implement:** In `Game` constructor, if third argument `board` is provided and is a Board instance, set `this.board = board`. Otherwise create `new Board(boardWidth, boardHeight)` and call `this.board.initialize()` as today.
3. **Run tests** — pass.

**Verification:**
- [x] Game constructor accepts optional third argument (Board)
- [x] Existing Game(dimensions) behavior unchanged
- [x] `npm test` passes

**Commit:** e.g. `Enhancement: Game constructor accepts optional pre-built Board`

---

### Step 3.2: GameServer and Server accept optional Game (or board dimensions + Board)

**Location:** `src/server/GameServer.js`, `src/server/server.js`.

**Action (TDD):**
1. **Write tests** (in existing server test files or new):
   - `GameServer` constructed with a `Game` instance uses that game (e.g. `gameServer.game.board.width` matches the game’s board).
   - `Server` constructed with port and a `Game` instance passes that game to GameServer (or equivalent so broadcast state uses the game’s board).
   - Backward compatibility: `GameServer(boardWidth, boardHeight)` and `Server(port, boardWidth, boardHeight)` still work (create Game internally as today).
2. **Implement:**
   - **GameServer:** Change constructor to accept either `(boardWidth, boardHeight)` or `(game)` where `game` is a `Game` instance. If `game` is provided, set `this.game = game`; else `this.game = new Game(boardWidth, boardHeight)` as today.
   - **Server:** Change constructor to accept either `(port, boardWidth, boardHeight)` or `(port, game)`. If second argument is a `Game` instance, pass it to GameServer; else pass boardWidth and boardHeight. Ensure `serializeState()` and all game logic use the injected game/board.
3. **Run tests** — pass.

**Verification:**
- [x] GameServer and Server accept optional Game
- [x] Backward compat for (width, height) and (port, width, height)
- [x] `npm test` passes

**Commit:** e.g. `Enhancement: GameServer and Server accept optional Game instance`

---

**Phase 3 Completion Checklist:**
- [x] Steps 3.1–3.2 completed
- [x] All game/server tests passing
- [x] No regressions

---

## Phase 4: Server CLI and Startup Integration (~30 min)

**Goal:** Server entry point parses `--board <path>`, loads board via loader, creates Board + Game, and starts Server with that Game. On load error: log and exit (no fallback).

### Step 4.1: Parse --board from argv and resolve default path

**Location:** `src/server/index.js` (or a small helper used by it).

**Action (TDD):**
1. **Add tests** (e.g. unit test for a `parseBoardPath(argv)` helper, or integration test that mocks loader):
   - `parseBoardPath(['node', 'index.js', '--board', 'boards/foo.json'])` returns `'boards/foo.json'`.
   - `parseBoardPath(['node', 'index.js'])` returns default `'./boards/classic.json'` (or agreed default).
2. **Implement:** Parse `process.argv` for `--board <path>`. If present, use the next argument as board path. If not present, use default `./boards/classic.json`. Export or use this in startup.
3. **Run tests** — pass.

**Verification:**
- [x] CLI parsing returns correct path (explicit or default)
- [x] `npm test` passes

**Commit:** e.g. `Enhancement: Parse --board from server argv, default boards/classic.json`

---

### Step 4.2: Startup: load board, create Board + Game, start Server; exit on error

**Location:** `src/server/index.js`.

**Action (TDD):**
1. **Add tests** (integration or with mocks):
   - When board path points to valid board + config: server starts (or loader returns data and Board/Game are created — test the wiring, not necessarily full listen).
   - When board path points to missing file: `loadBoardFromFiles` throws; startup catches, logs, and exits with non-zero (e.g. `process.exit(1)`). Test by invoking startup with invalid path and asserting exit code or thrown error.
2. **Implement:** In server startup (e.g. `startServer()` or the block that runs when file is executed):
   - Resolve board path (from Step 4.1).
   - Call `loadBoardFromFiles(boardPath)` in try/catch. On throw: log error message, call `process.exit(1)`.
   - On success: create `Board(width, height)`, call `board.initializeFromGrid(grid)`.
   - Create `Game(width, height, board)` (or equivalent).
   - Create `Server(port, game)` and start as today (e.g. `await server.start()`).
3. **Run tests** — pass.

**Verification:**
- [x] Server startup uses loader; on success creates Board + Game and starts with that Game
- [x] On loader throw: log and exit(1); no fallback to hard-coded board
- [x] `npm test` passes

**Commit:** e.g. `Enhancement: Server startup loads board from JSON, exits on error`

---

**Phase 4 Completion Checklist:**
- [x] Steps 4.1–4.2 completed
- [x] Server starts with loaded board when valid path given
- [x] Server exits on missing/invalid board (no fallback)
- [x] No regressions

---

## Phase 5: Default Board and Integration Verification (~25 min)

**Goal:** Provide a default board file so that when `--board` is omitted the server can start. Verify end-to-end: server with `--board`, server without `--board` (default), and client receives correct layout.

**Dimensions note:** Width and height are always from the dimensions config (not hard-coded). The default classic board uses **60×25** (project default for now). Tests use 20×20 or other sizes only as fixtures; they do not dictate runtime dimensions.

### Step 5.1: Add default board and config (classic 60×25)

**Location:** `boards/classic.json`, `boards/classic.config.json`.

**Action:**
1. Create `boards/classic.config.json` with `{ "width": 60, "height": 25 }`.
2. Create `boards/classic.json` with run-length encoded cells for a 60×25 board: perimeter walls (entity 1), interior empty (entity 0). Row-major; total 1500 cells. Example: first row 60 walls, rows 2–24 each have 1 wall + 58 empty + 1 wall, last row 60 walls. Use `repeat` where run length > 1; omit `repeat` for single cells.
3. Optionally add a test that `loadBoardFromFiles('boards/classic.json')` returns width 60, height 25, grid 60×25 with walls on perimeter and spaces inside.

**Verification:**
- [x] `boards/classic.json` and `boards/classic.config.json` exist
- [x] Loader returns correct dimensions and grid for classic board (60×25)
- [x] `npm test` passes

**Commit:** e.g. `Enhancement: Add default board boards/classic.json (60×25)`

---

### Step 5.2: Integration and manual verification

**Action:**
1. Run server without `--board`: `npm run server` (or `node src/server/index.js`). Expect server to start using `boards/classic.json`.
2. Run server with `--board boards/my-board.json`: expect server to start with 60×25 board (if my-board.config.json exists with width 60, height 25).
3. Run server with `--board boards/nonexistent.json`: expect server to exit with error and non-zero exit code.
4. With server running (classic or my-board), connect a client and confirm STATE_UPDATE contains correct `board.width`, `board.height`, and `board.grid` (or equivalent); client renders without error.

**Verification:**
- [x] Server starts with default board when `--board` omitted _(Step 5.1: classic.json in place)_
- [x] Server starts with custom board when `--board` points to valid files _(automated: serverStartup.test.js)_
- [x] Server exits on invalid/missing board _(automated: serverStartup.test.js)_
- [ ] Client receives and can use board layout from STATE_UPDATE _(manual check when running server + client)_
- [x] All automated tests pass

**Commit:** e.g. `Enhancement: Load board from JSON – integration verification`

---

**Phase 5 Completion Checklist:**
- [x] Default board and config in place
- [x] Automated test for classic board; manual client check optional
- [x] All tests pass
- [x] Gameplan progress summary updated

---

## Completion Checklist

- [x] Phase 1: Board loader module – complete
- [x] Phase 2: Board.initializeFromGrid – complete
- [x] Phase 3: Game/GameServer/Server accept pre-built Board/Game – complete
- [x] Phase 4: Server CLI and startup integration – complete
- [x] Phase 5: Default board and integration verification – complete
- [x] All tests passing (`npm test`)
- [x] No fallback to hard-coded board on load failure
- [ ] Enhancement card status updated; card file renamed with `X_` prefix when done
- [ ] Gameplan directory renamed with `X_` prefix when done (e.g. `X_load-board-from-json`)

---

## Notes

- **Spawn positions:** Using entity 2 (spawn) for player placement is optional for this gameplan; decoding 2 → `' '` and sending the grid to clients is sufficient. Spawn-selection logic can be added later.
- **Client:** No client code changes required for multiplayer; client already receives board in STATE_UPDATE. Single-player/standalone is out of scope.
- **Rendering:** Renderer already uses `board.getCell`; no change needed beyond supporting space and `#` (already used). JSON-loaded boards use space for empty and spawn.

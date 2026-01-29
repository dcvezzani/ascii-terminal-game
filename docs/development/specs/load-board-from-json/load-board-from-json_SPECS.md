# Specification: Load Game Board from JSON

## Overview

This specification defines loading the game board from JSON files instead of hard-coded initialization. Board layout (run-length encoded cells) and dimensions (separate config file) are read from disk; the server loads the board and sends the layout to clients. The hard-coded board in `Board.js` is never used as fallback—missing or invalid board data causes the server to throw, report the error, and exit.

**Purpose:** Enable custom boards and levels via data (JSON under `./boards`), support multiplayer (server sends layout to clients), and keep the Board API unchanged for rendering and game logic.

## Problem Statement

**Current behavior:**
- Board is built in `src/game/Board.js` with hard-coded perimeter walls and empty interior (lines 19–26).
- Every board is a fixed rectangle; layout cannot be customized without code changes.
- No support for variable board definitions, levels, or designer-authored layouts.

**Impact:** Limited extensibility; design changes require code changes; harder to add level selection or future editors.

## Solution Summary

1. **Board JSON:** Run-length encoded array of cell entries under `./boards`. Each entry: `{ "entity": 0|1|2 }` or `{ "entity": n, "repeat": m }` when run-length > 1 (omit `repeat` for a single cell). Row-major order.
2. **Dimensions config:** Separate JSON file per board with `width` and `height`. Same base path as board file with `.config.json` suffix (e.g. `boards/my-board.json` → `boards/my-board.config.json`).
3. **Loader:** Synchronous load of board file + config file, decode RLE to a 2D grid of characters, validate, then build a `Board` instance via `initializeFromGrid(grid)`.
4. **Server:** Parse `--board path` (or use default `./boards/classic.json`). Load board and config; on any error, throw, log, and exit. Pass loaded `Board` into `Game` / `GameServer`. Existing `serializeState()` continues to send `board.width`, `board.height`, and `board.serialize()` to clients—no new message type.
5. **Client:** In multiplayer, client only receives board layout via existing `STATE_UPDATE`; it does not load board files. Single-player/standalone mode is out of scope for this enhancement.
6. **Rendering:** Entity `0` → space `' '`, `1` → `'#'`, `2` → `' '` (spawn, nothing visible). Board’s `getCell`/`serialize` and renderer stay compatible.
7. **Errors:** No fallback to hard-coded board. Missing file, invalid JSON, invalid entity, or cell-count mismatch → throw, report error, stop server.

---

## Data Model

### 1. Board JSON (cells only)

- **Location:** Files under `./boards/`, e.g. `boards/my-board.json`.
- **Structure:** A single JSON array of run-length encoded cell entries. No `width`/`height` in this file.

**Cell entry schema:**

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `entity` | number | yes      | Cell type: `0` = empty, `1` = wall, `2` = spawn. Only 0, 1, 2 are valid. |
| `repeat` | number | no       | Run length. Omit when run length is 1. When present, must be ≥ 1. |

**Ordering:** Row-major (first row left-to-right, then second row, etc.). Total number of cells after decoding must equal `width × height` from the dimensions config.

**Example:**

```json
[
  {"entity": 1, "repeat": 60},
  {"entity": 1},
  {"entity": 0, "repeat": 9},
  {"entity": 2},
  {"entity": 0, "repeat": 48},
  {"entity": 1}
]
```

### 2. Dimensions config JSON

- **Location:** Same directory as board file, same base name with `.config.json` suffix.
  - Board file: `boards/my-board.json` → config file: `boards/my-board.config.json`.
  - Board file: `boards/level1.json` → config file: `boards/level1.config.json`.
- **Structure:** Single JSON object with `width` and `height`.

**Schema:**

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `width` | number | yes      | Board width (columns). Must be ≥ 1. |
| `height`| number | yes      | Board height (rows). Must be ≥ 1. |

**Example:**

```json
{
  "width": 60,
  "height": 25
}
```

### 3. Decoded grid (internal)

- **Type:** `string[][]` — 2D array of single characters, `grid[y][x]`.
- **Mapping from entity to character:**
  - Entity `0` (empty) → `' '` (space).
  - Entity `1` (wall) → `'#'`.
  - Entity `2` (spawn) → `' '` (space; nothing visible).
- **Constraints:** Rectangular; `grid.length === height`, `grid[y].length === width` for all rows. Total cells = `width × height`.

---

## Functional Requirements

### 1. Board loader

**Location:** New module, e.g. `src/board/boardLoader.js` (or `src/game/boardLoader.js`).

**Responsibilities:**
- Read board JSON file and dimensions config file synchronously (e.g. `readFileSync`).
- Parse JSON; on parse error, throw with a clear message.
- Validate dimensions config: `width` and `height` present, numbers, ≥ 1.
- Decode run-length encoded array to a 2D grid of characters (entity 0 → `' '`, 1 → `'#'`, 2 → `' '`).
- Validate during decode: only entity values 0, 1, 2 allowed; if any other value, throw and report the invalid value. If `repeat` is present, must be ≥ 1.
- Validate total cell count: after decoding, number of cells must equal `width × height`; otherwise throw with a clear message.
- Return an object suitable for building a Board, e.g. `{ width, height, grid }` where `grid` is `string[][]`.

**Config file resolution:** Given board file path `boardPath` (e.g. `boards/my-board.json`), config path is the same path with extension replaced by `.config.json` (e.g. `boards/my-board.config.json`). No other naming convention is required for MVP.

**Signature (example):**

```js
/**
 * Load and decode board from JSON files.
 * @param {string} boardFilePath - Path to board JSON (run-length encoded cells).
 * @returns {{ width: number, height: number, grid: string[][] }}
 * @throws {Error} If file missing, invalid JSON, invalid entity, or cell count mismatch.
 */
export function loadBoardFromFiles(boardFilePath) { ... }
```

### 2. Board class changes

**Location:** `src/game/Board.js`.

**Public API (unchanged):**
- `constructor(width, height)` — same.
- `getCell(x, y)` — same; returns character at position.
- `isWall(x, y)` — same; returns `true` iff `getCell(x, y) === '#'`.
- `serialize()` — same; returns 2D array of characters (copy of grid).

**New behavior:**
- **`initializeFromGrid(grid)`**  
  - Sets `this.grid` to the provided 2D array of characters.  
  - Caller must ensure `grid` dimensions match `this.width` and `this.height` (Board does not resize; validation can be in loader).  
  - If `this.grid` is already set, overwrite it.  
  - No longer call the old hard-coded `initialize()` when building the board from JSON; the server path uses only `initializeFromGrid` after load.

**Existing `initialize()`:** May remain for backward compatibility in tests or non-server code paths, but the server must never use it as fallback when board load fails (see Error handling). Prefer: server only ever creates Board from loader output and `initializeFromGrid`.

### 3. Server: CLI and startup

**Location:** Server entry point (e.g. `src/server/index.js` or where the server is started).

**CLI:**
- Parse `process.argv` for `--board <path>`.
- If `--board` is provided, use that path as the board file path (relative to process cwd or resolve as appropriate).
- If `--board` is not provided, use default path `./boards/classic.json`.
- No other board-selection mechanism (e.g. config file) is required for MVP.

**Startup sequence:**
1. Resolve board file path (from `--board` or default).
2. Call board loader with that path (loader internally resolves dimensions config path from board path).
3. If loader throws: log error, exit process with non-zero code (e.g. `process.exit(1)`). Do not fall back to hard-coded board.
4. Create `Board` with `width` and `height` from loader result; call `board.initializeFromGrid(grid)`.
5. Create `Game` (or equivalent) with this Board instance (e.g. pass Board into Game, or Game constructed with dimensions and then given the pre-built Board—depending on current Game constructor). Ensure `GameServer` / `Server` use this Board for all game state and for `serializeState()`.

**Error handling:** Any of the following must cause throw + log + exit (no fallback):
- Board file not found or unreadable.
- Dimensions config file not found or unreadable.
- Invalid JSON in either file.
- Dimensions config missing `width` or `height`, or not numbers, or &lt; 1.
- Invalid entity value (not 0, 1, or 2) in board JSON.
- Decoded cell count ≠ `width × height`.
- Any other validation failure in the loader.

### 4. Game / GameServer integration

**Current flow:** `GameServer` holds a `Game` that holds a `Board`. `serializeState()` returns `board.width`, `board.height`, and `board.serialize()` (grid). Clients receive this in `STATE_UPDATE`.

**Required change:** Server constructs `Board` from loader result (width, height, grid), then passes it into `Game` or `GameServer` so that the same Board instance is used for game logic and for `serializeState()`. No change to the shape of `serializeState()` or to message types—clients already receive board layout in `STATE_UPDATE`. No change to client parsing of `STATE_UPDATE` for board dimensions and grid.

**Spawn positions (optional for MVP):** If the game uses spawn points (entity 2) for placing players, the server can derive spawn positions from the decoded grid (e.g. collect coordinates where grid cell corresponds to entity 2) or from a separate pass over the RLE. Detailed spawn-selection logic (e.g. which spawn per player) is out of scope unless already required by existing game design; SPECS only require that entity 2 is decoded to a character and that the grid is valid and sent to clients.

### 5. Client

**Multiplayer:** Client does not load any board file. It receives board layout only via existing `STATE_UPDATE` (board width, height, grid). No code change required for client board rendering beyond ensuring it can render grids of arbitrary dimensions and the character set (`' '`, `'#'`, etc.) already used.

**Single-player / standalone:** Out of scope for this enhancement. If a mode exists that runs without a server and uses a board, it may continue to use existing Board construction or be updated later to load from file; this SPEC does not require client-side board file loading.

### 6. Rendering

**Mapping (already covered in Data model):** Entity 0 → `' '`, 1 → `'#'`, 2 → `' '`. The renderer uses `board.getCell(x, y)` and existing logic (e.g. wall vs empty). No change to renderer character handling is required beyond supporting space and `#`; spawn (2) is visually the same as empty (space).

**Backward compatibility:** Existing renderer and `getCell`/`serialize` contract remain; only the source of the grid changes (loaded from JSON instead of hard-coded).

---

## Non-Functional Requirements

- **Loading:** Synchronous file read for MVP (e.g. `readFileSync`). Async loading is out of scope.
- **Validation:** Strict: invalid data always results in throw + exit. No silent fallback or default board.
- **Performance:** Decode and validation in loader should be O(cells). No min/max dimensions for MVP; rectangular only, all rows same length (enforced by cell count check).

---

## Testing Requirements

- **Board loader:**
  - Valid board + config: decoded grid has correct dimensions and character mapping (0→space, 1→#, 2→space).
  - Missing board file: throws (or exits); no fallback.
  - Missing config file: throws (or exits).
  - Invalid JSON (syntax) in either file: throws with clear message.
  - Invalid entity value (e.g. 3, -1, "1"): throws and reports the invalid value.
  - Cell count mismatch (RLE decodes to more or fewer than width×height): throws with clear message.
  - Dimensions config missing width or height: throws.
  - Config path resolution: correct .config.json path from board path.
- **Board:**
  - `initializeFromGrid(grid)` sets grid correctly; `getCell`, `serialize`, `isWall` behave as before for the new grid.
- **Server (integration):**
  - Server started with `--board path/to/valid-board.json`: loads board, starts, and broadcast state includes correct board dimensions and grid.
  - Server started with `--board path/to/missing.json`: exits with error, does not start.
  - Server started without `--board` and default `./boards/classic.json` exists: uses default, starts.
  - Server started without `--board` and default file missing: exits with error.

---

## Success Criteria

- Board layout and dimensions are read from JSON files under `./boards` (cells file + `.config.json` dimensions).
- Server accepts `--board <path>` and uses default `./boards/classic.json` when omitted; fails to start if board or config is missing/invalid (no fallback to hard-coded board).
- Only entity values 0, 1, 2 are allowed; invalid values cause throw and reported error.
- Decoded grid is rectangular; total cells = width × height; otherwise loader throws.
- Board API (`getCell`, `isWall`, `serialize`, dimensions) unchanged; existing rendering and `serializeState()` work with loaded boards.
- Server sends board layout to clients via existing `STATE_UPDATE`; client does not load board files in multiplayer.
- All new and existing tests pass; no regressions in multiplayer or rendering.

---

## Related Documents

- **Enhancement card:** `docs/development/cards/enhancements/ENHANCEMENT_load_board_from_json.md`
- **Board implementation:** `src/game/Board.js`
- **Example board:** `boards/my-board.json` (run-length encoded cells; dimensions in separate config per above)

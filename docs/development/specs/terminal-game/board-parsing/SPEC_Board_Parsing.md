# Spec: Board Parsing

## Purpose

**Board Parsing** defines how the game board layout is loaded from disk: run-length encoded (RLE) cell data in JSON plus a shared dimensions file. The server loads the board and sends the layout to clients via existing state; the client does not load board files in multiplayer. Invalid or missing data causes the server to throw and exit—no fallback to a hard-coded board.

**Supersedes:** the former `load-board-from-json` spec (removed); this spec is the single source of truth for board loading.

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| Board JSON schema (RLE cells); dimensions JSON | Display position (Game Board / Canvas) |
| Loader: read, parse, decode RLE, validate | Rendering (Renderer, Game Board) |
| Entity → character mapping (0→space, 1→#, 2→space) | Spawn selection logic (Server spec §8) |
| Server: --board path, dimensions path, no fallback | Client board file loading (client receives state only) |
| Board constructor and initializeFromGrid | |

---

## 2. Problem

Boards were originally built in code (hard-coded perimeter walls and empty interior). Layout could not be customized without code changes, limiting extensibility and making level selection or designer-authored layouts difficult. Loading from JSON (RLE + dimensions) enables custom boards under `boards/` and keeps the Board API unchanged for rendering and game logic.

---

## 3. Data model

### 3.1 Board JSON (cells)

- **Location:** Files under `boards/`, e.g. `boards/classic.json`.
- **Structure:** Single JSON array of run-length encoded cell entries. No `width`/`height` in this file.

**Cell entry:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entity` | number | yes | 0 = empty, 1 = wall, 2 = spawn. Only 0, 1, 2 valid. |
| `repeat` | number | no | Run length. Omit for 1. When present, ≥ 1. |

**Order:** Row-major. Total cells after decoding must equal `width × height` from dimensions config.

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

### 3.2 Dimensions config (shared)

- **Location:** Default `boards/dimensions.json`. The server may use a dimensions file in the same directory as the board file when present; otherwise the default is used.
- **Structure:** `{ "width": number, "height": number }`. Both ≥ 1.

**Example:**

```json
{
  "width": 60,
  "height": 25
}
```

### 3.3 Decoded grid (internal)

- **Type:** `string[][]` — `grid[y][x]`.
- **Mapping:** Entity 0 (empty) → `' '`, 1 (wall) → `'#'`, 2 (spawn) → `' '` (spawn is stored in `spawnPoints` and displayed as space). Decoded grid is rectangular; total cells = `width × height`.

---

## 4. Board loader and Board class

### 4.1 Board loader

**Location:** `src/board/boardLoader.js`.

**Signature:**

```js
/**
 * @param {string} boardFilePath - Path to board JSON (run-length encoded cells).
 * @param {string} [dimensionsFilePath] - Path to dimensions JSON; defaults to boards/dimensions.json.
 * @returns {{ width: number, height: number, grid: string[][], spawnPoints: Array<{x: number, y: number}> }}
 * @throws {Error} If file missing, invalid JSON, invalid entity, or cell count mismatch.
 */
loadBoardFromFiles(boardFilePath, dimensionsFilePath?)
```

**Responsibilities:** Read board JSON and dimensions JSON synchronously; parse JSON; validate dimensions (`width` and `height` present, numbers, ≥ 1); decode RLE to 2D grid; validate entity values (0, 1, 2 only) and that total cell count = width × height; collect spawn coordinates for entity 2. Order: row-major (same as cell order). If the board has no entity-2 cells, return spawnPoints: []. The loader returns all spawn positions; the server applies a configurable maximum and fallback when empty (see [Server](../server/SPEC_Server.md) §8).

**Dimensions path:** Default is `boards/dimensions.json`. The server may pass a second argument (e.g. a path in the same directory as the board file when `dimensions.json` exists there).

**Errors (throw, no fallback):** Missing board or dimensions file; invalid JSON in either file; dimensions missing or invalid; invalid entity value (not 0, 1, or 2); invalid or missing `repeat` (must be ≥ 1 when present); cell count mismatch.

### 4.2 Board class

**Location:** `src/game/Board.js`.

**API:** The Board **constructor** accepts a single `boardData` object `{ width, height, grid }`. When `grid` is provided, the board is ready; no further call is required. Optional: `initializeFromGrid(grid)` for callers that construct a Board with only dimensions first and set the grid later.

**Public methods (unchanged):** `getCell(x, y)`, `isWall(x, y)`, `serialize()`.

**Server usage:** Server creates Board via `new Board(loaderResult)` where `loaderResult` is the return value of `loadBoardFromFiles` (width, height, grid). Spawn points from the loader (`spawnPoints`) are used by the server for spawn selection (see Server spec §8); Board does not consume spawnPoints.

---

## 5. Server

- **CLI:** `--board <path>`. Default `boards/classic.json`. Dimensions from same directory as board file when `dimensions.json` exists there, otherwise `boards/dimensions.json`.
- **Startup:** Resolve board path → call loader (with optional dimensions path) → on throw: log and exit (e.g. `process.exit(1)`). Create Board with `new Board(boardData)`; pass into Game/GameServer. No fallback to hard-coded board.
- **State:** Existing `serializeState()` continues to send `board.width`, `board.height`, `board.serialize()`; clients receive layout in STATE_UPDATE. Spawn points from loader are used for player spawn selection per [Server](../server/SPEC_Server.md) §8.

---

## 6. Client

- **Multiplayer:** Client does not load board files; receives board layout only via STATE_UPDATE. No change required beyond supporting arbitrary dimensions and character set.
- **Single-player/standalone:** Standalone or Game code may load from files per existing implementation; this spec does not require client-side board file loading in multiplayer.

---

## 7. Non-functional requirements

- **Loading:** Synchronous file read for MVP (e.g. `readFileSync`). Async loading is out of scope.
- **Validation:** Strict—invalid data always results in throw and exit. No silent fallback or default board.
- **Performance:** Decode and validation in loader should be O(cells).

---

## 8. Testing requirements

- **Loader:** Valid board + dimensions → correct dimensions and character mapping (0→space, 1→#, 2→space); correct spawnPoints for entity 2. Missing board or dimensions file → throw. Invalid JSON in either file → throw with clear message. Invalid entity value (e.g. 3, -1) or invalid repeat → throw. Cell count mismatch → throw. Dimensions missing width or height or not numbers or &lt; 1 → throw. Optional second parameter for dimensions path (e.g. for tests).
- **Board:** Constructor with `boardData` (width, height, grid) produces working board; `getCell`, `serialize`, `isWall` behave correctly. `initializeFromGrid(grid)` sets grid when called on a Board constructed with dimensions only.
- **Server:** Started with `--board path/to/valid-board.json` → loads board, starts, broadcast state includes correct board dimensions and grid. Started with `--board path/to/missing.json` → exits with error. Started without `--board` with default `boards/classic.json` present → uses default and starts. Started without `--board` and default file missing → exits with error.

---

## 9. Success criteria

- [ ] Board layout from JSON under `boards/`; dimensions from default or same directory as board file.
- [ ] Server accepts `--board <path>`, default `boards/classic.json`; fails to start if board or dimensions missing/invalid.
- [ ] Only entity values 0, 1, 2 allowed; invalid or cell count mismatch → throw; no fallback.
- [ ] Loader returns `spawnPoints`; server uses them for spawn selection per Server spec §8.
- [ ] Board API unchanged; rendering and serializeState() work with loaded boards.
- [ ] Client receives board via STATE_UPDATE only in multiplayer.

---

## 10. Related specs and implementation

| Spec / reference | Relation |
|------------------|----------|
| [Game Board](../game-board/SPEC_Game_Board.md) | Consumes board grid and dimensions for display. |
| [Overall](../SPEC_Overall.md) | How Board Parsing fits in the terminal game stack. |
| [Server](../server/SPEC_Server.md) §8 | Uses loader `spawnPoints` for spawn selection. |
| `src/board/boardLoader.js` | Loader implementation. |
| `src/game/Board.js` | Board implementation. |
| Enhancement card (archived) | `X_ENHANCEMENT_load_board_from_json`. |

# Spec: Board Parsing

## Purpose

**Board Parsing** defines how the game board layout is loaded from disk: run-length encoded (RLE) cell data in JSON plus a shared dimensions file. The server loads the board and sends the layout to clients via existing state; the client does not load board files in multiplayer. Invalid or missing data causes the server to throw and exit—no fallback to a hard-coded board.

**Consolidated from:** load-board-from-json_SPECS.md.

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| Board JSON schema (RLE cells); dimensions JSON | Display position (Game Board / Canvas) |
| Loader: read, parse, decode RLE, validate | Rendering (Renderer, Game Board) |
| Entity → character mapping (0→space, 1→#, 2→space) | Spawn selection logic (separate spawn spec) |
| Server: --board path, dimensions path, no fallback | Client board file loading (client receives state only) |
| Board.initializeFromGrid(grid) | |

---

## 2. Data model

### 2.1 Board JSON (cells)

- **Location:** Files under `./boards/`, e.g. `boards/classic.json`.
- **Structure:** Single JSON array of run-length encoded cell entries. No `width`/`height` in this file.

**Cell entry:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entity` | number | yes | 0 = empty, 1 = wall, 2 = spawn. Only 0, 1, 2 valid. |
| `repeat` | number | no | Run length. Omit for 1. When present, ≥ 1. |

**Order:** Row-major. Total cells after decoding must equal `width × height` from dimensions config.

### 2.2 Dimensions config (shared)

- **Location:** `boards/dimensions.json`. All boards use this file.
- **Structure:** `{ "width": number, "height": number }`. Both ≥ 1.

### 2.3 Decoded grid (internal)

- **Type:** `string[][]` — `grid[y][x]`.
- **Mapping:** Entity 0 → `' '`, 1 → `'#'`, 2 → `' '` (spawn displayed as space).

---

## 3. Board loader

- **Responsibilities:** Read board JSON and dimensions JSON (e.g. synchronously); parse JSON; validate dimensions; decode RLE to 2D grid; validate entity values (0, 1, 2 only) and total cell count = width × height.
- **Return:** `{ width, height, grid }` (and optionally `spawnPoints` if derived; see spawn spec).
- **Errors:** Missing file, invalid JSON, invalid entity, cell count mismatch → throw with clear message. No fallback.

### 3.2 Board class

- **API (unchanged):** `constructor(width, height)`, `getCell(x, y)`, `isWall(x, y)`, `serialize()`.
- **New:** `initializeFromGrid(grid)` — sets `this.grid` from the provided 2D array. Caller ensures dimensions match. Server creates Board only from loader output + `initializeFromGrid`.

---

## 4. Server

- **CLI:** `--board <path>`. Default `./boards/classic.json`. Dimensions from `boards/dimensions.json`.
- **Startup:** Resolve board path → call loader → on throw: log and exit (e.g. `process.exit(1)`). Create Board from loader result; pass into Game/GameServer. No fallback to hard-coded board.
- **State:** Existing `serializeState()` continues to send `board.width`, `board.height`, `board.serialize()`; clients receive layout in STATE_UPDATE.

---

## 5. Client

- **Multiplayer:** Client does not load board files; receives board layout only via STATE_UPDATE. No change required beyond supporting arbitrary dimensions and character set.
- **Single-player/standalone:** Out of scope for this spec.

---

## 6. Success criteria

- [ ] Board layout from JSON under `./boards`; dimensions from `boards/dimensions.json`.
- [ ] Server accepts `--board <path>`, default `./boards/classic.json`; fails to start if board or dimensions missing/invalid.
- [ ] Only entity values 0, 1, 2 allowed; invalid or count mismatch → throw.
- [ ] Board API unchanged; rendering and serializeState() work with loaded boards.
- [ ] Client receives board via STATE_UPDATE only in multiplayer.

---

## 7. Related specs

| Spec | Relation |
|------|----------|
| [Game Board](../game-board/SPEC_Game_Board.md) | Consumes board grid and dimensions for display. |
| [Overall](../SPEC_Overall.md) | How Board Parsing fits in the terminal game stack. |

# Load Game Board from JSON

This document describes how to use the **Load Game Board from JSON** feature: running the server with a board loaded from JSON files, choosing which board to use, and the format of board and dimensions files.

## Overview

The game server loads the playable board from two sources:

1. **Board layout** — A JSON file containing run-length encoded (RLE) cell data (walls, empty space, spawn points). You choose which board file to use via the `--board` CLI option.
2. **Dimensions** — Width and height come from a `dimensions.json` file. The server uses a `dimensions.json` in the **same directory as the board file** when present; otherwise it uses the default `boards/dimensions.json`. Every board layout must decode to exactly `width × height` cells from the chosen dimensions file.

The server does not use a hard-coded board. If the board file or dimensions file is missing or invalid, the server logs an error and exits with code 1.

---

## File layout

```
boards/
├── dimensions.json    # Shared width/height for all boards (required)
├── classic.json       # Default board layout (60×25 perimeter walls)
└── my-board.json      # Example custom board layout
```

- **`boards/dimensions.json`** — Default dimensions file. Defines `width` and `height` when no same-directory `dimensions.json` exists next to the board file.
- **Board JSON files** — One file per layout (e.g. `classic.json`, `my-board.json`). Each file contains only cell data. Dimensions come from `dimensions.json` in the same directory as the board file, if present, else from `boards/dimensions.json`.

---

## Dimensions config

**Files:** The server looks for `dimensions.json` in the **same directory as the board file** first. If that file exists, it is used. Otherwise the server uses `boards/dimensions.json`. At least one of these must exist for the board you load.

Each dimensions file must be valid JSON with numeric `width` and `height` (each ≥ 1).

**Example:**

```json
{
  "width": 60,
  "height": 25
}
```

The decoded board layout must have exactly `width × height` cells from the dimensions file used (e.g. 60×25 = 1500 cells).

---

## Board JSON format

**Location:** Any `.json` file under `boards/` (except `dimensions.json`).

**Structure:** A JSON array of **run-length encoded** cell entries. Each entry is an object:

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `entity` | number | yes      | Cell type: `0` = empty, `1` = wall, `2` = spawn. Only 0, 1, 2 are valid. |
| `repeat` | number | no       | Number of consecutive cells. Omit for a single cell (default 1). Must be ≥ 1 when present. |

**Entity mapping (rendered):**

- `0` (empty) → space `' '`
- `1` (wall) → `'#'`
- `2` (spawn) → space `' '` (used for player placement; visually same as empty)

**Order:** Row-major: first row left-to-right, then the next row, and so on. Total number of cells after decoding must equal `width × height` from the dimensions file used for that board (same-dir or default).

**Example (first row of a 60-wide board: 60 walls):**

```json
[
  {"entity": 1, "repeat": 60}
]
```

**Example (one wall, 58 empty, one wall — one middle row):**

```json
[
  {"entity": 1},
  {"entity": 0, "repeat": 58},
  {"entity": 1}
]
```

**Minimal 2×2 all-walls board (for 2×2 dimensions):**

```json
[
  {"entity": 1, "repeat": 4}
]
```

---

## CLI usage

The server is started with **Node** and optionally the **`--board`** argument. Run from the project root.

### Default board (classic)

Use the default board file `./boards/classic.json`. Dimensions still come from `boards/dimensions.json`.

**Command:**

```bash
npm run server
```

**Equivalent:**

```bash
node src/server/index.js
```

**What happens:** The server loads `boards/classic.json` and `boards/dimensions.json`. If both are valid, it starts the WebSocket server (port from config, e.g. 3000) with the classic 60×25 board.

**Example output (success):**

```
info: WebSocket server listening on port 3000 {"service":"game","timestamp":"..."}
info: Server started on port 3000
```

---

### Custom board

Use a specific board layout file with `--board <path>`.

**Command:**

```bash
npm run server -- --board boards/my-board.json
```

**Equivalent:**

```bash
node src/server/index.js --board boards/my-board.json
```

**What happens:** The server loads the given board file and `boards/dimensions.json`. The decoded layout must have exactly `width × height` cells (from dimensions). If valid, the server starts with that board.

**Example output (success):** Same as default — server listening and started.

---

### Relative paths

The board path is relative to the current working directory (typically the project root).

**Examples:**

```bash
node src/server/index.js --board boards/classic.json
node src/server/index.js --board ./boards/my-board.json
```

---

### Missing or invalid files

If the board file or dimensions file is missing or invalid, the server logs an error and exits with code 1. It does **not** fall back to a hard-coded board.

**Example: missing board file**

**Command:**

```bash
node src/server/index.js --board boards/nonexistent.json
```

**Example output:**

```
error: Board file not found: boards/nonexistent.json {"service":"game",...}
```

Process exits with code 1.

**Example: missing dimensions file**

If `boards/dimensions.json` is removed or renamed:

**Example output:**

```
error: Dimensions file not found: boards/dimensions.json {"service":"game",...}
```

Process exits with code 1.

**Example: board cell count mismatch**

If the board JSON decodes to a number of cells that does not match `width × height` in `dimensions.json`:

**Example output:**

```
error: Cell count mismatch: decoded 100 cells, but width×height is 1500. {"service":"game",...}
```

Process exits with code 1.

---

## Summary table

| Command | Board used | Dimensions |
|--------|------------|------------|
| `npm run server` | `./boards/classic.json` | `boards/dimensions.json` (default) |
| `npm run server -- --board boards/my-board.json` | `boards/my-board.json` | Same-dir or `boards/dimensions.json` |
| `node src/server/index.js --board path/to/board.json` | `path/to/board.json` | Same-dir `dimensions.json` if present, else `boards/dimensions.json` |

---

## Creating a custom board

1. Ensure a **dimensions file** exists: either `boards/dimensions.json` (default) or a `dimensions.json` in the same directory as your board file, with the desired `width` and `height`.
2. Create a new JSON file under `boards/` (e.g. `boards/my-level.json`).
3. Add a JSON array of RLE entries in **row-major** order. Total decoded cells must equal `width × height`.
4. Use only `entity` values `0`, `1`, and `2`. Use `repeat` for runs of 2 or more identical cells.
5. Start the server with `--board boards/my-level.json` and fix any loader errors (e.g. cell count mismatch, invalid entity).

---

## Related documentation

- **Specification (current):** [Board Parsing](../specs/terminal-game/board-parsing/SPEC_Board_Parsing.md) — single source of truth for board loading. The standalone load-board-from-json spec has been removed and consolidated into Board Parsing.
- **Project scripts:** Root `SCRIPTS.md` (server and client commands)

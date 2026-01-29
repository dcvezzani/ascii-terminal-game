# Enhancement Card: Load Game Board from JSON

## Status
**COMPLETE**

## Context

The game board is currently built in `src/game/Board.js`. The constructor accepts `width` and `height`, and `initialize()` creates a grid with:

- Walls (`#`) on the perimeter (first/last row, first/last column)
- Empty interior (`.`)

This logic is hard-coded in a nested loop (lines 19–26). There is no way to define custom layouts, different shapes, or multiple levels without changing code.

## Problem

**Current Behavior**:
- Every board is a fixed rectangle with the same pattern (walls + interior)
- Layout cannot be customized without editing `Board.js`
- No support for variable board definitions, levels, or user/designer-authored layouts

**Impact**:
- Limited extensibility for levels, mazes, or themed boards
- Design changes require code changes
- Harder to experiment with board layouts or support future features (e.g. level selection, editor, or mods)

## Desired Enhancement

Support loading the game board from a JSON definition (file or object) so that:

- Board dimensions and cell contents are defined in data, not code
- The current “classic” board can be represented as JSON for backward compatibility
- When no path is provided, a default board under `./boards` may be used; if none exists, the server fails to start (no fallback to hard-coded generation).

Rendering and game logic consume the board produced from JSON only; the hard-coded board is not used as fallback.

## Requirements

1. **JSON board format**: A defined schema for board JSON (run-length encoded cells; dimensions in separate config file, not in board JSON).
2. **Board initialization**: Board can be created from a provided JSON input (object or parsed from file).
3. **Backward compatibility**: The default/classic board is expressible and loadable via JSON (dimensions from config; project default 60×25 for now).
4. **No fallback to hard-coded board**: If the board file is missing or invalid (or no path/default under `./boards`), throw, report error, and stop the server — do not use hard-coded initialization.
5. **Validation**: Validate JSON (structure, dimensions from config, allowed symbols). Handle errors by throwing, reporting, and stopping — no fallback (see Q5).
6. **Compatibility**: Works with existing rendering and game logic (single-player and networked modes, as applicable).

## Benefits

- **Flexibility**: Custom boards and levels without code changes
- **Designer-friendly**: Board data is separate from code; non-developers can contribute once editor/upload exists (MVP: developers only, see Q8).
- **Extensibility**: Foundation for level selection, multiple boards, or future editors
- **Testability**: Easy to test with small, custom board definitions
- **Consistency**: Same Board API; only the source of the grid data changes

## Approach

- Define the JSON schema for the board file (run-length encoded cells) and for the separate dimensions config file (`width`, `height`).
- Add board loading logic (from object and, if desired, from file path) with validation.
- Refactor `Board` so it can initialize from JSON (and dimensions config). Server never uses hard-coded board as fallback on load failure.
- Keep the public Board API (e.g. `getCell`, dimensions) unchanged so callers do not need changes except where board creation is configured.
- Add tests for valid JSON, invalid JSON, missing data, and error/exit behavior (no fallback).
- Document the JSON format and how to select/load a board (e.g. config, CLI, or default).

## Related Files

- `src/game/Board.js` – board construction and initialization (primary change)
- `src/game/Game.js` – likely where Board is instantiated; may need to pass board config/JSON
- `src/index.js` / entry points – may need to pass board source (default vs JSON path/object)
- New: board JSON files under `boards/`, plus separate dimensions config file(s); loading module for board + config
- Tests: `test/game/Board.test.js` (and any integration tests that create a game with a board)

## Open Questions

1. **Where should board JSON definitions live?**  
   **Decided:** Board data is stored in JSON files under `./boards`. Not inline in code.
   - **Example:** `boards/my-board.json` — run-length encoded array of cell entries.
   - **Format:** Each entry is `{"entity": 0|1|2}` or `{"entity": n, "repeat": m}` when run-length > 1 (omit `repeat` for a single cell). Entity `0` = empty, `1` = wall, `2` = spawn. Cells are row-major; total cell count must match board dimensions (e.g. 60×25 = 1500 cells).
   - **Dimensions:** Board dimensions (`width`, `height`) are **not** in the board JSON. They are defined in a **separate JSON config file**. SPECS must define config file location/schema and how it is associated with a board file.

2. **How is the board source chosen at runtime?**  
   **Decided:** CLI argument `--board path/to/board.json`; server receives board path. No config file. Default + optional single path (see Notes for SPECS re: behavior when `--board` is omitted).

3. **Which cell symbols are allowed in JSON?**  
   **Decided:** JSON cell values are numeric codes only. Text files (e.g. `#`, ` `, `@`) are authored elsewhere; a separate application converts them to JSON — not part of this app.
   - **Valid tile values:** `0` = empty space (renders as ` `), `1` = wall (renders as `#`), `2` = spawning point (nothing rendered/visible).
   - Only `0`, `1`, `2` are valid. Any other value → **throw and report** unsupported values (reject; do not treat as a fallback type).
   - **Note:** For JSON-loaded boards, empty (`0`) renders as **space** — distinct from the current hard-coded board, which uses `.` for empty interior. Implementation must map entity `0` → space when rendering.

4. **Shape and size constraints?**  
   **Decided:** Strict rectangular only (all rows same length). No min/max dimensions for now.

5. **Behavior when JSON is invalid or file missing?**  
   **Decided:** The hard-coded board is **never** used as fallback.
   - **Missing or invalid board:** If the specified file is missing, or if no file is specified and there is no default board under `./boards`, **throw, report the error, and stop the server.** No silent fallback.
   - **Explicit path requested:** If a path was provided (e.g. `--board`) and the file is missing or invalid, exit with error (same as above).

6. **Synchronous vs async loading?**  
   **Decided:** Use **synchronous** loading for MVP (e.g. `readFileSync`, or in-memory object). Keep the solution simple for now. Async/remote or lazy-loaded boards can be considered later.

7. **Scope for multiplayer/server?**  
   **Decided:** **Multiplayer support.** The server loads the board JSON and **sends the layout to clients**. This enhancement is not client/single-player only — server and clients use the same board definition (server loads it, then sends layout to clients).

8. **Who authors boards?**  
   **Decided:** **MVP:** Only developers author boards (e.g. level files in repo). Keep validation and documentation simple for now. **Future:** An editor will allow clients to upload boards for use by the server; design/validation can evolve then.

---

## Documentation

- **SPECS**: `docs/development/specs/load-board-from-json/load-board-from-json_SPECS.md` ✅ Created
- **GAMEPLAN**: `docs/development/gameplans/X_load-board-from-json/load-board-from-json_GAMEPLAN.md` ✅ Complete

### Notes for SPECS (addressed in SPECS)

- **Dimensions config:** Config file same base path as board file with `.config.json` suffix (e.g. `boards/my-board.config.json`); schema `{ width, height }`.
- **Server without `--board`:** If omitted, use default `./boards/classic.json`; if that file does not exist, throw and exit.
- **Client and board layout:** In multiplayer, client only receives layout via `STATE_UPDATE`; client does not load board files. Single-player/standalone mode is out of scope for this enhancement.

## Tags

- `enhancement`
- `board`
- `data-driven`
- `json`

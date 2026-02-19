# Specification: Map Spawn Points for Player Starting Positions

## Overview

This specification defines using map-defined spawn points (entity `2` in board JSON) as the set of possible player starting positions. The server derives an ordered list of spawn coordinates when loading the board, caps that list at a configurable maximum, and considers a spawn **available** only when a clear circle (Manhattan distance) around it is free of walls and other players. Players join only when at least one spawn is available; when none is available the server holds the connection and sends a configurable message until a spawn becomes free. Spawn selection uses the next unoccupied spawn. If the board has no spawn points, the server falls back to board center.

**Purpose:** Make spawn points in custom maps (e.g. `@` in text maps, entity `2` in JSON) determine where players start and when they can join, so players never start on the same cell and the text→JSON→server pipeline is fully realized.

## Problem Statement

**Current behavior:**
- The server loads board layout from JSON (RLE cells with entity 0/1/2); entity `2` is decoded to space for rendering but is not used for placement.
- `GameServer.spawnPlayer()` places every player at a hard-coded position (e.g. center or fixed (10, 10)); all players can start at the same cell.
- Map authors can place spawn points in maps, but the server ignores them.

**Impact:** No support for designer-defined spawn locations; overlapping player starts; custom map workflow incomplete.

## Solution Summary

1. **Spawn list from board:** When the board is loaded, derive an ordered list of spawn coordinates from every cell that was entity `2` in the source data (row-major order). Cap the number of spawn points used at a configurable maximum (default 25).
2. **Spawn availability:** A spawn is **available** only when every cell within **Manhattan distance R** of that spawn is clear (no walls, no other players). R is configurable (default 3).
3. **Join behavior:** A player can be spawned only when at least one spawn is available. If none is available, the server **holds the connection** (does not reject CONNECT), sends a configurable message to the client, and spawns the player when a spawn later becomes available.
4. **Spawn selection:** When multiple spawns are available, assign the **next unoccupied spawn** so no two players start on the same cell.
5. **Fallback:** If the board has zero spawn points, use **board center** `(Math.floor(width/2), Math.floor(height/2))` so boards without spawns still work.
6. **Config:** Server config defines max spawn count, clear radius, and wait message (key names below).

---

## Data Model and Configuration

### 1. Loader result (extended)

The board loader returns an object that **includes** a spawn list when decoding the board:

| Field         | Type           | Description |
|---------------|----------------|-------------|
| `width`       | number         | Board width (unchanged). |
| `height`      | number         | Board height (unchanged). |
| `grid`        | string[][]     | Decoded grid (unchanged). |
| `spawnPoints` | Array<{x,y}>   | **New.** Ordered list of spawn coordinates in row-major order. Each entry is `{ x: number, y: number }`. Only cells that were entity `2` in the source RLE are included. |

**Order:** Row-major (same as cell order: row 0 left-to-right, then row 1, etc.). The server (or GameServer) applies the configurable maximum and uses the first N spawns; the rest are ignored.

### 2. Server config (spawn-related keys)

Config is read from `config/serverConfig.js` / `config/serverConfig.json`. The following keys are used for this feature. Key names are chosen for clarity and consistency with existing config shape.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `spawnPoints.maxCount` | number | 25 | Maximum number of spawn points used from the map. If the map has more spawn cells, only the first N (row-major) are used. |
| `spawnPoints.clearRadius` | number | 3 | Radius (in cells) for the clear circle. A spawn is available only when all cells with Manhattan distance ≤ this value are free of walls and other players. |
| `spawnPoints.waitMessage` | string | "Thank you for waiting. A spawn point is being selected for you." | Message sent to the client when no spawn is available (connection held until one becomes available). |

**Manhattan distance:** For two cells `(x1,y1)` and `(x2,y2)`, distance = `|x1-x2| + |y1-y2|`. A cell is *within* the clear circle of spawn `(sx,sy)` if `|x-sx| + |y-sy| <= clearRadius`.

---

## Functional Requirements

### 1. Spawn list derivation

- **Location:** Board loader (e.g. `src/board/boardLoader.js`).
- During RLE decode, when a cell is entity `2`, record its coordinates in row-major order (same order as cells are laid out in the grid).
- The loader returns `spawnPoints: [{ x, y }, ...]` in addition to `width`, `height`, `grid`.
- If the board has no entity-2 cells, return `spawnPoints: []`.
- The **maximum number of spawn points used** by the game is **not** applied in the loader; the loader returns all spawn positions. The component that consumes the list (e.g. GameServer or server startup) applies the cap from config (`spawnPoints.maxCount`): use only the first N entries; ignore the rest.

### 2. Spawn availability (clear circle)

- **Location:** GameServer or a small helper used by GameServer.
- A spawn point at `(sx, sy)` is **available** if and only if:
  - For every cell `(x, y)` with Manhattan distance `|x - sx| + |y - sy| <= R` (where R = `spawnPoints.clearRadius` from config):
    - The cell is not a wall (not `board.getCell(x,y) === '#'`), and
    - The cell is not occupied by any other player (no player with `player.x === x && player.y === y`).
- Boundary: only consider cells that lie within the board (`0 <= x < width`, `0 <= y < height`). Cells outside the board are treated as blocking (or equivalent: do not consider out-of-bounds as "clear"). So a spawn near the edge only needs the overlapping disk within the board to be clear.
- **Deterministic:** Availability is computed from current board and current player positions; no randomness.

### 3. Player join and spawn assignment

- **When a client sends CONNECT:**
  - Add the player (e.g. `addPlayer`) as today.
  - **If at least one spawn is available:** Choose the **next unoccupied spawn**. "Next" means: use a well-defined order (e.g. same as `spawnPoints` order); the first spawn in that order that is available is selected. Place the player at that spawn (set `player.x`, `player.y`), then send CONNECT response with gameState as today.
  - **If no spawn is available:** Do **not** place the player yet (player remains without position or in a "waiting" state). Do **not** reject the connection. Send a response (or a dedicated message) to the client that includes the **wait message** from config (`spawnPoints.waitMessage`) so the user knows they will join when a spawn is available. When a spawn later becomes available (e.g. another player disconnects), assign that spawn to the waiting player, then send CONNECT (or state) so the client receives playerId and gameState. Implementation may use a queue of waiting connections.
- **Next unoccupied spawn:** When multiple spawns are available, choose the first in the ordered spawn list that is available. This ensures two players do not start on the same cell when enough spawns exist.

### 4. Fallback when no spawn points

- If `spawnPoints` is empty (or the capped list is empty), the server does **not** use map spawns. It uses a single **fallback position:** board center.
  - Fallback coordinates: `x = Math.floor(board.width / 2)`, `y = Math.floor(board.height / 2)`.
- Availability for the fallback: the same clear-circle rule can apply (all cells within Manhattan distance R of the fallback must be clear), so that joining at center does not overlap other players. If the center is not available when using fallback, the same "hold connection" behavior applies: wait until the fallback position’s circle is clear, then spawn there. (So fallback behaves like a single spawn point.)

### 5. Compatibility

- Boards that already use entity `2` in JSON (or `@` in text before conversion) must have those positions used as spawns (subject to max count and availability).
- Boards with no spawn points must continue to work via the fallback.
- No change to client message types or to the shape of `STATE_UPDATE` / CONNECT response beyond possibly including a wait message when the player is not yet spawned; existing client handling of board and players remains valid.

### 6. Spawn as entity 2; rendered as space

- **`entity`: 2** always represents a spawn location. The board loader records every such cell in the `spawnPoints` list (row-major order) and renders that position on the grid as a space (same as entity 0), so the stored board has no special character at spawn cells—only the spawn list records their positions.

---

## Non-Functional Requirements

- **Spawn list derivation:** O(cells), done once at board load; not computed per join.
- **Spawn selection:** Simple and deterministic (next available in fixed order) for reproducibility and tests.
- **Config:** Values read at server startup from existing config mechanism; no runtime config reload required for MVP.

---

## Implementation Details

### Files and responsibilities

- **`src/board/boardLoader.js`**
  - During RLE decode, collect coordinates where **entity** is `2` in row-major order; add `spawnPoints` to the returned object.
  - Render entity 2 cells as space on the grid (same as entity 0).

- **`config/serverConfig.js` / `config/serverConfig.json`**
  - Add `spawnPoints.maxCount` (default 25), `spawnPoints.clearRadius` (default 3), `spawnPoints.waitMessage` (default string as above).

- **`src/server/index.js`** (or equivalent startup)
  - Load board via loader; receive `spawnPoints`.
  - Apply cap: `spawnList = loaderResult.spawnPoints.slice(0, config.spawnPoints.maxCount)` (or equivalent).
  - If no spawn points after cap, use fallback list of one: `[{ x: Math.floor(width/2), y: Math.floor(height/2) }]`.
  - Pass the (capped or fallback) spawn list to GameServer (e.g. via constructor or options).

- **`src/server/GameServer.js`**
  - Store the spawn list and config (clearRadius, waitMessage).
  - **`spawnPlayer(playerId, playerName)`** (or equivalent):
    - Compute available spawns (clear circle, Manhattan).
    - If at least one available: pick next unoccupied (first available in order), set player position, return success.
    - If none available: do not set position; mark player as "waiting for spawn" (or equivalent); return indication that spawn is deferred.
  - Expose a way to "try to spawn waiting players" (e.g. when a player disconnects, or on a tick) so that when a spawn becomes available, waiting players are assigned.
  - When a player is placed (immediately or after wait), behavior is as today (logging, etc.).

- **`src/server/server.js`** (or where CONNECT is handled)
  - On CONNECT: call `addPlayer` then attempt spawn (e.g. `spawnPlayer` or "tryJoin").
  - If spawn succeeded: send CONNECT response with gameState as today; map clientId to playerId.
  - If spawn deferred: send response that includes `spawnPoints.waitMessage` and optionally a flag so client can show "waiting for spawn"; do not include full gameState for that player until they are spawned. When they are later spawned, send CONNECT or STATE_UPDATE so the client receives playerId and gameState.
  - Ensure when a player disconnects, "try to spawn waiting players" is invoked so one of them can take the freed spawn.

### Availability helper (example)

- **`isSpawnAvailable(spawn, board, players, clearRadius)`:** returns true iff for every cell `(x,y)` with `|x - spawn.x| + |y - spawn.y| <= clearRadius` and within board bounds, the cell is not a wall and not occupied by any player. Useful for tests and for GameServer.

### Waiting players

- **Representation:** e.g. players in the `players` Map with `x === null` and `y === null` (or a dedicated "pendingSpawn" set). When a spawn becomes available, assign the first waiting player (FIFO) to that spawn and send the CONNECT/state response.
- **Order:** When multiple spawns become available (e.g. several players leave), assign one spawn per waiting player in FIFO order, one at a time, so each gets exactly one spawn and the "next unoccupied" rule holds.

---

## Testing Requirements

- **Board loader**
  - Board with entity `2` cells: returned `spawnPoints` has correct coordinates in row-major order; those cells are rendered as space on the grid.
  - Board with no entity `2`: `spawnPoints` is empty array.

- **Spawn availability**
  - Helper or GameServer: spawn with no players and no walls in circle is available.
  - Spawn with a wall within Manhattan R is not available.
  - Spawn with another player within Manhattan R is not available.
  - Spawn at edge: only in-bounds cells checked; correct result.
  - Radius 0: only the spawn cell itself must be clear.

- **Cap and fallback**
  - Map with more than max spawns: only first N (by config) are used.
  - Map with zero spawns: fallback position is center; availability still applies for that single "spawn".

- **Join flow**
  - One player joins: gets first spawn (or fallback).
  - Two players join: get different spawns (next unoccupied).
  - Join when no spawn available: connection held; client receives wait message; when another player leaves, waiting player is spawned and receives gameState.
  - Multiple waiting: when spawns free up, they are assigned in FIFO order, one spawn per player.

- **Config**
  - Default config: maxCount 25, clearRadius 3, waitMessage as specified.
  - Custom config: values are read and used (max count caps list; radius affects availability; message sent when waiting).

- **Integration**
  - Server starts with board that has spawns: first CONNECT gets a spawn from the list; second CONNECT gets a different spawn (if available).
  - Server starts with board that has no spawns: players spawn at center (subject to availability).

---

## Success Criteria

- Spawn positions are derived from the loaded board (entity `2`) once at load time and capped at configurable max (default 25).
- A spawn is available only when its clear circle (Manhattan distance ≤ config radius, default 3) is free of walls and other players.
- Players join only when a spawn (or fallback) is available; when none is available, the connection is held and the configurable wait message is sent until a spawn becomes available.
- Spawn selection uses next unoccupied spawn; no two players start on the same cell when enough spawns exist.
- Boards with no spawn points use board center as single fallback; availability rules still apply.
- Entity 2 is the only spawn marker; spawn list and grid decode correctly (spawn cells rendered as space).
- All new and existing tests pass; no regressions in multiplayer or board loading.

---

## Related Documents

- **Feature card:** `docs/development/cards/features/X_FEATURE_map_spawn_points_for_players.md`
- **Load board from JSON spec:** `docs/development/specs/load-board-from-json/load-board-from-json_SPECS.md`
- **Map parser specs:** `docs/development/wiki/map-parser/specs.md`
- **Board loader:** `src/board/boardLoader.js`
- **GameServer:** `src/server/GameServer.js`
- **Server CONNECT handling:** `src/server/server.js`

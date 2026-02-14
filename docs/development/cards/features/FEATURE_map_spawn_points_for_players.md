# Feature Card: Use Map Spawn Points for Player Starting Positions

## Context

**Current State**:
- Custom maps can be created as plain text files (e.g. `#` wall, `@` spawn, space empty) and converted to JSON via the map parser utility (`src/map-parser/`).
- The server loads board layout from JSON (load-board-from-json): RLE cell data with entity `0` (empty), `1` (wall), `2` (spawn). Dimensions come from `boards/dimensions.json`.
- **Spawn points: rendering vs. use.** Spawn points do **not** render as an entity during gameplay—they render as **space** (empty cell). So they are invisible on the board. During gameplay they are **used only** as the set of possible locations where a player can spawn when a client joins; this feature implements that use. (Board loader decodes entity `2` to space for rendering; the server will use the same cells as spawn positions.)
- When a player joins, `GameServer.spawnPlayer()` places them at a **hard-coded** position (e.g. center of board, or a fixed (10, 10) for 20×20). **All players currently start at the same cell**, which is undesirable; the feature will ensure players do not overlap by allowing join only when an **available** spawn point exists.

**Location**:
- Server: `src/server/GameServer.js` (spawn logic), `src/board/` or board loader (spawn list derivation)
- Map format: `docs/development/wiki/map-parser/specs.md`, `docs/development/wiki/load-board-from-json.md`
- Specs: `docs/development/specs/load-board-from-json/load-board-from-json_SPECS.md`

## Problem

- Map authors can place spawn points (`@` in text maps, entity `2` in JSON) to define where players should start, but the server ignores them.
- **Players must not start at the same cell.** Currently every player is placed at one fixed position, causing overlap. The server should allow a player to join only when a spawn point is **available**—i.e. when there is enough clear space around that spawn so the new player does not overlap others.
- The custom map workflow (text → JSON → server) is only fully realized when spawn points in the map actually affect where players are placed and when they can join.

## Desired Feature

When the server loads a board from JSON:

1. **Derive spawn positions** from the loaded board (all cells where entity was `2` / spawn). The number of spawn points is **variable per map**: a map may define 2, 5, or any number of spawns (e.g. corners, team sides, safe zones). The server shall support a **configurable maximum** so that maps with very many spawn cells do not exhaust resources; this maximum is set in server config and defaults to **25**.
2. **Spawn availability**: A spawn point is **available** only when there is a **clear circle** around it: every cell within a given **radius** of the spawn must be free of walls and free of other players. The **radius is configurable** in server config (e.g. `config/serverConfig.json`), **defaulting to 3**. So a spawn is available only if the disk of radius 3 (or the configured value) around it is clear.
3. **Players join when a spawn is available**: A player can be spawned only when at least one spawn point is available. If **no** spawn is available, the server **holds the connection** (does not reject) and spawns the player when a spawn later becomes available. The user is informed they will join as soon as a spawn point is available; this message is **configurable in server config** (default: "Thank you for waiting. A spawn point is being selected for you.").
4. **Use spawn points as starting positions**: When a spawn is available, assign the joining player to that spawn so that **players never start at the same cell**; each gets a spawn whose clear circle is empty.
5. **Spawn selection**: When multiple spawns are available, use **next unoccupied spawn** so two players do not start on the same cell when enough spawns exist.
6. **Fallback**: If the board has **no** spawn points, fall back to **board center** `(width/2, height/2)` (or similar) so boards without `@` still work; availability rules may still apply around that fallback position (SPECS).

This keeps the custom map workflow (plain text → map parser → JSON → server) and makes spawn points in the map data meaningful for multiplayer join behavior.

## Requirements

### Functional Requirements

1. **Spawn list from board**:
   - When the server loads a board (from board loader / JSON), derive an ordered list of spawn coordinates `[{x, y}, ...]` from cells that were entity `2` (spawn) in the source data. The count is **not fixed**: a map may have 2, 5, or any number of spawn points.
   - The number of spawn points used from the map shall be **capped at a configurable maximum**. This maximum is defined in **server config** (e.g. `config/serverConfig.json`), **defaulting to 25**. If the map defines more spawn cells than the limit, only the first N (in row-major order, or the order produced by the loader) are used; the rest are ignored. This prevents unbounded spawn lists while allowing flexible map design.
   - The loader or a small helper can produce this list during decode (e.g. collect coordinates where decoded cell corresponds to spawn). The list may be attached to the Board, passed to GameServer, or provided by the loader result.

2. **Spawn availability (clear circle)**:
   - A spawn point is **available** if and only if every cell within **radius R** of that spawn is **clear**: no walls and no other players. R is **configurable in server config** (e.g. `config/serverConfig.json`), **default 3**. **Distance metric: Manhattan** (|dx| + |dy| <= R). Cells within Manhattan distance R count as within the clear circle.
   - **Players can only join when at least one spawn point is available.** The server shall not place a new player at a spawn whose clear circle is not clear. **When no spawn is available:** The server **holds the connection** (does not reject CONNECT). When a spawn later becomes available, the server spawns the player and completes the join. The client is informed with a **configurable message** (server config; default: "Thank you for waiting. A spawn point is being selected for you.").

3. **Player spawn on join**:
   - When a client sends CONNECT and the server creates a player, the server shall place the player only at an **available** spawn position (one with a clear circle of radius R, using Manhattan distance). Players therefore **never start at the same cell**; each gets a spawn with no other players within the clear radius.
   - **Spawn selection:** When multiple spawns are available, use **next unoccupied spawn** so two players do not start on the same cell when enough spawns exist.

4. **Fallback when no spawns**:
   - If the board has zero spawn points, the server shall fall back to **board center** `(width/2, height/2)` (or equivalent) so that existing boards without spawns still allow players to join.

5. **Compatibility**:
   - Boards that already use entity `2` in JSON (or `@` in text before conversion) must result in those positions being used as spawns. Boards without any spawn points must continue to work with the fallback.
   - No change to client message types or STATE_UPDATE shape; only server-side spawn logic changes.

6. **Server config**:
   - **Max spawn points**: Configurable maximum number of spawn points read from server config (e.g. `config/serverConfig.json`). Default: **25**. If the loaded map has more spawn cells than this limit, only the first N spawns (in a well-defined order) are used. Config key name to be defined in SPECS (e.g. `board.maxSpawnPoints` or `spawnPoints.maxCount`).
   - **Spawn clear radius**: Configurable radius (number of cells) for the “clear circle” around a spawn. Default: **3**. Manhattan distance. Config key to be defined in SPECS (e.g. `spawnPoints.clearRadius` or `board.spawnClearRadius`).
   - **Spawn wait message**: When no spawn is available, the message shown to the waiting user is **configurable** in server config. Default: **"Thank you for waiting. A spawn point is being selected for you."** Config key to be defined in SPECS (e.g. `spawnPoints.waitMessage` or `messages.spawnWait`).

### Non-Functional Requirements

- Spawn list derivation should be O(cells) and done once at board load, not per player join.
- Spawn selection logic should be simple and deterministic (next unoccupied spawn) for reproducibility and tests.

## Open Questions & Answers

1. **Spawn selection strategy when multiple spawns exist**  
   - **Answer:** Use **next unoccupied spawn** so two players do not start on the same cell when enough spawns exist.

2. **Behavior when no spawn is available**  
   - **Answer:** **Hold the connection** (do not reject CONNECT). Spawn the player when a spawn later becomes available. The user is informed they will join as soon as a spawn point is available. The message is **configurable in server config**; default: "Thank you for waiting. A spawn point is being selected for you."

3. **Distance metric for “clear circle”**  
   - **Answer:** **Manhattan** (|dx| + |dy| ≤ R). Cells within Manhattan distance R of the spawn count as within the clear circle.

4. **Default fallback position when no spawns**  
   - **Answer:** Use **board center** `(width/2, height/2)` (or equivalent).

5. **Map parser output and loader input (entity 2 = spawn; rendering)**  
   - **Answer:** **Entity `2`** always represents a spawn location. The board loader records every such cell in a **spawn list** (e.g. `spawnPoints`) in row-major order, then **renders that position on the grid as a space** (same as entity 0). So the stored board has no special character at spawn cells—only the spawn list records their positions. The text→JSON→server pipeline works when the map parser outputs `entity: 2` for spawn cells (`@` in text maps).

## Related Features

- **X_ENHANCEMENT_load_board_from_json**: Board and dimensions loaded from JSON; entity 2 decoded. This feature extends that by using entity 2 positions for spawns.
- **Map parser** (`docs/development/wiki/map-parser/specs.md`): Converts text maps (`@` = spawn) to RLE JSON; output must align with loader’s entity 2 so spawn points flow through.

## Dependencies

- Load board from JSON must be in place (board loaded from RLE JSON with entity 0/1/2; dimensions from `boards/dimensions.json`). Spawn list can be derived in the loader or from the decoded grid after load.

## Status

- **Status**: NOT STARTED
- **Priority**: MEDIUM
- **Created**: 2026-02-11

## Documentation

- **SPECS**: `docs/development/specs/map-spawn-points-for-players/map-spawn-points-for-players_SPECS.md` (created).
- **GAMEPLAN**: To be created under `docs/development/gameplans/` after SPECS.

## Tags

- `feature`
- `spawn`
- `board`
- `multiplayer`
- `custom-maps`

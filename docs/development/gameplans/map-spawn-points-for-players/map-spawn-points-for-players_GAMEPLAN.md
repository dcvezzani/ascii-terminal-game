# Gameplan: Map Spawn Points for Player Starting Positions

## Overview

This gameplan breaks down the map-spawn-points feature into logical phases. Implementation follows Test-Driven Development (TDD): write tests first, run tests (expect failure), implement code to make tests pass, then commit after each step.

**Approach:** Extend the board loader to derive and return spawn points; add server config; implement spawn availability (Manhattan clear circle) and next-unoccupied assignment; then wire CONNECT and disconnect so players get map-defined spawns and waiting players are spawned when a slot frees up.

**Reference:** `docs/development/specs/map-spawn-points-for-players/map-spawn-points-for-players_SPECS.md`

## Progress Summary

- ✅ **Phase 1: Board loader – spawnPoints and entity 2** – COMPLETE
- ✅ **Phase 2: Server config – spawnPoints keys** – COMPLETE
- ✅ **Phase 3: Spawn availability helper** – COMPLETE
- ✅ **Phase 4: GameServer – spawn list, spawnPlayer, waiting, trySpawnWaiting** – COMPLETE
- ✅ **Phase 5: Server startup – cap, fallback, pass options** – COMPLETE
- ✅ **Phase 6: CONNECT handling and disconnect – deferred spawn, wait message** – COMPLETE
- ✅ **Phase 7: Tests and verification** – COMPLETE

## Prerequisites

- [ ] All existing tests passing (`npm test`)
- [ ] Spec and feature card reviewed
- [ ] Load-board-from-JSON in place (board loader returns `{ width, height, grid }`)

---

## Phase 1: Board loader – spawnPoints and entity 2 (~25 min)

**Goal:** During RLE decode, record every cell where **entity** is `2` in row-major order; return `spawnPoints: [{ x, y }, ...]` and render entity 2 as space on the grid.

### Step 1.1: Add spawnPoints to loader result

**Location:** `src/board/boardLoader.js`.

**Action (TDD):**
1. **Add tests** in `test/board/boardLoader.test.js`:
   - Board with entity `2` cells: returned object has `spawnPoints` array with correct coordinates in row-major order (e.g. one entity-2 at index 2 in a 2×2 grid → `[{ x: 0, y: 1 }]`).
   - Board with no entity `2`: `spawnPoints` is `[]`.
   - Existing test that checks entity 2 → space: also assert that cell is present in `spawnPoints` and grid cell is space.
2. **Run tests** — expect failures (loader does not return `spawnPoints` yet).
3. **Implement:** In the RLE decode loop, maintain a `spawnPoints` array. For each cell emitted, compute `x = index % width`, `y = Math.floor(index / width)`. When `entity === 2`, push `{ x, y }` to `spawnPoints`. Return `{ width, height, grid, spawnPoints }`.
4. **Run tests** — pass.

**Verification:**
- [x] Loader returns `spawnPoints` in row-major order; entity 2 cells rendered as space
- [x] No entity 2 → `spawnPoints: []`
- [x] `npm test` passes for board loader

**Commit:** e.g. `Feature: Board loader returns spawnPoints from entity 2 (row-major), render as space`

---

**Phase 1 Completion Checklist:**
- [x] Step 1.1 completed
- [x] Loader tests for spawnPoints passing
- [x] No regressions

---

## Phase 2: Server config – spawnPoints keys (~15 min)

**Goal:** Add `spawnPoints.maxCount`, `spawnPoints.clearRadius`, and `spawnPoints.waitMessage` to server config with spec defaults.

### Step 2.1: Add spawnPoints config

**Location:** `config/serverConfig.js`, `config/serverConfig.json`.

**Action (TDD):**
1. **Add tests** in `test/config/serverConfig.test.js`:
   - `serverConfig.spawnPoints` is defined with `maxCount` (25), `clearRadius` (3), `waitMessage` containing e.g. "spawn point".
2. **Implement:** In the default config object (used when JSON is missing or in the JSON file), add:
   - `spawnPoints: { maxCount: 25, clearRadius: 3, waitMessage: "Thank you for waiting. A spawn point is being selected for you." }`.
3. **Run tests** — pass.

**Verification:**
- [x] Config has spawnPoints with expected keys and defaults
- [x] `npm test` passes for config tests

**Commit:** e.g. `Feature: Add spawnPoints config (maxCount, clearRadius, waitMessage)`

---

**Phase 2 Completion Checklist:**
- [x] Step 2.1 completed
- [x] Config tests passing
- [x] No regressions

---

## Phase 3: Spawn availability helper (~25 min)

**Goal:** Implement `isSpawnAvailable(spawn, board, players, clearRadius)` so GameServer can decide if a spawn is free (Manhattan disk clear of walls and other players; out-of-bounds treated as blocking).

### Step 3.1: Spawn availability module and tests

**Location:** New file `src/server/spawnAvailability.js`.

**Action (TDD):**
1. **Write tests** in `test/server/spawnAvailability.test.js`:
   - Spawn with no players and no walls in circle → available.
   - Spawn with a wall within Manhattan R → not available.
   - Spawn with another player within Manhattan R → not available.
   - Spawn at edge: full disk in bounds and clear → available; disk extends out of bounds → not available.
   - Radius 0: only spawn cell must be clear (available if clear; not available if wall).
   - Waiting players (x/y null) do not count as occupying a cell.
2. **Run tests** — expect failures (module/function do not exist).
3. **Implement:** `isSpawnAvailable(spawn, board, players, clearRadius)`: iterate over all cells in the Manhattan disk (double loop over dx, dy with `|dx| + |dy| <= clearRadius`); for each (x, y) in bounds check not wall and not occupied by any player with position set; if any cell is out of bounds, wall, or occupied, return false; else return true.
4. **Run tests** — pass.

**Verification:**
- [x] `spawnAvailability.js` exported; tests cover clear, wall, player, edge, radius 0, waiting players
- [x] `npm test` passes for spawnAvailability

**Commit:** e.g. `Feature: Add isSpawnAvailable helper (Manhattan clear circle)`

---

**Phase 3 Completion Checklist:**
- [x] Step 3.1 completed
- [x] Spawn availability tests passing
- [x] No regressions

---

## Phase 4: GameServer – spawn list, spawnPlayer, waiting, trySpawnWaiting (~45 min)

**Goal:** GameServer accepts optional `spawnList` and `spawnConfig`; uses first available spawn for `spawnPlayer`; returns `{ spawned, waiting }`; exposes `trySpawnWaitingPlayers()` and `getSpawnWaitMessage()`.

### Step 4.1: GameServer constructor and spawn list

**Location:** `src/server/GameServer.js`.

**Action (TDD):**
1. **Add/update tests** in `test/server/GameServer.test.js`:
   - Constructor with no options: spawn list is fallback center `[{ x: floor(width/2), y: floor(height/2) }]` (existing spawnPlayer at (10,10) for 20×20 still passes).
   - Constructor with `options.spawnList` and `options.spawnConfig`: stored and used.
2. **Implement:** Constructor `(game, options = {})`. If `options.spawnList` is non-empty, set `this.spawnList = options.spawnList`; else set `this.spawnList = [{ x: Math.floor(width/2), y: Math.floor(height/2) }]`. Set `this.spawnConfig = { clearRadius: 3, waitMessage: "..." }` merged with `options.spawnConfig`.
3. **Run tests** — pass.

**Verification:**
- [x] GameServer accepts optional spawnList and spawnConfig; fallback when list empty/missing
- [x] Existing spawnPlayer tests still pass (fallback center)
- [x] `npm test` passes for GameServer

**Commit:** e.g. `Feature: GameServer accepts spawnList and spawnConfig options`

---

### Step 4.2: spawnPlayer uses spawn list and availability

**Location:** `src/server/GameServer.js`.

**Action (TDD):**
1. **Add tests:**
   - `spawnPlayer` returns `{ spawned: true }` when a spawn is available.
   - With two spawns in list (far apart), two players get different positions (next unoccupied).
   - With one spawn and clearRadius 0, first player spawns; second stays waiting (x/y null); `spawnPlayer` returns `{ spawned: false, waiting: true }`.
2. **Implement:** Add `_firstAvailableSpawn()` that uses `isSpawnAvailable` over `this.spawnList`. In `spawnPlayer`: if player not found return `{ spawned: false }`. Set `player.playerName`. If `_firstAvailableSpawn()` returns a spawn, set `player.x`, `player.y`, log, return `{ spawned: true }`. Else return `{ spawned: false, waiting: true }`.
3. **Run tests** — pass.

**Verification:**
- [x] spawnPlayer returns result object; uses first available spawn; leaves player waiting when none
- [x] Two players get different spawns when list has two available
- [x] `npm test` passes for GameServer

**Commit:** e.g. `Feature: GameServer spawnPlayer uses spawn list and availability`

---

### Step 4.3: trySpawnWaitingPlayers and getSpawnWaitMessage

**Location:** `src/server/GameServer.js`.

**Action (TDD):**
1. **Add tests:**
   - After one player spawns and one is waiting, remove first player and call `trySpawnWaitingPlayers()`; expect returned array to contain waiting player's id and that player now has x/y set.
   - `getSpawnWaitMessage()` returns configured wait message (custom when passed in spawnConfig).
2. **Implement:** `trySpawnWaitingPlayers()`: get all players with `x === null && y === null`; for each in order call `spawnPlayer`; collect playerIds that return `spawned: true`; return that array. `getSpawnWaitMessage()`: return `this.spawnConfig.waitMessage`.
3. **Run tests** — pass.

**Verification:**
- [x] trySpawnWaitingPlayers spawns waiting players in order; returns spawned ids
- [x] getSpawnWaitMessage returns config value
- [x] `npm test` passes for GameServer

**Commit:** e.g. `Feature: GameServer trySpawnWaitingPlayers and getSpawnWaitMessage`

---

**Phase 4 Completion Checklist:**
- [x] Steps 4.1–4.3 completed
- [x] GameServer spawn logic and waiting flow covered by tests
- [x] No regressions

---

## Phase 5: Server startup – cap, fallback, pass options (~20 min)

**Goal:** After loading the board, apply `spawnPoints.maxCount` to loader's `spawnPoints`; if none, use single fallback at board center; pass `spawnList` and `spawnConfig` to Server (and thus GameServer).

### Step 5.1: Build spawn list and options in startup

**Location:** `src/server/index.js`.

**Action (TDD):**
1. **Verify** (existing or add integration test): Server started with board path gets board from loader; if loader returns `spawnPoints`, they are used (covered indirectly by Phase 6 behavior).
2. **Implement:** After `loadBoardFromFiles(path)` and creating Board/Game:
   - `rawSpawns = boardData.spawnPoints ?? []`
   - `spawnList = rawSpawns.length > 0 ? rawSpawns.slice(0, config.spawnPoints?.maxCount ?? 25) : [{ x: Math.floor(board.width/2), y: Math.floor(board.height/2) }]`
   - `spawnConfig = { clearRadius: config.spawnPoints?.clearRadius ?? 3, waitMessage: config.spawnPoints?.waitMessage ?? "Thank you for waiting..." }`
   - `new Server(serverPort, game, { spawnList, spawnConfig })`
3. **Run tests** — server startup test and full suite pass.

**Verification:**
- [x] Startup applies maxCount cap and fallback; passes options to Server
- [x] Server/GameServer receive options (GameServer tests with options pass)
- [x] `npm test` passes

**Commit:** e.g. `Feature: Server startup builds spawn list (cap/fallback) and passes to GameServer`

---

### Step 5.2: Server constructor accepts options

**Location:** `src/server/server.js`.

**Action (TDD):**
1. **Implement:** Server constructor `(port, game, options = {})`. Pass `options` to `new GameServer(game, options)`.
2. **Run tests** — existing Server tests (no options) still pass; startup with board uses options.
3. **Verification:** [x] Server(port, game, options) passes options to GameServer; backward compat when options omitted.

**Commit:** e.g. `Feature: Server constructor accepts spawn options for GameServer`

---

**Phase 5 Completion Checklist:**
- [x] Steps 5.1–5.2 completed
- [x] Spawn list and config flow from loader → startup → GameServer
- [x] No regressions

---

## Phase 6: CONNECT handling and disconnect – deferred spawn, wait message (~40 min)

**Goal:** On CONNECT, if spawn succeeds send gameState as today; if spawn deferred send wait message and `waitingForSpawn`; on disconnect call trySpawnWaitingPlayers and send CONNECT with gameState to any newly spawned clients.

### Step 6.1: handleConnect uses spawn result; send wait or gameState

**Location:** `src/server/server.js`.

**Action (TDD):**
1. **Implement:** In `handleConnect`: after `addPlayer`, call `spawnPlayer` and capture result. If `result.spawned`: send CONNECT with `gameState` as today. If not (waiting): send CONNECT with `waitingForSpawn: true`, `message: gameServer.getSpawnWaitMessage()`, and no full gameState (or null).
2. **Run tests** — existing CONNECT tests still pass (spawn normally succeeds with fallback).
3. **Verification:** [x] Immediate spawn sends gameState; deferred sends wait message

**Commit:** e.g. `Feature: CONNECT response includes wait message when spawn deferred`

---

### Step 6.2: sendSpawnedStateToClient and getConnectionByPlayerId

**Location:** `src/server/server.js`, `src/server/ConnectionManager.js`.

**Action (TDD):**
1. **Implement:** In ConnectionManager, add `getConnectionByPlayerId(playerId)`: iterate `playerIdMap` to find clientId for that playerId; return `connections.get(clientId)`.
2. **Implement:** In Server, add `sendSpawnedStateToClient(clientId)`: get connection and player; if player has x/y set, send CONNECT message with full gameState to that client's WebSocket.
3. **Run tests** — pass (unit test for ConnectionManager if desired).
4. **Verification:** [x] Can find connection by playerId; can send CONNECT with gameState to a client

**Commit:** e.g. `Feature: ConnectionManager getConnectionByPlayerId; Server sendSpawnedStateToClient`

---

### Step 6.3: On disconnect, trySpawnWaitingPlayers and notify

**Location:** `src/server/server.js`.

**Action (TDD):**
1. **Implement:** In `onDisconnect`, after removing the disconnected player and connection, call `gameServer.trySpawnWaitingPlayers()`. For each returned playerId, get connection via `getConnectionByPlayerId`, then call `sendSpawnedStateToClient(connection.clientId)`.
2. **Run tests** — full suite; add integration test if needed (join when full, then disconnect one, then waiting gets state).
3. **Verification:** [x] Disconnect triggers trySpawnWaitingPlayers; newly spawned clients receive CONNECT with gameState

**Commit:** e.g. `Feature: On disconnect, spawn waiting players and send state`

---

**Phase 6 Completion Checklist:**
- [x] Steps 6.1–6.3 completed
- [x] CONNECT and disconnect flow match spec (hold connection, wait message, spawn when available)
- [x] No regressions

---

## Phase 7: Tests and verification (~30 min)

**Goal:** Cover board loader spawnPoints (and no entity 2), spawn availability edge cases, config, GameServer (two spawns, waiting, trySpawnWaiting), and optionally integration (two CONNECTs get different spawns; server with no spawns uses center).

### Step 7.1: Board loader tests

**Location:** `test/board/boardLoader.test.js`.

**Action:**
- Board with entity 2: `spawnPoints` has correct coordinates (row-major); grid cell is space.
- Board with no entity 2: `spawnPoints` is `[]`.
- Returned object includes `spawnPoints` in valid parse result.

**Verification:** [x] Loader tests updated/added; all pass

---

### Step 7.2: Spawn availability tests

**Location:** `test/server/spawnAvailability.test.js`.

**Action:** Already added in Phase 3; ensure all spec cases covered (clear, wall, player, edge, radius 0, waiting players).

**Verification:** [x] All availability tests pass

---

### Step 7.3: GameServer and config tests

**Location:** `test/server/GameServer.test.js`, `test/config/serverConfig.test.js`.

**Action:**
- GameServer: spawnPlayer return value; two players different spawns; trySpawnWaitingPlayers; getSpawnWaitMessage.
- Config: spawnPoints section with maxCount, clearRadius, waitMessage.

**Verification:** [x] GameServer and config tests pass

---

### Step 7.4: Full suite and manual check

**Action:**
1. Run `npm test` — all tests pass.
2. Optionally: start server with a board that has multiple spawns; connect two clients; confirm different spawn positions and that wait flow works when no spawn free.

**Verification:**
- [x] All automated tests pass
- [ ] Manual verification (optional): two clients get different spawns; wait message when full

---

**Phase 7 Completion Checklist:**
- [x] Board loader, spawn availability, GameServer, config tests in place and passing
- [x] Full test suite green
- [x] No regressions in multiplayer or board loading

---

## Completion Checklist

- [x] Phase 1: Board loader spawnPoints and entity 2
- [x] Phase 2: Server config spawnPoints keys
- [x] Phase 3: Spawn availability helper
- [x] Phase 4: GameServer spawn list, spawnPlayer, waiting, trySpawnWaiting
- [x] Phase 5: Server startup cap, fallback, pass options
- [x] Phase 6: CONNECT handling and disconnect (deferred spawn, wait message)
- [x] Phase 7: Tests and verification
- [x] All tests passing (`npm test`)
- [ ] Feature card status updated when product complete (optional)
- [ ] Gameplan directory renamed with `X_` prefix when feature is closed (optional)

---

## Notes

- **Entity 2 only:** The loader uses only `entity` (no `glyph` alias). Entity 2 = spawn: recorded in `spawnPoints` and rendered as space.
- **Client:** CONNECT response may include `waitingForSpawn: true` and `message`; client can show the message until a later CONNECT with full gameState. No change to STATE_UPDATE shape for spawned players.
- **Backward compatibility:** Boards with no spawn points use board center; existing Server(port, game) without options still works (GameServer uses fallback spawn list).

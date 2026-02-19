# Spec: Server

## Purpose

The **Server** is the single specification for the multiplayer game server. It is the state authority: it runs the game session over WebSocket, loads the board at startup (via [Board Parsing](../board-parsing/SPEC_Board_Parsing.md)), accepts client connections, validates moves, and broadcasts game state to all clients. This document covers server-side concepts, workflows, technologies, component roles, design patterns, configuration, logging, lifecycle, and error handling.

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| Server role (state authority, connection handling) | Client implementation ([Client](../client/SPEC_Client.md)) |
| Technologies (runtime, dependencies) | Board Parsing internals (Board Parsing spec) |
| Architecture and component roles (conceptual) | Rendering (Renderer, Game Board) |
| Message types and payload contract (CONNECT, MOVE, STATE_UPDATE) | |
| Board loading at startup (via Board Parsing) | |
| Player spawn (spawn points from map/board) | |
| Move validation (bounds, walls, other players) | |
| Periodic state broadcast to clients | |
| State management, connection lifecycle | |
| Design patterns (Facade, Manager, etc.) | |
| Configuration, logging, lifecycle, error handling | |

---

## 2. Technologies

- **Runtime:** Node.js. **Language:** JavaScript (ES Modules); no TypeScript.
- **WebSocket:** `ws` — WebSocket server; connection lifecycle, message events.
- **Logging:** `winston` — structured logging; multiple transports, configurable levels.
- **Identifiers:** Node.js `crypto.randomUUID()` for clientId and playerId.
- **Testing:** Vitest (unit tests, non-interactive).

---

## 3. Server role in the stack

- **Single source of truth:** The server holds the authoritative board and player state. Clients do not load board files; they receive board and state only via server messages (CONNECT response and STATE_UPDATE).
- **Board at startup:** The server loads the board using the loader defined in [Board Parsing](../board-parsing/SPEC_Board_Parsing.md) (e.g. `--board` path, dimensions). On load failure the server exits; there is no fallback board.
- **WebSocket lifecycle:** The server listens for WebSocket connections, assigns a clientId and playerId per client, spawns the player, and sends the full game state in the CONNECT response. Subsequent state changes are broadcast via STATE_UPDATE.

---

## 4. Architecture and component roles

Conceptual layers (no file paths):

- **Entry:** Load config, configure logger, create and start the server, register graceful shutdown (SIGINT, SIGTERM).
- **Server (orchestration):** WebSocket server lifecycle, connection handling, message routing, periodic state broadcast. Acts as a **Facade** over connection and game subsystems: provides a single interface (e.g. start/stop) and hides ConnectionManager, GameServer, and WebSocket details from the entry point.
- **Connection management:** Track active WebSocket connections; map clientId to playerId; store connection metadata; cleanup on disconnect (remove player, remove connection, clear mappings).
- **Game state:** Player lifecycle (add, remove, spawn); move validation and execution; state serialization for broadcast. Uses board from loader (dimensions and grid from [Board Parsing](../board-parsing/SPEC_Board_Parsing.md), not a hard-coded grid).
- **Message handling:** Parse and create JSON messages; validate envelope (type, payload, timestamp); centralize message type constants (CONNECT, MOVE, STATE_UPDATE).

**Facade pattern:** The Server component provides a simplified API (e.g. start/stop) so the entry point does not depend on ConnectionManager, GameServer, or WebSocket internals. Without it, the entry point would need to wire connections, message handlers, and broadcast logic directly.

---

## 5. Connection workflow

1. **Client sends CONNECT** — Message type `CONNECT`; payload may be empty or contain optional fields.
2. **Server:** Creates unique clientId and playerId; spawns the player at a valid spawn position (see §8); adds the player to the game; builds full game state (board, players, score).
3. **Server sends CONNECT response** — Same type `CONNECT`. Payload contains at least:
   - `clientId`, `playerId`, `playerName` (or equivalent)
   - `gameState`: `{ board: { width, height, grid }, players: [...], score }`
   Board dimensions and grid come from the loaded board. Each player entry includes at least `playerId`, `x`, `y`, `playerName`.
4. The client uses this response to initialize its local state and render the board.

---

## 6. Message protocol

All messages are JSON with a common envelope:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Message type: CONNECT, MOVE, STATE_UPDATE. |
| `payload` | object | Message-specific data. |
| `timestamp` | number | Unix timestamp (ms). |
| `clientId` | string | Optional; identifies the sender when needed. |

**CONNECT:** See §5. Request payload may be empty. Response payload: `clientId`, `playerId`, `playerName`, `gameState` (board with width/height/grid from loaded board, players array, score).

**MOVE (client → server):** Payload: `{ dx: number, dy: number }`. `dx` and `dy` must be integers in the range -1, 0, or 1.

**STATE_UPDATE (server → all clients):** Payload has the same shape as `gameState` in the CONNECT response: `{ board: { width, height, grid }, players: [...], score }`.

**Validation:** Required envelope fields are type, payload, timestamp. Invalid JSON or missing required fields: log and ignore. For MOVE, invalid dx/dy (non-integers or out of range) or failed move validation: log and reject (no state change); no reply required.

Invalid or unknown message types are ignored or logged; the server does not apply state changes for invalid MOVE payloads (see §10).

---

## 7. Board and state

- **Board source:** The board comes from the loader defined in [Board Parsing](../board-parsing/SPEC_Board_Parsing.md). The server creates its internal board representation from the loader result (e.g. `{ width, height, grid }` and optional `spawnPoints`). Board dimensions and layout are not fixed (e.g. not hard-coded 20×20). Cell semantics: empty `' '`, wall `'#'`, spawn displayed as `' '` per Board Parsing.
- **Serialized state:** The server exposes board and players in CONNECT and STATE_UPDATE. Shape: `board.width`, `board.height`, `board.grid`, and a list of players (each with identity and position). Clients consume this to drive [Game Board](../game-board/SPEC_Game_Board.md) display; clients do not load board files in multiplayer.
- **State management:** Server-authoritative; state is held in memory (no persistence). Serialization produces a copy of the board grid for transmission. Full state is broadcast (no delta updates).

---

## 8. Spawn

- **Spawn list:** Spawn positions come from the loader’s `spawnPoints` ([Board Parsing](../board-parsing/SPEC_Board_Parsing.md)); order is row-major. The server applies a configurable maximum (`spawnPoints.maxCount`, default 25). If the list is empty (no entity-2 cells or after cap), the server uses a single fallback: board center `(Math.floor(width/2), Math.floor(height/2))`.
- **Spawn availability:** A spawn is **available** only when every cell within Manhattan distance R of that spawn is free of walls and other players. R = `spawnPoints.clearRadius` (default 3). Only in-bounds cells are considered. Manhattan distance: |x - sx| + |y - sy| ≤ R.
- **Join behavior:** If at least one spawn is available, the server assigns the **next unoccupied spawn** (first available in spawn list order). If none is available, the server does not reject the connection: it holds the connection, sends the configurable wait message (`spawnPoints.waitMessage`) to the client, and spawns the player when a spawn later becomes available (e.g. when another player disconnects). Next unoccupied ensures no two players start on the same cell.
- **Config:** `spawnPoints.maxCount` (default 25), `spawnPoints.clearRadius` (default 3), `spawnPoints.waitMessage` (default string). See §14 Configuration.
- **On CONNECT:** Once the player is spawned (immediately or after wait), the server sets the player’s coordinates and includes that player in the game state sent in the CONNECT response and in subsequent STATE_UPDATE messages.

---

## 9. Move validation

The server validates every MOVE before updating state. Validation rules:

1. **Player exists and is spawned:** The client’s playerId corresponds to a player that has been added and has valid coordinates (not null/undefined).
2. **Bounds:** The new position is within the board (0 ≤ x < width, 0 ≤ y < height).
3. **Not a wall:** The cell at the new position is not a wall (same cell semantics as [Board Parsing](../board-parsing/SPEC_Board_Parsing.md) and [Game Board](../game-board/SPEC_Game_Board.md)).
4. **Not occupied:** The new position is not already occupied by another player.

If any check fails, the server does not update the player’s position (move is ignored or rejected; no state change). Implementation may log or send an optional response.

---

## 10. Periodic broadcast

- **STATE_UPDATE:** The server broadcasts the full game state to all connected clients at a fixed interval of 250 ms. Payload includes board, players, and score (same shape as gameState in CONNECT).
- **When:** Only when at least one client is connected. No broadcast when there are zero connections.
- **Format:** Same serialized state shape as in the CONNECT response. Clients use STATE_UPDATE to refresh their local state and re-render (full or incremental per client/Canvas/Renderer specs).

---

## 11. Connection lifecycle

1. **Connect:** WebSocket connection established; server generates clientId (e.g. UUID), registers connection in the connection manager, registers message/close/error handlers.
2. **Join:** Client sends CONNECT; server generates playerId, adds player, spawns at valid position, maps clientId to playerId, sends CONNECT response with full game state.
3. **Active play:** Client sends MOVE messages; server validates and applies moves; updated state is included in the next periodic broadcast.
4. **Disconnect:** WebSocket closes or errors; server removes player from game, removes connection from manager, cleans up clientId↔playerId mapping.

---

## 12. Design patterns

- **Facade:** Server component exposes a single interface (e.g. start/stop) and orchestrates ConnectionManager, GameServer, and WebSocket server.
- **Manager/Registry:** Connection manager holds connections and clientId→playerId mapping; game state holds players; Map-based lookups.
- **Value Object:** Board serialization returns a copy of the grid (immutable transmission).
- **Factory:** Message creation centralized (consistent envelope, timestamps).
- **Constants:** Message type constants (CONNECT, MOVE, STATE_UPDATE) in one place.

---

## 13. Error handling

- **Strategy:** Graceful degradation with logging. Do not let a single client or message failure bring down the server.
- **Startup/shutdown:** Wrap async start/stop in try/catch; on startup failure log and exit (e.g. exit code 1); on shutdown log and stop server before process exit.
- **Message parsing:** JSON parse errors: log and ignore message.
- **Send errors:** If sending to a client fails, log and continue; optionally treat as disconnect and cleanup.
- **Validation:** Invalid moves or missing player: log and reject; no reply required.
- **Connection errors:** Log; cleanup that connection and player.

---

## 14. Configuration

- **Source:** Config is loaded from a config module (e.g. server config module) and/or from `.ascii-tag/server.json` (e.g. created by CLI `ascii-tag init`). Port, host, and logging level are configurable.
- **Board path:** Server uses `--board <path>` per [Board Parsing](../board-parsing/SPEC_Board_Parsing.md); default board path and dimensions path as defined there.
- **Spawn:** `spawnPoints.maxCount` (default 25), `spawnPoints.clearRadius` (default 3), `spawnPoints.waitMessage` (default string; sent to client when no spawn is available and connection is held).
- **Priority:** Command-line or explicit parameters can override config file values where applicable.

---

## 15. Logging

- **Library:** Winston. **Levels:** error, warn, info, debug.
- **Transports:** Console (e.g. server mode) and/or file. File logs may live under `logs/` (e.g. error.log, combined.log) if applicable.
- **Use:** Error for failures; warn for validation/unexpected state; info for connection and join/leave events; debug for message routing or movement detail.

---

## 16. Lifecycle

- **Startup:** Load config, configure logger, create server instance, call start (create WebSocket server, register handlers, start periodic broadcast timer). Resolve when listening.
- **Runtime:** Accept WebSocket connections, handle messages (CONNECT, MOVE), broadcast state every 250 ms when clients are connected.
- **Shutdown:** On SIGINT/SIGTERM, run shutdown handler: stop server (stop broadcast timer, close all client connections, close WebSocket server), then process.exit(0).

---

## 17. Success criteria

- [ ] Server is the single source of truth for board and player state; clients receive state only via CONNECT and STATE_UPDATE.
- [ ] Board is loaded at startup via Board Parsing; no fallback to a hard-coded board.
- [ ] CONNECT: client sends request; server creates clientId/playerId, spawns player at valid position, sends response with full gameState.
- [ ] MOVE: client sends dx/dy in range -1..1; server validates (player spawned, bounds, not wall, not occupied) and updates position only if valid.
- [ ] STATE_UPDATE: server broadcasts full state every 250 ms when clients are connected.
- [ ] Spawn: new players receive a valid spawn position from map/board or defined default; when no spawn is available, connection is held and wait message sent until a spawn becomes available; spawn uses next unoccupied; when board has no spawn points, fallback is board center.
- [ ] Config and logger configured at startup; graceful shutdown on SIGINT/SIGTERM.
- [ ] Invalid messages and send/connection errors handled without crashing the server.

---

## 18. Related specs

| Spec | Relation |
|------|----------|
| [Board Parsing](../board-parsing/SPEC_Board_Parsing.md) | Board and optional spawn data source; server loads board at startup. |
| [Game Board](../game-board/SPEC_Game_Board.md) | Consumes board and player data on the client; data ultimately comes from server state. |
| [Overall](../SPEC_Overall.md) | How Server fits in the terminal game stack. |

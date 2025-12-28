# WebSocket Integration - Implementation Gameplan

## Overview

This gameplan implements WebSocket support for the terminal game application, enabling real-time communication between server and clients in preparation for multiplayer functionality. The implementation will add a WebSocket server that manages authoritative game state and allows multiple clients to connect and interact with the game.

**Reference**:

- Feature Card: `docs/development/cards/features/FEATURE_websocket_integration.md`
- Specification: `docs/development/specs/websocket-integration/websocket-integration_SPECS.md`

## Progress Summary

- ✅ **Phase 1: Dependencies and Configuration** - COMPLETE
- ⏳ **Phase 2: Message Protocol and Types** - NOT STARTED
- ⏳ **Phase 3: Server Infrastructure** - NOT STARTED
- ⏳ **Phase 4: Connection Management** - NOT STARTED
- ⏳ **Phase 5: Game State Synchronization** - NOT STARTED
- ⏳ **Phase 6: Client Integration** - NOT STARTED
- ⏳ **Phase 7: Reconnection Support** - NOT STARTED
- ⏳ **Phase 8: Logging and Error Handling** - NOT STARTED
- ⏳ **Phase 9: Testing** - NOT STARTED
- ⏳ **Phase 10: Documentation and Polish** - NOT STARTED

## Prerequisites

- Node.js installed (version 18+ recommended for ES Modules support)
- Existing game code working (Game, Board, Renderer, InputHandler)
- Terminal/console access
- Git initialized (for commits)

---

## Phase 1: Dependencies and Configuration (~15 minutes)

### Step 1.1: Install Dependencies

- [x] Install WebSocket library:

  ```bash
  npm install ws
  ```

- [x] Install UUID library for client ID generation:
  ```bash
  npm install uuid
  ```

**Verification**:

- [ ] `ws` package installed and listed in `package.json`
- [ ] `uuid` package installed and listed in `package.json`
- [ ] `package-lock.json` updated

### Step 1.2: Create Server Configuration

- [x] Create `src/config/serverConfig.js`
- [x] Define server configuration with:
  - WebSocket enabled/disabled flag
  - Server port (default: 3000)
  - Server host (default: '0.0.0.0')
  - Update interval (default: 250ms = 4 updates/second)
  - Logging level (default: 'info')
  - Reconnection settings

**Configuration Structure**:

```javascript
export const serverConfig = {
  websocket: {
    enabled: false,
    port: 3000,
    host: '0.0.0.0',
    updateInterval: 250, // milliseconds
  },
  logging: {
    level: 'info', // 'debug', 'info', 'warn', 'error'
  },
  reconnection: {
    enabled: true,
    maxAttempts: 5,
    retryDelay: 1000, // milliseconds
  },
};
```

**Verification**:

- [x] `serverConfig.js` file created
- [x] Configuration structure matches specification
- [x] Default values match specification answers
- [x] Configuration can be imported in other modules

---

## Phase 2: Message Protocol and Types (~30 minutes)

### Step 2.1: Create Message Types Constants

- [x] Create `src/network/MessageTypes.js`
- [x] Define message type constants:
  - `CONNECT`
  - `DISCONNECT`
  - `MOVE`
  - `STATE_UPDATE`
  - `ERROR`
  - `PING`
  - `PONG`
  - `SET_PLAYER_NAME`
  - `PLAYER_JOINED`
  - `PLAYER_LEFT`

**Verification**:

- [x] `MessageTypes.js` file created
- [x] All message types defined as constants
- [x] Message types exported for use in other modules

### Step 2.2: Create Message Handler

- [x] Create `src/network/MessageHandler.js`
- [x] Implement message parsing:
  - Parse JSON messages
  - Validate message structure
  - Extract message type, payload, timestamp, clientId
- [x] Implement message validation:
  - Check required fields
  - Validate message type
  - Validate payload structure
- [x] Implement error handling:
  - Handle malformed JSON
  - Handle missing required fields
  - Return structured error messages

**Message Structure**:

```javascript
{
  type: string,
  payload: any,
  timestamp?: number,
  clientId?: string
}
```

**Verification**:

- [x] `MessageHandler.js` file created
- [x] Can parse valid JSON messages
- [x] Can validate message structure
- [x] Returns errors for invalid messages
- [x] Handles malformed JSON gracefully

### Step 2.3: Create Message Builder Utilities

- [x] Add helper functions to `MessageHandler.js`:
  - `createMessage(type, payload, clientId)` - Create message object
  - `createErrorMessage(code, message, context, clientId)` - Create error message
  - `createStateUpdateMessage(gameState)` - Create state update message

**Error Message Structure**:

```javascript
{
  type: 'ERROR',
  payload: {
    code: string,
    message: string,
    context: {
      action: string,
      playerId: string,
      reason: string
    }
  },
  timestamp: number,
  clientId: string
}
```

**Verification**:

- [x] Helper functions created
- [x] Messages created with correct structure
- [x] Timestamps included when needed
- [x] Error messages include context

---

## Phase 3: Server Infrastructure (~45 minutes)

### Step 3.1: Create Server Entry Point

- [x] Create `src/server/index.js`
- [x] Import WebSocketServer from 'ws'
- [x] Import serverConfig
- [x] Create WebSocket server instance
- [x] Start server on configured port and host
- [x] Handle server startup errors
- [x] Implement graceful shutdown (SIGINT, SIGTERM)

**Server Setup**:

```javascript
import { WebSocketServer } from 'ws';
import { serverConfig } from '../config/serverConfig.js';

const wss = new WebSocketServer({
  port: serverConfig.websocket.port,
  host: serverConfig.websocket.host,
});
```

**Verification**:

- [x] `src/server/index.js` file created
- [x] Server starts successfully
- [x] Server listens on configured port
- [x] Server handles shutdown gracefully
- [x] Can be run as standalone: `node src/server/index.js`

### Step 3.2: Create Connection Manager

- [x] Create `src/server/ConnectionManager.js`
- [x] Implement connection tracking:
  - Store active connections (Map or object)
  - Generate unique client IDs using UUID v4
  - Track connection metadata (connectedAt, lastActivity, playerId, playerName)
- [x] Implement connection methods:
  - `addConnection(ws)` - Add new connection, return client ID
  - `removeConnection(clientId)` - Remove connection
  - `getConnection(clientId)` - Get connection by ID
  - `getAllConnections()` - Get all active connections
  - `updateActivity(clientId)` - Update last activity timestamp
- [x] Implement player management:
  - `setPlayerId(clientId, playerId)` - Set player ID for connection
  - `setPlayerName(clientId, playerName)` - Set player name
  - `getPlayerInfo(clientId)` - Get player info

**Connection Structure**:

```javascript
{
  id: string,              // UUID v4
  ws: WebSocket,
  connectedAt: number,
  lastActivity: number,
  playerId?: string,
  playerName?: string
}
```

**Verification**:

- [x] `ConnectionManager.js` file created
- [x] Can add connections
- [x] Can remove connections
- [x] Can retrieve connections by ID
- [x] Client IDs are UUID v4 format
- [x] Player info can be set and retrieved

### Step 3.3: Create Game Server

- [x] Create `src/server/GameServer.js`
- [x] Implement server-side game state:
  - Maintain single Game instance
  - Track all player positions (separate from client connections)
  - Map player IDs to positions
- [x] Implement game state methods:
  - `getGameState()` - Get current game state
  - `addPlayer(playerId, playerName, x, y)` - Add player to game
  - `removePlayer(playerId)` - Remove player from game
  - `movePlayer(playerId, dx, dy)` - Move player (with validation)
  - `resetGame()` - Reset game to initial state
- [ ] Implement state update broadcasting:
  - `broadcastStateUpdate()` - Broadcast state to all clients
  - Use configured update interval (4 times per second)
  - Throttle updates if needed

**Game State Structure**:

```javascript
{
  board: Board,
  players: [
    {
      playerId: string,
      playerName: string,
      clientId: string,
      x: number,
      y: number
    }
  ],
  score: number,
  running: boolean
}
```

**Verification**:

- [x] `GameServer.js` file created
- [x] Can create game instance
- [x] Can add players to game
- [x] Can remove players from game
- [x] Can move players (with validation)
- [x] Can get game state
- [ ] Can broadcast state updates (deferred to Phase 4)

---

## Phase 4: Connection Management (~30 minutes)

### Step 4.1: Integrate Connection Manager with Server

- [x] Update `src/server/index.js`
- [x] Import ConnectionManager
- [x] Create ConnectionManager instance
- [x] Handle 'connection' event:
  - Create new connection via ConnectionManager
  - Assign client ID
  - Send CONNECT message with initial game state
  - Set up message handlers
  - Set up disconnect handler
- [x] Handle 'close' event:
  - Remove connection from ConnectionManager
  - Remove player from game
  - Broadcast player left to other clients

**Verification**:

- [x] Server accepts new connections
- [x] Clients receive unique client IDs
- [x] Clients receive initial game state on connect
- [x] Connections are tracked correctly
- [x] Disconnections are handled and cleaned up

### Step 4.2: Implement Message Routing

- [x] Update `src/server/index.js`
- [x] Import MessageHandler and MessageTypes
- [x] Route incoming messages based on type:
  - `CONNECT` → Handle player connection
  - `DISCONNECT` → Handle player disconnection
  - `MOVE` → Handle player movement
  - `SET_PLAYER_NAME` → Handle player name setting
  - `PING` → Respond with PONG
- [x] Call appropriate GameServer methods
- [x] Send responses/acknowledgments

**Verification**:

- [x] Messages are parsed correctly
- [x] Messages are routed to correct handlers
- [x] Invalid messages return error responses
- [x] All message types are handled

### Step 4.3: Implement WebSocket Built-in Ping/Pong

- [x] Configure WebSocket server to use built-in ping/pong
- [x] Set ping interval (if configurable)
- [x] Handle pong responses
- [x] Detect dead connections (no pong response)
- [x] Clean up dead connections

**Verification**:

- [x] Ping/pong frames are sent/received
- [x] Dead connections are detected
- [x] Dead connections are cleaned up
- [x] Connection health is maintained

---

## Phase 5: Game State Synchronization (~45 minutes)

### Step 5.1: Implement State Update Broadcasting

- [x] Update `src/server/index.js`
- [x] Implement periodic state broadcasting:
  - Use setInterval with configured update interval (250ms)
  - Get current game state
  - Create STATE_UPDATE message
  - Broadcast to all connected clients
- [x] Implement immediate state updates:
  - Broadcast on player join
  - Broadcast on player leave
  - Broadcast on player name change
- [ ] Optimize state updates:
  - Only send changed data if possible (future enhancement)
  - Compress large state objects if needed (future enhancement)

**Verification**:

- [x] State updates are broadcast at configured interval
- [x] All connected clients receive updates
- [x] State updates include all player positions
- [x] State updates include board state

### Step 5.2: Implement Action Validation

- [x] Update `src/server/index.js`
- [x] Implement comprehensive validation for MOVE actions:
  - Validate action type
  - Validate required fields (playerId, dx, dy)
  - Validate player exists
  - Validate game rules (can't move into walls, can't move outside bounds)
  - Validate player permissions
  - Validate game is running
- [x] Return structured error messages on validation failure
- [x] Apply action only if validation passes

**Validation Checks**:

- Action type is MOVE
- Player ID exists in game
- dx and dy are valid (-1, 0, or 1)
- New position is within board bounds
- New position is not a wall
- Game is running

**Verification**:

- [x] Invalid actions are rejected
- [x] Error messages are sent to client
- [x] Valid actions are applied
- [x] Game state remains consistent

### Step 5.3: Implement Player Management

- [x] Update `src/server/index.js`
- [x] Implement player addition:
  - Assign starting position (center or random)
  - Create player object with playerId, playerName, clientId
  - Add to players array
  - Broadcast PLAYER_JOINED message
- [x] Implement player removal:
  - Remove from players array
  - Broadcast PLAYER_LEFT message
  - Clean up player resources
- [x] Implement player name setting:
  - Update player name
  - Broadcast name change to other clients

**Verification**:

- [x] Players can be added to game
- [x] Players can be removed from game
- [x] Player names can be set
- [x] Other clients are notified of player changes

---

## Phase 6: Client Integration (~60 minutes)

### Step 6.1: Create WebSocket Client Wrapper

- [x] Create `src/network/WebSocketClient.js`
- [x] Implement client connection:
  - Connect to WebSocket server
  - Handle connection events
  - Store connection state
- [x] Implement message sending:
  - `sendMessage(message)` - Send message to server
  - `sendMove(dx, dy)` - Send movement action
  - `sendSetPlayerName(name)` - Send player name
- [x] Implement message receiving:
  - Handle incoming messages
  - Parse messages
  - Call appropriate callbacks
- [x] Implement callbacks:
  - `onConnect` - Called when connected
  - `onDisconnect` - Called when disconnected
  - `onStateUpdate` - Called when state update received
  - `onError` - Called when error received
  - `onPlayerJoined` - Called when player joins
  - `onPlayerLeft` - Called when player leaves

**Verification**:

- [x] `WebSocketClient.js` file created
- [x] Can connect to server
- [x] Can send messages
- [x] Can receive messages
- [x] Callbacks are called correctly

### Step 6.2: Modify Client Entry Point for Networked Mode

- [x] Update `src/index.js`
- [x] Add mode detection (local vs networked):
  - Check `serverConfig.websocket.enabled`
  - Branch logic based on mode
- [x] Implement networked mode:
  - Create WebSocketClient instance
  - Connect to server
  - Send input actions to server
  - Receive state updates from server
  - Render state updates
- [x] Maintain local mode:
  - Keep existing single-player logic
  - No breaking changes

**Networked Mode Flow**:

1. Connect to WebSocket server
2. Receive initial game state
3. Render initial state
4. On input: Send action to server
5. On state update: Update local view and render

**Verification**:

- [x] Local mode still works (no breaking changes)
- [x] Networked mode can be enabled via config
- [x] Client connects to server in networked mode
- [x] Client receives and renders state updates
- [x] Client sends actions to server

### Step 6.3: Integrate Input with Networked Mode

- [x] Update input callbacks in networked mode
- [x] Instead of directly updating game state:
  - Send MOVE message to server
  - Wait for state update from server
  - Render updated state
- [ ] Handle player name input:
  - Allow player to set name on connect
  - Send SET_PLAYER_NAME message (basic support added, UI enhancement deferred)
- [ ] Handle reconnection:
  - Attempt to reconnect on disconnect
  - Restore player state if reconnection succeeds (deferred to Phase 7)

**Verification**:

- [x] Input actions are sent to server
- [x] State updates trigger rendering
- [ ] Player names can be set (basic support added)
- [ ] Reconnection works correctly (deferred to Phase 7)

---

## Phase 7: Reconnection Support (~30 minutes)

### Step 7.1: Implement Client Reconnection Logic

- [x] Update `src/network/WebSocketClient.js`
- [x] Implement reconnection:
  - Detect disconnection
  - Attempt reconnection with exponential backoff
  - Respect maxAttempts configuration
  - Store player state for restoration
- [x] Implement state restoration:
  - Send player ID on reconnect
  - Request current game state
  - Restore player position if possible

**Reconnection Flow**:

1. Detect disconnect
2. Wait retryDelay milliseconds
3. Attempt reconnect
4. If successful: Send player ID, restore state
5. If failed: Retry up to maxAttempts

**Verification**:

- [x] Reconnection attempts are made
- [x] Exponential backoff is used
- [x] Max attempts are respected
- [x] Player state can be restored

### Step 7.2: Implement Server Reconnection Handling

- [x] Update `src/server/index.js`
- [x] Handle player reconnection:
  - Accept player ID on reconnect
  - Restore player position if player exists
  - Send current game state
  - Update clientId mapping for reconnected player
- [ ] Handle reconnection timeout:
  - Remove player if reconnection fails (handled by existing disconnect logic)
  - Clean up player resources (handled by existing disconnect logic)

**Verification**:

- [x] Server accepts reconnections
- [x] Player state is restored
- [x] Other clients receive state updates
- [x] Failed reconnections are cleaned up (via existing disconnect handling)

---

## Phase 8: Logging and Error Handling (~30 minutes)

### Step 8.1: Implement Configurable Logging

- [ ] Create `src/utils/logger.js`
- [ ] Implement logging levels:
  - `debug` - All events, messages, state changes
  - `info` - Connections, disconnections, important events
  - `warn` - Warnings, non-critical errors
  - `error` - Errors only
- [ ] Implement logger methods:
  - `logger.debug(message, ...args)`
  - `logger.info(message, ...args)`
  - `logger.warn(message, ...args)`
  - `logger.error(message, ...args)`
- [ ] Use configured logging level from serverConfig
- [ ] Filter logs based on level

**Verification**:

- [ ] `logger.js` file created
- [ ] Logging levels work correctly
- [ ] Logs are filtered by configured level
- [ ] Logs are formatted appropriately

### Step 8.2: Add Logging Throughout Server

- [ ] Add logging to `src/server/index.js`:
  - Server startup/shutdown
  - Connection events
  - Errors
- [ ] Add logging to `src/server/ConnectionManager.js`:
  - Connection additions/removals
  - Player info updates
- [ ] Add logging to `src/server/GameServer.js`:
  - Player additions/removals
  - Player movements
  - State updates
  - Validation failures

**Verification**:

- [ ] Logging added to all server components
- [ ] Logs provide useful debugging information
- [ ] Log levels are appropriate
- [ ] Sensitive data is not logged

### Step 8.3: Implement Comprehensive Error Handling

- [ ] Add error handling to message parsing
- [ ] Add error handling to connection management
- [ ] Add error handling to game state operations
- [ ] Add error handling to WebSocket operations
- [ ] Return structured error messages to clients
- [ ] Log all errors appropriately

**Error Handling**:

- Catch and handle JSON parse errors
- Catch and handle WebSocket errors
- Catch and handle game state errors
- Return structured ERROR messages to clients
- Log errors with appropriate level

**Verification**:

- [ ] Errors are caught and handled
- [ ] Error messages are sent to clients
- [ ] Errors are logged
- [ ] Application doesn't crash on errors

---

## Phase 9: Testing (~60 minutes)

### Step 9.1: Unit Tests for Message Handling

- [ ] Create `test/network/MessageHandler.test.js`
- [ ] Test message parsing:
  - Valid messages
  - Invalid JSON
  - Missing required fields
  - Invalid message types
- [ ] Test message validation
- [ ] Test message builder functions

**Verification**:

- [ ] Unit tests created
- [ ] All tests pass
- [ ] Test coverage for message handling

### Step 9.2: Unit Tests for Connection Management

- [ ] Create `test/server/ConnectionManager.test.js`
- [ ] Test connection addition/removal
- [ ] Test client ID generation (UUID v4)
- [ ] Test player info management
- [ ] Test connection retrieval

**Verification**:

- [ ] Unit tests created
- [ ] All tests pass
- [ ] Test coverage for connection management

### Step 9.3: Unit Tests for Game Server

- [ ] Create `test/server/GameServer.test.js`
- [ ] Test player addition/removal
- [ ] Test player movement validation
- [ ] Test state update generation
- [ ] Test game state management

**Verification**:

- [ ] Unit tests created
- [ ] All tests pass
- [ ] Test coverage for game server

### Step 9.4: Integration Tests

- [ ] Create `test/integration/websocket.test.js`
- [ ] Test server startup/shutdown
- [ ] Test client connection/disconnection
- [ ] Test message sending/receiving
- [ ] Test multiple client connections
- [ ] Test state synchronization
- [ ] Test reconnection

**Verification**:

- [ ] Integration tests created
- [ ] All tests pass
- [ ] Multiple client scenarios tested
- [ ] State synchronization verified

---

## Phase 10: Documentation and Polish (~30 minutes)

### Step 10.1: Update README

- [ ] Update `README.md` with WebSocket information:
  - How to run server
  - How to run client in networked mode
  - Configuration options
  - Network requirements

**Verification**:

- [ ] README updated
- [ ] Instructions are clear
- [ ] Configuration documented

### Step 10.2: Add Code Comments

- [ ] Add JSDoc comments to all new files
- [ ] Document public methods
- [ ] Document message protocol
- [ ] Document configuration options

**Verification**:

- [ ] All files have appropriate comments
- [ ] Public APIs are documented
- [ ] Message protocol is documented

### Step 10.3: Create Server Startup Script

- [ ] Add npm script to start server:
  ```json
  {
    "scripts": {
      "server": "node src/server/index.js"
    }
  }
  ```
- [ ] Add npm script to start client in networked mode (if needed)

**Verification**:

- [ ] Scripts added to package.json
- [ ] Server can be started with `npm run server`
- [ ] Scripts work correctly

---

## Success Criteria

- [ ] WebSocket server starts and accepts connections
- [ ] Multiple clients can connect simultaneously
- [ ] Clients receive unique UUID v4 client IDs
- [ ] Clients can send actions to server
- [ ] Server validates actions comprehensively
- [ ] Server broadcasts state updates at configured interval (4/sec)
- [ ] Clients receive and render state updates
- [ ] Player IDs are separate from client IDs
- [ ] Players can set custom names
- [ ] Reconnection works with state restoration
- [ ] Logging is configurable and works
- [ ] Error handling is comprehensive
- [ ] Local mode still works (backward compatible)
- [ ] Networked mode can be enabled via configuration
- [ ] All tests pass
- [ ] Code is documented

## Estimated Time

- **Phase 1**: ~15 minutes
- **Phase 2**: ~30 minutes
- **Phase 3**: ~45 minutes
- **Phase 4**: ~30 minutes
- **Phase 5**: ~45 minutes
- **Phase 6**: ~60 minutes
- **Phase 7**: ~30 minutes
- **Phase 8**: ~30 minutes
- **Phase 9**: ~60 minutes
- **Phase 10**: ~30 minutes

**Total Estimated Time**: ~6-7 hours

## Notes

- Server runs on port 3000 by default, accessible from network (0.0.0.0)
- State updates broadcast at 4 times per second (250ms interval)
- Client IDs use UUID v4 for uniqueness
- Player IDs are separate from client IDs to support reconnection
- Comprehensive validation prevents cheating
- Structured error messages with context for debugging
- Full reconnection support with state restoration
- Configurable logging levels for development and production

## Dependencies

- `ws` - WebSocket library
- `uuid` - UUID generation (v4)
- Existing game code (Game, Board, Renderer, InputHandler)

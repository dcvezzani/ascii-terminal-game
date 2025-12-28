# WebSocket Integration - Implementation Gameplan

## Overview

This gameplan implements WebSocket support for the terminal game application, enabling real-time communication between server and clients in preparation for multiplayer functionality. The implementation will add a WebSocket server that manages authoritative game state and allows multiple clients to connect and interact with the game.

**Reference**:

- Feature Card: `docs/development/cards/features/FEATURE_websocket_integration.md`
- Specification: `docs/development/specs/websocket-integration/websocket-integration_SPECS.md`

## Progress Summary

- ⏳ **Phase 1: Dependencies and Configuration** - NOT STARTED
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

- [ ] Install WebSocket library:

  ```bash
  npm install ws
  ```

- [ ] Install UUID library for client ID generation:
  ```bash
  npm install uuid
  ```

**Verification**:

- [ ] `ws` package installed and listed in `package.json`
- [ ] `uuid` package installed and listed in `package.json`
- [ ] `package-lock.json` updated

### Step 1.2: Create Server Configuration

- [ ] Create `src/config/serverConfig.js`
- [ ] Define server configuration with:
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

- [ ] `serverConfig.js` file created
- [ ] Configuration structure matches specification
- [ ] Default values match specification answers
- [ ] Configuration can be imported in other modules

---

## Phase 2: Message Protocol and Types (~30 minutes)

### Step 2.1: Create Message Types Constants

- [ ] Create `src/network/MessageTypes.js`
- [ ] Define message type constants:
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

- [ ] `MessageTypes.js` file created
- [ ] All message types defined as constants
- [ ] Message types exported for use in other modules

### Step 2.2: Create Message Handler

- [ ] Create `src/network/MessageHandler.js`
- [ ] Implement message parsing:
  - Parse JSON messages
  - Validate message structure
  - Extract message type, payload, timestamp, clientId
- [ ] Implement message validation:
  - Check required fields
  - Validate message type
  - Validate payload structure
- [ ] Implement error handling:
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

- [ ] `MessageHandler.js` file created
- [ ] Can parse valid JSON messages
- [ ] Can validate message structure
- [ ] Returns errors for invalid messages
- [ ] Handles malformed JSON gracefully

### Step 2.3: Create Message Builder Utilities

- [ ] Add helper functions to `MessageHandler.js`:
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

- [ ] Helper functions created
- [ ] Messages created with correct structure
- [ ] Timestamps included when needed
- [ ] Error messages include context

---

## Phase 3: Server Infrastructure (~45 minutes)

### Step 3.1: Create Server Entry Point

- [ ] Create `src/server/index.js`
- [ ] Import WebSocketServer from 'ws'
- [ ] Import serverConfig
- [ ] Create WebSocket server instance
- [ ] Start server on configured port and host
- [ ] Handle server startup errors
- [ ] Implement graceful shutdown (SIGINT, SIGTERM)

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

- [ ] `src/server/index.js` file created
- [ ] Server starts successfully
- [ ] Server listens on configured port
- [ ] Server handles shutdown gracefully
- [ ] Can be run as standalone: `node src/server/index.js`

### Step 3.2: Create Connection Manager

- [ ] Create `src/server/ConnectionManager.js`
- [ ] Implement connection tracking:
  - Store active connections (Map or object)
  - Generate unique client IDs using UUID v4
  - Track connection metadata (connectedAt, lastActivity, playerId, playerName)
- [ ] Implement connection methods:
  - `addConnection(ws)` - Add new connection, return client ID
  - `removeConnection(clientId)` - Remove connection
  - `getConnection(clientId)` - Get connection by ID
  - `getAllConnections()` - Get all active connections
  - `updateActivity(clientId)` - Update last activity timestamp
- [ ] Implement player management:
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

- [ ] `ConnectionManager.js` file created
- [ ] Can add connections
- [ ] Can remove connections
- [ ] Can retrieve connections by ID
- [ ] Client IDs are UUID v4 format
- [ ] Player info can be set and retrieved

### Step 3.3: Create Game Server

- [ ] Create `src/server/GameServer.js`
- [ ] Implement server-side game state:
  - Maintain single Game instance
  - Track all player positions (separate from client connections)
  - Map player IDs to positions
- [ ] Implement game state methods:
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

- [ ] `GameServer.js` file created
- [ ] Can create game instance
- [ ] Can add players to game
- [ ] Can remove players from game
- [ ] Can move players (with validation)
- [ ] Can get game state
- [ ] Can broadcast state updates

---

## Phase 4: Connection Management (~30 minutes)

### Step 4.1: Integrate Connection Manager with Server

- [ ] Update `src/server/index.js`
- [ ] Import ConnectionManager
- [ ] Create ConnectionManager instance
- [ ] Handle 'connection' event:
  - Create new connection via ConnectionManager
  - Assign client ID
  - Send CONNECT message with initial game state
  - Set up message handlers
  - Set up disconnect handler
- [ ] Handle 'close' event:
  - Remove connection from ConnectionManager
  - Remove player from game
  - Broadcast player left to other clients

**Verification**:

- [ ] Server accepts new connections
- [ ] Clients receive unique client IDs
- [ ] Clients receive initial game state on connect
- [ ] Connections are tracked correctly
- [ ] Disconnections are handled and cleaned up

### Step 4.2: Implement Message Routing

- [ ] Update `src/server/index.js`
- [ ] Import MessageHandler and MessageTypes
- [ ] Route incoming messages based on type:
  - `CONNECT` → Handle player connection
  - `DISCONNECT` → Handle player disconnection
  - `MOVE` → Handle player movement
  - `SET_PLAYER_NAME` → Handle player name setting
  - `PING` → Respond with PONG
- [ ] Call appropriate GameServer methods
- [ ] Send responses/acknowledgments

**Verification**:

- [ ] Messages are parsed correctly
- [ ] Messages are routed to correct handlers
- [ ] Invalid messages return error responses
- [ ] All message types are handled

### Step 4.3: Implement WebSocket Built-in Ping/Pong

- [ ] Configure WebSocket server to use built-in ping/pong
- [ ] Set ping interval (if configurable)
- [ ] Handle pong responses
- [ ] Detect dead connections (no pong response)
- [ ] Clean up dead connections

**Verification**:

- [ ] Ping/pong frames are sent/received
- [ ] Dead connections are detected
- [ ] Dead connections are cleaned up
- [ ] Connection health is maintained

---

## Phase 5: Game State Synchronization (~45 minutes)

### Step 5.1: Implement State Update Broadcasting

- [ ] Update `src/server/GameServer.js`
- [ ] Implement periodic state broadcasting:
  - Use setInterval with configured update interval (250ms)
  - Get current game state
  - Create STATE_UPDATE message
  - Broadcast to all connected clients
- [ ] Implement immediate state updates:
  - Broadcast on player join
  - Broadcast on player leave
  - Broadcast on player move (if not using periodic updates)
- [ ] Optimize state updates:
  - Only send changed data if possible
  - Compress large state objects if needed

**Verification**:

- [ ] State updates are broadcast at configured interval
- [ ] All connected clients receive updates
- [ ] State updates include all player positions
- [ ] State updates include board state

### Step 5.2: Implement Action Validation

- [ ] Update `src/server/GameServer.js`
- [ ] Implement comprehensive validation for MOVE actions:
  - Validate action type
  - Validate required fields (playerId, dx, dy)
  - Validate player exists
  - Validate game rules (can't move into walls, can't move outside bounds)
  - Validate player permissions
- [ ] Return structured error messages on validation failure
- [ ] Apply action only if validation passes

**Validation Checks**:

- Action type is MOVE
- Player ID exists in game
- dx and dy are valid (-1, 0, or 1)
- New position is within board bounds
- New position is not a wall
- Game is running

**Verification**:

- [ ] Invalid actions are rejected
- [ ] Error messages are sent to client
- [ ] Valid actions are applied
- [ ] Game state remains consistent

### Step 5.3: Implement Player Management

- [ ] Update `src/server/GameServer.js`
- [ ] Implement player addition:
  - Assign starting position (center or random)
  - Create player object with playerId, playerName, clientId
  - Add to players array
  - Broadcast PLAYER_JOINED message
- [ ] Implement player removal:
  - Remove from players array
  - Broadcast PLAYER_LEFT message
  - Clean up player resources
- [ ] Implement player name setting:
  - Update player name
  - Broadcast name change to other clients

**Verification**:

- [ ] Players can be added to game
- [ ] Players can be removed from game
- [ ] Player names can be set
- [ ] Other clients are notified of player changes

---

## Phase 6: Client Integration (~60 minutes)

### Step 6.1: Create WebSocket Client Wrapper

- [ ] Create `src/network/WebSocketClient.js`
- [ ] Implement client connection:
  - Connect to WebSocket server
  - Handle connection events
  - Store connection state
- [ ] Implement message sending:
  - `sendMessage(message)` - Send message to server
  - `sendMove(dx, dy)` - Send movement action
  - `sendSetPlayerName(name)` - Send player name
- [ ] Implement message receiving:
  - Handle incoming messages
  - Parse messages
  - Call appropriate callbacks
- [ ] Implement callbacks:
  - `onConnect` - Called when connected
  - `onDisconnect` - Called when disconnected
  - `onStateUpdate` - Called when state update received
  - `onError` - Called when error received
  - `onPlayerJoined` - Called when player joins
  - `onPlayerLeft` - Called when player leaves

**Verification**:

- [ ] `WebSocketClient.js` file created
- [ ] Can connect to server
- [ ] Can send messages
- [ ] Can receive messages
- [ ] Callbacks are called correctly

### Step 6.2: Modify Client Entry Point for Networked Mode

- [ ] Update `src/index.js`
- [ ] Add mode detection (local vs networked):
  - Check `serverConfig.websocket.enabled`
  - Branch logic based on mode
- [ ] Implement networked mode:
  - Create WebSocketClient instance
  - Connect to server
  - Send input actions to server
  - Receive state updates from server
  - Render state updates
- [ ] Maintain local mode:
  - Keep existing single-player logic
  - No breaking changes

**Networked Mode Flow**:

1. Connect to WebSocket server
2. Receive initial game state
3. Render initial state
4. On input: Send action to server
5. On state update: Update local view and render

**Verification**:

- [ ] Local mode still works (no breaking changes)
- [ ] Networked mode can be enabled via config
- [ ] Client connects to server in networked mode
- [ ] Client receives and renders state updates
- [ ] Client sends actions to server

### Step 6.3: Integrate Input with Networked Mode

- [ ] Update input callbacks in networked mode
- [ ] Instead of directly updating game state:
  - Send MOVE message to server
  - Wait for state update from server
  - Render updated state
- [ ] Handle player name input:
  - Allow player to set name on connect
  - Send SET_PLAYER_NAME message
- [ ] Handle reconnection:
  - Attempt to reconnect on disconnect
  - Restore player state if reconnection succeeds

**Verification**:

- [ ] Input actions are sent to server
- [ ] State updates trigger rendering
- [ ] Player names can be set
- [ ] Reconnection works correctly

---

## Phase 7: Reconnection Support (~30 minutes)

### Step 7.1: Implement Client Reconnection Logic

- [ ] Update `src/network/WebSocketClient.js`
- [ ] Implement reconnection:
  - Detect disconnection
  - Attempt reconnection with exponential backoff
  - Respect maxAttempts configuration
  - Store player state for restoration
- [ ] Implement state restoration:
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

- [ ] Reconnection attempts are made
- [ ] Exponential backoff is used
- [ ] Max attempts are respected
- [ ] Player state can be restored

### Step 7.2: Implement Server Reconnection Handling

- [ ] Update `src/server/GameServer.js`
- [ ] Handle player reconnection:
  - Accept player ID on reconnect
  - Restore player position if player exists
  - Send current game state
  - Notify other clients of reconnection
- [ ] Handle reconnection timeout:
  - Remove player if reconnection fails
  - Clean up player resources

**Verification**:

- [ ] Server accepts reconnections
- [ ] Player state is restored
- [ ] Other clients are notified
- [ ] Failed reconnections are cleaned up

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

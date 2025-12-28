# Specification: WebSocket Integration for Multiplayer Support

## Overview

This specification details the integration of WebSocket support into the terminal game application to enable real-time communication between server and clients, preparing for multiplayer functionality. The implementation will add a WebSocket server that manages authoritative game state and allows multiple clients to connect and interact with the game.

**Reference Card**: `docs/development/cards/features/FEATURE_websocket_integration.md`

## Goals

1. Add WebSocket server capability to handle multiple client connections
2. Implement real-time bidirectional communication between server and clients
3. Create message protocol for client-server communication
4. Separate server-side authoritative game state from client-side rendering
5. Maintain backward compatibility with existing single-player mode
6. Establish foundation for future multiplayer features

## Current State

**Current Architecture**:

- `src/game/Game.js` - Manages local game state (player position, board, score)
- `src/game/Board.js` - Represents game board/grid
- `src/render/Renderer.js` - Handles terminal rendering
- `src/input/InputHandler.js` - Handles keyboard input locally
- `src/index.js` - Main entry point, orchestrates game loop
- All game logic runs in a single Node.js process
- No network communication layer
- Single-player only

**Current Game Flow**:

1. User presses key → `InputHandler` captures input
2. `InputHandler` calls callback → `index.js` handles action
3. `Game` updates state → `Renderer` updates display
4. All happens synchronously in one process

**Issues**:

- No way to share game state between multiple players
- No network communication capability
- Cannot support multiplayer gameplay
- Game state is local only

## Target State

**New Architecture**:

- `src/server/index.js` - WebSocket server entry point
- `src/server/GameServer.js` - Server-side game state management
- `src/server/ConnectionManager.js` - Manages client connections
- `src/network/MessageHandler.js` - Handles message parsing and routing
- `src/network/MessageTypes.js` - Defines message type constants
- `src/network/WebSocketClient.js` - WebSocket client wrapper
- `src/config/serverConfig.js` - Server configuration

**New Game Flow (Networked Mode)**:

1. Client connects to WebSocket server
2. Server sends initial game state to client
3. User presses key → `InputHandler` captures input
4. Client sends action message to server
5. Server validates and applies action to authoritative game state
6. Server broadcasts state update to all connected clients
7. Clients receive update and render new state

**Benefits**:

- Multiple clients can connect to same game
- Server maintains authoritative game state
- Real-time synchronization between clients
- Foundation for multiplayer gameplay
- Can add web client later

## Functional Requirements

### FR1: WebSocket Server

**Requirement**: Create a WebSocket server that can accept and manage multiple client connections.

**Details**:

- Start WebSocket server on configurable port (default: 8080)
- Accept multiple simultaneous client connections
- Handle client connection events
- Handle client disconnection events
- Track connected clients with unique IDs
- Graceful server shutdown

**Server Lifecycle**:

- Server starts and listens on configured port
- Server accepts new client connections
- Server assigns unique client ID to each connection
- Server tracks active connections
- Server handles client disconnections and cleanup

**Acceptance Criteria**:

- [ ] WebSocket server starts successfully
- [ ] Server accepts multiple simultaneous connections
- [ ] Each client receives unique ID
- [ ] Server tracks all active connections
- [ ] Server handles disconnections gracefully
- [ ] Server shuts down cleanly

### FR2: Client Connection Management

**Requirement**: Manage client connections, including connection lifecycle and error handling.

**Details**:

- Assign unique client ID to each connection
- Maintain list of active connections
- Handle connection errors and timeouts
- Support connection cleanup on disconnect
- Log connection events

**Connection States**:

- `CONNECTING` - Client is establishing connection
- `CONNECTED` - Client is connected and active
- `DISCONNECTING` - Client is disconnecting
- `DISCONNECTED` - Client has disconnected

**Acceptance Criteria**:

- [ ] Each client receives unique ID on connection
- [ ] Active connections are tracked
- [ ] Connection errors are handled gracefully
- [ ] Disconnections are cleaned up properly
- [ ] Connection events are logged

### FR3: Message Protocol

**Requirement**: Define and implement a message protocol for client-server communication.

**Details**:

- JSON-based message format
- Structured message schema with type, payload, timestamp, clientId
- Message validation
- Error handling for malformed messages
- Support for multiple message types

**Message Structure**:

```json
{
  "type": "MOVE",
  "payload": {
    "playerId": "client-123",
    "dx": 1,
    "dy": 0
  },
  "timestamp": 1234567890,
  "clientId": "client-123"
}
```

**Message Types**:

- `CONNECT` - Client connects, includes client info
- `DISCONNECT` - Client disconnects
- `MOVE` - Player movement action
- `STATE_UPDATE` - Game state update from server
- `ERROR` - Error message
- `PING` - Keep-alive ping
- `PONG` - Keep-alive pong

**Acceptance Criteria**:

- [ ] Message format is defined and documented
- [ ] Messages are validated before processing
- [ ] Malformed messages are handled gracefully
- [ ] All message types are supported
- [ ] Message parsing errors are caught and logged

### FR4: Message Handling

**Requirement**: Parse, validate, and route incoming WebSocket messages to appropriate handlers.

**Details**:

- Parse incoming WebSocket messages (JSON)
- Validate message format and content
- Route messages to appropriate handlers based on type
- Send responses/acknowledgments
- Handle errors gracefully

**Message Routing**:

- `CONNECT` → Connection handler
- `DISCONNECT` → Disconnection handler
- `MOVE` → Movement handler
- `PING` → Ping handler (respond with PONG)
- Invalid/unknown → Error handler

**Acceptance Criteria**:

- [ ] Messages are parsed correctly
- [ ] Messages are validated before routing
- [ ] Messages are routed to correct handlers
- [ ] Responses are sent when appropriate
- [ ] Errors are handled and logged

### FR5: Game State Synchronization

**Requirement**: Synchronize game state between server and clients.

**Details**:

- Server maintains authoritative game state
- Clients send player actions to server
- Server validates and applies actions
- Server broadcasts state updates to all clients
- Clients receive and apply state updates

**State Synchronization Flow**:

1. Client sends action (e.g., MOVE)
2. Server validates action
3. Server applies action to game state
4. Server creates state update message
5. Server broadcasts to all connected clients
6. Clients receive and render updated state

**Game State Includes**:

- Board state
- All player positions
- Game score
- Game running state

**Acceptance Criteria**:

- [ ] Server maintains authoritative game state
- [ ] Client actions are validated before applying
- [ ] State updates are broadcast to all clients
- [ ] Clients receive and apply state updates
- [ ] State is synchronized across all clients

### FR6: Hybrid Mode Support

**Requirement**: Support both local (single-player) and networked (multiplayer) modes.

**Details**:

- Configuration option to enable/disable WebSocket mode
- Local mode: Game runs as before (single-player, no network)
- Networked mode: Game runs with WebSocket server
- Mode selection via configuration
- Backward compatible with existing single-player mode

**Mode Selection**:

- Local mode: `serverConfig.websocket.enabled = false`
- Networked mode: `serverConfig.websocket.enabled = true`

**Acceptance Criteria**:

- [ ] Local mode works as before (no breaking changes)
- [ ] Networked mode can be enabled via configuration
- [ ] Mode switching works correctly
- [ ] Existing single-player functionality is preserved

### FR7: Server Configuration

**Requirement**: Provide configuration for WebSocket server settings.

**Details**:

- Configurable server port
- Configurable server host/address
- Enable/disable WebSocket mode
- Configuration in `src/config/serverConfig.js` or `gameConfig.js`

**Configuration Options**:

```javascript
export const serverConfig = {
  websocket: {
    enabled: false, // Enable/disable WebSocket mode
    port: 3000, // WebSocket server port (default: 3000)
    host: '0.0.0.0', // Server host (default: '0.0.0.0' - accessible from network)
    updateInterval: 250, // State update interval in milliseconds (default: 250ms = 4 updates/second)
  },
  logging: {
    level: 'info', // Logging level: 'debug', 'info', 'warn', 'error'
  },
};
```

**Acceptance Criteria**:

- [ ] Server configuration is defined
- [ ] Configuration is loaded from config file
- [ ] Server uses configured port and host
- [ ] WebSocket mode can be enabled/disabled

## Technical Requirements

### TR1: WebSocket Library

**Requirement**: Use `ws` package for WebSocket functionality.

**Details**:

- Install `ws` package: `npm install ws`
- Use `WebSocketServer` for server
- Use `WebSocket` for client
- Support WebSocket protocol (RFC 6455)
- Handle WebSocket upgrade requests

**Dependencies**:

- `ws` - WebSocket library for Node.js

**Acceptance Criteria**:

- [ ] `ws` package is installed
- [ ] WebSocket server is created using `ws`
- [ ] WebSocket client can connect to server
- [ ] WebSocket protocol is supported

### TR2: Server Architecture

**Requirement**: Implement server architecture with clear separation of concerns.

**Details**:

- Separate server entry point (`src/server/index.js`)
- Server-side game instance management (`src/server/GameServer.js`)
- Connection manager (`src/server/ConnectionManager.js`)
- Message handler (`src/network/MessageHandler.js`)
- Message types (`src/network/MessageTypes.js`)

**File Structure**:

```
src/
  server/
    index.js              # WebSocket server entry point
    GameServer.js         # Server-side game management
    ConnectionManager.js  # Client connection management
  network/
    MessageHandler.js     # Message parsing and routing
    MessageTypes.js       # Message type constants
    WebSocketClient.js    # WebSocket client wrapper
  config/
    serverConfig.js       # Server configuration
```

**Acceptance Criteria**:

- [ ] Server architecture is implemented
- [ ] Files are organized in appropriate directories
- [ ] Separation of concerns is maintained
- [ ] Code is modular and testable

### TR3: Client Architecture

**Requirement**: Implement client architecture for WebSocket communication.

**Details**:

- WebSocket client wrapper (`src/network/WebSocketClient.js`)
- Modify `src/index.js` to support WebSocket client mode
- Send input actions to server
- Receive and apply state updates from server

**Client Flow**:

1. Client connects to WebSocket server
2. Client receives initial game state
3. Client sends input actions to server
4. Client receives state updates from server
5. Client renders updated state

**Acceptance Criteria**:

- [ ] WebSocket client is implemented
- [ ] Client can connect to server
- [ ] Client can send messages to server
- [ ] Client can receive messages from server
- [ ] Client applies state updates correctly

### TR4: Error Handling

**Requirement**: Implement comprehensive error handling for WebSocket operations.

**Details**:

- Handle WebSocket connection errors
- Handle message parsing errors
- Handle game state errors
- Log errors appropriately
- Graceful degradation

**Error Types**:

- Connection errors (network issues, server unavailable)
- Message parsing errors (invalid JSON, malformed messages)
- Game state errors (invalid actions, state inconsistencies)
- Timeout errors (connection timeouts)

**Acceptance Criteria**:

- [ ] Connection errors are handled
- [ ] Message parsing errors are handled
- [ ] Game state errors are handled
- [ ] Errors are logged appropriately
- [ ] Application degrades gracefully on errors

### TR5: Testing

**Requirement**: Implement tests for WebSocket functionality.

**Details**:

- Unit tests for message parsing
- Unit tests for connection management
- Integration tests for WebSocket communication
- Test multiple client connections
- Test message handling

**Test Coverage**:

- Message parsing and validation
- Connection management
- Game state synchronization
- Error handling
- Multiple client scenarios

**Acceptance Criteria**:

- [ ] Unit tests are written for message parsing
- [ ] Unit tests are written for connection management
- [ ] Integration tests are written for WebSocket communication
- [ ] Tests cover multiple client connections
- [ ] All tests pass

## Data Structures

### Message

**Structure**:

```typescript
interface Message {
  type: string; // Message type (MOVE, STATE_UPDATE, etc.)
  payload: any; // Message-specific data
  timestamp?: number; // Optional timestamp
  clientId?: string; // Optional client identifier
}
```

**Examples**:

**MOVE Message**:

```json
{
  "type": "MOVE",
  "payload": {
    "playerId": "player-uuid-456",
    "dx": 1,
    "dy": 0
  },
  "timestamp": 1234567890,
  "clientId": "client-uuid-123"
}
```

**CONNECT Message** (with player name):

```json
{
  "type": "CONNECT",
  "payload": {
    "playerName": "Player1",
    "playerId": "player-uuid-456"
  },
  "timestamp": 1234567890,
  "clientId": "client-uuid-123"
}
```

**ERROR Message** (structured with context):

```json
{
  "type": "ERROR",
  "payload": {
    "code": "INVALID_MOVE",
    "message": "Cannot move into wall",
    "context": {
      "action": "MOVE",
      "playerId": "player-uuid-456",
      "dx": 1,
      "dy": 0,
      "reason": "Target position is a wall"
    }
  },
  "timestamp": 1234567890,
  "clientId": "client-uuid-123"
}
```

**STATE_UPDATE Message**:

```json
{
  "type": "STATE_UPDATE",
  "payload": {
    "board": [...],
    "players": [
      {
        "playerId": "player-uuid-456",
        "playerName": "Player1",
        "clientId": "client-uuid-123",
        "x": 10,
        "y": 10
      }
    ],
    "score": 0,
    "running": true
  },
  "timestamp": 1234567890
}
```

### Client Connection

**Structure**:

```typescript
interface ClientConnection {
  id: string; // Unique client ID (UUID v4)
  ws: WebSocket; // WebSocket connection
  connectedAt: number; // Connection timestamp
  lastActivity: number; // Last activity timestamp
  playerId?: string; // Optional player identifier (separate from client ID)
  playerName?: string; // Optional player name (set by player)
}
```

### Game State

**Structure**:

```typescript
interface GameState {
  board: Board; // Board state
  players: Player[]; // All player positions
  score: number; // Game score
  running: boolean; // Game running state
}

interface Player {
  playerId: string; // Unique player ID (separate from client ID)
  playerName?: string; // Optional player name
  clientId: string; // Client connection ID (UUID v4)
  x: number; // Player X position
  y: number; // Player Y position
}
```

## File Structure

```
src/
  server/
    index.js              # WebSocket server entry point
    GameServer.js         # Server-side game management
    ConnectionManager.js # Client connection management
  network/
    MessageHandler.js    # Message parsing and routing
    MessageTypes.js      # Message type constants
    WebSocketClient.js   # WebSocket client wrapper
  config/
    serverConfig.js      # Server configuration
  game/
    Game.js              # (existing) Game state management
  # ... existing files
```

## Implementation Notes

### Server-Side Game State

The server maintains a single authoritative game state instance. All game state changes happen on the server, and clients receive updates via WebSocket messages.

### Client-Side Rendering

Clients handle rendering locally but receive state updates from the server. This allows for responsive rendering while maintaining authoritative state on the server.

### Message Flow

1. **Client → Server**: Client sends action (e.g., MOVE)
2. **Server**: Validates and applies action
3. **Server → All Clients**: Server broadcasts state update
4. **Clients**: Receive and render updated state

### Connection Lifecycle

1. **Connect**: Client connects, receives initial state
2. **Play**: Client sends actions, receives updates
3. **Disconnect**: Client disconnects, server cleans up

## Success Criteria

- [ ] WebSocket server starts and accepts connections
- [ ] Multiple clients can connect simultaneously
- [ ] Clients can send actions to server
- [ ] Server validates and applies actions
- [ ] Server broadcasts state updates to all clients
- [ ] Clients receive and render state updates
- [ ] Local mode still works (backward compatible)
- [ ] Networked mode can be enabled via configuration
- [ ] Error handling works correctly
- [ ] Tests are written and passing
- [ ] Code is well-documented

## Dependencies

- `ws` - WebSocket library for Node.js
- `uuid` - UUID generation library (for client ID generation using UUID v4)
- Existing game code (`Game`, `Board`, `Renderer`, `InputHandler`)

## Related Documents

- **Feature Card**: `docs/development/cards/features/FEATURE_websocket_integration.md`
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws package documentation](https://github.com/websockets/ws)
- [WebSocket Protocol (RFC 6455)](https://tools.ietf.org/html/rfc6455)

## Open Questions

### Q1: Server Port and Host Configuration

**Question**: What should be the default server port and host configuration?

**Options**:

- **Option A**: Default port 8080, host 'localhost' (development-friendly)
- **Option B**: Default port 3000, host '0.0.0.0' (common web port, accessible from network)
- **Option C**: Default port 8080, host '0.0.0.0' (accessible from network)
- **Option D**: Configurable with no defaults (require explicit configuration)

**Recommendation**: Option A - Default port 8080, host 'localhost' for development, but make it easily configurable.

**Answer**: **Option B** - Default port 3000, host '0.0.0.0' (common web port, accessible from network)

### Q2: Client ID Generation

**Question**: How should unique client IDs be generated?

**Options**:

- **Option A**: Simple incrementing counter (client-1, client-2, etc.)
- **Option B**: UUID v4 (random UUIDs)
- **Option C**: Timestamp-based IDs (timestamp-random)
- **Option D**: Connection-based IDs (connection index or socket ID)

**Recommendation**: Option B - UUID v4 for unique, non-guessable client IDs.

**Answer**: **Option B** - UUID v4 (random UUIDs)

### Q3: Message Timestamp Handling

**Question**: Should messages include timestamps, and if so, how should they be handled?

**Options**:

- **Option A**: Include timestamps in all messages (server and client)
- **Option B**: Include timestamps only in server messages
- **Option C**: Include timestamps only when needed (optional field)
- **Option D**: No timestamps (not needed for initial implementation)

**Recommendation**: Option C - Include timestamps as optional field, useful for debugging and future features like latency measurement.

**Answer**: **Option C** - Include timestamps only when needed (optional field)

### Q4: Keep-Alive (Ping/Pong) Implementation

**Question**: Should we implement keep-alive (Ping/Pong) messages for connection health?

**Options**:

- **Option A**: Implement Ping/Pong with configurable interval (e.g., every 30 seconds)
- **Option B**: Implement Ping/Pong with fixed interval (e.g., every 30 seconds)
- **Option C**: Use WebSocket's built-in ping/pong frames (if supported by library)
- **Option D**: No keep-alive (not needed for initial implementation)

**Recommendation**: Option C - Use WebSocket's built-in ping/pong frames if supported, otherwise Option A with configurable interval.

**Answer**: **Option C** - Use WebSocket's built-in ping/pong frames (if supported by library)

### Q5: State Update Frequency

**Question**: How frequently should the server broadcast state updates to clients?

**Options**:

- **Option A**: Broadcast on every state change (immediate updates)
- **Option B**: Broadcast at fixed interval (e.g., 4 times per second); this should be configurable in the configuration
- **Option C**: Broadcast on state change with throttling (e.g., max 60 updates/second)
- **Option D**: Broadcast only when significant state changes occur

**Recommendation**: Option A - Broadcast on every state change for immediate updates, but consider throttling if performance becomes an issue.

**Answer**: **Option B** - Broadcast at fixed interval (e.g., 4 times per second); this should be configurable in the configuration

### Q6: Player Identification

**Question**: How should players be identified in the game state?

**Options**:

- **Option A**: Use client ID as player ID (simple, one-to-one mapping)
- **Option B**: Separate player ID from client ID (allows reconnection with same player)
- **Option C**: Allow players to set their own names/IDs
- **Option D**: Auto-assign player numbers (Player 1, Player 2, etc.)

**Recommendation**: Option A - Use client ID as player ID for initial implementation, can enhance later.

**Answer**: **Option B and C** - Separate player ID from client ID (allows reconnection with same player) AND Allow players to set their own names/IDs

### Q7: Action Validation

**Question**: What level of validation should be performed on client actions before applying them?

**Options**:

- **Option A**: Basic validation (check action type, required fields)
- **Option B**: Comprehensive validation (check action type, fields, game rules, player permissions)
- **Option C**: Minimal validation (trust client, validate only critical fields)
- **Option D**: No validation (trust client completely - not recommended)

**Recommendation**: Option B - Comprehensive validation to prevent cheating and ensure game integrity.

**Answer**: **Option B** - Comprehensive validation (check action type, fields, game rules, player permissions)

### Q8: Error Message Format

**Question**: How should error messages be formatted and sent to clients?

**Options**:

- **Option A**: Simple error messages (just error text)
- **Option B**: Structured error messages (error code, message, details)
- **Option C**: Error messages with context (what action failed, why)
- **Option D**: No error messages (silent failure - not recommended)

**Recommendation**: Option B - Structured error messages with error codes for programmatic handling.

**Answer**: **Option B and C** - Structured error messages (error code, message, details) AND Error messages with context (what action failed, why)

### Q9: Reconnection Handling

**Question**: Should we implement reconnection handling in the initial implementation?

**Options**:

- **Option A**: Implement full reconnection support (client can reconnect and resume)
- **Option B**: Implement basic reconnection (client can reconnect but starts fresh)
- **Option C**: No reconnection support (client must start new connection)
- **Option D**: Detect disconnection but don't handle reconnection (future enhancement)

**Recommendation**: Option D - Detect disconnection and clean up, but defer reconnection handling to future enhancement.

**Answer**: **Option A** - Implement full reconnection support (client can reconnect and resume)

### Q10: Logging and Debugging

**Question**: What level of logging should be implemented for WebSocket operations?

**Options**:

- **Option A**: Comprehensive logging (all events, messages, state changes)
- **Option B**: Standard logging (connections, disconnections, errors)
- **Option C**: Minimal logging (errors only)
- **Option D**: Configurable logging levels (debug, info, warn, error)

**Recommendation**: Option D - Configurable logging levels for flexibility during development and production.

**Answer**: **Option D** - Configurable logging levels (debug, info, warn, error)

### Q11: Testing Strategy

**Question**: What testing approach should be used for WebSocket functionality?

**Options**:

- **Option A**: Unit tests only (test individual components in isolation)
- **Option B**: Integration tests only (test full WebSocket communication)
- **Option C**: Both unit and integration tests
- **Option D**: Manual testing only (no automated tests)

**Recommendation**: Option C - Both unit and integration tests for comprehensive coverage.

**Answer**: **Option C** - Both unit and integration tests

### Q12: Configuration File Location

**Question**: Where should server configuration be stored?

**Options**:

- **Option A**: Add to existing `src/config/gameConfig.js`
- **Option B**: Create separate `src/config/serverConfig.js`
- **Option C**: Use environment variables
- **Option D**: Use command-line arguments

**Recommendation**: Option B - Separate `serverConfig.js` to keep concerns separated, but can reference `gameConfig.js` if needed.

**Answer**: **Option B** - Create separate `src/config/serverConfig.js`

## Status

**Status**: 📋 READY FOR GAMEPLAN

**Next Step**: Create gameplan document for implementation

## Answers Summary

All open questions have been answered:

- **Q1**: Option B - Default port 3000, host '0.0.0.0' (common web port, accessible from network)
- **Q2**: Option B - UUID v4 (random UUIDs)
- **Q3**: Option C - Include timestamps only when needed (optional field)
- **Q4**: Option C - Use WebSocket's built-in ping/pong frames (if supported by library)
- **Q5**: Option B - Broadcast at fixed interval (e.g., 4 times per second); configurable in configuration
- **Q6**: Option B and C - Separate player ID from client ID (allows reconnection with same player) AND Allow players to set their own names/IDs
- **Q7**: Option B - Comprehensive validation (check action type, fields, game rules, player permissions)
- **Q8**: Option B and C - Structured error messages (error code, message, details) AND Error messages with context (what action failed, why)
- **Q9**: Option A - Implement full reconnection support (client can reconnect and resume)
- **Q10**: Option D - Configurable logging levels (debug, info, warn, error)
- **Q11**: Option C - Both unit and integration tests
- **Q12**: Option B - Create separate `src/config/serverConfig.js`

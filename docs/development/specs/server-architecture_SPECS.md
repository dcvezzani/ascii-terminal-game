# Specification: Server Architecture and Client-Server Communication

## Overview

This specification documents the server architecture, communication patterns, and design decisions for the multiplayer game server. This document serves as a reference for implementing similar server solutions in future projects.

**Purpose**: Reference documentation for server architecture patterns, client-server interaction, and implementation details.

## Architecture Overview

### High-Level Architecture

The server follows a **modular, event-driven architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Server Layer                    │
│  (src/server/index.js, src/server/server.js)                │
│  - Connection lifecycle management                           │
│  - Message routing and validation                            │
│  - Broadcast coordination                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Connection Manager Layer                        │
│  (src/server/ConnectionManager.js)                          │
│  - Client connection tracking                                │
│  - Client ID ↔ Player ID mapping                            │
│  - Graceful disconnection handling                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Game Server Layer                            │
│  (src/server/GameServer.js)                                 │
│  - Authoritative game state                                  │
│  - Player management                                         │
│  - Entity management                                         │
│  - Event emission (EventEmitter)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Game Logic Layer                           │
│  (src/game/Game.js, src/game/Board.js, src/game/Cell.js)   │
│  - Board representation                                     │
│  - Cell queue system (entities per cell)                    │
│  - Collision detection                                      │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. WebSocket Server (`src/server/index.js`)

**Responsibilities**:
- WebSocket server lifecycle (start/stop)
- Connection handling and routing
- Message parsing and validation
- Message type routing to handlers
- Periodic broadcasts (state updates, ping/pong)
- Graceful shutdown handling

**Key Features**:
- Uses `ws` library (WebSocket implementation)
- Per-connection client ID generation (UUID v4)
- Automatic ping/pong for connection health
- Configurable broadcast intervals
- Graceful disconnection with grace periods

**Patterns Used**:
- **Singleton pattern**: Single server instance
- **Factory pattern**: Message creation helpers
- **Observer pattern**: Event-driven message handling

#### 2. Connection Manager (`src/server/ConnectionManager.js`)

**Responsibilities**:
- Track active WebSocket connections
- Map client IDs to connections
- Map client IDs to player IDs
- Track connection metadata (timestamps, activity)
- Graceful disconnection with grace periods

**Key Features**:
- Two-tier connection tracking:
  - `connections`: Active connections
  - `disconnectedConnections`: Disconnected connections awaiting purge
- Grace period: 60 seconds before permanent removal
- Activity timestamp tracking
- Player ID and name association

**Data Structures**:
```javascript
{
  id: string (UUID),
  ws: WebSocket,
  connectedAt: number (timestamp),
  lastActivity: number (timestamp),
  playerId: string | null,
  playerName: string | null
}
```

**Patterns Used**:
- **Registry pattern**: Centralized connection tracking
- **Graceful degradation**: Grace period for reconnection

#### 3. Game Server (`src/server/GameServer.js`)

**Responsibilities**:
- Authoritative game state management
- Player lifecycle (add, remove, restore, disconnect)
- Entity spawning and management
- Movement validation and execution
- Event emission for game events (collisions, etc.)

**Key Features**:
- Extends Node.js `EventEmitter` for event-driven architecture
- Two-tier player tracking:
  - `players`: Active players
  - `disconnectedPlayers`: Disconnected players awaiting purge/reconnection
- Entity tracking with unique IDs
- Collision detection with event emission
- Position validation and conflict resolution

**Event System**:
- Emits events via `EventEmitter`:
  - `EventTypes.BUMP`: Collision events (wall, player, entity)
  - Events include scope (`targeted` or `broadcast`), type, and context

**Patterns Used**:
- **Event-driven architecture**: EventEmitter pattern
- **Authority pattern**: Server is authoritative for all game state
- **State machine**: Player states (active → disconnected → purged)

#### 4. Message Handler (`src/network/MessageHandler.js`)

**Responsibilities**:
- Message parsing and validation
- Message creation helpers
- Error message formatting
- State update message creation

**Message Structure**:
```javascript
{
  type: string,        // MessageTypes constant
  payload: object,    // Message-specific data
  timestamp: number,  // Unix timestamp
  clientId: string    // Optional client ID
}
```

**Patterns Used**:
- **Factory pattern**: Message creation functions
- **Validation pattern**: Input validation before processing

#### 5. Game Logic Layer (`src/game/`)

**Components**:
- `Game.js`: Game state wrapper (score, running state)
- `Board.js`: 2D grid representation with cell queues
- `Cell.js`: Individual cell with entity queue
- `Glyph.js`: Character/glyph representation

**Key Concepts**:
- **Cell Queue System**: Each cell can contain multiple entities
  - Only one solid entity per cell (blocks movement)
  - Multiple non-solid entities allowed (overlay)
- **Entity Priority**: Solid entities > non-solid entities > base cell character
- **Serialization**: Board serializes to base characters for network transmission

## Communication Patterns

### Message Types

All communication uses JSON messages over WebSocket. Message types are defined in `src/network/MessageTypes.js`:

**Client → Server**:
- `CONNECT`: Join game (with optional playerId for reconnection)
- `DISCONNECT`: Leave game gracefully
- `MOVE`: Player movement (dx, dy: -1, 0, or 1)
- `SET_PLAYER_NAME`: Update player name
- `PING`: Keep-alive
- `RESTART`: Request game restart
- `TEST`: Development/testing messages

**Server → Client**:
- `CONNECT`: Connection acknowledgment (includes clientId, playerId, gameState)
- `STATE_UPDATE`: Periodic game state broadcast
- `PLAYER_JOINED`: Notification of new player
- `PLAYER_LEFT`: Notification of player leaving
- `ERROR`: Error response with code and message
- `PONG`: Keep-alive response

### Message Flow

#### Connection Flow

```
1. Client connects → WebSocket connection established
2. Server generates clientId (UUID) → sends CONNECT message
3. Client sends CONNECT message (with optional playerId for reconnection)
4. Server:
   - If playerId provided and exists → Reconnection (restore player)
   - Otherwise → New player (create player, assign playerId)
5. Server sends CONNECT response with:
   - clientId
   - playerId
   - playerName
   - gameState (full state)
   - isReconnection flag
6. Server broadcasts PLAYER_JOINED (if new player)
7. Server broadcasts STATE_UPDATE (immediate)
```

#### Movement Flow

```
1. Client sends MOVE message (dx, dy)
2. Server validates:
   - Client has playerId
   - dx, dy are numbers (-1, 0, or 1)
   - Game is running
3. Server attempts move:
   - Validates new position (bounds, walls, solid entities)
   - If collision → Emit collision event, return error
   - If valid → Update player position, return success
4. Server broadcasts STATE_UPDATE:
   - Immediate mode: Broadcast immediately
   - Periodic mode: Wait for periodic broadcast (250ms)
```

#### State Update Flow

```
1. Server periodically (250ms) or on events:
   - Serializes game state (board grid, players, entities)
   - Creates STATE_UPDATE message
   - Broadcasts to all connected clients
2. Client receives STATE_UPDATE:
   - Parses game state
   - Updates local game representation
   - Renders changes (incremental or full)
```

### Broadcast Strategies

**Periodic Broadcasts**:
- **State Updates**: Every 250ms (4 updates/second)
- **Ping**: Every 30 seconds
- **Purge**: Every 30 seconds (cleanup disconnected players/connections)

**Event-Driven Broadcasts**:
- **Immediate State Update**: On player movement (if configured)
- **Player Join/Leave**: Immediate broadcast
- **Game Restart**: Immediate state update

## State Management

### Server State

**Authoritative State**:
- Board grid (2D array of cells)
- Player positions and metadata
- Entity positions and properties
- Game score and running state

**State Serialization**:
- Board grid serialized to base characters (strings)
- Players serialized as array of objects
- Entities serialized as array of objects
- Full state sent in STATE_UPDATE messages

**State Structure**:
```javascript
{
  board: {
    width: number,
    height: number,
    grid: string[][]  // Base characters only
  },
  players: [
    {
      playerId: string,
      playerName: string,
      clientId: string,
      x: number,
      y: number
    }
  ],
  entities: [
    {
      entityId: string,
      entityType: string,
      x: number,
      y: number,
      solid: boolean,
      glyph: string,
      color: string
    }
  ],
  score: number,
  running: boolean
}
```

### Client State

**Client-Side Prediction**:
- Local player position predicted immediately on input
- Server state used for reconciliation
- Periodic reconciliation (configurable, default 5 seconds)

**State Reconciliation**:
- Client compares predicted position with server state
- If discrepancy → Snap to server position
- Smooth handling of position corrections

## Event System

### Event-Driven Architecture

The server uses Node.js `EventEmitter` for internal event handling:

**Event Types** (`src/server/EventTypes.js`):
- `BUMP`: Collision events (wall, player, entity)
- `PLAYER_COLLISION`: Player-to-player collision
- `WALL_COLLISION`: Player-to-wall collision
- `ENTITY_COLLISION`: Player-to-entity collision

**Event Structure**:
```javascript
{
  scope: 'targeted' | 'broadcast',
  type: string,  // EventTypes constant
  targetId: string,  // Target player/client ID
  playerId: string,
  attemptedPosition: { x, y },
  currentPosition: { x, y },
  collisionType: string,
  timestamp: number
}
```

**Event Listeners**:
- `src/server/listeners/collisionListener.js`: Handles collision events
- Extensible: Additional listeners can be registered

**Patterns Used**:
- **Observer pattern**: EventEmitter
- **Listener pattern**: Modular event handlers

## Client-Server Interaction Patterns

### Reconnection Handling

**Grace Period System**:
- Disconnected players kept for 60 seconds
- Disconnected connections kept for 60 seconds
- Allows reconnection within grace period
- Automatic purge after grace period

**Reconnection Flow**:
```
1. Client disconnects (network issue, etc.)
2. Server marks player as disconnected (moves to disconnectedPlayers)
3. Server removes player from board (visual removal)
4. Client attempts reconnection
5. Client sends CONNECT with previous playerId
6. Server checks disconnectedPlayers for playerId
7. If found → Restore player (same position, new clientId)
8. If not found → Create new player
```

### Error Handling

**Error Message Structure**:
```javascript
{
  type: 'ERROR',
  payload: {
    code: string,      // Error code (e.g., 'INVALID_MOVE')
    message: string,   // Human-readable message
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

**Error Codes**:
- `INVALID_INPUT`: Invalid message format
- `MALFORMED_JSON`: JSON parse error
- `MISSING_TYPE`: Missing message type
- `INVALID_TYPE`: Unknown message type
- `NOT_CONNECTED`: Player not connected
- `INVALID_MOVE`: Invalid movement parameters
- `MOVE_FAILED`: Movement blocked (collision)
- `GAME_NOT_RUNNING`: Game not in running state
- `PLAYER_ADD_FAILED`: Failed to add player
- `INTERNAL_ERROR`: Server error

### Validation Patterns

**Input Validation**:
- Message structure validation
- Type checking (numbers, strings, objects)
- Range validation (dx, dy: -1, 0, 1)
- State validation (game running, player connected)

**Position Validation**:
- Bounds checking (within board)
- Wall collision detection
- Solid entity collision detection
- Conflict resolution (spiral search for available position)

## Frameworks and Libraries

### Core Dependencies

**`ws` (v8.18.3)**:
- WebSocket server implementation
- Used for: WebSocket connections, ping/pong, connection management

**`winston` (v3.19.0)**:
- Logging framework
- Used for: Server logging, debug/info/warn/error levels

**`crypto` (Node.js built-in)**:
- UUID generation (randomUUID)
- Used for: Client ID and player ID generation

### Design Patterns

1. **Event-Driven Architecture**: EventEmitter for game events
2. **Factory Pattern**: Message creation helpers
3. **Registry Pattern**: Connection and player tracking
4. **Authority Pattern**: Server is authoritative for game state
5. **Graceful Degradation**: Grace periods for reconnection
6. **Observer Pattern**: Event listeners for game events
7. **State Machine**: Player states (active → disconnected → purged)

## Configuration

### Server Configuration (`src/config/serverConfig.js`)

```javascript
{
  websocket: {
    enabled: true,
    port: 3000,
    host: '0.0.0.0',
    broadcastIntervals: {
      state: 250,        // State update interval (ms)
      ping: 30000,       // Ping interval (ms)
      purge: 30000,      // Purge interval (ms)
      movement: "immediate" | "periodic"
    }
  },
  logging: {
    level: 'info',
    transports: ['console'],
    file: { ... }
  },
  reconnection: {
    enabled: true,
    maxAttempts: 5,
    retryDelay: 1000
  }
}
```

## Key Concepts

### 1. Authoritative Server

The server maintains authoritative game state. All game logic (movement, collisions, entity spawning) is validated and executed on the server. Clients receive state updates but cannot directly modify game state.

### 2. Cell Queue System

Each board cell maintains a queue of entities:
- **Base Character**: Cell's base type (wall, empty space)
- **Entity Queue**: Stack of entities at this position
  - Only one solid entity allowed (blocks movement)
  - Multiple non-solid entities allowed (visual overlay)

**Display Priority**:
1. Solid entity (if present)
2. Non-solid entity (if present)
3. Base cell character

### 3. Grace Period System

Disconnected players and connections are kept for a grace period (60 seconds) to allow reconnection:
- Prevents data loss on temporary network issues
- Enables seamless reconnection
- Automatic cleanup after grace period

### 4. Event-Driven Game Logic

Game events (collisions, etc.) are emitted via EventEmitter:
- Decoupled event handling
- Extensible (new listeners can be added)
- Targeted events (specific player) or broadcast events

### 5. State Serialization

Game state is serialized for network transmission:
- Board grid: Base characters only (strings)
- Players: Array of player objects
- Entities: Array of entity objects
- Full state sent in each STATE_UPDATE

### 6. Client-Side Prediction

Clients predict local player movement for immediate feedback:
- Local player renders immediately on input
- Server state used for reconciliation
- Periodic reconciliation to sync with server

## Testing Patterns

### Server Testing

**Test Structure**:
- Unit tests for individual components
- Integration tests for component interaction
- Event system tests for event emission/handling

**Key Test Areas**:
- Connection lifecycle (connect, disconnect, reconnect)
- Message handling and validation
- Player management (add, remove, restore)
- Movement validation and collision detection
- State serialization and broadcasting
- Event emission and handling

## Performance Considerations

### Broadcast Optimization

- **Periodic Broadcasts**: Configurable intervals (default 250ms for state)
- **Immediate Broadcasts**: Optional for movement (prevents visual glitches)
- **Selective Broadcasting**: Only to connected clients

### State Serialization

- Board grid serialized to minimal format (base characters)
- Only active players included in state
- Entities included only if present

### Connection Management

- Ping/pong for connection health (30s interval)
- Automatic cleanup of stale connections
- Grace period prevents unnecessary purging

## Security Considerations

### Input Validation

- All messages validated before processing
- Type checking and range validation
- Position validation (bounds, collisions)

### Error Handling

- Structured error messages
- No sensitive information in error responses
- Graceful error handling (no crashes)

## Extension Points

### Adding New Message Types

1. Add message type to `MessageTypes.js`
2. Add handler in `routeMessage()` in `src/server/index.js`
3. Implement handler function
4. Update client if needed

### Adding New Event Types

1. Add event type to `EventTypes.js`
2. Emit event in appropriate location (e.g., `GameServer.js`)
3. Create listener in `src/server/listeners/`
4. Register listener in `src/server/index.js`

### Adding New Entity Types

1. Define entity properties (glyph, color, solid, etc.)
2. Use `gameServer.spawnEntity()` to create entities
3. Entities automatically tracked and serialized in state

## Migration Notes

### For Future Projects

**Key Patterns to Reuse**:
1. **Connection Manager**: Client ID tracking, grace periods
2. **Game Server**: Authoritative state, event emission
3. **Message Handler**: Structured message format, validation
4. **Event System**: EventEmitter for game events
5. **Grace Period System**: Reconnection support

**Adaptations Needed**:
- Game-specific logic (movement, collisions, etc.)
- Message types (game-specific actions)
- Event types (game-specific events)
- State structure (game-specific data)

**Configuration**:
- Broadcast intervals (tune for game requirements)
- Grace periods (adjust for game type)
- Logging levels (production vs development)

## Summary

This server architecture provides a robust, scalable foundation for multiplayer games with:

- **Clear separation of concerns**: WebSocket layer, connection management, game logic
- **Event-driven design**: Extensible event system for game events
- **Authoritative server**: Server maintains game state, clients receive updates
- **Graceful handling**: Reconnection support, error handling, graceful shutdown
- **Performance**: Optimized broadcasts, efficient state serialization
- **Extensibility**: Easy to add new message types, events, entities

The architecture is designed to be reusable across different game types while maintaining flexibility for game-specific logic.

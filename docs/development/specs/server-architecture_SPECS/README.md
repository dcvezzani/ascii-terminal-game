# Server Architecture Specifications

## Overview

This document describes the technologies, core concepts, patterns, and architectural decisions used in the game server implementation. The server is a WebSocket-based multiplayer game server built with Node.js that manages game state, player connections, and real-time communication.

**Version**: 1.0  
**Last Updated**: 2025-01-XX

---

## Table of Contents

1. [Technologies](#technologies)
2. [Core Architecture](#core-architecture)
3. [Component Structure](#component-structure)
4. [Communication Protocol](#communication-protocol)
5. [State Management](#state-management)
6. [Connection Management](#connection-management)
7. [Design Patterns](#design-patterns)
8. [Error Handling](#error-handling)
9. [Configuration](#configuration)
10. [Logging](#logging)
11. [Lifecycle Management](#lifecycle-management)

---

## Technologies

### Runtime & Language

- **Node.js**: JavaScript runtime environment
- **ES Modules**: Native ES module system (`import`/`export`)
- **JavaScript**: Pure JavaScript (no TypeScript)

### Core Dependencies

- **ws** (`^8.18.3`): WebSocket server implementation
  - Provides `WebSocketServer` class for WebSocket connections
  - Handles connection lifecycle, message events, and error handling

- **winston** (`^3.19.0`): Structured logging library
  - Multi-transport logging (console, file)
  - Configurable log levels
  - JSON format for file logs, colored console output

- **crypto** (Node.js built-in): UUID generation
  - `randomUUID()` for generating unique client and player identifiers

### Development Tools

- **vitest** (`^4.0.16`): Unit testing framework
  - Non-interactive test execution
  - ES module support

---

## Core Architecture

### High-Level Architecture

The server follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         Entry Point (index.js)          │
│  - Configuration loading                 │
│  - Logger setup                          │
│  - Graceful shutdown handling            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Server (server.js)              │
│  - WebSocket server lifecycle           │
│  - Connection handling                   │
│  - Message routing                       │
│  - Periodic state broadcasting           │
└─────┬───────────────┬───────────────────┘
      │               │
┌─────▼─────┐   ┌─────▼──────────────┐
│Connection │   │   GameServer        │
│Manager    │   │   - Player mgmt     │
│           │   │   - Game state      │
│           │   │   - Move validation │
└───────────┘   └─────┬───────────────┘
                     │
              ┌──────▼──────┐
              │    Game     │
              │    - Board  │
              │    - Score  │
              └─────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns**: Each component has a single, well-defined responsibility
2. **Event-Driven**: Uses WebSocket events and Node.js event emitters
3. **State Authority**: Server is the authoritative source of game state
4. **Stateless Communication**: Messages are self-contained with timestamps
5. **Graceful Degradation**: Handles errors and disconnections gracefully

---

## Component Structure

### 1. Entry Point (`src/server/index.js`)

**Purpose**: Server initialization and lifecycle management

**Responsibilities**:
- Load server configuration
- Configure logger for server mode
- Initialize and start the Server instance
- Set up graceful shutdown handlers (SIGINT, SIGTERM)

**Pattern**: Factory/Initialization pattern

**Key Features**:
- Async/await with try/catch error handling
- Graceful shutdown that stops server before process exit
- Configuration-driven port selection

### 2. Server (`src/server/server.js`)

**Purpose**: WebSocket server and message orchestration

**Responsibilities**:
- WebSocket server lifecycle (start/stop)
- Connection event handling
- Message routing and processing
- Periodic state broadcasting to all clients
- Client-to-player mapping coordination

**Pattern**: Facade pattern (orchestrates ConnectionManager and GameServer)

**Key Features**:
- Promise-based start/stop methods
- Periodic broadcasting at configurable interval (default: 250ms = 4 updates/sec)
- Message type-based routing
- Connection lifecycle management

**State Broadcasting**:
- Runs on fixed interval (250ms)
- Broadcasts full game state to all connected clients
- Only broadcasts when clients are connected
- Checks WebSocket readyState before sending

### 3. ConnectionManager (`src/server/ConnectionManager.js`)

**Purpose**: WebSocket connection lifecycle and metadata management

**Responsibilities**:
- Track active WebSocket connections
- Map clientId to playerId
- Store connection metadata (connectedAt, lastActivity)
- Provide connection lookup and enumeration

**Pattern**: Registry/Manager pattern

**Data Structures**:
- `connections`: Map<clientId, connectionObject>
  - `clientId`: Unique identifier (UUID)
  - `ws`: WebSocket instance
  - `connectedAt`: Timestamp
  - `lastActivity`: Timestamp
- `playerIdMap`: Map<clientId, playerId>
  - Maps WebSocket connection to game player

**Key Features**:
- UUID-based client identification
- Activity tracking for potential timeout logic
- Bidirectional mapping (clientId ↔ playerId)

### 4. GameServer (`src/server/GameServer.js`)

**Purpose**: Game state management and player operations

**Responsibilities**:
- Player lifecycle (add, remove, spawn)
- Player movement validation and execution
- Game state serialization for broadcasting
- Collision detection (walls, bounds, other players)

**Pattern**: Domain Model pattern

**Data Structures**:
- `players`: Map<playerId, playerObject>
  - `playerId`: Unique player identifier
  - `clientId`: Associated WebSocket client ID
  - `playerName`: Display name
  - `x`, `y`: Board coordinates (null until spawned)

**Key Features**:
- Server-authoritative movement validation
- Collision detection (walls, boundaries, player positions)
- State serialization for network transmission
- Player spawning at fixed position (center: 10, 10)

**Move Validation**:
1. Player exists and is spawned
2. New position within board bounds
3. New position is not a wall
4. New position is not occupied by another player

### 5. Game (`src/game/Game.js`)

**Purpose**: Core game state container

**Responsibilities**:
- Board initialization
- Score tracking
- Game running state

**Pattern**: Aggregate Root pattern

**Key Features**:
- Delegates board operations to Board class
- Simple state container (score, running flag)

### 6. Board (`src/game/Board.js`)

**Purpose**: Game board grid representation

**Responsibilities**:
- Grid initialization (walls on perimeter, empty interior)
- Cell access and wall checking
- Board serialization for network transmission

**Pattern**: Value Object pattern

**Data Structure**:
- `grid`: 2D array (row-major: `grid[y][x]`)
  - `'#'`: Wall character
  - `'.'`: Empty space character

**Key Features**:
- Fixed-size board (default: 20x20)
- Perimeter walls, empty interior
- Immutable serialization (returns copy of grid)

### 7. MessageHandler (`src/network/MessageHandler.js`)

**Purpose**: Message parsing and creation utilities

**Responsibilities**:
- Parse JSON messages from WebSocket
- Validate message structure
- Create properly formatted messages
- Add timestamps to messages

**Pattern**: Utility/Helper pattern

**Message Structure**:
```javascript
{
  type: string,        // Message type (from MessageTypes)
  payload: object,     // Message-specific data
  timestamp: number,   // Unix timestamp (ms)
  clientId?: string    // Optional client identifier
}
```

**Key Features**:
- JSON parsing with error handling
- Required field validation (type, payload, timestamp)
- Automatic timestamp injection
- Optional clientId support

### 8. MessageTypes (`src/network/MessageTypes.js`)

**Purpose**: Message type constants

**Responsibilities**:
- Define message type constants
- Prevent typos in message types
- Centralize message type definitions

**Message Types**:
- `CONNECT`: Client connection request/response
- `MOVE`: Player movement request
- `STATE_UPDATE`: Periodic game state broadcast

**Pattern**: Constants/Enum pattern

---

## Communication Protocol

### WebSocket Protocol

**Transport**: WebSocket (ws:// or wss://)  
**Message Format**: JSON strings  
**Encoding**: UTF-8

### Message Flow

#### 1. Connection Flow

```
Client                    Server
  │                         │
  │─── CONNECT ────────────>│
  │                         │ (Generate playerId)
  │                         │ (Spawn player)
  │                         │ (Add to game)
  │<── CONNECT ─────────────│ (with gameState)
  │                         │
```

**CONNECT Request** (Client → Server):
```json
{
  "type": "CONNECT",
  "payload": {},
  "timestamp": 1234567890
}
```

**CONNECT Response** (Server → Client):
```json
{
  "type": "CONNECT",
  "payload": {
    "clientId": "uuid",
    "playerId": "uuid",
    "playerName": "Player abc12345",
    "gameState": {
      "board": { "width": 20, "height": 20, "grid": [...] },
      "players": [...],
      "score": 0
    }
  },
  "timestamp": 1234567890
}
```

#### 2. Movement Flow

```
Client                    Server
  │                         │
  │─── MOVE ──────────────>│
  │   {dx, dy}             │ (Validate move)
  │                        │ (Update position)
  │                        │ (Broadcast in next cycle)
  │<── STATE_UPDATE ────────│ (Periodic broadcast)
  │                         │
```

**MOVE Request** (Client → Server):
```json
{
  "type": "MOVE",
  "payload": {
    "dx": -1,  // -1, 0, or 1
    "dy": 0    // -1, 0, or 1
  },
  "timestamp": 1234567890
}
```

#### 3. State Update Flow

```
Server                    All Clients
  │                         │
  │─── STATE_UPDATE ────────>│ (Every 250ms)
  │   (Full game state)     │
  │                         │
```

**STATE_UPDATE** (Server → Clients):
```json
{
  "type": "STATE_UPDATE",
  "payload": {
    "board": {
      "width": 20,
      "height": 20,
      "grid": [["#", "#", ...], ...]
    },
    "players": [
      {
        "playerId": "uuid",
        "x": 10,
        "y": 10,
        "playerName": "Player abc12345"
      },
      ...
    ],
    "score": 0
  },
  "timestamp": 1234567890
}
```

### Message Validation

**Server-side validation**:
- JSON parsing errors are caught and logged
- Required fields checked (type, payload, timestamp)
- Move validation: dx/dy must be numbers in range [-1, 1]
- Player must exist and be spawned before movement

**Error Handling**:
- Invalid messages are logged and ignored
- Invalid moves are logged and rejected (no response sent)
- Connection errors trigger disconnect handling

---

## State Management

### Server-Authoritative Architecture

The server is the **single source of truth** for game state:

1. **State Storage**: Game state lives in memory (GameServer, Game, Board). In-memory Player objects include `lastX`, `lastY`, and `lastT` for velocity calculation; serialized output adds `vx`, `vy` per player (cells per second).
2. **State Updates**: Only server can modify game state
3. **State Broadcasting**: Server periodically broadcasts full state to all clients
4. **Client Input**: Clients send commands (MOVE), server validates and applies

### State Serialization

**Purpose**: Convert in-memory game state to JSON for network transmission

**Serialized State Structure**:
```javascript
{
  board: {
    width: number,
    height: number,
    grid: string[][]  // 2D array of characters
  },
  players: [
    {
      playerId: string,
      x: number,
      y: number,
      playerName: string,
      vx: number,   // velocity in cells per second (for client extrapolation)
      vy: number
    },
    ...
  ],
  score: number
}
```

**Velocity computation**: GameServer tracks per player `lastX`, `lastY`, and `lastT` (timestamp of last position update). These are set on spawn and on each move. In `serializeState()`, velocity is computed as `(x - lastX) / dtSec` and `(y - lastY) / dtSec` where `dtSec = (now - lastT) / 1000`. If there is no previous position or `dtSec` is zero, `vx` and `vy` are 0. The values are included so clients can extrapolate remote player positions when their interpolation buffer runs dry (e.g. packet loss).

**Serialization Methods**:
- `GameServer.serializeState()`: Serializes full game state (including per-player velocity)
- `Board.serialize()`: Returns copy of grid (immutable)

### State Update Frequency

- **Broadcast Interval**: 250ms (4 updates per second)
- **Update Trigger**: Fixed interval timer (not event-driven)
- **Update Scope**: Full game state (not delta updates)

**Rationale**:
- Simple implementation (no delta tracking needed)
- Handles missed messages gracefully (full state always available)
- Low bandwidth for small game state
- Acceptable latency for turn-based/exploration gameplay

---

## Connection Management

### Connection Lifecycle

1. **Connection**: WebSocket connection established
   - Server generates `clientId` (UUID)
   - Connection added to ConnectionManager
   - Event handlers registered (message, close, error)

2. **Authentication/Join**: Client sends CONNECT message
   - Server generates `playerId` (UUID)
   - Player added to GameServer
   - Player spawned at initial position
   - `clientId` mapped to `playerId`
   - CONNECT response sent with full game state

3. **Active Play**: Client sends MOVE messages
   - Server validates and processes moves
   - State updates applied immediately
   - State broadcast in next periodic cycle

4. **Disconnection**: WebSocket closes or errors
   - Player removed from game
   - Connection removed from ConnectionManager
   - Mappings cleaned up

### Connection Tracking

**Connection Metadata**:
- `connectedAt`: Timestamp when connection established
- `lastActivity`: Timestamp of last message received
- `clientId`: Unique connection identifier
- `ws`: WebSocket instance

**Player Mapping**:
- `clientId` → `playerId` mapping stored in ConnectionManager
- Used to route MOVE messages to correct player
- Cleaned up on disconnection

### Connection State Checks

Before sending messages:
- Check `ws.readyState === 1` (OPEN)
- Wrap send in try/catch for error handling
- Log errors but don't throw (graceful degradation)

---

## Design Patterns

### 1. Class-Based Architecture

**Pattern**: ES6 Classes with clear responsibilities

**Examples**:
- `Server` class: WebSocket server orchestration
- `GameServer` class: Game state management
- `ConnectionManager` class: Connection tracking
- `Game` class: Game aggregate root
- `Board` class: Board value object

**Benefits**:
- Clear encapsulation
- Easy to test (dependency injection possible)
- Familiar OOP patterns

### 2. Manager/Registry Pattern

**Pattern**: Centralized management of collections

**Examples**:
- `ConnectionManager`: Manages WebSocket connections
- `GameServer.players`: Manages player objects

**Implementation**: Uses `Map` for O(1) lookups

**Benefits**:
- Fast lookups by ID
- Centralized access control
- Easy enumeration

### 3. Facade Pattern

**Pattern**: Simplified interface to complex subsystem

**Example**: `Server` class orchestrates `ConnectionManager` and `GameServer`

**Benefits**:
- Hides complexity from entry point
- Single point of coordination
- Easier to test components independently

### 4. Value Object Pattern

**Pattern**: Immutable objects representing values

**Example**: `Board` serialization returns copy of grid

**Benefits**:
- Prevents accidental mutation
- Thread-safe (though Node.js is single-threaded)
- Clear ownership of data

### 5. Factory Pattern

**Pattern**: Creation logic encapsulated

**Example**: `MessageHandler.createMessage()` creates properly formatted messages

**Benefits**:
- Consistent message structure
- Centralized timestamp logic
- Easy to extend with validation

### 6. Constants Pattern

**Pattern**: Centralized constant definitions

**Example**: `MessageTypes` object with message type constants

**Benefits**:
- Prevents typos
- Single source of truth
- IDE autocomplete support

---

## Error Handling

### Error Handling Strategy

**Philosophy**: Graceful degradation with comprehensive logging

### Error Handling Patterns

#### 1. Try/Catch for Async Operations

```javascript
try {
  await server.start();
} catch (error) {
  logger.error('Failed to start server:', error);
  process.exit(1);
}
```

**Used in**:
- Server startup
- Server shutdown
- Message parsing

#### 2. Error Logging with Context

```javascript
logger.error(`Error handling message from ${clientId}:`, error);
```

**Pattern**: Include context (clientId, operation) in error logs

#### 3. Silent Error Handling (Graceful Degradation)

```javascript
try {
  connection.ws.send(messageStr);
} catch (error) {
  logger.error(`Error broadcasting to ${clientId}:`, error);
  // Continue processing other connections
}
```

**Pattern**: Log error but don't throw (prevent cascade failures)

#### 4. Validation with Early Returns

```javascript
if (!playerId) {
  logger.warn(`Cannot move: client ${clientId} has no playerId`);
  return;
}
```

**Pattern**: Validate inputs, log warnings, return early

### Error Categories

1. **Connection Errors**: WebSocket errors, send failures
   - Handled: Logged, connection cleaned up
   - Impact: Single client affected

2. **Message Errors**: Invalid JSON, missing fields
   - Handled: Logged, message ignored
   - Impact: Single message lost

3. **Validation Errors**: Invalid moves, missing players
   - Handled: Logged, operation rejected
   - Impact: Single operation rejected

4. **System Errors**: Server startup failures
   - Handled: Logged, process exits
   - Impact: Server shutdown

### Logging Levels

- **error**: System errors, connection failures
- **warn**: Validation failures, unexpected states
- **info**: Connection events, player joins/leaves
- **debug**: Movement details, message routing

---

## Configuration

### Configuration System

**Pattern**: JSON file with fallback defaults

**Location**: `config/serverConfig.json`

**Loading**: Synchronous file read in `config/serverConfig.js`

**Fallback**: Default values if config file missing or invalid

### Configuration Structure

```json
{
  "websocket": {
    "enabled": true,
    "port": 3000,
    "host": "0.0.0.0"
  },
  "logging": {
    "level": "info"
  }
}
```

### Configuration Options

**websocket.enabled**: Enable/disable WebSocket server (not currently used)  
**websocket.port**: Port number for WebSocket server (default: 3000)  
**websocket.host**: Host address to bind (default: "0.0.0.0")  
**logging.level**: Winston log level (default: "info")

### Configuration Override

**Command-line override**: `startServer(port)` accepts optional port parameter

**Priority**:
1. Function parameter (if provided)
2. Config file value
3. Default value

---

## Logging

### Logging Architecture

**Library**: Winston (`winston`)

**Transports**:
- **Console** (server mode only): Colored, simple format
- **File (error.log)**: Error-level logs only
- **File (combined.log)**: All log levels

### Logger Configuration

**Mode-based Configuration**:
- **Server mode**: Console + file logging
- **Client mode**: File logging only (not used by server)

**Format**:
- **Console**: Colorized, simple format
- **File**: JSON format with timestamp, level, message, stack traces

### Log Levels

- **error**: System errors, failures
- **warn**: Warnings, validation failures
- **info**: Important events (connections, player joins)
- **debug**: Detailed information (movements, message routing)

### Log File Location

**Directory**: `logs/` (created automatically if missing)

**Files**:
- `logs/error.log`: Error-level logs
- `logs/combined.log`: All logs

### Logger Initialization

**Pattern**: Configure before use

```javascript
configureLogger('server');
logger.level = serverConfig.logging.level;
```

**Timing**: Must be called before other modules import logger

---

## Lifecycle Management

### Server Lifecycle

#### 1. Initialization

```javascript
// Load config
// Configure logger
// Create Server instance
const server = new Server(port);
```

#### 2. Startup

```javascript
await server.start();
// WebSocket server listening
// Periodic broadcasting started
```

**Startup Sequence**:
1. Create WebSocketServer instance
2. Register event handlers
3. Wait for 'listening' event
4. Start periodic broadcasting
5. Resolve promise

#### 3. Runtime

- Accept WebSocket connections
- Handle messages
- Broadcast state periodically
- Manage player lifecycle

#### 4. Shutdown

```javascript
await server.stop();
// Stop broadcasting
// Close all connections
// Close WebSocket server
```

**Shutdown Sequence**:
1. Stop periodic broadcasting
2. Close all WebSocket connections
3. Close WebSocketServer
4. Resolve promise

### Graceful Shutdown

**Signal Handlers**:
- `SIGINT` (Ctrl+C): Graceful shutdown
- `SIGTERM`: Graceful shutdown

**Shutdown Process**:
1. Log shutdown message
2. Stop server (closes connections)
3. Exit process with code 0

**Pattern**: Async shutdown handler

```javascript
const shutdown = async () => {
  logger.info('Shutting down server...');
  await server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

### Process Management

**Entry Point Detection**:
```javascript
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
```

**Pattern**: Only start server if file is run directly (not imported)

---

## Key Design Decisions

### 1. Server-Authoritative State

**Decision**: Server is the single source of truth for game state

**Rationale**:
- Prevents cheating
- Handles network issues gracefully
- Simplifies client implementation

**Trade-offs**:
- Higher latency (server round-trip for moves)
- More server load
- Requires periodic state sync

### 2. Full State Broadcasting

**Decision**: Broadcast complete game state every 250ms

**Rationale**:
- Simple implementation (no delta tracking)
- Handles missed messages (full state always available)
- Low bandwidth for small game state

**Trade-offs**:
- Higher bandwidth than delta updates
- Redundant data transmission
- Fixed update rate (not adaptive)

### 3. Fixed Update Rate

**Decision**: 250ms broadcast interval (4 updates/sec)

**Rationale**:
- Sufficient for exploration/turn-based gameplay
- Predictable server load
- Simple timer-based implementation

**Trade-offs**:
- Not adaptive to network conditions
- May be too slow for fast-paced games
- Wastes bandwidth when no changes occur

### 4. UUID-Based Identifiers

**Decision**: Use UUIDs for clientId and playerId

**Rationale**:
- Globally unique (no collisions)
- No coordination needed
- Secure (not guessable)

**Trade-offs**:
- Longer strings (more memory/bandwidth)
- Not human-readable
- Requires crypto module

### 5. In-Memory State

**Decision**: Game state stored in memory (no persistence)

**Rationale**:
- Simple implementation
- Fast access
- Sufficient for MVP

**Trade-offs**:
- State lost on server restart
- No game history
- Limited scalability

### 6. Class-Based Architecture

**Decision**: Use ES6 classes for components

**Rationale**:
- Clear encapsulation
- Familiar OOP patterns
- Easy to test

**Trade-offs**:
- More boilerplate than functional approach
- Requires `new` keyword
- Can lead to tight coupling if not careful

---

## Testing Considerations

### Testability Features

1. **Dependency Injection**: Components can be instantiated with dependencies
2. **Pure Functions**: MessageHandler functions are pure (easy to test)
3. **Separated Concerns**: Each component can be tested independently
4. **State Serialization**: State can be serialized and compared

### Testing Patterns

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **Mock WebSockets**: Use mock WebSocket instances for testing

### Test Coverage Areas

- Message parsing and creation
- Move validation logic
- Connection management
- State serialization
- Error handling

---

## Future Enhancement Considerations

### Potential Improvements

1. **Delta Updates**: Only send changed state (reduce bandwidth)
2. **Adaptive Update Rate**: Adjust broadcast frequency based on activity
3. **State Persistence**: Save game state to database
4. **Room/Game Instances**: Support multiple concurrent games
5. **Player Authentication**: Add authentication system
6. **Rate Limiting**: Prevent message spam
7. **Heartbeat/Ping**: Detect stale connections
8. **Reconnection Handling**: Allow clients to reconnect and resume
9. **Message Queuing**: Queue messages during disconnection
10. **Compression**: Compress state updates for large games

---

## Summary

The server architecture follows a **layered, class-based design** with clear separation of concerns:

- **Entry Point**: Initialization and lifecycle
- **Server**: WebSocket orchestration and message routing
- **ConnectionManager**: Connection tracking and mapping
- **GameServer**: Game state and player management
- **Game/Board**: Core game domain models
- **MessageHandler**: Message parsing and creation utilities

**Key Patterns**:
- Server-authoritative state management
- Event-driven communication
- Periodic state broadcasting
- Graceful error handling
- Configuration-driven behavior

**Technologies**:
- Node.js with ES Modules
- WebSocket (ws library)
- Winston logging
- Crypto for UUIDs

This architecture provides a solid foundation for a multiplayer terminal game with room for future enhancements.

---

**End of Document**

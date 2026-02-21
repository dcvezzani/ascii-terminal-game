# Client Technologies, Core Concepts, and Patterns Specification

## Overview

This document describes the technologies, core concepts, and design patterns used in the client-side implementation of the terminal-based multiplayer game. The client is built with Node.js and implements real-time multiplayer gameplay with client-side prediction, incremental rendering, and WebSocket communication.

**Purpose**: Reference documentation for client-side technologies, architectural patterns, and implementation concepts.

## Table of Contents

1. [Technologies and Dependencies](#technologies-and-dependencies)
2. [Core Concepts](#core-concepts)
3. [Architectural Patterns](#architectural-patterns)
4. [Design Patterns](#design-patterns)
5. [State Management Patterns](#state-management-patterns)
6. [Network Communication Patterns](#network-communication-patterns)
7. [Rendering Patterns](#rendering-patterns)
8. [Input Handling Patterns](#input-handling-patterns)
9. [Error Handling and Resilience](#error-handling-and-resilience)
10. [Configuration Management](#configuration-management)
11. [Code Organization Patterns](#code-organization-patterns)

---

## Technologies and Dependencies

### Runtime Environment

**Node.js (ES Modules)**
- **Usage**: JavaScript runtime environment
- **Module System**: ES Modules (`import`/`export`)
- **Features Used**:
  - `process.stdin` for raw keyboard input
  - `process.stdout` for terminal output
  - `process.argv` for command-line arguments
  - `import.meta.url` for module resolution

### Core Dependencies

**`ws` (v8.18.3)**
- **Purpose**: WebSocket client library
- **Usage**: Real-time bidirectional communication with game server
- **Key Features**:
  - WebSocket connection management
  - Event-driven message handling
  - Connection state tracking (CONNECTING, OPEN, CLOSING, CLOSED)
- **Pattern**: Used via wrapper class `WebSocketClient` for abstraction

**`winston` (v3.19.0)**
- **Purpose**: Structured logging framework
- **Usage**: Client-side logging (file-based, no console output)
- **Key Features**:
  - Multiple transport support (file, console)
  - Log levels (error, warn, info, debug)
  - JSON format for structured logs
  - Mode-based configuration (server vs client)
- **Pattern**: Factory function `configureLogger(mode)` for mode-specific setup

**`chalk` (v5.6.2)**
- **Purpose**: Terminal string styling
- **Usage**: Color rendering for game elements (players, walls, text)
- **Key Features**:
  - RGB color support (hex to RGB conversion)
  - Text styling (bold, underline, etc.)
  - Color functions for dynamic styling
- **Pattern**: Color functions created from hex strings stored in config

**`ansi-escapes` (v7.2.0)**
- **Purpose**: ANSI escape code utilities
- **Usage**: Terminal cursor control and screen manipulation
- **Key Features**:
  - `cursorTo(x, y)`: Position cursor
  - `eraseScreen`: Clear entire screen
  - `cursorHide`/`cursorShow`: Cursor visibility
- **Pattern**: Used for precise terminal rendering control

**`cli-cursor` (v5.0.0)**
- **Purpose**: Terminal cursor visibility control
- **Usage**: Hide/show cursor during gameplay
- **Key Features**:
  - Simple cursor hide/show API
- **Pattern**: Used in `Renderer` class for cursor management

### Development Dependencies

**`vitest` (v4.0.16)**
- **Purpose**: Unit testing framework
- **Usage**: Client-side component testing
- **Key Features**:
  - ES Modules support
  - Fast test execution
  - Mocking capabilities

---

## Core Concepts

### 1. Client-Side Prediction

**Concept**: Immediately update local player position on input without waiting for server confirmation, providing instant visual feedback.

**Implementation**:
- **Predicted State**: `localPlayerPredictedPosition` tracks local player's predicted position
- **Validation**: Client validates movement before predicting (bounds, walls, collisions)
- **Reconciliation**: Periodic comparison of predicted vs server position with correction
- **Rendering**: Local player rendered from predicted position, other players from server state

**Benefits**:
- Reduces perceived latency
- Provides responsive gameplay
- Maintains server authority (reconciliation corrects discrepancies)

**Trade-offs**:
- Potential for visual "snap back" if server rejects movement
- Requires client-side validation logic (must match server rules)
- Additional state management complexity

### 2. Incremental Rendering

**Concept**: Update only changed cells instead of re-rendering the entire screen, reducing flicker and improving performance.

**Implementation**:
- **Change Detection**: `compareStates()` compares previous vs current state
- **Change Types**: Detects moved players, joined players, left players, score changes
- **Selective Updates**: Only updates cells that changed
- **Fallback**: Full render if too many changes (>10) or on error

**Benefits**:
- Minimal screen flicker
- Better performance (fewer terminal writes)
- Smooth visual updates

**Trade-offs**:
- Requires state comparison logic
- More complex rendering pipeline
- Must handle edge cases (too many changes, errors)

### 3. State Synchronization

**Concept**: Maintain local copy of server state while allowing optimistic local updates (prediction).

**Implementation**:
- **Server State**: `currentState` stores authoritative state from server
- **Previous State**: `previousState` tracks last rendered state for change detection
- **Predicted State**: `localPlayerPredictedPosition` tracks optimistic local player position
- **Synchronization**: `STATE_UPDATE` messages update `currentState`, reconciliation syncs prediction

**State Flow**:
```
Server STATE_UPDATE → currentState → compareStates() → incremental render
User Input → validateMovement() → update localPlayerPredictedPosition → immediate render
Periodic/Event → reconcilePosition() → correct prediction → re-render
```

Other players' **display** positions come from interpolated state (see Remote Entity Interpolation); server state still drives full/incremental render and change detection.

### 4. Remote Entity Interpolation

**Concept**: Smooth movement of other players between server true-ups by showing them slightly in the past and interpolating between the two most recent server snapshots.

**Implementation**:
- **Per-entity buffer**: Each remote player has a buffer of `{ t, x, y, playerName, vx?, vy? }` (timestamp and position; optional velocity from server). Capped (e.g. 20 entries).
- **On STATE_UPDATE**: Push remote players to buffers using `message.timestamp`; remove buffers and clear cells for players who left.
- **Interpolation tick** (e.g. every 50ms): `renderTime = Date.now() - INTERPOLATION_DELAY_MS` (e.g. 100ms). For each entity, lerp between the two snapshots surrounding `renderTime`, or use latest if 0–1 entries, or extrapolate when past last snapshot. Update `remoteEntityInterpolated` and redraw only remote player cells that changed; then call renderer.
- **State**: `remoteEntityBuffers`, `remoteEntityInterpolated`, `lastDrawnInterpolatedPositions`, `interpolationTickTimer`; constants INTERPOLATION_DELAY_MS, INTERPOLATION_TICK_MS, REMOTE_ENTITY_BUFFER_MAX, EXTRAPOLATION_MAX_MS.
- **Extrapolation**: When `renderTime` is past the last snapshot (e.g. packet loss), hold or extrapolate using server-provided `vx`/`vy` (if present) or client-derived velocity from the last two buffer entries; clamp duration (e.g. 300ms).

**Benefits**: Smooth motion for remote players; optional server velocity improves extrapolation when the buffer runs dry.

See [Remote Entity Interpolation Specification](../remote-entity-interpolation/remote-entity-interpolation_SPECS.md) for full details.

### 5. Message Queue Pattern

**Concept**: Buffer outgoing messages when WebSocket is not ready, preventing message loss during connection transitions.

**Implementation**:
- **Queue Storage**: `messageQueue` array in `WebSocketClient`
- **Queue Conditions**: Queue when socket is CLOSING, CLOSED, or not initialized
- **Flush Trigger**: Flush queue when socket transitions to OPEN state
- **Error Handling**: Re-queue messages if send fails

**Benefits**:
- Prevents dropped keypresses during connection issues
- Handles transient connection states gracefully
- Ensures all user input reaches server

### 6. Event-Driven Architecture

**Concept**: Components communicate via events and callbacks rather than direct method calls.

**Implementation**:
- **WebSocket Events**: `connect`, `message`, `error`, `close`
- **Input Events**: `onMove`, `onQuit` callbacks
- **Custom Events**: `WebSocketClient` uses event emitter pattern internally

**Benefits**:
- Loose coupling between components
- Easy to extend with new event handlers
- Natural fit for asynchronous operations

### 7. Configuration-Driven Behavior

**Concept**: Client behavior controlled via configuration file, allowing customization without code changes.

**Implementation**:
- **Config File**: `config/clientConfig.json`
- **Config Sections**:
  - `websocket`: Server URL
  - `logging`: Log level
  - `rendering`: Glyphs and colors (player, space, wall)
  - `prediction`: Enable/disable, reconciliation interval
- **Defaults**: `clientConfig.js` provides defaults if file missing

**Benefits**:
- Easy customization for different environments
- No code changes needed for configuration updates
- Supports different visual styles per deployment

---

## Architectural Patterns

### 1. Layered Architecture

**Structure**:
```
┌─────────────────────────────────────┐
│     Entry Point (index.js)          │
│  - Mode selection                   │
│  - Logger configuration             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Networked Mode (networkedMode.js)  │
│  - Orchestration                    │
│  - State management                 │
│  - Event coordination               │
└──────┬───────────────┬───────────────┘
       │               │
┌──────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
│  Network    │  │  Render    │  │   Input     │
│  Layer      │  │  Layer     │  │   Layer     │
└─────────────┘  └────────────┘  └─────────────┘
```

**Layers**:
1. **Entry Layer**: Bootstrap and configuration
2. **Mode Layer**: Game mode orchestration
3. **Service Layers**: Network, rendering, input handling

**Benefits**:
- Clear separation of concerns
- Easy to test individual layers
- Modular and maintainable

### 2. Adapter Pattern

**Usage**: Convert server state format to client rendering format.

**Example**: Board adapter in `networkedMode.js`
```javascript
const board = {
  width: currentState.board.width,
  height: currentState.board.height,
  grid: currentState.board.grid,
  getCell: (x, y) => { /* adapt grid access */ },
  isWall: (x, y) => { /* adapt wall check */ }
};
```

**Benefits**:
- Decouples server state format from rendering logic
- Allows different state formats without changing renderer
- Provides consistent interface for rendering

### 3. Factory Pattern

**Usage**: Create configured instances based on mode or configuration.

**Examples**:
- `configureLogger(mode)`: Creates logger with mode-specific transports
- `Renderer` constructor: Creates renderer with config-based glyphs/colors
- `MessageHandler.createMessage()`: Creates properly formatted messages

**Benefits**:
- Centralized object creation
- Consistent initialization
- Easy to extend with new configurations

### 4. Observer Pattern

**Usage**: Components subscribe to events and react to changes.

**Examples**:
- `WebSocketClient.on('connect', callback)`: Subscribe to connection events
- `inputHandler.onMove(callback)`: Subscribe to movement input
- `wsClient.on('message', handler)`: Subscribe to server messages

**Benefits**:
- Decoupled event producers and consumers
- Multiple handlers can subscribe to same event
- Easy to add/remove handlers dynamically

---

## Design Patterns

### 1. Single Responsibility Principle

**Application**: Each class/function has one clear purpose.

**Examples**:
- `WebSocketClient`: Only handles WebSocket communication
- `Renderer`: Only handles terminal rendering
- `InputHandler`: Only handles keyboard input
- `MessageHandler`: Only handles message parsing/creation

**Benefits**:
- Easier to understand and maintain
- Easier to test
- Easier to modify without side effects

### 2. Dependency Injection

**Usage**: Dependencies passed as constructor parameters or function arguments.

**Examples**:
- `Renderer` receives config in constructor
- `networkedMode` receives no parameters (uses imports)
- Functions receive state/board as parameters rather than accessing globals

**Benefits**:
- Testable (can inject mocks)
- Flexible (can swap implementations)
- Clear dependencies

### 3. Strategy Pattern

**Usage**: Different behaviors selected based on configuration or state.

**Examples**:
- Prediction enabled/disabled via `clientConfig.prediction.enabled`
- Full render vs incremental render based on change count
- Logger transports based on mode (server vs client)

**Benefits**:
- Runtime behavior selection
- Easy to add new strategies
- Configuration-driven behavior

### 4. Guard Clauses

**Usage**: Early returns for invalid conditions, reducing nesting.

**Examples**:
```javascript
function reconcilePosition() {
  if (!localPlayerId) return;
  if (localPlayerPredictedPosition.x === null) return;
  if (!currentState) return;
  // ... main logic
}
```

**Benefits**:
- Clearer code flow
- Reduced nesting
- Easier to read

### 5. Defensive Programming

**Usage**: Validate inputs and handle edge cases gracefully.

**Examples**:
- Null checks before accessing properties
- Bounds checking before array access
- Fallback to full render on error
- Default values for missing config

**Benefits**:
- Prevents crashes
- Graceful degradation
- Better user experience

---

## State Management Patterns

### 1. Immutable State Updates

**Concept**: Create new state objects rather than mutating existing ones.

**Implementation**:
- `currentState` replaced entirely on `STATE_UPDATE`
- `localPlayerPredictedPosition` replaced with new object
- `previousState` stores copy of previous state
- **Remote entity interpolation** uses separate state: `remoteEntityBuffers`, `remoteEntityInterpolated`, `lastDrawnInterpolatedPositions`. The interpolation tick does not change `currentState` or `previousState`; it only redraws remote player cells.

**Benefits**:
- Easier to compare states (reference equality)
- Prevents accidental mutations
- Clear state transitions

### 2. State Comparison Pattern

**Concept**: Compare previous and current state to detect changes.

**Implementation**:
- `compareStates(previousState, currentState)` returns structured changes
- Uses `Map` for O(1) player lookups
- Returns arrays of changes (moved, joined, left)

**Change Detection Algorithm**:
1. Create map of previous players (O(n))
2. Iterate current players (O(n))
   - If in map: check if moved
   - If not in map: marked as joined
   - Remove from map
3. Remaining in map: marked as left

**Complexity**: O(n) where n is number of players

### 3. Optimistic Updates

**Concept**: Update UI immediately, correct later if server disagrees.

**Implementation**:
- User input → validate → update prediction → render immediately
- Server response → reconcile → correct if needed → re-render

**Benefits**:
- Instant feedback
- Better perceived performance
- Server remains authoritative

### 4. State Reconciliation

**Concept**: Periodically sync optimistic state with authoritative state.

**Implementation**:
- Timer-based: Every N milliseconds (configurable, default 5000ms)
- Event-based: On every `STATE_UPDATE` (immediate correction)
- Comparison: Predicted position vs server position
- Correction: Update prediction to match server, re-render

**Reconciliation Flow**:
```
Timer/Event → reconcilePosition() → 
  Compare predicted vs server → 
  If mismatch → Update prediction → 
  Clear old position → Draw at server position → 
  Update status bar
```

---

## Network Communication Patterns

### 1. Message-Based Communication

**Concept**: All communication via structured JSON messages.

**Message Structure**:
```javascript
{
  type: string,        // MessageTypes constant
  payload: object,     // Message-specific data
  timestamp: number,   // Unix timestamp
  clientId: string     // Optional client ID
}
```

**Benefits**:
- Type-safe message handling
- Easy to extend with new message types
- Consistent format

### 2. Request-Response Pattern

**Concept**: Client sends request, server responds.

**Examples**:
- `CONNECT` → Server responds with `CONNECT` (acknowledgment + state)
- `MOVE` → Server processes and broadcasts `STATE_UPDATE`

**Note**: Not all messages are request-response (e.g., `STATE_UPDATE` is push-only)

### 3. Push Pattern

**Concept**: Server pushes updates to clients without explicit request.

**Examples**:
- `STATE_UPDATE`: Periodic state broadcasts
- `PLAYER_JOINED`: Notification of new player
- `PLAYER_LEFT`: Notification of player leaving

**Benefits**:
- Real-time updates
- Efficient (no polling)
- Server controls update frequency

### 4. Connection State Management

**Concept**: Track and handle WebSocket connection states.

**States**:
- `CONNECTING` (0): Initial connection attempt
- `OPEN` (1): Connected and ready
- `CLOSING` (2): Closing connection
- `CLOSED` (3): Connection closed

**Handling**:
- Queue messages when not `OPEN`
- Flush queue when `OPEN`
- Handle reconnection on `CLOSE`

---

## Rendering Patterns

### 1. Full Render Pattern

**Usage**: Clear screen and render everything from scratch.

**When Used**:
- Initial render (`previousState === null`)
- Too many changes (>10)
- Error during incremental render
- Modal state changes

**Implementation**:
```javascript
renderer.clearScreen();
renderer.renderTitle();
renderer.renderBoard(board, players);
renderer.renderStatusBar(score, position, height);
```

### 2. Incremental Render Pattern

**Usage**: Update only changed cells.

**When Used**:
- Normal state updates
- Small number of changes (≤10)

**Implementation**:
1. Compare states → get changes
2. Filter local player from changes
3. For each change:
   - Clear old position (restore cell content)
   - Draw at new position
4. Update status bar if needed

Remote players are drawn at **interpolated** positions during the interpolation tick (clear old cell, draw new); full/incremental render on STATE_UPDATE may draw them at server positions first, then the tick overwrites with interpolated positions.

### 3. Cell Content Resolution

**Concept**: Determine what to render at each position based on priority.

**Priority Order**:
1. **Player** (highest priority)
2. **Entity** (if present, top-most visible)
3. **Board Cell** (base character, lowest priority)

**Implementation**: `getCellContent(x, y, board, players)`

### 4. Cell Restoration Pattern

**Concept**: When clearing a position, restore what was underneath.

**Restoration Priority**:
1. Check for entities at position
2. Check for other players at position
3. Fall back to board cell base character

**Implementation**: `restoreCellContent(x, y, board, players, entities)`

### 5. Cursor Positioning

**Concept**: Use ANSI escape codes for precise terminal cursor control.

**Usage**:
- `cursorTo(x, y)`: Position cursor for cell updates
- Calculate screen coordinates: `screenY = boardY + titleOffset + 1` (1-indexed)

**Benefits**:
- Efficient (only update changed cells)
- No flicker
- Precise control

---

## Input Handling Patterns

### 1. Raw Mode Input

**Concept**: Capture keyboard input immediately without line buffering.

**Implementation**:
- `process.stdin.setRawMode(true)`: Enable raw mode
- `process.stdin.on('data', handler)`: Capture keypress events
- Parse escape sequences for arrow keys

**Benefits**:
- Immediate response
- No Enter key required
- Supports special keys (arrows, ESC)

### 2. Key Mapping Pattern

**Concept**: Map keyboard input to game actions.

**Mappings**:
- Arrow keys: Movement (↑↓←→)
- WASD: Movement (W/A/S/D)
- Q/ESC: Quit

**Implementation**: `InputHandler.handleInput(data)` parses key sequences

### 3. Callback Registration Pattern

**Concept**: Register callbacks for different input types.

**Usage**:
- `inputHandler.onMove(callback)`: Register movement handler
- `inputHandler.onQuit(callback)`: Register quit handler

**Benefits**:
- Flexible (can change handlers)
- Testable (can mock callbacks)
- Decoupled (input handler doesn't know game logic)

---

## Error Handling and Resilience

### 1. Try-Catch Blocks

**Usage**: Wrap operations that might fail.

**Examples**:
- Message parsing
- Rendering operations
- Network operations

**Pattern**:
```javascript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed:', error);
  // Fallback or graceful degradation
}
```

### 2. Graceful Degradation

**Concept**: Fall back to simpler behavior on error.

**Examples**:
- Incremental render error → fall back to full render
- Message parse error → log and ignore
- Network error → queue message for retry

### 3. Validation Before Action

**Concept**: Validate inputs/state before performing operations.

**Examples**:
- `validateMovement()` before predicting
- Check `localPlayerId` before reconciliation
- Check `currentState` before rendering

**Benefits**:
- Prevents invalid operations
- Clear error messages
- Better debugging

### 4. Logging for Debugging

**Concept**: Log important events and errors for troubleshooting.

**Usage**:
- Debug logs for prediction/reconciliation
- Error logs for failures
- Info logs for connection events

**Pattern**: Use appropriate log levels (debug, info, warn, error)

---

## Configuration Management

### 1. JSON Configuration File

**Concept**: Store configuration in JSON file.

**File**: `config/clientConfig.json`

**Structure**:
```json
{
  "websocket": { "url": "ws://localhost:3000" },
  "logging": { "level": "debug" },
  "rendering": {
    "playerGlyph": "☻",
    "spaceGlyph": " ",
    "wallGlyph": "#",
    "playerColor": "00FF00"
  },
  "prediction": {
    "enabled": true,
    "reconciliationInterval": 5000
  }
}
```

### 2. Default Values Pattern

**Concept**: Provide defaults if config file missing or incomplete.

**Implementation**: `clientConfig.js` loads JSON or returns defaults

**Benefits**:
- Works out of the box
- Graceful handling of missing config
- Easy to override

### 3. Configuration Access Pattern

**Concept**: Access config via imported module.

**Usage**: `import clientConfig from '../config/clientConfig.js'`

**Benefits**:
- Single source of truth
- Easy to mock in tests
- Type-safe access (if using TypeScript)

---

## Code Organization Patterns

### 1. Module-Based Organization

**Structure**:
```
src/
  index.js              # Entry point
  modes/                # Game modes
    networkedMode.js
  network/              # Network layer
    WebSocketClient.js
    MessageHandler.js
    MessageTypes.js
  render/               # Rendering
    Renderer.js
  input/                # Input handling
    InputHandler.js
  game/                 # Game logic (shared)
    Board.js
    Game.js
  utils/                # Utilities
    logger.js
    stateComparison.js
    terminal.js
  config/               # Configuration
    clientConfig.js
```

**Benefits**:
- Clear separation by concern
- Easy to find code
- Scalable structure

### 2. Naming Conventions

**Classes**: PascalCase (`WebSocketClient`, `InputHandler`)
**Functions**: camelCase (`renderFull`, `compareStates`)
**Constants**: UPPER_SNAKE_CASE (in `MessageTypes.js`)
**Files**: Match class/export name (`WebSocketClient.js`)

**Benefits**:
- Consistent codebase
- Easy to understand
- Follows JavaScript conventions

### 3. Export Patterns

**Default Exports**: Main class/function
```javascript
export default WebSocketClient;
```

**Named Exports**: Multiple exports from utility modules
```javascript
export { compareStates };
export default compareStates;
```

**Benefits**:
- Clear API
- Flexible imports
- Tree-shakeable

### 4. Import Organization

**Pattern**: Group imports by type
```javascript
// External dependencies
import { WebSocket } from 'ws';
import chalk from 'chalk';

// Internal modules
import WebSocketClient from '../network/WebSocketClient.js';
import logger from '../utils/logger.js';
```

**Benefits**:
- Easy to see dependencies
- Clear organization
- Easy to maintain

---

## Summary

The client architecture employs:

- **Modern JavaScript**: ES Modules, async/await, modern patterns
- **Event-Driven Design**: WebSocket events, input callbacks, custom events
- **Optimistic Updates**: Client-side prediction with reconciliation
- **Efficient Rendering**: Incremental updates with full render fallback
- **Resilient Communication**: Message queue, error handling, graceful degradation
- **Configuration-Driven**: JSON config with sensible defaults
- **Modular Structure**: Clear separation of concerns, testable components

These patterns and technologies work together to provide a responsive, maintainable, and extensible client implementation for the multiplayer terminal game.

# Client Architecture Specification

## Overview

This document describes the client-side architecture, patterns, and implementation details for the terminal-based multiplayer game. The client is built with Node.js, uses WebSocket for real-time communication, implements client-side prediction for responsive gameplay, and uses incremental rendering for optimal performance.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Network Communication](#network-communication)
4. [State Management](#state-management)
5. [Rendering System](#rendering-system)
6. [Input Handling](#input-handling)
7. [Client-Side Prediction](#client-side-prediction)
8. [Reconciliation](#reconciliation)
9. [Incremental Rendering](#incremental-rendering)
10. [Modal System](#modal-system)
11. [Reconnection Handling](#reconnection-handling)
12. [Client-Server Interaction](#client-server-interaction)
13. [Client-Client Interaction](#client-client-interaction)
14. [Patterns and Conventions](#patterns-and-conventions)

---

## Architecture Overview

### High-Level Architecture

The client follows a modular, event-driven architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      Entry Point (index.js)                │
│  - Detects mode (local vs networked)                        │
│  - Initializes appropriate mode handler                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌─────────▼──────────┐
│  Local Mode    │          │  Networked Mode    │
│  (localMode.js)│          │ (networkedMode.js) │
└────────────────┘          └─────────┬──────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                         │
    ┌─────────▼────────┐    ┌─────────▼────────┐    ┌─────────▼────────┐
    │ WebSocketClient  │    │  InputHandler    │    │    Renderer      │
    │  (Network Layer) │    │  (Input Layer)   │    │  (Render Layer)  │
    └─────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
              │                      │                         │
              │                      │                         │
    ┌─────────▼──────────────────────▼────────────────────────▼────────┐
    │                    Game State Management                          │
    │  - currentState (server state)                                    │
    │  - previousState (for change detection)                            │
    │  - localPlayerPredictedPosition (client-side prediction)          │
    └───────────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Separation of Concerns**: Each component has a single, well-defined responsibility
2. **Event-Driven**: Components communicate via callbacks and events
3. **State Synchronization**: Server is source of truth, client predicts locally
4. **Incremental Updates**: Only render what changed, not the entire screen
5. **Error Recovery**: Graceful fallbacks when operations fail

---

## Core Components

### 1. Entry Point (`src/index.js`)

**Purpose**: Bootstrap the application and select the appropriate mode.

**Responsibilities**:
- Load environment variables
- Check server configuration to determine mode
- Initialize and run either `localMode` or `networkedMode`
- Handle process termination signals

**Key Features**:
- Mode selection based on `serverConfig.websocket.enabled`
- Global logger attachment for debugging
- Graceful error handling and cleanup

### 2. Networked Mode (`src/modes/networkedMode.js`)

**Purpose**: Main orchestrator for multiplayer game mode.

**Responsibilities**:
- Initialize all game components (Game, Renderer, InputHandler, WebSocketClient, ModalManager)
- Set up WebSocket event handlers
- Coordinate client-side prediction
- Manage state synchronization
- Handle reconnection logic
- Coordinate rendering updates

**Key State Variables**:
- `game`: Game instance (kept for compatibility, but state comes from server)
- `renderer`: Renderer instance for terminal output
- `inputHandler`: Handles keyboard input
- `wsClient`: WebSocket client wrapper
- `modalManager`: Manages modal dialogs
- `currentState`: Current game state from server
- `previousState`: Previous state for change detection
- `localPlayerId`: ID of the local player
- `localPlayerPredictedPosition`: Predicted position for client-side prediction
- `queuedStateUpdate`: State updates received before `localPlayerId` is set

### 3. WebSocket Client (`src/network/WebSocketClient.js`)

**Purpose**: Abstraction layer for WebSocket communication.

**Responsibilities**:
- Manage WebSocket connection lifecycle
- Handle reconnection with exponential backoff
- Parse and route incoming messages
- Send outgoing messages
- Maintain connection state (clientId, playerId, playerName)

**Key Features**:
- **Reconnection Logic**: Automatic reconnection with exponential backoff
  - Configurable max attempts, retry delay, exponential backoff
  - Detects manual vs automatic disconnects
  - Preserves playerId on reconnection
- **Message Routing**: Routes incoming messages to appropriate callbacks
- **State Management**: Tracks connection state and player identity

**Reconnection Flow**:
1. Connection lost → `on('close')` triggered
2. Check if manual disconnect → if yes, don't reconnect
3. Check if reconnection enabled and attempts < max → if yes, attempt reconnect
4. Calculate delay with exponential backoff
5. Attempt connection after delay
6. On success: send CONNECT with playerId (if reconnecting)
7. On failure: retry up to max attempts

### 4. Message Handler (`src/network/MessageHandler.js`)

**Purpose**: Parse, validate, and create WebSocket messages.

**Responsibilities**:
- Parse JSON messages from server
- Validate message structure
- Create properly formatted messages for sending
- Handle parsing errors gracefully

**Message Structure**:
```javascript
{
  type: string,        // Message type (from MessageTypes)
  payload: object,    // Message-specific data
  timestamp: number,   // Message timestamp
  clientId: string    // Client ID (optional)
}
```

### 5. Message Types (`src/network/MessageTypes.js`)

**Purpose**: Define all message types used in client-server communication.

**Message Types**:
- `CONNECT`: Initial connection or reconnection
- `DISCONNECT`: Client disconnection
- `MOVE`: Player movement command
- `SET_PLAYER_NAME`: Set player name
- `RESTART`: Request game restart
- `STATE_UPDATE`: Server state update
- `PLAYER_JOINED`: Player joined notification
- `PLAYER_LEFT`: Player left notification
- `ERROR`: Error message
- `PING`/`PONG`: Keep-alive messages
- `TEST`: Development/testing messages

### 6. Renderer (`src/render/Renderer.js`)

**Purpose**: Handle all terminal rendering operations.

**Responsibilities**:
- Render game board, title, status bar
- Render modals
- Incremental cell updates
- Color management
- Cursor positioning

**Key Features**:
- **Full Render**: Complete screen render (initial render, fallback)
- **Incremental Render**: Update only changed cells
- **Cell Content Resolution**: Determines what to render at each position (player > entity > board cell)
- **Color Functions**: Converts hex colors to chalk color functions
- **Modal Support**: Renders modals with background dimming

**Rendering Priority** (for `getCellContent`):
1. Player at position (highest priority)
2. Top-most visible entity at position
3. Board cell base character (lowest priority)

### 7. Input Handler (`src/input/InputHandler.js`)

**Purpose**: Capture and route keyboard input.

**Responsibilities**:
- Capture raw keyboard input
- Parse keypress events
- Route input to game callbacks or modal input handler
- Handle modal vs game input routing

**Key Features**:
- **Raw Mode**: Uses Node.js raw mode for immediate keypress capture
- **Modal Routing**: When modal is open, all input goes to modal handler
- **Input Buffer Clearing**: Prevents input accumulation
- **Key Mapping**: Maps arrow keys and WASD to movement callbacks

**Input Routing Logic**:
1. If modal is open → route to `ModalInputHandler`
2. Otherwise → route to game callbacks (movement, quit, restart, help)

### 8. Modal System

**Components**:
- `Modal` (`src/ui/Modal.js`): Modal data structure with content and selection
- `ModalManager` (`src/ui/ModalManager.js`): Manages modal stack and state
- `ModalInputHandler` (`src/ui/ModalInputHandler.js`): Handles modal-specific input
- `ModalRenderer` (`src/render/ModalRenderer.js`): Renders modals with scrolling

**Key Features**:
- **Modal Stacking**: Supports nested modals with scroll position preservation
- **Scrolling**: Long content can be scrolled within viewport
- **Selection**: Highlighted option selection with keyboard navigation
- **Actions**: Options can have actions that execute when selected
- **Auto-close**: Modals can auto-close after action execution

### 9. State Comparison (`src/utils/stateComparison.js`)

**Purpose**: Detect changes between game states for incremental rendering.

**Responsibilities**:
- Compare player arrays (moved, joined, left)
- Compare entity arrays (moved, spawned, despawned, animated)
- Compare scores
- Return structured change detection results

**Change Detection Algorithm**:
- Uses `Map` for O(1) lookups
- Compares previous vs current state
- Returns arrays of changes (moved, joined, left, spawned, etc.)

---

## Network Communication

### Connection Lifecycle

1. **Initial Connection**:
   - Client creates `WebSocketClient` instance
   - Calls `connect()` with server URL
   - On connection, sends `CONNECT` message (without playerId)
   - Server responds with `CONNECT` containing `clientId` and optional `gameState`
   - Server sends `PLAYER_JOINED` with `playerId`
   - Client stores `localPlayerId` and initializes prediction

2. **Reconnection**:
   - Client detects connection loss
   - Attempts reconnection with exponential backoff
   - On successful reconnect, sends `CONNECT` with `playerId`
   - Server restores player state if playerId is valid
   - Client receives `CONNECT` response with restored state

3. **Disconnection**:
   - Manual: Client sends `DISCONNECT` and closes connection
   - Automatic: Connection lost, triggers reconnection logic

### Message Flow

**Client → Server**:
- `CONNECT`: Join game or reconnect
- `MOVE`: Player movement command (dx, dy)
- `DISCONNECT`: Leave game
- `RESTART`: Request game restart
- `SET_PLAYER_NAME`: Change player name
- `PING`: Keep-alive

**Server → Client**:
- `CONNECT`: Connection acknowledgment with clientId and gameState
- `STATE_UPDATE`: Periodic game state updates
- `PLAYER_JOINED`: Notification that player joined (includes local playerId)
- `PLAYER_LEFT`: Notification that player left
- `ERROR`: Error message
- `PONG`: Keep-alive response

### Message Handling Pattern

All messages follow this pattern:
1. Server sends message as JSON string
2. `WebSocketClient.handleMessage()` receives raw data
3. `MessageHandler.parseMessage()` parses and validates
4. Message type determines which callback to invoke
5. Callback processes message and updates client state

---

## State Management

### State Structure

**Server State** (received via `STATE_UPDATE`):
```javascript
{
  board: {
    width: number,
    height: number,
    grid: string[][]  // 2D array of base characters
  },
  players: [
    {
      playerId: string,
      x: number,
      y: number,
      playerName: string
    }
  ],
  entities: [
    {
      entityId: string,
      x: number,
      y: number,
      glyph: string,
      color: string,
      solid: boolean,
      zOrder: number,
      entityType: string
    }
  ],
  score: number
}
```

### Client State Variables

1. **`currentState`**: Latest state from server (source of truth)
2. **`previousState`**: Previous state for change detection
3. **`localPlayerPredictedPosition`**: Predicted position for local player (client-side prediction)
4. **`localPlayerId`**: ID of the local player (set when `PLAYER_JOINED` received)

### State Synchronization Flow

1. **Server sends `STATE_UPDATE`**
2. **Client receives and stores in `currentState`**
3. **If `localPlayerId` not set**: Queue state update
4. **If modal open**: Skip rendering, still update state
5. **Compare `previousState` vs `currentState`**:
   - If `previousState === null`: Full render
   - Otherwise: Incremental render based on changes
6. **Update `previousState`** after successful render

### Edge Cases

- **State update before `localPlayerId` set**: Queue state update, process when `localPlayerId` arrives
- **Local player missing from state**: Likely server restart, reset state and rejoin
- **Too many changes**: Fallback to full render (threshold: 10 changes)

---

## Rendering System

### Rendering Modes

1. **Full Render** (`renderFull()`):
   - Clears entire screen
   - Renders title, board, status bar, modals
   - Used for: initial render, fallback, error recovery

2. **Incremental Render**:
   - Updates only changed cells
   - Used for: player movement, entity movement, entity spawn/despawn

### Rendering Pipeline

1. **Initial Render**:
   - `previousState === null` → trigger full render
   - Store state as `previousState`

2. **Subsequent Renders**:
   - Compare `previousState` vs `currentState`
   - Calculate changes (players, entities)
   - Apply incremental updates:
     - Update moved players (excluding local player)
     - Update moved/spawned/despawned entities
     - Update status bar if changed
   - Store new state as `previousState`

3. **Fallback Conditions**:
   - Too many changes (>10 changes) → full render
   - Error during incremental update → full render
   - Modal state change → full render

### Cell Content Resolution

The `getCellContent()` method determines what to render at each position:

1. **Check for player** at position → render player character
2. **Check for top-most visible entity** at position → render entity
3. **Fall back to board cell** → render base character

**Entity Visibility Rules**:
- Players always render on top of entities
- Entities with higher `zOrder` render on top
- If same `zOrder`, stable sort by `entityId`

### Color Management

- Colors stored as hex strings (e.g., "FF0000" for red)
- `getColorFunction()` converts hex to chalk color function
- Default color: white (if hex is null/undefined)

---

## Input Handling

### Input Flow

1. **Keypress Event**:
   - `InputHandler` captures raw keypress
   - Parses key name/sequence

2. **Modal Check**:
   - If modal open → route to `ModalInputHandler`
   - Otherwise → route to game callbacks

3. **Game Input Processing**:
   - Movement keys (arrow/WASD) → movement callbacks
   - Special keys (Q/ESC, R, H/?) → action callbacks

### Movement Input Processing (Networked Mode)

When movement key pressed:

1. **Client-Side Prediction** (if enabled):
   - Validate predicted position (not null/undefined)
   - Check bounds
   - Check wall collision
   - Check entity collision
   - Check other player collision
   - If valid: update `localPlayerPredictedPosition`
   - Render immediately at new position
   - Clear old position

2. **Send to Server**:
   - Always send `MOVE` message to server
   - Server validates and updates state
   - Server sends `STATE_UPDATE` with authoritative position

3. **Reconciliation**:
   - Periodic reconciliation compares predicted vs server position
   - If mismatch: correct to server position and re-render

### Input Buffer Management

- `clearInputBuffer()` drains stdin to prevent accumulation
- Called after every keypress to prevent lag

---

## Client-Side Prediction

### Purpose

Provide immediate visual feedback for local player movement without waiting for server round-trip.

### Implementation

**Prediction State**:
- `localPlayerPredictedPosition`: `{ x, y }` or `{ x: null, y: null }`
- Initialized from server position on first `STATE_UPDATE`
- Updated immediately on movement input
- Used for rendering local player

**Prediction Flow**:

1. **Movement Input**:
   - Calculate new position (oldX + dx, oldY + dy)
   - Validate bounds, walls, collisions
   - If valid: update `localPlayerPredictedPosition`
   - Render immediately

2. **Server Response**:
   - Server processes movement
   - Server sends `STATE_UPDATE` with authoritative position
   - Reconciliation compares predicted vs server

3. **Reconciliation**:
   - If mismatch: correct to server position
   - Re-render at corrected position

### Collision Detection (Client-Side)

Before predicting movement, client checks:
1. **Bounds**: New position within board bounds
2. **Walls**: Cell at new position is not a wall
3. **Solid Entities**: No solid entity at new position
4. **Other Players**: No other player at new position

If any check fails, movement is rejected (no prediction, no server message).

### Edge Cases

- **Null/Undefined Position**: Don't predict if position is null/undefined
- **Out of Bounds**: Correct to server position immediately
- **Server Rejection**: Server position doesn't change → reconciliation corrects

---

## Reconciliation

### Purpose

Periodically synchronize predicted position with server authoritative position.

### Implementation

**Reconciliation Timer**:
- Configurable interval (default: 5000ms)
- Runs continuously while prediction enabled
- Compares `localPlayerPredictedPosition` vs server position

**Reconciliation Process**:

1. **Check Prerequisites**:
   - `localPlayerId` must be set
   - Predicted position must not be null/undefined
   - Server player must exist in state

2. **Compare Positions**:
   - If predicted !== server → discrepancy detected

3. **Correction**:
   - Update `localPlayerPredictedPosition` to server position
   - Clear old predicted position (restore cell content)
   - Draw player at server position
   - Update status bar

**Reconciliation Triggers**:
- Timer-based: Every N milliseconds (configurable)
- State update: On every `STATE_UPDATE` (optional, additional check)

### Edge Cases

- **Invalid Server Position**: Log warning, skip reconciliation
- **Out of Bounds Predicted Position**: Correct immediately to server position
- **Server Rejection**: Position doesn't change on server → reconciliation corrects

---

## Incremental Rendering

### Purpose

Update only changed cells instead of re-rendering entire screen, reducing flicker and improving performance.

### Change Detection

Uses `compareStates()` to detect:
- **Players**: moved, joined, left
- **Entities**: moved, spawned, despawned, animated
- **Score**: changed

### Incremental Update Process

1. **Compare States**:
   - `compareStates(previousState, currentState)`
   - Returns structured change object

2. **Filter Local Player**:
   - Exclude local player from server state rendering
   - Local player uses predicted position (rendered separately)

3. **Apply Updates**:
   - **Moved Players**: Clear old position, draw at new position
   - **Joined Players**: Draw at spawn position
   - **Left Players**: Clear position, restore cell content
   - **Moved Entities**: Clear old, draw at new
   - **Spawned Entities**: Draw at spawn position
   - **Despawned Entities**: Clear position, restore cell content
   - **Animated Entities**: Update glyph at same position
   - **Status Bar**: Update if score or position changed

4. **Fallback Conditions**:
   - Too many changes (>10) → full render
   - Error during update → full render

### Cell Content Restoration

When clearing a position, must restore what was underneath:
- Check for entities at position
- Check for other players at position
- Fall back to board cell base character

---

## Modal System

### Architecture

**Components**:
- `Modal`: Data structure (title, content, selection, scroll)
- `ModalManager`: Manages modal stack and state
- `ModalInputHandler`: Handles modal-specific input (arrow keys, Enter, Escape)
- `ModalRenderer`: Renders modal with scrolling and selection highlighting

### Modal Stack

- Supports nested modals
- When new modal opens, current modal pushed to stack
- When modal closes, previous modal restored from stack
- Scroll positions preserved in modal instances

### Modal Rendering

- **Background Dimming**: Optional dimming overlay over game board
- **Modal Box**: Centered box with title and content
- **Scrolling**: Long content scrolls within viewport
- **Selection**: Highlighted option with configurable colors
- **Shadow**: Optional shadow effect for depth

### Modal Input

When modal is open:
- All input routed to `ModalInputHandler`
- Arrow keys: Navigate options or scroll content
- Enter: Execute selected option action
- Escape: Close modal
- Game input blocked while modal open

### Modal Actions

- Options can have `action` functions
- Actions receive `{ modal }` parameter
- Actions can close modal automatically (configurable `autoClose` flag)
- Modal-level actions also supported

---

## Reconnection Handling

### Reconnection Strategy

**Automatic Reconnection**:
- Enabled by default (configurable)
- Exponential backoff for retry delays
- Maximum retry attempts (default: 5)
- Preserves `playerId` across reconnections

**Reconnection Flow**:

1. **Connection Lost**:
   - `WebSocketClient` detects close event
   - Checks if manual disconnect → if yes, don't reconnect
   - Checks reconnection config → if enabled, attempt reconnect

2. **Reconnection Attempt**:
   - Calculate delay (exponential backoff)
   - Wait for delay
   - Attempt connection
   - On success: send `CONNECT` with `playerId`
   - On failure: retry up to max attempts

3. **State Restoration**:
   - Server receives `CONNECT` with `playerId`
   - Server checks if player exists → if yes, restore state
   - Server sends `CONNECT` response with `gameState`
   - Client receives state and reinitializes prediction

### Reconnection State Management

**On Disconnect**:
- Reset `localPlayerPredictedPosition` to null
- Clear reconciliation timer
- Clear queued state update
- Set `running = false`

**On Reconnect**:
- Send `CONNECT` with `playerId` (if reconnecting)
- Receive `CONNECT` response with `gameState`
- Reinitialize `localPlayerPredictedPosition` from server
- Restart reconciliation timer
- Resume game loop

### Server Restart Detection

- Server sends `CONNECT` with `isReconnection: false` even if client had `playerId`
- Client detects this and triggers `onServerRestart` callback
- Client resets all state:
  - `previousState = null`
  - `localPlayerPredictedPosition = { x: null, y: null }`
  - `localPlayerId = null`
  - Clear reconciliation timer
  - Reset modal manager
- Client sends new `CONNECT` (without playerId) to rejoin as new player

---

## Client-Server Interaction

### Connection Establishment

1. **Client Initiates**:
   - Creates `WebSocketClient` instance
   - Calls `connect()` with server URL
   - Waits for connection

2. **Server Responds**:
   - Accepts connection
   - Assigns `clientId`
   - Sends `CONNECT` with `clientId` and optional `gameState`

3. **Client Joins Game**:
   - Client sends `CONNECT` (without playerId for new player)
   - Server creates player, assigns `playerId`
   - Server sends `PLAYER_JOINED` with `playerId`
   - Client stores `localPlayerId`

### Movement Synchronization

1. **Client Input**:
   - User presses movement key
   - Client predicts movement (if enabled)
   - Client sends `MOVE` message to server

2. **Server Processing**:
   - Server validates movement
   - Server updates player position
   - Server broadcasts `STATE_UPDATE` to all clients

3. **Client Receives Update**:
   - Client receives `STATE_UPDATE`
   - Client updates `currentState`
   - Client reconciles predicted position
   - Client renders changes (incremental or full)

### State Updates

**Update Frequency**:
- Server sends `STATE_UPDATE` periodically
- Client processes updates asynchronously
- Client queues updates if `localPlayerId` not set

**Update Processing**:
1. Store in `currentState`
2. Check if modal open → if yes, skip rendering
3. Compare with `previousState`
4. Apply incremental updates or full render
5. Update `previousState`

### Error Handling

**Network Errors**:
- Connection lost → trigger reconnection
- Message parse error → log and ignore
- Invalid message → log error

**State Errors**:
- Invalid position → log warning, skip update
- Missing player → trigger rejoin
- Too many changes → fallback to full render

---

## Client-Client Interaction

### Indirect Communication

Clients do **not** communicate directly with each other. All communication goes through the server:

```
Client A → Server → Client B
Client A → Server → Client C
Client B → Server → Client A
```

### Player Visibility

**Other Players**:
- Clients receive all players in `STATE_UPDATE`
- Clients render other players at positions from server state
- Local player excluded from server state rendering (uses prediction)

**Player Identification**:
- Each player has unique `playerId`
- Clients identify local player via `localPlayerId`
- Other players rendered with same character/color (future: different colors per player)

### Synchronization

**State Consistency**:
- All clients receive same `STATE_UPDATE` messages
- All clients render same board state
- All clients see same entity positions
- Local player position may differ temporarily (prediction) but reconciles

**Collision Detection**:
- Server is authoritative for collisions
- Client predicts collisions (optimistic)
- Server may reject movement → reconciliation corrects

---

## Patterns and Conventions

### Code Organization

**File Structure**:
- `src/modes/`: Mode handlers (local, networked)
- `src/network/`: Network communication (WebSocket, messages)
- `src/render/`: Rendering components
- `src/input/`: Input handling
- `src/ui/`: UI components (modals)
- `src/game/`: Game logic (Board, Game, Cell)
- `src/utils/`: Utility functions
- `src/config/`: Configuration files

### Naming Conventions

- **Classes**: PascalCase (e.g., `WebSocketClient`, `InputHandler`)
- **Functions**: camelCase (e.g., `renderFull`, `compareStates`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `PLAYER_CHAR`, `WALL_CHAR`)
- **Files**: Match class/export name (e.g., `WebSocketClient.js`)

### Error Handling

- **Try-Catch Blocks**: Wrap async operations and rendering
- **Graceful Degradation**: Fallback to full render on error
- **Logging**: Use `clientLogger` for all errors and warnings
- **State Recovery**: Reset state on unrecoverable errors

### Async/Await Patterns

- Use `async/await` with `try/catch` blocks
- Follow patterns in `STANDARDS_AND_PROCESSES/async-await.md` for Array loops
- Avoid blocking operations in main loop

### Configuration

- **Client Config** (`src/config/clientConfig.js`):
  - Logging settings
  - Prediction settings
  - WebSocket URL
  - Reconnection settings

- **Game Config** (`src/config/gameConfig.js`):
  - Board dimensions
  - Player initial position
  - Renderer offsets
  - Modal configuration

### Testing Patterns

- Unit tests for individual components
- Integration tests for full workflows
- Mock WebSocket for network tests
- Test both local and networked modes

### Performance Considerations

- **Incremental Rendering**: Only update changed cells
- **Change Detection**: O(n) complexity with Map lookups
- **Prediction**: Immediate feedback without server round-trip
- **Reconciliation**: Periodic, not on every update
- **Fallback Threshold**: Full render if >10 changes

### Future Enhancements

Potential areas for improvement:
- Different colors per player
- Player name display
- Entity animations
- Board mutations (destructible walls)
- More sophisticated prediction (interpolation, lag compensation)
- Client-side entity prediction
- Optimistic entity updates

---

## Summary

The client architecture is designed for:
- **Responsiveness**: Client-side prediction provides immediate feedback
- **Efficiency**: Incremental rendering minimizes screen updates
- **Reliability**: Reconnection and error recovery ensure stability
- **Modularity**: Clear separation of concerns for maintainability
- **Extensibility**: Patterns support future enhancements

The client maintains a local predicted state while synchronizing with the server's authoritative state, providing a smooth multiplayer experience with minimal latency perception.

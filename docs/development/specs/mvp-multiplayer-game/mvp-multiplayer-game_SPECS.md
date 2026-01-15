# Specification: MVP Multiplayer Terminal Game

## Overview

This specification defines the MVP (Minimum Viable Product) for a multiplayer terminal-based game. The MVP provides a working foundation where a WebSocket server manages game state and multiple clients can connect, move around a game board, and see each other's positions in real-time.

**Purpose**: Establish a minimal working multiplayer game that can be enhanced with advanced features (client-side prediction, incremental rendering, reconnection, etc.) in future iterations.

## Problem Statement

We need a working multiplayer terminal game where:
- A WebSocket server runs in one terminal window
- One or more clients can connect from separate terminal windows
- Players can move around a game board using keyboard input
- Players can see each other's positions in real-time
- The system is simple enough to test manually and serves as a foundation for future enhancements

## Solution

Build a minimal multiplayer game with:
1. **WebSocket Server**: Manages connections, game state, and broadcasts updates
2. **Client Application**: Connects to server, displays game board, handles input
3. **Game Board**: 20x20 grid with walls and players
4. **Real-time Synchronization**: Server broadcasts state updates every 250ms

## Requirements

### Functional Requirements

#### Server Requirements

1. **WebSocket Server**:
   - Start WebSocket server on configurable port (default: 3000)
   - Accept multiple client connections simultaneously
   - Generate unique client ID (UUID) for each connection
   - Handle connection lifecycle (connect, disconnect)

2. **Player Management**:
   - Generate unique player ID (UUID) when client sends CONNECT message
   - Track active players (playerId, x, y, playerName, clientId)
   - Remove player from game when client disconnects
   - Default player name: "Player {playerId}" (first 8 chars of playerId)

3. **Game State Management**:
   - Maintain authoritative game state:
     - Board: 20x20 grid (walls on perimeter, empty interior)
     - Players: Array of player objects
     - Score: 0 (placeholder)
   - Initialize board on server start:
     - Outer cells: `#` (walls)
     - Inner cells: `.` (empty spaces)
   - Initial player position: center (10, 10)

4. **Message Handling**:
   - Accept CONNECT messages (client joining)
   - Accept MOVE messages (dx, dy: -1, 0, or 1)
   - Validate all incoming messages
   - Send CONNECT response with clientId, playerId, gameState
   - Send STATE_UPDATE messages periodically (every 250ms)

5. **Movement Validation**:
   - Validate bounds: new position must be within 0-19 (both x and y)
   - Validate walls: cannot move into cell with `#`
   - Validate player collision: cannot move into cell occupied by another player
   - Update player position only if all validations pass
   - Reject invalid moves (no error message needed for MVP)

6. **State Broadcasting**:
   - Broadcast STATE_UPDATE to all connected clients every 250ms
   - Include full game state (board grid, players array, score)
   - Serialize board grid as 2D array of base characters (strings)

#### Client Requirements

1. **Connection**:
   - Connect to WebSocket server at configurable URL (default: ws://localhost:3000)
   - Send CONNECT message on successful connection
   - Handle connection errors gracefully (display error, exit)

2. **Input Handling**:
   - Capture keyboard input in raw mode
   - Map arrow keys (↑ ↓ ← →) to movement: up, down, left, right
   - Map WASD keys to movement: W=up, S=down, A=left, D=right
   - Map Q or ESC to quit (disconnect and exit)
   - Send MOVE message to server on movement keypress

3. **Display**:
   - Render game board (20x20 grid)
   - Render players at their positions (character: `@`, color: green)
   - Render walls (`#`, color: gray)
   - Render empty spaces (`.`, color: white)
   - Display title/header
   - Display status bar with:
     - Score: 0
     - Position: (x, y)
     - Instructions: "Arrow keys/WASD to move, Q/ESC to quit"
   - Update display when receiving STATE_UPDATE from server

4. **State Management**:
   - Store current game state received from server
   - Update display when state changes
   - Handle disconnection (show error message, exit gracefully)

5. **Terminal Management**:
   - Check terminal size on startup (minimum 25x25)
   - Warn if terminal too small, but continue
   - Hide cursor during gameplay
   - Restore cursor on exit
   - Clear screen on exit

### Non-Functional Requirements

1. **Performance**:
   - Server broadcasts state every 250ms (4 updates/second)
   - Client renders updates smoothly without flickering
   - Movement input is responsive (no noticeable lag)

2. **Reliability**:
   - Server handles client disconnections gracefully (remove player, continue)
   - Client handles server disconnections (show error message, exit)
   - Server continues running even if all clients disconnect

3. **Usability**:
   - Clear visual distinction between players, walls, and empty spaces
   - Status bar provides useful information
   - Controls are intuitive (arrow keys, WASD)
   - Error messages are clear

## Data Model

### Server State Structure

```javascript
{
  board: {
    width: 20,
    height: 20,
    grid: string[][]  // 2D array: "#" for walls, "." for empty
  },
  players: [
    {
      playerId: string,      // UUID
      clientId: string,       // UUID
      x: number,              // 0-19
      y: number,              // 0-19
      playerName: string      // "Player {first8chars}"
    }
  ],
  score: number              // 0 for MVP
}
```

### Message Structure

**Client → Server**:
```javascript
// CONNECT
{
  type: "CONNECT",
  payload: {},
  timestamp: number
}

// MOVE
{
  type: "MOVE",
  payload: {
    dx: number,  // -1, 0, or 1
    dy: number   // -1, 0, or 1
  },
  timestamp: number
}
```

**Server → Client**:
```javascript
// CONNECT response
{
  type: "CONNECT",
  payload: {
    clientId: string,
    playerId: string,
    playerName: string,
    gameState: {
      board: { width, height, grid },
      players: [...],
      score: number
    }
  },
  timestamp: number
}

// STATE_UPDATE
{
  type: "STATE_UPDATE",
  payload: {
    board: { width, height, grid },
    players: [...],
    score: number
  },
  timestamp: number
}
```

## Implementation Details

### Server Implementation

**File Structure**:
- `src/server/index.js`: WebSocket server entry point
- `src/server/server.js`: Server class/instance
- `src/server/ConnectionManager.js`: Track connections and client IDs
- `src/server/GameServer.js`: Manage game state and players
- `src/network/MessageHandler.js`: Parse and create messages
- `src/network/MessageTypes.js`: Message type constants

**Key Components**:

1. **WebSocket Server** (`src/server/server.js`):
   - Use `ws` library
   - Listen on configurable port
   - Handle connection events
   - Generate client IDs (UUID v4)
   - Route messages to handlers

2. **Connection Manager** (`src/server/ConnectionManager.js`):
   - Track active connections (Map: clientId → connection)
   - Map clientId to playerId
   - Remove connections on disconnect

3. **Game Server** (`src/server/GameServer.js`):
   - Initialize board (20x20 with walls)
   - Manage players (add, remove, update position)
   - Validate and execute movement
   - Serialize state for broadcasting
   - Periodic broadcast timer (250ms)

4. **Message Handler** (`src/network/MessageHandler.js`):
   - Parse incoming JSON messages
   - Validate message structure
   - Create response messages
   - Handle parse errors

### Client Implementation

**File Structure**:
- `src/index.js`: Entry point (detect mode, start client)
- `src/modes/networkedMode.js`: Networked game mode handler
- `src/network/WebSocketClient.js`: WebSocket client wrapper
- `src/network/MessageHandler.js`: Parse and create messages
- `src/network/MessageTypes.js`: Message type constants
- `src/input/InputHandler.js`: Keyboard input handling
- `src/render/Renderer.js`: Terminal rendering
- `src/game/Game.js`: Game state wrapper (for compatibility)
- `src/game/Board.js`: Board representation

**Key Components**:

1. **Entry Point** (`src/index.js`):
   - Check server config (if websocket enabled, use networked mode)
   - Initialize networked mode
   - Handle process signals (SIGINT, SIGTERM)

2. **Networked Mode** (`src/modes/networkedMode.js`):
   - Initialize WebSocket client
   - Initialize renderer
   - Initialize input handler
   - Set up message handlers
   - Coordinate rendering on state updates
   - Handle disconnection

3. **WebSocket Client** (`src/network/WebSocketClient.js`):
   - Connect to server
   - Send CONNECT on connection
   - Handle incoming messages
   - Route messages to callbacks
   - Handle disconnection

4. **Input Handler** (`src/input/InputHandler.js`):
   - Set stdin to raw mode
   - Capture keypress events
   - Map keys to actions (movement, quit)
   - Send MOVE messages to server
   - Handle quit (disconnect, exit)

5. **Renderer** (`src/render/Renderer.js`):
   - Render title/header
   - Render game board (20x20)
   - Render players at positions
   - Render status bar
   - Use ANSI escape codes for positioning
   - Use chalk for colors
   - Hide/show cursor

### Game Logic

**Board Initialization**:
- Create 20x20 grid
- Set outer cells (row 0, row 19, col 0, col 19) to `#`
- Set inner cells to `.`

**Player Spawning**:
- New player starts at position (10, 10)
- Check if position is occupied (wall or player)
- If occupied, find nearest empty position (spiral search)

**Movement Validation**:
```javascript
function validateMove(player, dx, dy, board, players) {
  const newX = player.x + dx;
  const newY = player.y + dy;
  
  // Check bounds
  if (newX < 0 || newX >= 20 || newY < 0 || newY >= 20) {
    return false;
  }
  
  // Check wall
  if (board.grid[newY][newX] === '#') {
    return false;
  }
  
  // Check player collision
  const occupied = players.some(p => 
    p.playerId !== player.playerId && p.x === newX && p.y === newY
  );
  if (occupied) {
    return false;
  }
  
  return true;
}
```

## Testing Requirements

### Server Tests

1. **Connection Tests**:
   - Server starts and listens on port
   - Client can connect
   - Server generates client ID
   - Multiple clients can connect

2. **Player Management Tests**:
   - Player created on CONNECT
   - Player ID generated
   - Player added to game state
   - Player removed on disconnect

3. **Movement Tests**:
   - Valid movement updates position
   - Invalid movement (bounds) rejected
   - Invalid movement (wall) rejected
   - Invalid movement (player collision) rejected

4. **State Broadcasting Tests**:
   - STATE_UPDATE sent periodically
   - All connected clients receive updates
   - State includes board, players, score

### Client Tests

1. **Connection Tests**:
   - Client connects to server
   - CONNECT message sent
   - CONNECT response received
   - Game state initialized

2. **Input Tests**:
   - Arrow keys mapped to movement
   - WASD keys mapped to movement
   - Q/ESC triggers quit
   - MOVE messages sent on movement

3. **Rendering Tests**:
   - Board renders correctly
   - Players render at correct positions
   - Status bar displays correctly
   - Colors applied correctly

### Integration Tests

1. **Multi-Player Tests**:
   - Two clients connect
   - Both see each other
   - Movement updates visible to both
   - Disconnection handled correctly

## Success Criteria

1. **Server**:
   - ✅ Server starts and accepts connections
   - ✅ Multiple clients can connect simultaneously
   - ✅ Players can move around board
   - ✅ Movement validation works (bounds, walls, collisions)
   - ✅ State broadcasts every 250ms
   - ✅ Disconnections handled gracefully

2. **Client**:
   - ✅ Client connects to server
   - ✅ Game board displays correctly
   - ✅ Players visible at correct positions
   - ✅ Keyboard input works (arrow keys, WASD)
   - ✅ Movement updates visible
   - ✅ Quit works (Q/ESC)

3. **Multi-Player**:
   - ✅ Two or more clients can connect
   - ✅ All clients see all players
   - ✅ Movement updates visible to all clients
   - ✅ Players cannot occupy same cell

4. **Manual Testing**:
   - ✅ Can start server in one terminal
   - ✅ Can start multiple clients in separate terminals
   - ✅ Can move players and see updates in real-time
   - ✅ Can quit gracefully

## Related Features

- Future: Client-side prediction for responsive movement
- Future: Incremental rendering for performance
- Future: Reconnection handling with grace periods
- Future: Modal system for UI
- Future: Entity system (collectibles, obstacles)
- Future: Player names customization
- Future: Different player colors

## Migration Notes

This MVP serves as the foundation for the full architecture described in:
- `docs/development/specs/server-architecture_SPECS/README.md`
- `docs/development/specs/client-architecture_SPEC.md`

Future enhancements will build upon this MVP without breaking existing functionality.

# Gameplan: MVP Multiplayer Terminal Game

## Overview

This gameplan breaks down the MVP multiplayer terminal game implementation into logical phases. The implementation follows Test-Driven Development (TDD) - write tests first, then implement code to make tests pass.

**Approach**: Build in parallel (server and client) to enable manual testing as we go.

## Progress Summary

- ✅ **Phase 1: Shared Infrastructure** - COMPLETE
- ✅ **Phase 2: Server Core** - COMPLETE
- ⏳ **Phase 3: Client Core** - NOT STARTED
- ⏳ **Phase 4: Server Game Logic** - NOT STARTED
- ⏳ **Phase 5: Client Game Logic** - NOT STARTED
- ⏳ **Phase 6: Integration and Polish** - NOT STARTED

## Prerequisites

- ✅ Dependencies installed (ws, winston, ansi-escapes, chalk, cli-cursor)
- ✅ Vitest configured and working
- ✅ Project structure exists
- ✅ Feature card created
- ✅ SPECS document created

## Phase 1: Shared Infrastructure (~30 minutes)

**Goal**: Create shared code used by both server and client (message types, message handler, game logic).

### Step 1.1: Create Message Types

**Location**: `src/network/MessageTypes.js`

**Action**:
- Create constants for message types:
  - `CONNECT`
  - `MOVE`
  - `STATE_UPDATE`

**Test**: Create test file `src/network/__tests__/MessageTypes.test.js`
- Test that all message type constants are defined
- Test that constants are strings

**Verification**:
- [x] MessageTypes.js created
- [x] Test file created
- [x] Tests written
- [x] Tests pass

### Step 1.2: Create Message Handler

**Location**: `src/network/MessageHandler.js`

**Action**:
- Create `parseMessage(rawData)` function:
  - Parse JSON string
  - Validate structure (type, payload, timestamp)
  - Return parsed message or throw error
- Create `createMessage(type, payload, clientId?)` function:
  - Create message object with type, payload, timestamp, optional clientId
  - Return message object

**Test**: Create test file `src/network/__tests__/MessageHandler.test.js`
- Test parseMessage with valid JSON
- Test parseMessage with invalid JSON (throws error)
- Test parseMessage with missing fields (throws error)
- Test createMessage creates correct structure
- Test createMessage includes timestamp

**Verification**:
- [x] MessageHandler.js created
- [x] Test file created
- [x] Tests written
- [x] Tests pass

### Step 1.3: Create Board Class

**Location**: `src/game/Board.js`

**Action**:
- Create `Board` class:
  - Constructor: `new Board(width, height)`
  - `initialize()`: Create grid, set walls on perimeter, empty interior
  - `getCell(x, y)`: Return cell character at position
  - `isWall(x, y)`: Check if cell is wall
  - `serialize()`: Return 2D array of base characters

**Test**: Create test file `src/game/__tests__/Board.test.js`
- Test board initialization (20x20)
- Test walls on perimeter
- Test empty interior
- Test getCell returns correct character
- Test isWall returns true for walls, false for empty
- Test serialize returns 2D array

**Verification**:
- [x] Board.js created
- [x] Test file created
- [x] Tests written
- [x] Tests pass

### Step 1.4: Create Game Class

**Location**: `src/game/Game.js`

**Action**:
- Create `Game` class:
  - Constructor: `new Game(boardWidth, boardHeight)`
  - `board`: Board instance
  - `score`: number (default 0)
  - `running`: boolean (default true)

**Test**: Create test file `src/game/__tests__/Game.test.js`
- Test game initialization
- Test board is created
- Test score defaults to 0
- Test running defaults to true

**Verification**:
- [x] Game.js created
- [x] Test file created
- [x] Tests written
- [x] Tests pass

**Phase 1 Completion Checklist**:
- [x] All steps completed
- [x] All tests passing
- [x] Code committed

---

## Phase 2: Server Core (~45 minutes)

**Goal**: Create WebSocket server that accepts connections and manages client connections.

### Step 2.1: Create Connection Manager

**Location**: `src/server/ConnectionManager.js`

**Action**:
- Create `ConnectionManager` class:
  - `connections`: Map of clientId → connection object
  - `addConnection(clientId, ws)`: Add connection
  - `removeConnection(clientId)`: Remove connection
  - `getConnection(clientId)`: Get connection by ID
  - `getAllConnections()`: Get all connections
  - `setPlayerId(clientId, playerId)`: Map clientId to playerId
  - `getPlayerId(clientId)`: Get playerId for clientId

**Test**: Create test file `src/server/__tests__/ConnectionManager.test.js`
- Test addConnection
- Test removeConnection
- Test getConnection
- Test getAllConnections
- Test setPlayerId/getPlayerId

**Verification**:
- [x] ConnectionManager.js created
- [x] Test file created
- [x] Tests written
- [x] Tests pass

### Step 2.2: Create WebSocket Server

**Location**: `src/server/server.js`

**Action**:
- Create `Server` class:
  - Constructor: `new Server(port)`
  - `start()`: Start WebSocket server, listen on port
  - `stop()`: Stop server, close all connections
  - `onConnection(ws)`: Handle new connection
    - Generate clientId (UUID)
    - Add to ConnectionManager
    - Send CONNECT message with clientId
    - Set up message handler
    - Set up disconnect handler

**Test**: Create test file `src/server/__tests__/server.test.js`
- Test server starts and listens on port
- Test server accepts connections
- Test clientId generated on connection
- Test CONNECT message sent on connection
- Test server stops gracefully

**Note**: Use `ws` library's test utilities or mock WebSocket connections

**Verification**:
- [x] server.js created
- [x] Test file created
- [x] Tests written
- [x] Tests pass

### Step 2.3: Create Server Entry Point

**Location**: `src/server/index.js`

**Action**:
- Create `startServer(port)` function:
  - Create Server instance
  - Start server
  - Set up graceful shutdown (SIGINT, SIGTERM)
  - Log server start message

**Test**: Manual test - start server, verify it listens on port

**Verification**:
- [x] index.js created
- [x] Server can be started manually
- [x] Server listens on correct port

**Phase 2 Completion Checklist**:
- [x] All steps completed
- [x] All tests passing
- [x] Server can accept connections manually
- [x] Code committed

---

## Phase 3: Client Core (~45 minutes)

**Goal**: Create client that connects to server and handles basic rendering.

### Step 3.1: Create WebSocket Client

**Location**: `src/network/WebSocketClient.js`

**Action**:
- Create `WebSocketClient` class:
  - Constructor: `new WebSocketClient(url)`
  - `connect()`: Connect to server
  - `send(message)`: Send message to server
  - `on(event, callback)`: Register event handlers (connect, message, error, close)
  - `disconnect()`: Close connection
  - `isConnected()`: Check connection status

**Test**: Create test file `src/network/__tests__/WebSocketClient.test.js`
- Test connect establishes connection
- Test send sends message
- Test on registers handlers
- Test disconnect closes connection
- Test isConnected returns correct status

**Note**: Mock WebSocket or use test server

**Verification**:
- [ ] WebSocketClient.js created
- [ ] Test file created
- [ ] Tests written
- [ ] Tests pass

### Step 3.2: Create Basic Renderer

**Location**: `src/render/Renderer.js`

**Action**:
- Create `Renderer` class:
  - Constructor: `new Renderer()`
  - `clearScreen()`: Clear terminal
  - `renderTitle()`: Render game title
  - `renderBoard(board, players)`: Render board grid with players
  - `renderStatusBar(score, position)`: Render status bar
  - `hideCursor()`: Hide terminal cursor
  - `showCursor()`: Show terminal cursor
  - `getCellContent(x, y, board, players)`: Determine what to render at position

**Test**: Create test file `src/render/__tests__/Renderer.test.js`
- Test clearScreen
- Test renderTitle
- Test getCellContent returns correct character
- Test getCellContent prioritizes player over board

**Verification**:
- [ ] Renderer.js created
- [ ] Test file created
- [ ] Tests written
- [ ] Tests pass

### Step 3.3: Create Client Entry Point

**Location**: `src/index.js`

**Action**:
- Update entry point:
  - Check if server config exists (for now, default to networked mode)
  - Import and initialize networked mode
  - Handle process signals (SIGINT, SIGTERM)

**Test**: Manual test - start client, verify it connects

**Verification**:
- [ ] index.js updated
- [ ] Client can connect to server manually

**Phase 3 Completion Checklist**:
- [ ] All steps completed
- [ ] All tests passing
- [ ] Client can connect to server manually
- [ ] Code committed

---

## Phase 4: Server Game Logic (~60 minutes)

**Goal**: Implement game state management, player management, and movement on server.

### Step 4.1: Create Game Server

**Location**: `src/server/GameServer.js`

**Action**:
- Create `GameServer` class:
  - Constructor: `new GameServer(boardWidth, boardHeight)`
  - `game`: Game instance
  - `players`: Map of playerId → player object
  - `addPlayer(clientId, playerId, playerName)`: Add player to game
  - `removePlayer(playerId)`: Remove player from game
  - `getPlayer(playerId)`: Get player by ID
  - `getAllPlayers()`: Get all players
  - `spawnPlayer(playerId, playerName)`: Spawn player at initial position (10, 10)
  - `serializeState()`: Serialize game state for broadcasting

**Test**: Create test file `src/server/__tests__/GameServer.test.js`
- Test addPlayer adds player
- Test removePlayer removes player
- Test spawnPlayer sets initial position
- Test serializeState returns correct structure

**Verification**:
- [ ] GameServer.js created
- [ ] Test file created
- [ ] Tests written
- [ ] Tests pass

### Step 4.2: Implement Movement Validation

**Location**: `src/server/GameServer.js`

**Action**:
- Add `validateMove(playerId, dx, dy)` method:
  - Get player
  - Calculate new position
  - Check bounds (0-19)
  - Check walls
  - Check player collisions
  - Return true/false
- Add `movePlayer(playerId, dx, dy)` method:
  - Validate move
  - If valid, update player position
  - Return success/failure

**Test**: Update `src/server/__tests__/GameServer.test.js`
- Test validateMove with valid move
- Test validateMove with out of bounds
- Test validateMove with wall collision
- Test validateMove with player collision
- Test movePlayer updates position on valid move
- Test movePlayer rejects invalid move

**Verification**:
- [ ] Movement validation implemented
- [ ] Tests written
- [ ] Tests pass

### Step 4.3: Handle CONNECT Messages

**Location**: `src/server/server.js`

**Action**:
- Update message handler:
  - On CONNECT message:
    - Generate playerId (UUID)
    - Generate playerName ("Player {first8chars}")
    - Add player to GameServer
    - Spawn player at (10, 10)
    - Send CONNECT response with clientId, playerId, playerName, gameState

**Test**: Manual test - client connects, receives CONNECT response with gameState

**Verification**:
- [ ] CONNECT handler implemented
- [ ] Player created on CONNECT
- [ ] CONNECT response sent with gameState

### Step 4.4: Handle MOVE Messages

**Location**: `src/server/server.js`

**Action**:
- Update message handler:
  - On MOVE message:
    - Get playerId from connection
    - Validate dx, dy are numbers (-1, 0, or 1)
    - Call gameServer.movePlayer(playerId, dx, dy)
    - If successful, state will be broadcast in next update
    - If failed, do nothing (no error message for MVP)

**Test**: Manual test - client sends MOVE, player position updates

**Verification**:
- [ ] MOVE handler implemented
- [ ] Movement updates player position
- [ ] Invalid moves rejected

### Step 4.5: Implement State Broadcasting

**Location**: `src/server/server.js`

**Action**:
- Add periodic broadcast:
  - Set interval (250ms)
  - Serialize game state
  - Create STATE_UPDATE message
  - Broadcast to all connected clients
- Broadcast on player join/leave
- Broadcast on player movement (optional, or wait for periodic)

**Test**: Manual test - verify STATE_UPDATE sent every 250ms

**Verification**:
- [ ] Periodic broadcast implemented
- [ ] STATE_UPDATE sent every 250ms
- [ ] All clients receive updates

**Phase 4 Completion Checklist**:
- [ ] All steps completed
- [ ] All tests passing
- [ ] Server manages players correctly
- [ ] Movement works correctly
- [ ] State broadcasts correctly
- [ ] Code committed

---

## Phase 5: Client Game Logic (~60 minutes)

**Goal**: Implement input handling, state updates, and rendering on client.

### Step 5.1: Create Input Handler

**Location**: `src/input/InputHandler.js`

**Action**:
- Create `InputHandler` class:
  - Constructor: `new InputHandler()`
  - `start()`: Set stdin to raw mode, start listening
  - `stop()`: Restore stdin, stop listening
  - `onMove(callback)`: Register movement callback (dx, dy)
  - `onQuit(callback)`: Register quit callback
  - Map arrow keys to movement
  - Map WASD to movement
  - Map Q/ESC to quit

**Test**: Create test file `src/input/__tests__/InputHandler.test.js`
- Test arrow keys trigger movement callbacks
- Test WASD keys trigger movement callbacks
- Test Q/ESC triggers quit callback

**Note**: Mock stdin or use test utilities

**Verification**:
- [ ] InputHandler.js created
- [ ] Test file created
- [ ] Tests written
- [ ] Tests pass

### Step 5.2: Create Networked Mode

**Location**: `src/modes/networkedMode.js`

**Action**:
- Create `networkedMode()` function:
  - Create WebSocketClient
  - Create Renderer
  - Create InputHandler
  - Connect to server
  - On CONNECT response: store playerId, initial render
  - On STATE_UPDATE: update display
  - On movement input: send MOVE message
  - On quit: disconnect, exit

**Test**: Manual test - client connects, receives state, can send moves

**Verification**:
- [ ] networkedMode.js created
- [ ] Client connects and receives state
- [ ] Client can send movement commands

### Step 5.3: Implement State Updates

**Location**: `src/modes/networkedMode.js`

**Action**:
- Store current state from server
- On STATE_UPDATE:
  - Update current state
  - Re-render board with new state
  - Update status bar with position

**Test**: Manual test - verify display updates when state changes

**Verification**:
- [ ] State updates trigger re-render
- [ ] Display shows correct player positions

### Step 5.4: Implement Terminal Management

**Location**: `src/utils/terminal.js` and `src/modes/networkedMode.js`

**Action**:
- Create terminal utilities:
  - `checkTerminalSize(minWidth, minHeight)`: Check terminal size, warn if too small
  - `getTerminalSize()`: Get terminal dimensions
- In networkedMode:
  - Check terminal size on startup
  - Hide cursor on start
  - Show cursor on exit
  - Clear screen on exit

**Test**: Manual test - verify terminal size check, cursor management

**Verification**:
- [ ] Terminal size checked
- [ ] Cursor hidden during gameplay
- [ ] Cursor restored on exit
- [ ] Screen cleared on exit

**Phase 5 Completion Checklist**:
- [ ] All steps completed
- [ ] All tests passing
- [ ] Client handles input correctly
- [ ] Client updates display correctly
- [ ] Terminal management works
- [ ] Code committed

---

## Phase 6: Integration and Polish (~30 minutes)

**Goal**: Test multi-player functionality, handle edge cases, polish user experience.

### Step 6.1: Multi-Player Testing

**Action**:
- Start server
- Start two clients in separate terminals
- Verify both clients see each other
- Verify movement updates visible to both
- Verify players cannot occupy same cell

**Verification**:
- [ ] Two clients can connect simultaneously
- [ ] Both clients see all players
- [ ] Movement updates visible to all
- [ ] Player collision prevention works

### Step 6.2: Error Handling

**Action**:
- Server: Handle client disconnection gracefully
- Client: Handle server disconnection (show error, exit)
- Client: Handle connection errors (show error, exit)
- Server: Handle invalid messages gracefully

**Verification**:
- [ ] Server handles disconnections
- [ ] Client handles server disconnection
- [ ] Error messages are clear

### Step 6.3: Polish

**Action**:
- Add startup messages
- Improve status bar display
- Add connection status to status bar
- Verify colors work correctly
- Verify rendering is smooth

**Verification**:
- [ ] Startup messages clear
- [ ] Status bar informative
- [ ] Colors applied correctly
- [ ] Rendering smooth

### Step 6.4: Final Testing

**Action**:
- Run all unit tests
- Run integration tests
- Manual testing with 2+ clients
- Test edge cases (rapid movement, disconnection, etc.)

**Verification**:
- [ ] All tests pass
- [ ] Manual testing successful
- [ ] Edge cases handled

**Phase 6 Completion Checklist**:
- [ ] All steps completed
- [ ] Multi-player works correctly
- [ ] Error handling works
- [ ] Polish complete
- [ ] All tests pass
- [ ] Code committed

---

## Completion Checklist

- [ ] All phases completed
- [ ] All tests passing
- [ ] Server starts and accepts connections
- [ ] Client connects and displays game
- [ ] Multiple clients can connect
- [ ] Players can move around board
- [ ] Movement updates visible to all clients
- [ ] Player collision prevention works
- [ ] Error handling works
- [ ] Code committed
- [ ] Feature card updated to COMPLETE
- [ ] Feature card renamed with "X_" prefix
- [ ] Gameplan directory renamed with "X_" prefix

## Notes

- Follow TDD: Write tests first, then implement
- Commit after each phase step
- Test manually as we go (server + client)
- Keep code simple for MVP
- Future enhancements will build on this foundation

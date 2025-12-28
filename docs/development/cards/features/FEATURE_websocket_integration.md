# Feature: WebSocket Integration for Multiplayer Support

## Context

The application is currently a single-player terminal-based game where:

- Players move a character around a board using keyboard input
- Game state is managed locally in the `Game` class
- Rendering happens directly to the terminal via `Renderer`
- Input is handled locally via `InputHandler`
- All game logic runs in a single Node.js process

**Current Architecture**:

- `src/game/Game.js` - Manages game state (player position, board, score)
- `src/game/Board.js` - Represents the game board/grid
- `src/render/Renderer.js` - Handles terminal rendering
- `src/input/InputHandler.js` - Handles keyboard input
- `src/index.js` - Main entry point, orchestrates game loop

**Location**: Implementation will be in:

- `src/server/` - New directory for server-side code
- `src/client/` - New directory for client-side code (optional, for future web client)
- `src/network/` - New directory for WebSocket communication layer
- `package.json` - Add WebSocket dependencies

## Problem

**Current State**:

- Game is single-player only
- All game state is local to one process
- No way to share game state between multiple players
- No network communication layer
- Cannot support multiplayer gameplay

**Desired State**:

- WebSocket server that can handle multiple client connections
- Ability to sync game state between server and clients
- Foundation for multiplayer support (multiple players in same game)
- Separation of concerns: server manages authoritative game state, clients handle input/rendering
- Real-time bidirectional communication between server and clients

## Desired Feature

Integrate WebSocket support into the application to enable real-time communication between server and clients, preparing for multiplayer functionality:

1. **WebSocket Server**
   - Create a WebSocket server that can accept multiple client connections
   - Handle client connection/disconnection events
   - Manage client sessions and identify connected players
   - Broadcast game state updates to all connected clients

2. **Game State Synchronization**
   - Server maintains authoritative game state
   - Clients send input/actions to server
   - Server processes actions and updates game state
   - Server broadcasts state changes to all clients
   - Clients receive and apply state updates

3. **Message Protocol**
   - Define message format for client-server communication
   - Handle different message types (connect, disconnect, move, state update, etc.)
   - Implement message validation and error handling
   - Support for future message types (chat, game events, etc.)

4. **Architecture Separation**
   - Server-side game logic (authoritative state)
   - Client-side rendering and input handling
   - Network layer for WebSocket communication
   - Clear separation between local and networked game modes

## Requirements

### Functional Requirements

1. **WebSocket Server**
   - Start WebSocket server on configurable port
   - Accept multiple simultaneous client connections
   - Track connected clients (client IDs, connection status)
   - Handle client connection events
   - Handle client disconnection events (cleanup, notify other clients)
   - Graceful server shutdown

2. **Client Connection Management**
   - Assign unique client IDs to each connection
   - Maintain list of active connections
   - Handle connection errors and timeouts
   - Support reconnection logic (future enhancement)

3. **Message Handling**
   - Parse incoming WebSocket messages
   - Validate message format and content
   - Route messages to appropriate handlers
   - Send responses/acknowledgments
   - Handle malformed or invalid messages gracefully

4. **Game State Synchronization**
   - Server maintains single authoritative game state
   - Clients send player actions (movement, etc.) to server
   - Server validates and applies actions to game state
   - Server broadcasts updated game state to all clients
   - Clients receive and render updated state

5. **Message Types**
   - `CONNECT` - Client connects, receives initial game state
   - `DISCONNECT` - Client disconnects, cleanup
   - `MOVE` - Client sends movement action
   - `STATE_UPDATE` - Server broadcasts game state changes
   - `ERROR` - Error messages for invalid actions
   - `PING/PONG` - Keep-alive for connection health

### Technical Requirements

1. **WebSocket Library**
   - Use `ws` package (popular Node.js WebSocket library)
   - Support WebSocket protocol (RFC 6455)
   - Handle WebSocket upgrade requests
   - Support both server and client connections

2. **Message Format**
   - JSON-based message format for easy parsing
   - Structured message schema:
     ```json
     {
       "type": "MOVE",
       "payload": {
         "playerId": "client-123",
         "dx": 1,
         "dy": 0
       },
       "timestamp": 1234567890
     }
     ```

3. **Server Architecture**
   - Separate server entry point (`src/server/index.js`)
   - Server-side game instance management
   - Connection manager for tracking clients
   - Message router/handler system

4. **Error Handling**
   - Handle WebSocket connection errors
   - Handle message parsing errors
   - Handle game state errors
   - Log errors appropriately
   - Graceful degradation

5. **Configuration**
   - Configurable WebSocket server port
   - Configurable server host/address
   - Enable/disable WebSocket mode
   - Configuration in `src/config/gameConfig.js` or separate server config

6. **Testing**
   - Unit tests for message parsing
   - Unit tests for connection management
   - Integration tests for WebSocket communication
   - Test multiple client connections
   - Test message handling

## Implementation Approach

### Option 1: Server-Client Architecture (Recommended)

Create a dedicated WebSocket server that manages game state, with clients connecting to it:

**Server Side**:

- `src/server/index.js` - WebSocket server entry point
- `src/server/GameServer.js` - Server-side game state management
- `src/server/ConnectionManager.js` - Manages client connections
- `src/network/MessageHandler.js` - Handles message parsing and routing
- `src/network/MessageTypes.js` - Defines message type constants

**Client Side** (Terminal Client):

- Modify `src/index.js` to support WebSocket client mode
- `src/network/WebSocketClient.js` - WebSocket client wrapper
- Send input actions to server
- Receive and apply state updates from server

**Pros**:

- Clear separation of server and client
- Server maintains authoritative state
- Supports multiple clients easily
- Foundation for true multiplayer
- Can add web client later

**Cons**:

- More complex architecture
- Requires network communication
- Need to handle latency and synchronization

### Option 2: Peer-to-Peer Architecture

Direct WebSocket connections between clients (not recommended for this use case).

**Pros**:

- No central server needed
- Lower latency for direct connections

**Cons**:

- Complex state synchronization
- No authoritative game state
- Difficult to prevent cheating
- Not suitable for multiplayer games

### Option 3: Hybrid Mode

Support both local (single-player) and networked (multiplayer) modes.

**Pros**:

- Backward compatible with existing single-player mode
- Can test locally without server
- Flexible deployment options

**Cons**:

- More code to maintain
- Need to handle mode switching

**Recommendation**: Option 1 (Server-Client Architecture) with Option 3 (Hybrid Mode) - Start with server-client, but maintain ability to run in local mode.

## Technical Details

### WebSocket Library: `ws`

Install `ws` package:

```bash
npm install ws
```

**Server Example**:

```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', data => {
    const message = JSON.parse(data);
    // Handle message
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

### Message Protocol

**Message Structure**:

```typescript
interface Message {
  type: string; // Message type (MOVE, STATE_UPDATE, etc.)
  payload: any; // Message-specific data
  timestamp?: number; // Optional timestamp
  clientId?: string; // Optional client identifier
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

### Server Game State

Server maintains authoritative game state:

- Board state
- All player positions
- Game score
- Game running state

Clients send actions, server validates and applies them, then broadcasts updates.

### Connection Lifecycle

1. **Client Connects**
   - Server assigns client ID
   - Server sends initial game state
   - Client receives and renders state

2. **Client Sends Action**
   - Client sends MOVE message
   - Server validates action
   - Server updates game state
   - Server broadcasts STATE_UPDATE to all clients

3. **Client Disconnects**
   - Server removes client from active connections
   - Server broadcasts player removal to other clients
   - Cleanup client resources

### Configuration

Add to `src/config/gameConfig.js` or create `src/config/serverConfig.js`:

```javascript
export const serverConfig = {
  websocket: {
    enabled: false, // Enable/disable WebSocket mode
    port: 8080, // WebSocket server port
    host: 'localhost', // Server host
  },
  // ... other config
};
```

### File Structure

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
  game/
    Game.js              # (existing) Game state management
  # ... existing files
```

## Testing Strategy

1. **Unit Tests**
   - Message parsing and validation
   - Connection management
   - Game state synchronization logic

2. **Integration Tests**
   - WebSocket server startup/shutdown
   - Client connection/disconnection
   - Message sending and receiving
   - Multiple client connections

3. **Manual Testing**
   - Connect multiple terminal clients
   - Verify state synchronization
   - Test error handling
   - Test reconnection (future)

## Future Enhancements (Post-Implementation)

- Multiple players in same game session
- Player identification and names
- Chat functionality
- Game rooms/lobbies
- Spectator mode
- Reconnection handling
- Latency compensation
- Web client (browser-based)
- Authentication and authorization

## Dependencies

- `ws` - WebSocket library for Node.js
- (Optional) `@types/ws` - TypeScript types for ws (if using TypeScript)

## References

- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws package documentation](https://github.com/websockets/ws)
- [WebSocket Protocol (RFC 6455)](https://tools.ietf.org/html/rfc6455)

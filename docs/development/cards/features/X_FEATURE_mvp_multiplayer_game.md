# Feature Card: MVP Multiplayer Terminal Game

## Context

**Current State**: 
- Project structure exists with empty files
- Basic dependencies installed (ansi-escapes, chalk, cli-cursor, ws, winston)
- Vitest test framework configured
- Architecture specs exist as reference documentation

**Location**: 
- Server: `src/server/`
- Client: `src/modes/`, `src/network/`, `src/render/`, `src/input/`
- Game Logic: `src/game/`

## Problem

We need a working MVP multiplayer terminal game where:
- A WebSocket server runs in one terminal
- One or more clients can connect from separate terminals
- Players can move around a game board
- Players can see each other's positions in real-time

This MVP will serve as the foundation for future enhancements (client-side prediction, incremental rendering, modals, etc.).

## Desired Feature

A minimal multiplayer terminal game with:

1. **WebSocket Server**:
   - Accepts client connections
   - Manages game state (board, players, positions)
   - Broadcasts state updates to all connected clients
   - Handles player movement commands

2. **Client Application**:
   - Connects to WebSocket server
   - Displays game board with players
   - Accepts keyboard input for movement (arrow keys, WASD)
   - Updates display when server sends state updates

3. **Game Board**:
   - Fixed 20x20 grid
   - Outer walls (`#`) forming perimeter
   - Empty interior spaces (`.`)
   - Player character (`@`)

4. **Player Movement**:
   - Arrow keys or WASD for movement
   - Server validates and updates positions
   - All clients see updated positions

## Requirements

### Functional Requirements

1. **Server**:
   - Start WebSocket server on configurable port (default: 3000)
   - Generate unique client IDs for each connection
   - Generate unique player IDs when clients join
   - Maintain authoritative game state (board, players)
   - Accept MOVE messages from clients
   - Validate movement (bounds, walls)
   - Broadcast STATE_UPDATE messages to all clients periodically (250ms)
   - Handle client disconnections gracefully

2. **Client**:
   - Connect to WebSocket server
   - Send CONNECT message on connection
   - Receive and display game state
   - Accept keyboard input (arrow keys, WASD, Q to quit)
   - Send MOVE messages to server
   - Update display when receiving STATE_UPDATE
   - Handle disconnection gracefully

3. **Game State**:
   - Board: 20x20 grid with walls on perimeter
   - Players: Array of player objects (playerId, x, y, playerName)
   - Initial player position: center (10, 10)
   - Score: 0 (placeholder)

4. **Movement**:
   - dx, dy values: -1, 0, or 1
   - Validate bounds (within 0-19)
   - Validate walls (cannot move into wall cells)
   - Update player position on valid move
   - Reject invalid moves

### Non-Functional Requirements

1. **Performance**:
   - Server broadcasts state every 250ms
   - Client renders updates smoothly

2. **Reliability**:
   - Server handles client disconnections
   - Client handles server disconnections (show error, exit)

3. **Usability**:
   - Clear visual display of board and players
   - Responsive controls
   - Status bar showing position

## Open Questions

1. **Player Names**: Should players be able to set names, or use default "Player {playerId}"?
   - **Answer**: Use default "Player {playerId}" for MVP

2. **Multiple Players on Same Cell**: Should multiple players be able to occupy the same cell?
   - **Answer**: No, prevent movement if another player is at target position

3. **Player Collision**: What happens when a player tries to move into another player?
   - **Answer**: Movement is rejected, player stays in current position

4. **Terminal Size**: Should we check terminal size before starting?
   - **Answer**: Yes, warn if terminal is too small (minimum 25x25 for board + UI)

5. **Error Messages**: How should errors be displayed to the user?
   - **Answer**: Display error message in status bar or console, then continue

## Related Features

- Future: Client-side prediction
- Future: Incremental rendering
- Future: Reconnection handling
- Future: Modal system
- Future: Entity system

## Dependencies

- None (this is the initial MVP)

## Status

- **Status**: ✅ COMPLETE
- **Priority**: HIGH
- **Created**: 2025-01-XX
- **Completed**: 2026-01-08

## Documentation

- **SPECS**: `docs/development/specs/mvp-multiplayer-game/mvp-multiplayer-game_SPECS.md` ✅ Created
- **GAMEPLAN**: `docs/development/gameplans/mvp-multiplayer-game/mvp-multiplayer-game_GAMEPLAN.md` ✅ Created

## Status

- **Status**: ✅ COMPLETE

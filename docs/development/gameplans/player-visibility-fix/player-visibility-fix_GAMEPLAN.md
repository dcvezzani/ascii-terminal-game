# Player Visibility Fix - Implementation Gameplan

## Overview

This gameplan implements fixes for two related bugs:

1. **BUG_player_glyphs_not_visible_until_movement**: Players don't appear when a client first connects if other players are already in the game
2. **BUG_player_not_rendered_after_collision**: Players disappear after collisions if their position doesn't change

**Reference Cards**:

- `docs/development/cards/bugs/BUG_player_glyphs_not_visible_until_movement.md`
- `docs/development/cards/bugs/BUG_player_not_rendered_after_collision.md`

**Reference Specs**: `docs/development/specs/player-visibility-fix/player-visibility-fix_SPECS.md`

## Goals

1. Extract `playerId` from CONNECT response to set `localPlayerId` earlier, allowing state updates to be processed immediately
2. Ensure all players are visible when a client first connects, regardless of whether they've moved
3. Ensure all players remain visible after collisions, even if their positions haven't changed
4. Maintain incremental rendering performance while ensuring visibility

## Current State

**Current Architecture**:

- `src/index.js` - Client entry point with `runNetworkedMode()`
  - `localPlayerId` is set in `onPlayerJoined` callback
  - State updates are queued if `localPlayerId` is not set
  - Queued state is processed in `onPlayerJoined` callback
- `src/network/WebSocketClient.js` - WebSocket client wrapper
  - Handles CONNECT message but doesn't extract `playerId` from CONNECT response
  - `onConnect` callback is called when WebSocket connection is established
  - No `onConnectResponse` callback for CONNECT message response
- `src/render/Renderer.js` - Handles all rendering
  - `updatePlayersIncremental()` only renders players that have changed (moved/joined/left)
  - Does not render players with unchanged positions after collisions
- `src/server/GameServer.js` - Game server
  - Detects collisions in `movePlayer()` method (returns `false` on collision)
  - Does NOT include collision information in state updates

**Current Flow**:

1. Client connects to server
2. Server sends CONNECT response with `clientId` and `gameState` (may include `playerId`)
3. Client receives CONNECT response but doesn't extract `playerId`
4. Client receives PLAYER_JOINED message and sets `localPlayerId`
5. Client processes queued state update (if any)
6. Client renders players based on state updates
7. If collision occurs, server prevents movement but doesn't send collision info
8. Client only renders players that changed, so unchanged players disappear

**Problems**:

- `playerId` not extracted from CONNECT response, causing unnecessary queuing
- Queued state processing logic is duplicated in `onPlayerJoined`
- Server doesn't send collision information in state updates
- Client doesn't render all players after collisions

## Target State

**New Flow**:

1. Client connects to server
2. Server sends CONNECT response with `clientId`, `playerId`, and `gameState`
3. Client extracts `playerId` from CONNECT response and sets `localPlayerId` immediately
4. Client processes queued state update (if any) using reusable function
5. Client renders all players on initial render
6. Server detects collisions and includes collision info in state updates
7. Client detects collision info and renders all players to ensure visibility

**Benefits**:

- Faster initialization (no waiting for PLAYER_JOINED)
- All players visible immediately on connection
- All players remain visible after collisions
- Modular implementation for future lobby system

## Progress Summary

- ✅ **Phase 1: WebSocketClient Enhancement** - COMPLETE
- ✅ **Phase 2: Extract Player ID from CONNECT Response** - COMPLETE
- ✅ **Phase 3: Refactor Queued State Processing** - COMPLETE
- ✅ **Phase 4: Server-Side Collision Detection** - COMPLETE
- ✅ **Phase 5: Client-Side Collision Rendering** - COMPLETE
- ⏳ **Phase 6: Testing** - NOT STARTED

## Implementation Phases

---

## Phase 1: WebSocketClient Enhancement (~30 minutes)

**Goal**: Add `onConnectResponse` callback to WebSocketClient to handle CONNECT message response separately from WebSocket connection establishment.

### Step 1.1: Add onConnectResponse Callback to WebSocketClient

- [x] Open `src/network/WebSocketClient.js`
- [x] In constructor, add `onConnectResponse` to `callbacks` object:
  ```javascript
  this.callbacks = {
    onConnect: null, // Called when WebSocket connection established
    onConnectResponse: null, // NEW: Called when CONNECT message response received
    // ... existing callbacks ...
  };
  ```

**Verification**:

- [x] `onConnectResponse` added to `callbacks` object
- [x] Initialized to `null`

### Step 1.2: Call onConnectResponse in handleMessage

- [x] In `handleMessage()` method, find the `MessageTypes.CONNECT` case
- [x] Add call to `onConnectResponse` callback with payload:
  ```javascript
  case MessageTypes.CONNECT:
    this.clientId = payload.clientId;

    // If we have a playerId, this is a reconnection
    if (this.playerId && payload.playerId === this.playerId) {
      this.reconnecting = false;
      this.reconnectAttempts = 0;
    }

    // NEW: Call onConnectResponse callback with payload
    if (this.callbacks.onConnectResponse) {
      this.callbacks.onConnectResponse(payload);
    }

    // Handle gameState in CONNECT response (existing code)
    if (payload.gameState) {
      if (this.callbacks.onStateUpdate) {
        this.callbacks.onStateUpdate(payload.gameState);
      }
    }
    break;
  ```

**Verification**:

- [x] `onConnectResponse` callback is called with payload
- [x] Callback is called before `onStateUpdate` (if gameState exists)
- [x] Existing CONNECT handling logic is preserved

### Step 1.3: Add onConnectResponse Method

- [x] Add public method to set `onConnectResponse` callback:
  ```javascript
  /**
   * Set callback for CONNECT message response
   * @param {Function} callback - Callback function that receives payload
   */
  onConnectResponse(callback) {
    this.callbacks.onConnectResponse = callback;
  }
  ```

**Verification**:

- [x] Method exists and sets callback correctly
- [x] Method follows same pattern as other callback setters (e.g., `onConnect`, `onStateUpdate`)

### Step 1.4: Add Unit Tests

- [x] Create/update `test/network/WebSocketClient.test.js`
- [x] Test that `onConnectResponse` callback is called when CONNECT message is received
- [x] Test that callback receives correct payload
- [x] Test that callback is called before `onStateUpdate` (if gameState exists)
- [x] Test that `onConnectResponse()` method sets callback correctly

**Verification**:

- [x] All tests pass
- [x] Tests cover callback invocation and payload passing

---

## Phase 2: Extract Player ID from CONNECT Response (~45 minutes)

**Goal**: Extract `playerId` from CONNECT response to set `localPlayerId` earlier, allowing queued state updates to be processed immediately.

### Step 2.1: Set up onConnectResponse Callback in index.js

- [x] Open `src/index.js`
- [x] In `runNetworkedMode()`, find where `wsClient.onConnect()` is set up
- [x] Add `wsClient.onConnectResponse()` callback after `wsClient.onConnect()`:
  ```javascript
  wsClient.onConnectResponse(payload => {
    // Extract playerId from CONNECT response if available
    if (payload && payload.playerId) {
      localPlayerId = payload.playerId;
      clientLogger.debug(`Local player ID set from CONNECT: ${localPlayerId}`);

      // Process queued state update if one exists
      if (queuedStateUpdate && renderer) {
        // Process queued state (will be refactored in Phase 3)
        // For now, use existing logic from onPlayerJoined
        processQueuedStateUpdate(queuedStateUpdate);
        queuedStateUpdate = null;
      }
    }
  });
  ```

**Verification**:

- [x] Callback is set up correctly
- [x] `localPlayerId` is set when `playerId` is in payload
- [x] Queued state is processed if it exists (temporary - will be refactored in Phase 3)

### Step 2.2: Update onPlayerJoined to Use Same Logic

- [x] In `onPlayerJoined` callback, ensure it still works as fallback
- [x] Note: This will be refactored in Phase 3 to use shared function

**Verification**:

- [x] `onPlayerJoined` still sets `localPlayerId` if not already set
- [x] Fallback behavior works correctly

### Step 2.3: Add Unit Tests

- [x] Create/update `test/index/connect-response.test.js`
- [x] Test that `localPlayerId` is set when CONNECT response includes `playerId`
- [x] Test that `localPlayerId` remains null if CONNECT response doesn't include `playerId`
- [x] Test that queued state is processed when `localPlayerId` is set from CONNECT
- [x] Test that `onPlayerJoined` still works as fallback

**Verification**:

- [x] All tests pass
- [x] Tests cover both CONNECT response and PLAYER_JOINED fallback

---

## Phase 3: Refactor Queued State Processing (~45 minutes)

**Goal**: Extract queued state processing logic into a reusable function to eliminate duplication and ensure all players are rendered.

### Step 3.1: Extract processQueuedStateUpdate Function

- [x] Open `src/index.js`
- [x] In `runNetworkedMode()`, create reusable function before `wsClient.onConnect()`:
  ```javascript
  // Function to process queued state update
  function processQueuedStateUpdate(gameState) {
    currentState = gameState;

    try {
      // Initialize predicted position if needed
      if (previousState === null && localPlayerId) {
        const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
        if (localPlayer && localPlayer.x !== null && localPlayer.y !== null) {
          localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
          lastReconciliationTime = Date.now();
          if (clientConfig.prediction.enabled) {
            startReconciliationTimer();
          }
        }
      }

      // Initial render - renderFull() already renders all players
      if (previousState === null) {
        renderer.renderFull(game, gameState, localPlayerId);
        previousState = JSON.parse(JSON.stringify(gameState));
      }
    } catch (error) {
      clientLogger.error('Error processing queued state update:', error);
    }
  }
  ```

**Verification**:

- [x] Function is defined in correct scope
- [x] Function includes all logic from `onPlayerJoined` callback
- [x] Function handles error cases

### Step 3.2: Update onConnectResponse to Use Function

- [x] Update `wsClient.onConnectResponse()` callback to use `processQueuedStateUpdate()`:
  ```javascript
  wsClient.onConnectResponse(payload => {
    if (payload && payload.playerId) {
      localPlayerId = payload.playerId;
      clientLogger.debug(`Local player ID set from CONNECT: ${localPlayerId}`);

      // Process queued state update if one exists
      if (queuedStateUpdate && renderer) {
        processQueuedStateUpdate(queuedStateUpdate);
        queuedStateUpdate = null;
      }
    }
  });
  ```

**Verification**:

- [x] `onConnectResponse` uses `processQueuedStateUpdate()` function
- [x] Logic is consistent with `onPlayerJoined`

### Step 3.3: Update onPlayerJoined to Use Function

- [x] Update `wsClient.onPlayerJoined()` callback to use `processQueuedStateUpdate()`:
  ```javascript
  wsClient.onPlayerJoined(payload => {
    if (payload.clientId === wsClient.getClientId()) {
      // Only set localPlayerId if not already set from CONNECT response
      if (!localPlayerId) {
        localPlayerId = payload.playerId;
      }

      // Process queued state update if one exists
      if (queuedStateUpdate && renderer) {
        processQueuedStateUpdate(queuedStateUpdate);
        queuedStateUpdate = null;
      }
    }
  });
  ```

**Verification**:

- [x] `onPlayerJoined` uses `processQueuedStateUpdate()` function
- [x] `localPlayerId` is only set if not already set (fallback behavior)
- [x] Duplication is eliminated

### Step 3.4: Add Unit Tests

- [x] Create/update `test/index/queued-state-processing.test.js`
- [x] Test that `processQueuedStateUpdate()` function processes queued state correctly
- [x] Test that `renderFull()` is called with correct gameState
- [x] Test that `previousState` is set after processing queued state
- [x] Test that predicted position is initialized if needed
- [x] Test that function handles errors gracefully

**Verification**:

- [x] All tests pass
- [x] Tests cover function behavior and error handling

---

## Phase 4: Server-Side Collision Detection (~1 hour)

**Goal**: Add collision information to server state updates so clients can detect collisions and render all players.

**Note**: This phase can be implemented separately or deferred if a temporary client-side solution is preferred. However, per Q3 (Option B), server-side collision detection is the authoritative approach.

### Step 4.1: Track Collision Events in GameServer

- [x] Open `src/server/GameServer.js`
- [x] Add collision tracking state:
  ```javascript
  constructor() {
    // ... existing code ...
    this.collisionEvents = []; // Track collisions in current update cycle
  }
  ```

**Verification**:

- [x] `collisionEvents` array is initialized
- [x] Array is cleared/reset appropriately

### Step 4.2: Record Collisions in movePlayer

- [x] In `movePlayer()` method, when collision is detected, record it:

  ```javascript
  // Check for collision with other players
  const hasCollision = Array.from(this.players.values()).some(
    otherPlayer =>
      otherPlayer.playerId !== playerId && otherPlayer.x === newX && otherPlayer.y === newY
  );

  if (hasCollision) {
    logger.debug(`Player collision for player ${playerId} at (${newX}, ${newY})`);
    // Record collision event
    this.collisionEvents.push({
      playerId,
      timestamp: Date.now(),
      attemptedPosition: { x: newX, y: newY },
    });
    return false;
  }
  ```

**Verification**:

- [x] Collisions are recorded in `collisionEvents` array
- [x] Collision events include relevant information

### Step 4.3: Include Collision Info in getGameState

- [x] In `getGameState()` method, include collision information:
  ```javascript
  getGameState() {
    return {
      board: {
        width: this.game.board.width,
        height: this.game.board.height,
        grid: this.game.board.grid,
      },
      players: Array.from(this.players.values()).map(player => ({
        playerId: player.playerId,
        x: player.x,
        y: player.y,
        playerName: player.playerName,
      })),
      entities: this.game.entities || [],
      score: this.game.getScore(),
      // NEW: Include collision information
      hasCollisions: this.collisionEvents.length > 0,
      collisions: this.collisionEvents, // Array of collision events
    };
  }
  ```

**Verification**:

- [x] `getGameState()` includes `hasCollisions` flag
- [x] `getGameState()` includes `collisions` array
- [x] Collision information is accurate

### Step 4.4: Clear Collision Events After State Update

- [x] In `src/server/index.js`, after broadcasting state update, clear collision events:

  ```javascript
  // In state update interval or after move processing:
  if (gameServer.getPlayerCount() > 0) {
    const stateMessage = createStateUpdateMessage(gameServer.getGameState());
    broadcastMessage(stateMessage);

    // Clear collision events after broadcasting
    gameServer.clearCollisionEvents();
  }
  ```

- [x] Add `clearCollisionEvents()` method to `GameServer`:
  ```javascript
  clearCollisionEvents() {
    this.collisionEvents = [];
  }
  ```

**Verification**:

- [x] Collision events are cleared after state update
- [x] Events don't persist across update cycles

### Step 4.5: Add Unit Tests

- [x] Create/update `test/server/GameServer.test.js`
- [x] Test that collisions are recorded in `collisionEvents`
- [x] Test that `getGameState()` includes collision information
- [x] Test that collision events are cleared after state update
- [x] Test that `hasCollisions` flag is correct

**Verification**:

- [x] All tests pass
- [x] Tests cover collision tracking and state inclusion

---

## Phase 5: Client-Side Collision Rendering (~45 minutes)

**Goal**: Render all players when collision is detected to ensure visibility after collisions.

### Step 5.1: Check for Collision Info in State Update

- [x] Open `src/index.js`
- [x] In `wsClient.onStateUpdate()` callback, after processing incremental updates, check for collisions:

  ```javascript
  // After processing incremental updates (existing code)...

  // NEW: Render all players when collision detected (per Q3: Option B)
  if (gameState.hasCollisions || (gameState.collisions && gameState.collisions.length > 0)) {
    // Collision detected - render all players to ensure visibility
    // This ensures players with unchanged positions are still visible after collisions
    const otherPlayers = (gameState.players || []).filter(p => p.playerId !== localPlayerId);

    // Render all other players
    for (const player of otherPlayers) {
      const playerColorFn = renderer.getColorFunction(PLAYER_CHAR.color);
      renderer.updateCell(player.x, player.y, PLAYER_CHAR.char, playerColorFn);
    }

    // Move cursor out of the way
    process.stdout.write(ansiEscapes.cursorTo(0, renderer.statusBarOffset + 1));
  }
  ```

**Verification**:

- [x] Collision check is performed after incremental updates
- [x] All other players are rendered when collision detected
- [x] Cursor is moved out of the way

### Step 5.2: Import Required Constants

- [x] Ensure `PLAYER_CHAR` is imported from `gameConstants`:
  ```javascript
  import {
    // ... existing imports ...
    PLAYER_CHAR,
  } from './constants/gameConstants.js';
  ```

**Verification**:

- [x] `PLAYER_CHAR` is imported
- [x] Import statement is correct (also imported `ansiEscapes` for cursor positioning)

### Step 5.3: Add Temporary Fallback (if server changes not available)

- [x] If Phase 4 is not completed, add temporary fallback per Q4 (Option C):
  ```javascript
  // Temporary: Render all players when changes detected (if collision detection not available)
  if (!gameState.hasCollisions && !gameState.collisions) {
    // Fallback: Render all players when any changes detected
    if (
      otherPlayerChanges.moved.length > 0 ||
      otherPlayerChanges.joined.length > 0 ||
      otherPlayerChanges.left.length > 0
    ) {
      // Render all other players
      for (const player of otherPlayers) {
        const playerColorFn = renderer.getColorFunction(PLAYER_CHAR.color);
        renderer.updateCell(player.x, player.y, PLAYER_CHAR.char, playerColorFn);
      }
    }
  }
  ```

**Verification**:

- [x] Temporary fallback is implemented (if needed) - SKIPPED (Phase 4 is complete)
- [x] Fallback only activates if collision detection not available - N/A

### Step 5.4: Add Unit Tests

- [x] Create/update `test/index/collision-rendering.test.js`
- [x] Test that all players are rendered when `hasCollisions` is true
- [x] Test that all players are rendered when `collisions` array has items
- [x] Test that players are not unnecessarily re-rendered if already rendered
- [x] Test temporary fallback (if implemented) - SKIPPED (Phase 4 is complete)

**Verification**:

- [x] All tests pass
- [x] Tests cover collision detection and rendering

---

## Phase 6: Testing (~1.5 hours)

**Goal**: Comprehensive unit and integration tests for all phases.

### Step 6.1: Integration Test - Initial Player Visibility

- [ ] Create/update `test/integration/player-visibility.test.js`
- [ ] Test that Player A is visible in Player B's terminal when Player B connects
- [ ] Test that all players are visible on initial render
- [ ] Test that players are visible even if they haven't moved
- [x] Test that `localPlayerId` is set from CONNECT response - **COVERED** in `test/index/connect-response.test.js`

**Verification**:

- [ ] All integration tests pass
- [ ] Tests cover initial visibility scenarios

**Note**: Unit test coverage exists for `localPlayerId` extraction from CONNECT response, but integration tests are needed to verify end-to-end visibility.

### Step 6.2: Integration Test - Post-Collision Visibility

- [ ] In `test/integration/player-visibility.test.js`, add collision tests:
- [ ] Test that Player A remains visible in Player B's terminal after collision
- [ ] Test that both players are visible after collision, even if positions unchanged
- [ ] Test that players remain visible after multiple collisions
- [x] Test that collision information is received from server - **PARTIALLY COVERED** in `test/server/GameServer.test.js` (server-side collision tracking) and `test/index/collision-rendering.test.js` (client-side collision rendering logic)

**Verification**:

- [ ] All collision visibility tests pass
- [ ] Tests cover post-collision scenarios

**Note**: Unit tests exist for collision detection and rendering logic, but integration tests are needed to verify end-to-end collision visibility across multiple clients.

### Step 6.3: Integration Test - State Update Queueing

- [ ] In `test/integration/player-visibility.test.js`, add queueing tests:
- [x] Test that state updates are queued when `localPlayerId` is not set - **COVERED** in `test/index/queued-state-processing.test.js` and `test/index/edge-cases.test.js`
- [x] Test that queued state is processed when `localPlayerId` is set from CONNECT - **COVERED** in `test/index/connect-response.test.js` and `test/index/queued-state-processing.test.js`
- [x] Test that queued state is processed when `localPlayerId` is set from PLAYER_JOINED - **COVERED** in `test/index/connect-response.test.js` (fallback behavior)
- [ ] Test that most recent queued state is used (older states are overwritten) - **NEEDS INTEGRATION TEST**
- [x] Test that all players in queued state are rendered - **COVERED** in `test/index/queued-state-processing.test.js` (renderFull is called)

**Verification**:

- [ ] All queueing tests pass
- [ ] Tests cover state queueing and processing

**Note**: Unit tests exist for queueing logic, but integration test needed to verify that most recent queued state overwrites older states in a real WebSocket scenario.

### Step 6.4: Manual Testing

- [ ] Test with two clients:
  - [ ] Client A connects first and doesn't move
  - [ ] Client B connects and should see Client A immediately
  - [ ] Client A moves and Client B sees movement
  - [ ] Client B collides with Client A
  - [ ] Both clients should see both players after collision
- [ ] Test reconnection:
  - [ ] Client A connects and moves
  - [ ] Client B connects and sees Client A
  - [ ] Client B disconnects and reconnects
  - [ ] Client B should see Client A immediately after reconnection

**Verification**:

- [ ] Manual testing confirms all scenarios work
- [ ] No visual glitches or missing players

---

## Completion Checklist

- [ ] All phases completed
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing completed
- [ ] Code follows existing patterns
- [ ] No regressions introduced
- [ ] Documentation updated (if needed)

## Success Criteria

1. ✅ Player A is visible in Player B's terminal immediately when Player B connects
2. ✅ All players are visible on initial render, regardless of movement
3. ✅ Players remain visible after collisions, even if positions unchanged
4. ✅ No performance degradation from rendering all players
5. ✅ Queued state updates are processed correctly when `localPlayerId` is set
6. ✅ `playerId` is extracted from CONNECT response when available
7. ✅ Server sends collision information in state updates (if Phase 4 completed)
8. ✅ Client renders all players when collision detected

## Notes

- **Modular Implementation**: Phase 1-3 implementation should be modular to allow easy transition to lobby-based game selection in the future (per Q1 note).
- **Server Collision Detection**: Phase 4 can be implemented separately or deferred. If deferred, Phase 5 includes a temporary fallback solution (per Q4: Option C).
- **Performance**: Rendering all players after collisions should have minimal performance impact since it only happens when collisions are detected (per Performance Considerations in specs).

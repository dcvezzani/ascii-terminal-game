# Client-Side Prediction - Implementation Gameplan

## Overview

This gameplan implements client-side prediction for the local player to provide immediate visual feedback while maintaining server authority. The local player will render immediately on input, while other players and entities continue to use server state. Periodic reconciliation will ensure the local player stays synchronized with the server.

**Reference Card**: `docs/development/cards/features/FEATURE_client_side_prediction.md`

## Goals

1. Render local player immediately upon keypress (no server round-trip wait)
2. Maintain server authority for all other players and entities
3. Implement periodic reconciliation to sync local player with server (configurable interval, default 5 seconds)
4. Handle position discrepancies smoothly without visual glitches
5. Integrate seamlessly with existing incremental rendering system

## Current State

**Current Architecture**:
- `src/index.js` - Client entry point with `runNetworkedMode()`
  - Input handler sends MOVE messages to server
  - Waits for server STATE_UPDATE to render player movement
  - Uses incremental rendering for all players based on server state
- `src/render/Renderer.js` - Handles all rendering
  - `updatePlayersIncremental()` - Updates player positions based on server state
  - `updateCell()` - Updates individual cells
- `src/config/clientConfig.js` - Client configuration
  - Currently only has logging configuration

**Current Flow**:
1. Player presses movement key
2. Client sends MOVE message to server
3. Server validates and processes move
4. Server broadcasts STATE_UPDATE
5. Client receives STATE_UPDATE
6. Client renders player at new position

**Problem**: Steps 2-5 introduce latency (50-200ms+), making the game feel unresponsive.

## Target State

**New Flow**:
1. Player presses movement key
2. Client immediately renders player at predicted position (client-side prediction)
3. Client sends MOVE message to server (in parallel)
4. Server validates and processes move
5. Server broadcasts STATE_UPDATE
6. Client receives STATE_UPDATE and updates other players/entities
7. Every N seconds: Client reconciles local player position with server (true-up)

**Benefits**:
- Immediate visual feedback (0ms perceived latency)
- Server authority maintained (prevents cheating)
- Periodic reconciliation prevents drift
- Smooth gameplay experience

## Implementation Phases

---

## Phase 1: Configuration and State Tracking (~30 minutes)

### Step 1.1: Add Prediction Configuration

- [ ] Open `src/config/clientConfig.js`
- [ ] Add `prediction` configuration object:
  ```javascript
  prediction: {
    enabled: true,
    reconciliationInterval: 5000, // milliseconds (default: 5 seconds)
  }
  ```

**Verification**:
- [ ] `clientConfig.prediction` object exists
- [ ] `enabled` property is boolean (default: true)
- [ ] `reconciliationInterval` property is number (default: 5000)

### Step 1.2: Add Prediction State Variables

- [ ] Open `src/index.js`
- [ ] In `runNetworkedMode()`, add state tracking variables:
  ```javascript
  let localPlayerPredictedPosition = { x: null, y: null };
  let lastReconciliationTime = Date.now();
  let reconciliationTimer = null;
  ```

**Verification**:
- [ ] Variables declared in correct scope
- [ ] Initial values are correct (null for position, current time for lastReconciliation)

### Step 1.3: Initialize Predicted Position from Server

- [ ] In `wsClient.onPlayerJoined()` callback, initialize predicted position:
  ```javascript
  if (payload.clientId === wsClient.getClientId()) {
    localPlayerId = payload.playerId;
    // Initialize predicted position from first server state
  }
  ```
- [ ] In `wsClient.onStateUpdate()`, initialize predicted position on first update:
  ```javascript
  if (previousState === null && localPlayerId) {
    const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
    if (localPlayer) {
      localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
    }
  }
  ```

**Verification**:
- [ ] Predicted position initialized when local player joins
- [ ] Predicted position matches server position initially

---

## Phase 2: Immediate Local Rendering (~1-2 hours)

### Step 2.1: Modify Input Handler for Immediate Rendering

- [ ] Open `src/index.js`
- [ ] Locate input handler setup in `runNetworkedMode()`
- [ ] Modify movement callbacks to:
  1. Update `localPlayerPredictedPosition` immediately
  2. Render player at predicted position using `renderer.updateCell()`
  3. Still send MOVE message to server
- [ ] Example for `onMoveUp`:
  ```javascript
  onMoveUp: () => {
    if (showingHelp) {
      showingHelp = false;
      if (renderer && currentState) {
        renderer.renderFull(game, currentState, localPlayerId);
      }
      return;
    }
    
    // Client-side prediction: Update and render immediately
    if (localPlayerPredictedPosition.x !== null && localPlayerPredictedPosition.y !== null) {
      const oldX = localPlayerPredictedPosition.x;
      const oldY = localPlayerPredictedPosition.y;
      
      // Update predicted position
      localPlayerPredictedPosition.y -= 1;
      
      // Render immediately at predicted position
      const boardAdapter = {
        getCell: (x, y) => {
          if (currentState && currentState.board && currentState.board.grid) {
            if (y >= 0 && y < currentState.board.grid.length &&
                x >= 0 && x < currentState.board.grid[y].length) {
              return currentState.board.grid[y][x];
            }
          }
          return null;
        },
      };
      
      // Clear old position (restore cell)
      const oldCell = boardAdapter.getCell(oldX, oldY);
      const oldGlyph = oldCell === WALL_CHAR.char ? WALL_CHAR : EMPTY_SPACE_CHAR;
      const oldColorFn = renderer.getColorFunction(oldGlyph.color);
      renderer.updateCell(oldX, oldY, oldGlyph.char, oldColorFn);
      
      // Draw at new position
      const playerColorFn = renderer.getColorFunction(PLAYER_CHAR.color);
      renderer.updateCell(
        localPlayerPredictedPosition.x,
        localPlayerPredictedPosition.y,
        PLAYER_CHAR.char,
        playerColorFn
      );
      
      // Update status bar with predicted position
      renderer.updateStatusBarIfChanged(
        currentState?.score || 0,
        localPlayerPredictedPosition.x,
        localPlayerPredictedPosition.y,
        currentState?.score || 0,
        oldX,
        oldY
      );
    }
    
    // Still send to server
    if (wsClient && wsClient.isConnected()) {
      wsClient.sendMove(0, -1);
    }
  }
  ```

**Verification**:
- [ ] All movement callbacks (`onMoveUp`, `onMoveDown`, `onMoveLeft`, `onMoveRight`) updated
- [ ] Predicted position updates immediately
- [ ] Player renders at predicted position immediately
- [ ] MOVE messages still sent to server
- [ ] Old position is cleared correctly
- [ ] Status bar updates with predicted position

### Step 2.2: Exclude Local Player from Server State Rendering

- [ ] Modify `wsClient.onStateUpdate()` callback
- [ ] When applying incremental updates, exclude local player from player updates:
  ```javascript
  // Filter out local player from server state for rendering
  const otherPlayers = gameState.players.filter(p => p.playerId !== localPlayerId);
  const previousOtherPlayers = (previousState?.players || []).filter(p => p.playerId !== localPlayerId);
  
  // Update other players (not local player)
  if (changes.players.moved.length > 0 || 
      changes.players.joined.length > 0 || 
      changes.players.left.length > 0) {
    renderer.updatePlayersIncremental(
      previousOtherPlayers,
      otherPlayers,
      boardAdapter,
      changes.players
    );
  }
  ```
- [ ] Local player rendering is handled by input handler (Step 2.1)

**Verification**:
- [ ] Local player excluded from server state rendering
- [ ] Other players still render correctly from server state
- [ ] No duplicate rendering of local player

### Step 2.3: Handle Wall Collisions (Optional Enhancement)

- [ ] Add collision detection before updating predicted position
- [ ] Check if predicted position would be a wall:
  ```javascript
  const newX = localPlayerPredictedPosition.x + dx;
  const newY = localPlayerPredictedPosition.y + dy;
  const cell = boardAdapter.getCell(newX, newY);
  if (cell === WALL_CHAR.char) {
    // Don't update position, don't render, don't send to server
    return;
  }
  ```
- [ ] Only update and render if move is valid

**Verification**:
- [ ] Predicted position doesn't move into walls
- [ ] Visual feedback prevents movement into walls
- [ ] MOVE messages not sent for invalid moves

---

## Phase 3: Server Reconciliation (~1-2 hours)

### Step 3.1: Implement Reconciliation Function

- [ ] Create `reconcileWithServer()` function in `runNetworkedMode()`:
  ```javascript
  function reconcileWithServer(gameState) {
    if (!localPlayerId || localPlayerPredictedPosition.x === null) {
      return;
    }
    
    const serverPlayer = gameState.players.find(p => p.playerId === localPlayerId);
    if (!serverPlayer) {
      return;
    }
    
    const predicted = localPlayerPredictedPosition;
    const server = { x: serverPlayer.x, y: serverPlayer.y };
    
    // Check for discrepancy
    if (predicted.x !== server.x || predicted.y !== server.y) {
      clientLogger.debug(
        `Reconciliation: Predicted (${predicted.x}, ${predicted.y}) != Server (${server.x}, ${server.y})`
      );
      
      // Correct to server position
      const oldX = predicted.x;
      const oldY = predicted.y;
      localPlayerPredictedPosition = { x: server.x, y: server.y };
      
      // Re-render at corrected position
      const boardAdapter = {
        getCell: (x, y) => {
          if (y >= 0 && y < gameState.board.grid.length &&
              x >= 0 && x < gameState.board.grid[y].length) {
            return gameState.board.grid[y][x];
          }
          return null;
        },
      };
      
      // Clear old predicted position
      const oldCell = boardAdapter.getCell(oldX, oldY);
      const oldGlyph = oldCell === WALL_CHAR.char ? WALL_CHAR : EMPTY_SPACE_CHAR;
      const oldColorFn = renderer.getColorFunction(oldGlyph.color);
      renderer.updateCell(oldX, oldY, oldGlyph.char, oldColorFn);
      
      // Draw at corrected server position
      const playerColorFn = renderer.getColorFunction(PLAYER_CHAR.color);
      renderer.updateCell(server.x, server.y, PLAYER_CHAR.char, playerColorFn);
      
      // Update status bar
      renderer.updateStatusBarIfChanged(
        gameState.score || 0,
        server.x,
        server.y,
        gameState.score || 0,
        oldX,
        oldY
      );
    }
    
    lastReconciliationTime = Date.now();
  }
  ```

**Verification**:
- [ ] Function detects position discrepancies
- [ ] Function corrects predicted position to server position
- [ ] Function re-renders at corrected position
- [ ] Function updates lastReconciliationTime

### Step 3.2: Set Up Reconciliation Timer

- [ ] In `runNetworkedMode()`, set up reconciliation timer:
  ```javascript
  function startReconciliationTimer() {
    if (reconciliationTimer) {
      clearInterval(reconciliationTimer);
    }
    
    const interval = clientConfig.prediction.reconciliationInterval;
    reconciliationTimer = setInterval(() => {
      if (currentState && localPlayerId) {
        reconcileWithServer(currentState);
      }
    }, interval);
  }
  ```
- [ ] Call `startReconciliationTimer()` after first state update (when `localPlayerId` is set)
- [ ] Clear timer in cleanup/disconnect handler

**Verification**:
- [ ] Timer starts after local player joins
- [ ] Timer triggers reconciliation at configured interval
- [ ] Timer is cleared on disconnect/cleanup

### Step 3.3: Handle Reconciliation on State Updates

- [ ] Optionally call `reconcileWithServer()` on every state update (in addition to timer)
- [ ] This provides more frequent reconciliation if needed
- [ ] Or rely solely on timer-based reconciliation

**Verification**:
- [ ] Reconciliation occurs at configured intervals
- [ ] Position discrepancies are corrected

---

## Phase 4: Integration and Edge Cases (~1 hour)

### Step 4.1: Handle Initial State

- [ ] Ensure predicted position is initialized from server state
- [ ] Handle case where local player joins mid-game
- [ ] Handle case where server state arrives before localPlayerId is set

**Verification**:
- [ ] Predicted position always initialized correctly
- [ ] No rendering errors on initial state

### Step 4.2: Handle Disconnection and Reconnection

- [ ] Reset predicted position on disconnect
- [ ] Re-initialize predicted position on reconnect
- [ ] Restart reconciliation timer on reconnect

**Verification**:
- [ ] Clean state on disconnect
- [ ] Proper initialization on reconnect

### Step 4.3: Handle Edge Cases

- [ ] Handle null/undefined predicted position
- [ ] Handle invalid predicted positions (out of bounds)
- [ ] Handle rapid input (multiple moves before server responds)
- [ ] Handle server rejecting moves (position doesn't change on server)

**Verification**:
- [ ] All edge cases handled gracefully
- [ ] No crashes or visual glitches

---

## Phase 5: Testing (~2-3 hours)

### Step 5.1: Unit Tests

- [ ] Create `test/index/prediction.test.js`
- [ ] Test predicted position initialization
- [ ] Test predicted position updates on input
- [ ] Test reconciliation logic
- [ ] Test reconciliation timer

**Verification**:
- [ ] Unit tests created
- [ ] All unit tests pass

### Step 5.2: Integration Tests

- [ ] Create `test/integration/client-side-prediction.test.js`
- [ ] Test immediate rendering on input
- [ ] Test other players still use server state
- [ ] Test reconciliation at configured intervals
- [ ] Test position correction on discrepancy

**Verification**:
- [ ] Integration tests created
- [ ] All integration tests pass

### Step 5.3: Manual Testing

- [ ] Test smooth local player movement
- [ ] Test other players still synchronized
- [ ] Test reconciliation corrects drift
- [ ] Test with various network conditions
- [ ] Test with different reconciliation intervals

**Verification**:
- [ ] Manual testing completed
- [ ] Game feels responsive
- [ ] No visual glitches

---

## Progress Summary

- ✅ **Phase 1: Configuration and State Tracking** - COMPLETE
- ⏳ **Phase 2: Immediate Local Rendering** - PENDING
- ⏳ **Phase 3: Server Reconciliation** - PENDING
- ⏳ **Phase 4: Integration and Edge Cases** - PENDING
- ⏳ **Phase 5: Testing** - PENDING

## Success Criteria

1. ✅ Local player movements render immediately upon keypress
2. ✅ Other players and entities continue using server state
3. ✅ Reconciliation occurs at configured intervals (default: 5 seconds)
4. ✅ Position discrepancies are corrected smoothly
5. ✅ No visual glitches or flickering during reconciliation
6. ✅ System integrates seamlessly with incremental rendering
7. ✅ Configuration is easily adjustable
8. ✅ All tests pass

## Estimated Time

- **Phase 1**: ~30 minutes
- **Phase 2**: ~1-2 hours
- **Phase 3**: ~1-2 hours
- **Phase 4**: ~1 hour
- **Phase 5**: ~2-3 hours

**Total**: ~5-8 hours

## Notes

- Client-side prediction is a common pattern in networked games
- The reconciliation interval should balance responsiveness and accuracy
- Too frequent reconciliation may cause jitter, too infrequent may allow drift
- Default 5 seconds is a reasonable starting point but may need tuning
- Wall collision detection in prediction is optional but recommended for better UX
- Consider adding visual indicators for reconciliation (debug mode)


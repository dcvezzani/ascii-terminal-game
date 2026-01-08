# Gameplan: Client-Side Prediction

## Overview

This gameplan breaks down the client-side prediction implementation into logical phases. The implementation follows Test-Driven Development (TDD) - write tests first, then implement code to make tests pass.

**Approach**: Build incrementally, starting with prediction state management, then validation functions, movement processing, reconciliation, and finally integration and testing.

## Progress Summary

- ⏳ **Phase 1: Prediction State Management** - PENDING
- ⏳ **Phase 2: Client-Side Validation Functions** - PENDING
- ⏳ **Phase 3: Movement Input Processing with Prediction** - PENDING
- ⏳ **Phase 4: Reconciliation System** - PENDING
- ⏳ **Phase 5: Configuration and Integration** - PENDING
- ⏳ **Phase 6: Testing and Verification** - PENDING

## Prerequisites

- ✅ MVP multiplayer game implemented and working
- ✅ Incremental rendering implemented and working
- ✅ State updates received from server every 250ms
- ✅ All existing tests passing (144 tests)
- ✅ Enhancement card created
- ✅ SPECS document created

## Phase 1: Prediction State Management (~30 minutes)

**Goal**: Add prediction state variable and initialize it from server state.

### Step 1.1: Add Prediction State Variable

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add `localPlayerPredictedPosition` variable:
  - Type: `{ x: number, y: number } | { x: null, y: null }`
  - Initialize to `{ x: null, y: null }`
  - Place near other state variables (after `localPlayerId`)

**Code**:
```javascript
let localPlayerPredictedPosition = { x: null, y: null };
```

**Test**: No tests needed yet (just variable declaration)

**Verification**:
- [ ] Variable added
- [ ] Initialized to `{ x: null, y: null }`
- [ ] Placed in appropriate location

### Step 1.2: Initialize from CONNECT Response

**Location**: `src/modes/networkedMode.js` (update `handleConnect` function)

**Action**:
- In `handleConnect`, after setting `localPlayerId` and `currentState`:
  - Find local player in `gameState.players`
  - If found, set `localPlayerPredictedPosition` to server position
  - Log initialization for debugging

**Code**:
```javascript
function handleConnect(message) {
  // ... existing code ...
  
  localPlayerId = playerId;
  currentState = gameState;
  
  // Initialize prediction from server position
  if (gameState.players) {
    const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
    if (localPlayer) {
      localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
      logger.debug(`Initialized prediction position: (${localPlayer.x}, ${localPlayer.y})`);
    }
  }
  
  // ... rest of function ...
}
```

**Test**: Update `test/modes/networkedMode.test.js` (if exists) or add manual test
- Test prediction initialized from CONNECT response
- Test prediction not initialized if player not found

**Verification**:
- [ ] Prediction initialized from CONNECT response
- [ ] Handles missing player gracefully
- [ ] Logs initialization for debugging

### Step 1.3: Initialize from STATE_UPDATE (First Time)

**Location**: `src/modes/networkedMode.js` (update `handleStateUpdate` function)

**Action**:
- In `handleStateUpdate`, before calling `render()`:
  - Check if `localPlayerPredictedPosition.x === null`
  - If null and `localPlayerId` is set:
    - Find local player in `currentState.players`
    - If found, initialize prediction from server position

**Code**:
```javascript
function handleStateUpdate(message) {
  // ... existing code ...
  
  currentState = message.payload;
  
  // Initialize prediction if not already set
  if (localPlayerPredictedPosition.x === null && localPlayerId && currentState.players) {
    const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
    if (localPlayer) {
      localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
      logger.debug(`Initialized prediction position from STATE_UPDATE: (${localPlayer.x}, ${localPlayer.y})`);
    }
  }
  
  render();
}
```

**Test**: Manual test or add to test suite
- Test prediction initialized from first STATE_UPDATE
- Test prediction not re-initialized if already set

**Verification**:
- [ ] Prediction initialized from first STATE_UPDATE
- [ ] Not re-initialized if already set
- [ ] Handles missing player gracefully

### Step 1.4: Add Helper Function for Server Position

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add helper function `getServerPlayerPosition()`:
  - Returns `{ x, y }` or `null`
  - Finds local player in `currentState.players`
  - Returns position if found, null otherwise

**Code**:
```javascript
function getServerPlayerPosition() {
  if (!currentState || !currentState.players) {
    return null;
  }
  const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
  return localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
}
```

**Test**: Add unit test for helper function
- Test returns position when player found
- Test returns null when player not found
- Test returns null when state is null

**Verification**:
- [ ] Helper function added
- [ ] Tests written
- [ ] Tests pass

**Phase 1 Completion Checklist**:
- [ ] All steps completed
- [ ] Prediction state variable added
- [ ] Initialization from CONNECT works
- [ ] Initialization from STATE_UPDATE works
- [ ] Helper function added and tested
- [ ] Code committed

---

## Phase 2: Client-Side Validation Functions (~45 minutes)

**Goal**: Implement validation functions that match server validation logic.

### Step 2.1: Add validateBounds Function

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add `validateBounds(x, y, board)` function:
  - Check if x and y are within board bounds
  - Return `true` if valid, `false` otherwise
  - Handle null/undefined board gracefully

**Code**:
```javascript
function validateBounds(x, y, board) {
  if (!board) return false;
  return x >= 0 && x < board.width && y >= 0 && y < board.height;
}
```

**Test**: Create test file `test/modes/networkedMode.test.js` or add to existing
- Test valid bounds (within board)
- Test invalid bounds (negative, too large)
- Test edge cases (0, 0) and (width-1, height-1)
- Test null board

**Verification**:
- [ ] Function added
- [ ] Tests written
- [ ] Tests pass

### Step 2.2: Add validateWall Function

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add `validateWall(x, y, board)` function:
  - Check if cell at position is not a wall (`#`)
  - Use `board.getCell(x, y)` to get cell character
  - Return `true` if not wall, `false` if wall
  - Handle null/undefined board gracefully

**Code**:
```javascript
function validateWall(x, y, board) {
  if (!board || !board.getCell) return false;
  const cell = board.getCell(x, y);
  return cell !== '#';
}
```

**Test**: Add to test suite
- Test valid position (not wall)
- Test invalid position (wall)
- Test edge cases (perimeter walls)
- Test null board

**Verification**:
- [ ] Function added
- [ ] Tests written
- [ ] Tests pass

### Step 2.3: Add validateEntityCollision Function

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add `validateEntityCollision(x, y, entities)` function:
  - Check if no solid entity at position
  - Iterate entities array, check `x`, `y`, and `solid` properties
  - Return `true` if no solid entity, `false` if solid entity found
  - Handle null/undefined/empty entities gracefully

**Code**:
```javascript
function validateEntityCollision(x, y, entities) {
  if (!entities || entities.length === 0) return true;
  
  // Check for solid entities at position
  const solidEntity = entities.find(
    e => e.x === x && e.y === y && e.solid === true
  );
  return !solidEntity;
}
```

**Test**: Add to test suite
- Test no entities (should pass)
- Test non-solid entity at position (should pass)
- Test solid entity at position (should fail)
- Test multiple entities (check correct one)
- Test null/empty entities

**Verification**:
- [ ] Function added
- [ ] Tests written
- [ ] Tests pass

### Step 2.4: Add validatePlayerCollision Function

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add `validatePlayerCollision(x, y, players, excludePlayerId)` function:
  - Check if no other player at position
  - Exclude local player from check (using `excludePlayerId`)
  - Return `true` if no other player, `false` if other player found
  - Handle null/undefined/empty players gracefully

**Code**:
```javascript
function validatePlayerCollision(x, y, players, excludePlayerId) {
  if (!players || players.length === 0) return true;
  
  // Check for other players at position
  const otherPlayer = players.find(
    p => p.playerId !== excludePlayerId && p.x === x && p.y === y
  );
  return !otherPlayer;
}
```

**Test**: Add to test suite
- Test no players (should pass)
- Test other player at position (should fail)
- Test local player at position (should pass - excluded)
- Test null/empty players

**Verification**:
- [ ] Function added
- [ ] Tests written
- [ ] Tests pass

### Step 2.5: Add validateMovement Function

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add `validateMovement(x, y, currentState)` function:
  - Create board adapter from `currentState.board`
  - Get other players (exclude local player)
  - Get entities from `currentState.entities`
  - Call all validation functions in order:
    1. `validateBounds`
    2. `validateWall`
    3. `validateEntityCollision`
    4. `validatePlayerCollision`
  - Return `true` if all pass, `false` if any fail

**Code**:
```javascript
function validateMovement(x, y, currentState) {
  if (!currentState || !currentState.board) return false;

  // Create board adapter
  const board = {
    width: currentState.board.width,
    height: currentState.board.height,
    getCell: (x, y) => {
      if (y < 0 || y >= currentState.board.grid.length) return null;
      if (x < 0 || x >= currentState.board.grid[y].length) return null;
      return currentState.board.grid[y][x];
    }
  };

  // Get other players (exclude local player)
  const otherPlayers = (currentState.players || []).filter(
    p => p.playerId !== localPlayerId
  );

  // Get entities
  const entities = currentState.entities || [];

  // Validate all checks
  if (!validateBounds(x, y, board)) return false;
  if (!validateWall(x, y, board)) return false;
  if (!validateEntityCollision(x, y, entities)) return false;
  if (!validatePlayerCollision(x, y, otherPlayers, localPlayerId)) return false;

  return true;
}
```

**Test**: Add to test suite
- Test valid movement (all checks pass)
- Test invalid movement (each check fails individually)
- Test combined validation (multiple checks)
- Test null/undefined state

**Verification**:
- [ ] Function added
- [ ] All validation functions called in correct order
- [ ] Tests written
- [ ] Tests pass

**Phase 2 Completion Checklist**:
- [ ] All steps completed
- [ ] All validation functions implemented
- [ ] All tests passing
- [ ] Validation logic matches server behavior
- [ ] Code committed

---

## Phase 3: Movement Input Processing with Prediction (~60 minutes)

**Goal**: Update movement input handler to predict movement immediately and render.

### Step 3.1: Update Movement Input Handler

**Location**: `src/modes/networkedMode.js` (update `inputHandler.onMove` callback)

**Action**:
- Replace existing `inputHandler.onMove` callback:
  - Get current position (predicted or server)
  - Calculate new position
  - Validate movement
  - If valid: update prediction and render immediately
  - Always send MOVE to server

**Code**:
```javascript
inputHandler.onMove((dx, dy) => {
  if (!wsClient.isConnected() || !localPlayerId) {
    return;
  }

  // Get current predicted position (or fall back to server position)
  const currentPos = localPlayerPredictedPosition.x !== null
    ? localPlayerPredictedPosition
    : getServerPlayerPosition();

  if (!currentPos || currentPos.x === null) {
    // Can't predict without valid position
    sendMoveToServer(dx, dy);
    return;
  }

  // Calculate new position
  const newX = currentPos.x + dx;
  const newY = currentPos.y + dy;

  // Validate new position
  if (validateMovement(newX, newY, currentState)) {
    // Valid movement - update prediction immediately
    const oldPos = { ...localPlayerPredictedPosition };
    localPlayerPredictedPosition = { x: newX, y: newY };

    // Create board adapter for rendering
    const board = {
      width: currentState.board.width,
      height: currentState.board.height,
      grid: currentState.board.grid,
      getCell: (x, y) => {
        if (y < 0 || y >= currentState.board.grid.length) return null;
        if (x < 0 || x >= currentState.board.grid[y].length) return null;
        return currentState.board.grid[y][x];
      },
      isWall: (x, y) => {
        const cell = board.getCell(x, y);
        return cell === '#';
      }
    };

    // Get other players for rendering
    const otherPlayers = (currentState.players || []).filter(
      p => p.playerId !== localPlayerId
    );
    const entities = currentState.entities || [];

    // Render immediately
    renderer.restoreCellContent(oldPos.x, oldPos.y, board, otherPlayers, entities);
    renderer.updateCell(
      newX,
      newY,
      renderer.config.playerGlyph,
      renderer.config.playerColor
    );

    // Update status bar with new position
    renderer.renderStatusBar(
      currentState.score || 0,
      { x: newX, y: newY },
      currentState.board.height
    );
  }

  // Always send to server (server is authoritative)
  sendMoveToServer(dx, dy);
});
```

**Test**: Manual test or add to test suite
- Test movement updates prediction immediately
- Test movement renders immediately
- Test invalid movement doesn't update prediction
- Test MOVE always sent to server

**Verification**:
- [ ] Movement handler updated
- [ ] Prediction updates immediately on valid movement
- [ ] Rendering happens immediately
- [ ] Invalid movement doesn't update prediction
- [ ] MOVE always sent to server

### Step 3.2: Add sendMoveToServer Helper Function

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add `sendMoveToServer(dx, dy)` helper function:
  - Create MOVE message
  - Send via WebSocket client
  - Handle errors gracefully

**Code**:
```javascript
function sendMoveToServer(dx, dy) {
  try {
    const moveMessage = MessageHandler.createMessage(MessageTypes.MOVE, { dx, dy });
    wsClient.send(moveMessage);
  } catch (error) {
    logger.error('Error sending MOVE message:', error);
  }
}
```

**Test**: Add to test suite or manual test
- Test MOVE message created correctly
- Test MOVE sent to server
- Test error handling

**Verification**:
- [ ] Helper function added
- [ ] MOVE sent correctly
- [ ] Error handling works

### Step 3.3: Update Rendering to Use Predicted Position

**Location**: `src/modes/networkedMode.js` (update `render()` function)

**Action**:
- Update `render()` function to use predicted position:
  - Get server position from `currentState.players`
  - Use predicted position if available, otherwise server position
  - Render local player using this position

**Code**:
```javascript
function render() {
  // ... existing render logic ...

  // Get local player position (predicted or server)
  const localPlayer = currentState.players?.find(p => p.playerId === localPlayerId);
  const serverPosition = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
  
  // Use predicted position if available, otherwise server position
  const position = localPlayerPredictedPosition.x !== null
    ? localPlayerPredictedPosition
    : serverPosition;

  // ... render board with otherPlayers ...

  // Render local player separately using predicted/server position
  if (position) {
    renderer.updateCell(
      position.x,
      position.y,
      renderer.config.playerGlyph,
      renderer.config.playerColor
    );
  }

  // ... rest of render logic ...
}
```

**Test**: Manual test
- Test local player renders using predicted position
- Test falls back to server position if prediction is null
- Test rendering works correctly

**Verification**:
- [ ] Rendering uses predicted position
- [ ] Falls back to server position correctly
- [ ] Manual test confirms responsive movement

**Phase 3 Completion Checklist**:
- [ ] All steps completed
- [ ] Movement input handler updated
- [ ] Prediction updates immediately
- [ ] Rendering happens immediately
- [ ] Helper function added
- [ ] Rendering uses predicted position
- [ ] Manual test confirms responsive movement
- [ ] Code committed

---

## Phase 4: Reconciliation System (~45 minutes)

**Goal**: Implement periodic reconciliation to sync predicted position with server.

### Step 4.1: Add Reconciliation Function

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add `reconcilePosition()` function:
  - Check prerequisites (localPlayerId, predicted position, server state)
  - Get server position
  - Compare with predicted position
  - If mismatch: correct to server position and re-render

**Code**:
```javascript
function reconcilePosition() {
  // Check prerequisites
  if (!localPlayerId) {
    return; // Can't reconcile without player ID
  }

  if (localPlayerPredictedPosition.x === null || localPlayerPredictedPosition.y === null) {
    return; // Can't reconcile without predicted position
  }

  if (!currentState || !currentState.players) {
    return; // Can't reconcile without server state
  }

  // Get server position
  const serverPlayer = currentState.players.find(p => p.playerId === localPlayerId);
  if (!serverPlayer) {
    logger.warn('Local player not found in server state, skipping reconciliation');
    return;
  }

  const serverPos = { x: serverPlayer.x, y: serverPlayer.y };
  const predictedPos = localPlayerPredictedPosition;

  // Compare positions
  if (serverPos.x !== predictedPos.x || serverPos.y !== predictedPos.y) {
    // Mismatch detected - correct to server position
    logger.debug(`Reconciliation: correcting position from (${predictedPos.x}, ${predictedPos.y}) to (${serverPos.x}, ${serverPos.y})`);

    // Create board adapter
    const board = {
      width: currentState.board.width,
      height: currentState.board.height,
      grid: currentState.board.grid,
      getCell: (x, y) => {
        if (y < 0 || y >= currentState.board.grid.length) return null;
        if (x < 0 || x >= currentState.board.grid[y].length) return null;
        return currentState.board.grid[y][x];
      },
      isWall: (x, y) => {
        const cell = board.getCell(x, y);
        return cell === '#';
      }
    };

    // Get other players
    const otherPlayers = (currentState.players || []).filter(
      p => p.playerId !== localPlayerId
    );
    const entities = currentState.entities || [];

    // Clear old predicted position
    renderer.restoreCellContent(
      predictedPos.x,
      predictedPos.y,
      board,
      otherPlayers,
      entities
    );

    // Update predicted position to server position
    localPlayerPredictedPosition = { x: serverPos.x, y: serverPos.y };

    // Draw player at server position
    renderer.updateCell(
      serverPos.x,
      serverPos.y,
      renderer.config.playerGlyph,
      renderer.config.playerColor
    );

    // Update status bar
    renderer.renderStatusBar(
      currentState.score || 0,
      serverPos,
      currentState.board.height
    );
  }
}
```

**Test**: Add to test suite
- Test reconciliation when positions match (no correction)
- Test reconciliation when positions differ (correction applied)
- Test reconciliation skips when prerequisites not met
- Test old position cleared, new position rendered

**Verification**:
- [ ] Reconciliation function added
- [ ] Tests written
- [ ] Tests pass

### Step 4.2: Add Reconciliation Timer

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add timer management functions:
  - `startReconciliationTimer()`: Start interval timer
  - `stopReconciliationTimer()`: Stop and clear timer
  - Add `reconciliationTimer` variable

**Code**:
```javascript
let reconciliationTimer = null;

function startReconciliationTimer() {
  if (reconciliationTimer) {
    clearInterval(reconciliationTimer);
  }

  const interval = clientConfig.prediction?.reconciliationInterval || 5000;
  reconciliationTimer = setInterval(() => {
    reconcilePosition();
  }, interval);
}

function stopReconciliationTimer() {
  if (reconciliationTimer) {
    clearInterval(reconciliationTimer);
    reconciliationTimer = null;
  }
}
```

**Test**: Add to test suite or manual test
- Test timer starts after player ID set
- Test timer stops on disconnect
- Test timer uses correct interval

**Verification**:
- [ ] Timer functions added
- [ ] Timer starts correctly
- [ ] Timer stops correctly

### Step 4.3: Start Timer on Initialization

**Location**: `src/modes/networkedMode.js` (update `handleConnect` and `handleStateUpdate`)

**Action**:
- In `handleConnect`, after initializing prediction:
  - Call `startReconciliationTimer()`
- In `handleStateUpdate`, after initializing prediction:
  - Call `startReconciliationTimer()` (if not already started)

**Code**:
```javascript
function handleConnect(message) {
  // ... existing code ...
  
  // Initialize prediction from server position
  if (gameState.players) {
    const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
    if (localPlayer) {
      localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
      startReconciliationTimer(); // Start reconciliation timer
    }
  }
}

function handleStateUpdate(message) {
  // ... existing code ...
  
  // Initialize prediction if not already set
  if (localPlayerPredictedPosition.x === null && localPlayerId && currentState.players) {
    const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
    if (localPlayer) {
      localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
      startReconciliationTimer(); // Start reconciliation timer
    }
  }
  
  render();
}
```

**Test**: Manual test
- Test timer starts after initialization
- Test reconciliation runs periodically

**Verification**:
- [ ] Timer starts on initialization
- [ ] Reconciliation runs periodically

### Step 4.4: Stop Timer on Disconnect/Shutdown

**Location**: `src/modes/networkedMode.js` (update `shutdown` function)

**Action**:
- In `shutdown` function:
  - Call `stopReconciliationTimer()`
  - Reset `localPlayerPredictedPosition` to `{ x: null, y: null }`

**Code**:
```javascript
function shutdown(reason) {
  if (!running) {
    return;
  }

  running = false;
  logger.info(`Shutting down: ${reason}`);

  // Stop reconciliation timer
  stopReconciliationTimer();
  
  // Reset prediction state
  localPlayerPredictedPosition = { x: null, y: null };

  try {
    inputHandler.stop();
    renderer.showCursor();
    renderer.clearScreen();
    wsClient.disconnect();
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }

  process.exit(0);
}
```

**Test**: Manual test
- Test timer stops on shutdown
- Test prediction state reset

**Verification**:
- [ ] Timer stops on shutdown
- [ ] Prediction state reset

**Phase 4 Completion Checklist**:
- [ ] All steps completed
- [ ] Reconciliation function implemented
- [ ] Timer management implemented
- [ ] Timer starts on initialization
- [ ] Timer stops on shutdown
- [ ] Tests written and passing
- [ ] Code committed

---

## Phase 5: Configuration and Integration (~30 minutes)

**Goal**: Add configuration support and ensure all components work together.

### Step 5.1: Add Configuration to clientConfig.json.example

**Location**: `config/clientConfig.json.example`

**Action**:
- Add `prediction` section:
  - `enabled`: `true` (default)
  - `reconciliationInterval`: `5000` (milliseconds)

**Code**:
```json
{
  "websocket": {
    "url": "ws://localhost:3000"
  },
  "logging": {
    "level": "info"
  },
  "rendering": {
    "playerGlyph": "☻",
    "playerColor": "00FF00"
  },
  "prediction": {
    "enabled": true,
    "reconciliationInterval": 5000
  }
}
```

**Verification**:
- [ ] Configuration added to example file

### Step 5.2: Add Configuration Defaults

**Location**: `config/clientConfig.js`

**Action**:
- Add defaults for prediction settings in fallback config

**Code**:
```javascript
config = {
  websocket: {
    url: 'ws://localhost:3000'
  },
  logging: {
    level: 'info'
  },
  rendering: {
    playerGlyph: '☻',
    playerColor: '00FF00'
  },
  prediction: {
    enabled: true,
    reconciliationInterval: 5000
  }
};
```

**Verification**:
- [ ] Defaults added
- [ ] Defaults match example file

### Step 5.3: Add Prediction Enabled Check

**Location**: `src/modes/networkedMode.js` (update movement handler)

**Action**:
- Wrap prediction logic in `if (clientConfig.prediction?.enabled !== false)` check
- If disabled, fall back to server position only

**Code**:
```javascript
inputHandler.onMove((dx, dy) => {
  if (!wsClient.isConnected() || !localPlayerId) {
    return;
  }

  // Check if prediction is enabled
  if (clientConfig.prediction?.enabled !== false) {
    // Prediction enabled - use prediction logic
    // ... existing prediction code ...
  } else {
    // Prediction disabled - just send to server
    sendMoveToServer(dx, dy);
  }
});
```

**Test**: Manual test
- Test prediction works when enabled
- Test falls back to server when disabled

**Verification**:
- [ ] Prediction enabled check added
- [ ] Falls back correctly when disabled

### Step 5.4: Update Reconciliation to Use Config Interval

**Location**: `src/modes/networkedMode.js` (already done in Step 4.2)

**Action**:
- Verify `startReconciliationTimer()` uses config interval
- Already implemented in Phase 4, Step 4.2

**Verification**:
- [ ] Reconciliation uses config interval
- [ ] Default interval works correctly

**Phase 5 Completion Checklist**:
- [ ] All steps completed
- [ ] Configuration added
- [ ] Defaults set
- [ ] Prediction enabled check added
- [ ] Configuration used correctly
- [ ] Code committed

---

## Phase 6: Testing and Verification (~45 minutes)

**Goal**: Comprehensive testing and verification of client-side prediction.

### Step 6.1: Unit Test Coverage

**Action**:
- Review all unit tests
- Ensure edge cases covered:
  - Null/undefined positions
  - Missing state
  - Invalid positions
  - Prediction initialization
  - Validation functions
  - Reconciliation

**Verification**:
- [ ] All unit tests pass
- [ ] Edge cases covered
- [ ] Test coverage adequate

### Step 6.2: Integration Testing

**Action**:
- Test full prediction flow:
  - Movement input → prediction updates → render immediately
  - Server response → reconciliation corrects if needed
- Test prediction accuracy:
  - Most movements match server (no correction needed)
  - Occasional corrections (server rejection)
- Test rendering integration:
  - Local player renders using predicted position
  - Other players render using server position
  - Status bar updates with predicted position

**Verification**:
- [ ] Integration tests pass
- [ ] Prediction flow works correctly
- [ ] Rendering integration works

### Step 6.3: Manual Testing - Responsiveness

**Action**:
- Start server and client
- Press movement keys rapidly
- Verify instant visual feedback (< 16ms perceived)
- Verify no input lag
- Test with multiple rapid keypresses

**Verification**:
- [ ] Movement appears instant
- [ ] No perceptible input lag
- [ ] Rapid keypresses work correctly

### Step 6.4: Manual Testing - Reconciliation

**Action**:
- Move player to position
- Wait for reconciliation (5 seconds)
- Verify reconciliation corrects position if needed
- Test server rejection scenario (if possible)

**Verification**:
- [ ] Reconciliation works correctly
- [ ] Position corrections happen smoothly
- [ ] No visual glitches during correction

### Step 6.5: Manual Testing - Edge Cases

**Action**:
- Test movement at board boundaries
- Test movement into walls
- Test movement into other players
- Test disconnect/reconnect
- Test server restart (if possible)

**Verification**:
- [ ] Edge cases handled gracefully
- [ ] No crashes or errors
- [ ] Falls back to server position when needed

### Step 6.6: Performance Verification

**Action**:
- Measure prediction update time (should be < 1ms)
- Measure validation time (should be < 0.1ms)
- Verify no performance degradation
- Test with multiple players

**Verification**:
- [ ] Performance acceptable
- [ ] No performance regressions
- [ ] Prediction updates quickly

**Phase 6 Completion Checklist**:
- [ ] All tests passing
- [ ] Manual testing confirms responsiveness
- [ ] Reconciliation works correctly
- [ ] Edge cases handled
- [ ] Performance verified
- [ ] Code committed

---

## Completion Checklist

- [ ] All phases completed
- [ ] All tests passing
- [ ] Movement appears instant (< 16ms)
- [ ] Prediction accuracy > 95%
- [ ] Reconciliation corrects errors within 5 seconds
- [ ] Edge cases handled gracefully
- [ ] Performance acceptable
- [ ] Code committed
- [ ] Enhancement card updated to COMPLETE
- [ ] All acceptance criteria met

## Notes

- Follow TDD: Write tests first, then implement code
- Commit after each phase step
- Test manually as we go (verify responsiveness)
- Keep code simple and maintainable
- Server is always authoritative
- Prediction is optimistic but corrected
- Reconciliation ensures accuracy

## Implementation Tips

1. **Start Simple**: Begin with bounds and wall validation only
2. **Test Incrementally**: Test each component separately before integration
3. **Visual Verification**: Manual testing is crucial for responsiveness
4. **Error Handling**: Always fallback to server position when prediction fails
5. **Performance**: Validation should be fast (< 0.1ms per check)
6. **Reconciliation**: Silent correction is acceptable for MVP

## Future Enhancements

- Interpolation for smooth movement
- Lag compensation
- Rollback and replay for corrections
- Client-side entity prediction
- More sophisticated reconciliation strategies
- Visual indication of prediction corrections (optional)

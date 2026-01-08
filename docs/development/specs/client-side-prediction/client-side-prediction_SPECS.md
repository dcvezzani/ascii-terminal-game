# Specification: Client-Side Prediction

## Overview

This specification defines the implementation of client-side prediction for the multiplayer terminal game. Currently, when a player presses a movement key, the client sends a `MOVE` message to the server and waits for the server to process and send back a `STATE_UPDATE` before the player sees their character move. This creates noticeable input lag (up to 250ms), making the game feel unresponsive.

This enhancement implements immediate visual feedback for local player movement through client-side prediction, while maintaining synchronization with the server's authoritative state through periodic reconciliation.

**Purpose**: Provide instant, responsive movement feedback (< 16ms) by predicting local player movement on the client, while ensuring accuracy through reconciliation with the server's authoritative state.

## Problem Statement

**Current Behavior**:
- Player presses movement key (arrow keys or WASD)
- Client sends `MOVE` message to server
- Client waits for server to process movement and send `STATE_UPDATE`
- Only then does the player see their character move
- Typical delay: 0-250ms (depending on when the update arrives relative to the input)
- Server sends `STATE_UPDATE` every 250ms, so worst-case delay is 250ms

**Impact**:
- Perceived input lag makes the game feel unresponsive and sluggish
- Poor user experience, especially with network latency
- Movement feels disconnected from keyboard input
- Competitive disadvantage in multiplayer scenarios
- Reduced sense of control and immersion

## Solution

Implement client-side prediction system that:
1. **Predicts Immediately**: Update local player position instantly on input (< 16ms)
2. **Validates Locally**: Perform client-side collision detection (bounds, walls, entities, players) before predicting
3. **Reconciles Periodically**: Sync predicted position with server authoritative position via timer-based reconciliation
4. **Corrects Errors**: Automatically correct prediction when server position differs from predicted position
5. **Maintains Accuracy**: Server remains authoritative; client prediction is optimistic but corrected

## Requirements

### Functional Requirements

#### 1. Prediction State Management

**Location**: `src/modes/networkedMode.js`

**New State Variable**: `localPlayerPredictedPosition`

**Type**: `{ x: number, y: number } | { x: null, y: null }`

**Purpose**: Track the predicted position of the local player for immediate rendering.

**Initialization**:
- Set from server position on first `CONNECT` response (if `gameState` includes player)
- Set from server position on first `STATE_UPDATE` (if not already set)
- Initialize to `{ x: null, y: null }` on startup

**Update**:
- Immediately update on movement input (if validation passes)
- Update during reconciliation (when server position differs)

**Reset**:
- Reset to `{ x: null, y: null }` on disconnect
- Reset to `{ x: null, y: null }` on server restart detection
- Reset to `{ x: null, y: null }` on invalid state (missing player, out of bounds)

**State Lifecycle**:
```javascript
// Initial state
let localPlayerPredictedPosition = { x: null, y: null };

// On CONNECT response with gameState
if (gameState.players) {
  const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
  if (localPlayer) {
    localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
  }
}

// On STATE_UPDATE (first time)
if (localPlayerPredictedPosition.x === null && currentState.players) {
  const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
  if (localPlayer) {
    localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
  }
}
```

#### 2. Movement Input Processing

**Location**: `src/modes/networkedMode.js` (update `inputHandler.onMove` callback)

**Current Implementation**:
```javascript
inputHandler.onMove((dx, dy) => {
  if (wsClient.isConnected() && localPlayerId) {
    const moveMessage = MessageHandler.createMessage(MessageTypes.MOVE, { dx, dy });
    wsClient.send(moveMessage);
  }
});
```

**Updated Implementation**:
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

    // Render immediately
    renderer.restoreCellContent(oldPos.x, oldPos.y, board, otherPlayers, entities);
    renderer.updateCell(
      newX,
      newY,
      renderer.config.playerGlyph,
      renderer.config.playerColor
    );

    // Update status bar with new position
    renderer.renderStatusBar(currentState.score || 0, { x: newX, y: newY }, boardHeight);
  }

  // Always send to server (server is authoritative)
  sendMoveToServer(dx, dy);
});
```

**Helper Function**: `getServerPlayerPosition()`
```javascript
function getServerPlayerPosition() {
  if (!currentState || !currentState.players) {
    return null;
  }
  const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
  return localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
}
```

**Helper Function**: `sendMoveToServer(dx, dy)`
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

#### 3. Client-Side Collision Detection

**Location**: `src/modes/networkedMode.js` (new helper functions)

**Purpose**: Validate movement before predicting to match server behavior.

**Validation Functions**:

##### `validateBounds(x, y, board)`
```javascript
function validateBounds(x, y, board) {
  if (!board) return false;
  return x >= 0 && x < board.width && y >= 0 && y < board.height;
}
```

##### `validateWall(x, y, board)`
```javascript
function validateWall(x, y, board) {
  if (!board || !board.getCell) return false;
  const cell = board.getCell(x, y);
  return cell !== '#';
}
```

##### `validateEntityCollision(x, y, entities)`
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

##### `validatePlayerCollision(x, y, players, excludePlayerId)`
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

##### `validateMovement(x, y, currentState)`
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

**Validation Order**:
1. Bounds check (fastest, fail early)
2. Wall check
3. Entity collision check
4. Player collision check (most expensive)

**Behavior**: If any validation fails, prediction is rejected (don't update position, don't render). Still send `MOVE` to server (server may accept movement client rejected).

#### 4. Reconciliation System

**Location**: `src/modes/networkedMode.js`

**Purpose**: Periodically synchronize predicted position with server authoritative position.

**Reconciliation Timer**:
- Configurable interval (default: 5000ms)
- Stored in `clientConfig.prediction.reconciliationInterval`
- Uses `setInterval` to run reconciliation periodically
- Timer cleared on disconnect, server restart, or shutdown

**Reconciliation Process**:

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

    // Clear old predicted position
    renderer.restoreCellContent(
      predictedPos.x,
      predictedPos.y,
      board,
      otherPlayers,
      currentState.entities || []
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

**Reconciliation Triggers**:
1. **Timer-based**: Every N milliseconds (configurable, default: 5000ms)
2. **State update**: On every `STATE_UPDATE` (optional additional check)

**Timer Setup**:
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

**Timer Lifecycle**:
- Start: After `localPlayerId` is set (on CONNECT response or first STATE_UPDATE)
- Stop: On disconnect, server restart, or shutdown
- Restart: On reconnection (if reconnection is implemented)

#### 5. Rendering Updates

**Location**: `src/modes/networkedMode.js` (update `render()` function)

**Current Behavior**: Local player is rendered using server position from `currentState.players`.

**Updated Behavior**: Local player is rendered using `localPlayerPredictedPosition` if available, falling back to server position.

**Position Source Priority**:
1. Use `localPlayerPredictedPosition` if `x !== null && y !== null`
2. Fall back to server position from `currentState.players` if prediction is null
3. Don't render if both are null/undefined

**Rendering Logic**:
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

  // Exclude local player from server state rendering
  const otherPlayers = (currentState.players || []).filter(
    p => p.playerId !== localPlayerId
  );

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

**Status Bar Updates**:
- Use predicted position for status bar display
- Update status bar when predicted position changes (during movement input)
- Update status bar during reconciliation (when position is corrected)

#### 6. Configuration

**Location**: `config/clientConfig.json` and `config/clientConfig.json.example`

**New Settings**:
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

**Configuration Loading**:
- Update `config/clientConfig.js` to include defaults for prediction settings
- Defaults: `enabled: true`, `reconciliationInterval: 5000`

**Configuration Usage**:
```javascript
// Check if prediction is enabled
if (clientConfig.prediction?.enabled !== false) {
  // Prediction enabled (default: true)
  // ... prediction logic ...
}

// Get reconciliation interval
const interval = clientConfig.prediction?.reconciliationInterval || 5000;
```

### Non-Functional Requirements

1. **Responsiveness**:
   - Movement should appear instant (< 16ms) on input
   - No perceptible delay between keypress and visual feedback
   - Prediction update should complete in < 1ms

2. **Correctness**:
   - Prediction validation must match server validation rules exactly
   - Reconciliation must correct all prediction errors
   - Server position is always authoritative

3. **Synchronization**:
   - Reconciliation must correct prediction errors within reasonable time (default: 5 seconds)
   - Prediction should match server position in most cases (> 95% accuracy)
   - Occasional corrections are acceptable (server rejection, network issues)

4. **Performance**:
   - Prediction and validation should have minimal CPU overhead (< 0.1ms per input)
   - Reconciliation should not block main thread
   - No noticeable performance impact on rendering

5. **Reliability**:
   - Handle edge cases gracefully (null positions, out of bounds, server rejection)
   - No crashes or unhandled exceptions
   - Fallback to server position when prediction fails
   - Reset prediction state on disconnect/server restart

## Data Model

### Prediction State

```javascript
{
  localPlayerPredictedPosition: {
    x: number | null,
    y: number | null
  }
}
```

### Configuration Model

```javascript
{
  prediction: {
    enabled: boolean,           // Default: true
    reconciliationInterval: number  // Default: 5000 (milliseconds)
  }
}
```

### State Structure (Unchanged)

Same as MVP state structure:
```javascript
{
  board: {
    width: number,
    height: number,
    grid: string[][]
  },
  players: Array<{
    playerId: string,
    x: number,
    y: number,
    playerName: string
  }>,
  entities: Array<{
    entityId: string,
    x: number,
    y: number,
    glyph: string,
    color: string,
    solid: boolean,
    zOrder: number,
    entityType: string
  }>,
  score: number
}
```

## Implementation Details

### File Structure

**Modified Files**:
- `src/modes/networkedMode.js`: Add prediction state, validation, reconciliation
- `config/clientConfig.js`: Add prediction configuration defaults
- `config/clientConfig.json.example`: Add prediction configuration example

**No New Files Required**: All functionality added to existing `networkedMode.js`

### State Initialization Flow

```javascript
// 1. On startup
let localPlayerPredictedPosition = { x: null, y: null };

// 2. On CONNECT response
function handleConnect(message) {
  localPlayerId = message.payload.playerId;
  currentState = message.payload.gameState;
  
  // Initialize prediction from server position
  if (currentState.players) {
    const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
    if (localPlayer) {
      localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
    }
  }
  
  // Start reconciliation timer
  startReconciliationTimer();
}

// 3. On STATE_UPDATE (first time, if not initialized)
function handleStateUpdate(message) {
  currentState = message.payload;
  
  // Initialize prediction if not already set
  if (localPlayerPredictedPosition.x === null && currentState.players) {
    const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
    if (localPlayer) {
      localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
      startReconciliationTimer();
    }
  }
  
  render();
}
```

### Movement Prediction Flow

```javascript
// User presses movement key
inputHandler.onMove((dx, dy) => {
  // 1. Get current position (predicted or server)
  const currentPos = localPlayerPredictedPosition.x !== null
    ? localPlayerPredictedPosition
    : getServerPlayerPosition();
  
  if (!currentPos) return;
  
  // 2. Calculate new position
  const newX = currentPos.x + dx;
  const newY = currentPos.y + dy;
  
  // 3. Validate movement
  if (validateMovement(newX, newY, currentState)) {
    // 4. Update prediction
    const oldPos = { ...localPlayerPredictedPosition };
    localPlayerPredictedPosition = { x: newX, y: newY };
    
    // 5. Render immediately
    renderer.restoreCellContent(oldPos.x, oldPos.y, board, otherPlayers, entities);
    renderer.updateCell(newX, newY, glyph, color);
    renderer.renderStatusBar(score, { x: newX, y: newY }, boardHeight);
  }
  
  // 6. Always send to server
  sendMoveToServer(dx, dy);
});
```

### Reconciliation Flow

```javascript
// Timer-based reconciliation (every 5 seconds)
setInterval(() => {
  reconcilePosition();
}, reconciliationInterval);

function reconcilePosition() {
  // 1. Check prerequisites
  if (!localPlayerId || localPlayerPredictedPosition.x === null) return;
  
  // 2. Get server position
  const serverPlayer = currentState.players.find(p => p.playerId === localPlayerId);
  if (!serverPlayer) return;
  
  // 3. Compare positions
  if (serverPlayer.x !== localPlayerPredictedPosition.x ||
      serverPlayer.y !== localPlayerPredictedPosition.y) {
    // 4. Correct to server position
    const oldPos = { ...localPlayerPredictedPosition };
    localPlayerPredictedPosition = { x: serverPlayer.x, y: serverPlayer.y };
    
    // 5. Re-render
    renderer.restoreCellContent(oldPos.x, oldPos.y, board, otherPlayers, entities);
    renderer.updateCell(serverPlayer.x, serverPlayer.y, glyph, color);
    renderer.renderStatusBar(score, { x: serverPlayer.x, y: serverPlayer.y }, boardHeight);
  }
}
```

### Edge Cases Handling

#### Null/Undefined Position
```javascript
// Don't predict if position is null/undefined
if (localPlayerPredictedPosition.x === null) {
  // Fall back to server position or skip prediction
  return;
}
```

#### Out of Bounds
```javascript
// Validation catches out of bounds
if (!validateBounds(x, y, board)) {
  // Prediction rejected, but still send to server
  return;
}
```

#### Server Rejection
```javascript
// Server rejects movement (position doesn't change)
// Reconciliation will correct prediction on next check
// No special handling needed - reconciliation handles it
```

#### Server Restart
```javascript
// On server restart detection
function handleServerRestart() {
  localPlayerPredictedPosition = { x: null, y: null };
  stopReconciliationTimer();
  // ... reset other state ...
}
```

#### Disconnect
```javascript
// On disconnect
function shutdown(reason) {
  localPlayerPredictedPosition = { x: null, y: null };
  stopReconciliationTimer();
  // ... cleanup ...
}
```

## Testing Requirements

### Unit Tests

#### Validation Functions Tests

**File**: `test/modes/networkedMode.test.js` (add new test suite)

**Test Cases**:
1. **validateBounds**:
   - Valid bounds (within board)
   - Invalid bounds (negative, too large)
   - Edge cases (0, 0) and (width-1, height-1)

2. **validateWall**:
   - Valid position (not wall)
   - Invalid position (wall)
   - Edge cases (perimeter walls)

3. **validateEntityCollision**:
   - No entities (should pass)
   - Non-solid entity at position (should pass)
   - Solid entity at position (should fail)
   - Multiple entities (check top-most)

4. **validatePlayerCollision**:
   - No players (should pass)
   - Other player at position (should fail)
   - Local player at position (should pass - excluded)

5. **validateMovement**:
   - Valid movement (all checks pass)
   - Invalid movement (each check fails individually)
   - Combined validation (multiple checks)

#### Prediction State Management Tests

**Test Cases**:
1. **Initialization**:
   - Starts as `{ x: null, y: null }`
   - Initializes from CONNECT response
   - Initializes from first STATE_UPDATE

2. **Update on Movement**:
   - Updates immediately on valid movement
   - Doesn't update on invalid movement
   - Preserves position on validation failure

3. **Reset**:
   - Resets on disconnect
   - Resets on server restart
   - Resets on invalid state

#### Reconciliation Tests

**Test Cases**:
1. **Reconciliation Match**:
   - Predicted position matches server (no correction)

2. **Reconciliation Mismatch**:
   - Predicted position differs from server (correction applied)
   - Old position cleared
   - New position rendered

3. **Reconciliation Prerequisites**:
   - Skips if `localPlayerId` not set
   - Skips if predicted position is null
   - Skips if server player not found

4. **Reconciliation Timer**:
   - Timer starts after player ID set
   - Timer stops on disconnect
   - Timer restarts on reconnection

### Integration Tests

**File**: `test/modes/networkedMode.test.js` (add to existing)

**Test Cases**:
1. **Movement Prediction Flow**:
   - User input → prediction updates → render immediately
   - Server response → reconciliation corrects if needed

2. **Prediction Accuracy**:
   - Most movements match server (no correction needed)
   - Occasional corrections (server rejection)

3. **Rendering Integration**:
   - Local player renders using predicted position
   - Other players render using server position
   - Status bar updates with predicted position

### Manual Testing

1. **Responsiveness Testing**:
   - Start server and client
   - Press movement keys rapidly
   - Verify instant visual feedback (< 16ms perceived)
   - Verify no input lag

2. **Reconciliation Testing**:
   - Move player to position
   - Simulate server rejection (modify server validation)
   - Verify reconciliation corrects position within 5 seconds

3. **Edge Cases Testing**:
   - Test movement at board boundaries
   - Test movement into walls
   - Test movement into other players
   - Test rapid keypresses
   - Test disconnect/reconnect

4. **Performance Testing**:
   - Measure prediction update time (< 1ms)
   - Measure validation time (< 0.1ms)
   - Verify no performance degradation

## Success Criteria

1. **Responsiveness**:
   - ✅ Movement appears instant (< 16ms) on input
   - ✅ No perceptible delay between keypress and visual feedback
   - ✅ Game feels responsive and snappy

2. **Correctness**:
   - ✅ Prediction validation matches server validation
   - ✅ Reconciliation corrects all prediction errors
   - ✅ Server position is always authoritative

3. **Synchronization**:
   - ✅ Reconciliation corrects errors within 5 seconds
   - ✅ Prediction accuracy > 95% (most movements match server)
   - ✅ Occasional corrections are acceptable and handled gracefully

4. **Performance**:
   - ✅ Prediction update completes in < 1ms
   - ✅ Validation completes in < 0.1ms
   - ✅ No noticeable performance impact

5. **Reliability**:
   - ✅ Handles all edge cases gracefully
   - ✅ No crashes or unhandled exceptions
   - ✅ Falls back to server position when prediction fails

6. **Testing**:
   - ✅ All unit tests pass
   - ✅ Integration tests pass
   - ✅ Manual testing confirms responsive movement

## Related Features

- **Incremental Rendering** (X_ENHANCEMENT_reduce_screen_flicker.md): Works seamlessly with prediction
- **Entity System** (future): Entity collision detection depends on entity system
- **Reconnection Handling** (future): Prediction state reset on reconnection

## Migration Notes

### Backward Compatibility

- Prediction is opt-in via configuration (enabled by default)
- Falls back to server position when prediction is disabled or fails
- No breaking changes to existing rendering API
- Existing tests should continue to pass

### Future Enhancements

This implementation focuses on basic prediction. Future enhancements can add:
- Interpolation for smooth movement
- Lag compensation
- Rollback and replay for corrections
- Client-side entity prediction
- More sophisticated reconciliation strategies

## References

- **Enhancement Card**: `docs/development/cards/enhancements/ENHANCEMENT_client_side_prediction.md`
- **Client Architecture Spec**: `docs/development/specs/client-architecture_SPECS.md`
  - Section: "Client-Side Prediction" (lines 467-513)
  - Section: "Reconciliation" (lines 516-554)
  - Section: "Input Handling" (lines 421-465)
  - Section: "State Management" (lines 305-365)
- **Server Architecture Spec**: `docs/development/specs/server-architecture_SPECS.md`
  - Section: "Movement Validation" (for matching validation rules)

## Summary

This specification defines the implementation of client-side prediction to provide instant, responsive movement feedback. The solution uses optimistic prediction with client-side validation, immediate rendering, and periodic reconciliation to maintain accuracy with the server's authoritative state. The implementation is designed to be performant, reliable, and maintainable while providing a significantly improved user experience.

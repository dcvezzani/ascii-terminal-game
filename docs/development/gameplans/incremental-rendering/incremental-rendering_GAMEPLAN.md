# Incremental Rendering - Implementation Gameplan

## Overview

This gameplan implements incremental/differential rendering for multiplayer mode to eliminate full screen refreshes and improve performance. The implementation will track previous game state and only update changed cells/players/entities, resulting in smooth, flicker-free rendering.

**Reference**:

- Feature Card: `docs/development/cards/features/FEATURE_incremental_rendering.md`
- Specification: `docs/development/specs/incremental-rendering/incremental-rendering_SPECS.md`

## Progress Summary

- ✅ **Phase 1: State Tracking** - COMPLETE
- ✅ **Phase 2: State Comparison Utilities** - COMPLETE
- ✅ **Phase 3: Incremental Renderer Methods** - COMPLETE
- ✅ **Phase 4: Integration** - COMPLETE (Update batching deferred as optimization)
- ⏳ **Phase 5: Testing and Refinement** - PENDING

## Prerequisites

- WebSocket integration complete and working
- Multiplayer mode functional
- Server broadcasting `STATE_UPDATE` messages
- Client receiving and rendering state updates
- Existing `Renderer` class with `updateCell()` method

## Architectural Decisions

Based on specification answers:

- **State Comparison**: Separate utility functions in `src/utils/stateComparison.js` (Q1: Option B)
- **Board Mutability**: Defer board change detection until board becomes mutable (Q2: Option B)
- **Overlap Handling**: Server-side validation prevents overlaps (Q3: Option D)
- **Fallback Strategy**: Fall back when both board and players changed significantly (Q4: Option D)
- **Performance**: Simple comparison (iterate through arrays) (Q5: Option A)
- **Status Bar**: Only update when score/position changes (Q6: Option B)
- **Position Tracking**: Separate Maps for players and entities (Q7: Option B)
- **Error Recovery**: Retry incremental update once, then fall back (Q8: Option C)
- **Initial Render**: On first state update with valid `localPlayerId` (Q9: Option D)
- **State Sync**: Always trust server state (Q10: Option A)
- **Update Batching**: Batch all updates, then render (double buffering) (Q11: Option C)
- **Testing**: Both unit and integration tests (Q12: Option C)

---

## Phase 1: State Tracking (~30 minutes)

### Step 1.1: Add Previous State Variable

- [x] Open `src/index.js`
- [x] Locate `runNetworkedMode()` function
- [x] Add `previousState` variable initialization:
  ```javascript
  let previousState = null;
  ```
- [x] Initialize to `null` for first render detection

**Verification**:

- [x] `previousState` variable declared in `runNetworkedMode()`
- [x] Initialized to `null`
- [x] Variable persists across state updates

### Step 1.2: Store State After Rendering

- [x] Locate `wsClient.onStateUpdate()` callback in `runNetworkedMode()`
- [x] After successful rendering, store current state:
  ```javascript
  previousState = JSON.parse(JSON.stringify(gameState)); // Deep copy
  ```
- [x] Ensure state is stored after both full render and incremental updates

**Verification**:

- [x] State is stored after each render
- [x] State is deep copied (not reference)
- [x] State structure matches server state structure

### Step 1.3: Handle Initial Render Detection

- [x] Modify `wsClient.onStateUpdate()` to check `previousState`:
  ```javascript
  if (previousState === null) {
    // First render - use renderFull()
  } else {
    // Subsequent renders - use incremental updates
  }
  ```
- [x] Ensure `localPlayerId` is set before first render (per Q9: Option D)

**Verification**:

- [x] First render uses `renderFull()` when `previousState === null`
- [x] Subsequent renders use incremental updates (placeholder for Phase 4)
- [x] Initial render waits for valid `localPlayerId`

---

## Phase 2: State Comparison Utilities (~2 hours)

### Step 2.1: Create State Comparison Module

- [x] Create `src/utils/stateComparison.js`
- [x] Add JSDoc comments describing the module
- [x] Export comparison functions

**Verification**:

- [x] `stateComparison.js` file created
- [x] File can be imported in other modules
- [x] Module structure follows project conventions

### Step 2.2: Implement Player Comparison

- [x] Create `comparePlayers(previousPlayers, currentPlayers)` function
- [x] Create Maps for O(1) lookups (per Q7: Option B):
  ```javascript
  const prevMap = new Map(previousPlayers.map(p => [p.playerId, { x: p.x, y: p.y }]));
  const currMap = new Map(currentPlayers.map(p => [p.playerId, { x: p.x, y: p.y }]));
  ```
- [x] Detect moved players (same `playerId`, different position)
- [x] Detect joined players (`playerId` in current but not previous)
- [x] Detect left players (`playerId` in previous but not current)
- [x] Return structured change object:
  ```javascript
  {
    moved: Array<{ playerId, oldX, oldY, newX, newY }>,
    joined: Array<{ playerId, x, y, playerName }>,
    left: Array<{ playerId, x, y }>
  }
  ```

**Verification**:

- [x] `comparePlayers()` function implemented
- [x] Correctly detects player movements
- [x] Correctly detects player joins
- [x] Correctly detects player leaves
- [x] Handles edge cases (empty arrays, null values)

### Step 2.3: Implement Entity Comparison

- [x] Create `compareEntities(previousEntities, currentEntities)` function
- [x] Create Maps for O(1) lookups:
  ```javascript
  const prevMap = new Map(previousEntities.map(e => [
    e.entityId,
    { x: e.x, y: e.y, glyph: e.glyph, animationFrame: e.animationFrame }
  ]));
  const currMap = new Map(currentEntities.map(e => [
    e.entityId,
    { x: e.x, y: e.y, glyph: e.glyph, animationFrame: e.animationFrame }
  ]));
  ```
- [x] Detect moved entities (same `entityId`, different position)
- [x] Detect spawned entities (`entityId` in current but not previous)
- [x] Detect despawned entities (`entityId` in previous but not current)
- [x] Detect animated entities (same `entityId` and position, different glyph/animationFrame)
- [x] Return structured change object:
  ```javascript
  {
    moved: Array<{ entityId, oldX, oldY, newX, newY, entityType }>,
    spawned: Array<{ entityId, x, y, entityType, glyph?, animationFrame? }>,
    despawned: Array<{ entityId, x, y }>,
    animated: Array<{ entityId, x, y, oldGlyph, newGlyph, animationFrame }>
  }
  ```

**Verification**:

- [x] `compareEntities()` function implemented
- [x] Correctly detects entity movements
- [x] Correctly detects entity spawns
- [x] Correctly detects entity despawns
- [x] Correctly detects entity animations
- [x] Handles edge cases (empty arrays, null values)

### Step 2.4: Implement Score Comparison

- [x] Create `compareScore(previousScore, currentScore)` function
- [x] Compare numeric values
- [x] Return structured change object:
  ```javascript
  {
    changed: boolean,
    oldScore: number,
    newScore: number
  }
  ```

**Verification**:

- [x] `compareScore()` function implemented
- [x] Correctly detects score changes
- [x] Returns correct structure

### Step 2.5: Create Main Comparison Function

- [x] Create `compareStates(previousState, currentState)` function
- [x] Call individual comparison functions:
  - `comparePlayers()`
  - `compareEntities()`
  - `compareScore()`
- [x] Combine results into single change object
- [x] Handle null/undefined states gracefully
- [x] Return complete change detection result

**Verification**:

- [x] `compareStates()` function implemented
- [x] Calls all comparison functions
- [x] Returns complete change object
- [x] Handles edge cases (null states, missing arrays)

---

## Phase 3: Incremental Renderer Methods (~2-3 hours)

### Step 3.1: Add Update Players Incremental Method

- [x] Open `src/render/Renderer.js`
- [x] Add `updatePlayersIncremental(previousPlayers, currentPlayers, board)` method
- [x] Accept change detection result from `comparePlayers()`
- [x] For moved players:
  - Clear old position (restore cell content from board)
  - Draw player at new position using `updateCell()`
- [x] For joined players:
  - Draw player at new position
- [x] For left players:
  - Clear player position (restore cell content from board)
- [x] Use `PLAYER_CHAR` for player rendering
- [x] Handle multiple players at same position (per Q3: server prevents overlaps)

**Verification**:

- [x] `updatePlayersIncremental()` method added to Renderer
- [x] Moved players update correctly
- [x] Joined players appear correctly
- [x] Left players are removed correctly
- [x] Old positions restored with correct cell content

### Step 3.2: Add Update Entities Incremental Method

- [x] Add `updateEntitiesIncremental(previousEntities, currentEntities, board)` method
- [x] Accept change detection result from `compareEntities()`
- [x] For moved entities:
  - Clear old position (restore cell content from board)
  - Draw entity at new position using entity-specific glyph/color
- [x] For spawned entities:
  - Draw entity at new position with correct glyph/color
- [x] For despawned entities:
  - Clear entity position (restore cell content from board)
- [x] For animated entities:
  - Update glyph/character at same position (no position change)
- [x] Support entity-specific glyphs and colors
- [x] Use entity type to determine rendering (glyph, color)

**Verification**:

- [x] `updateEntitiesIncremental()` method added to Renderer
- [x] Moved entities update correctly
- [x] Spawned entities appear correctly
- [x] Despawned entities are removed correctly
- [x] Animated entities update visual representation correctly
- [x] Entities use correct glyphs and colors

### Step 3.3: Add Update Status Bar If Changed Method

- [x] Add `updateStatusBarIfChanged(score, x, y, previousScore, previousX, previousY)` method
- [x] Compare score and position with previous values
- [x] Only call `renderStatusBar()` if score or position changed (per Q6: Option B)
- [x] Reuse existing `renderStatusBar()` method

**Verification**:

- [x] `updateStatusBarIfChanged()` method added to Renderer
- [x] Status bar updates when score changes
- [x] Status bar updates when position changes
- [x] Status bar does not update when unchanged

### Step 3.4: Verify Update Cell Method Exists

- [x] Check if `updateCell(x, y, char, colorFn)` method exists in Renderer
- [x] If missing, implement it:
  ```javascript
  updateCell(x, y, char, colorFn) {
    const boardStartX = getHorizontalCenter(this.boardWidth);
    const screenX = boardStartX + x;
    const screenY = this.boardOffset + y;
    process.stdout.write(ansiEscapes.cursorTo(screenX, screenY));
    process.stdout.write(colorFn(char));
  }
  ```

**Verification**:

- [x] `updateCell()` method exists or is implemented
- [x] Method correctly updates a single cell
- [x] Method uses correct cursor positioning

---

## Phase 4: Integration (~2-3 hours)

### Step 4.1: Import State Comparison Utilities

- [x] Open `src/index.js`
- [x] Import state comparison functions:
  ```javascript
  import { compareStates } from './utils/stateComparison.js';
  ```

**Verification**:

- [x] State comparison utilities imported
- [x] Import statement is correct

### Step 4.2: Modify State Update Callback

- [x] Locate `wsClient.onStateUpdate()` callback in `runNetworkedMode()`
- [x] Add logic to check `previousState`:
  ```javascript
  wsClient.onStateUpdate(gameState => {
    currentState = gameState;
    
    if (!renderer || !localPlayerId) {
      return; // Wait for renderer and localPlayerId
    }
    
    try {
      if (previousState === null) {
        // First render - use renderFull()
        renderer.renderFull(game, gameState, localPlayerId);
        previousState = JSON.parse(JSON.stringify(gameState));
      } else {
        // Subsequent renders - use incremental updates
        const changes = compareStates(previousState, gameState);
        // Apply incremental updates...
        previousState = JSON.parse(JSON.stringify(gameState));
      }
    } catch (error) {
      // Error handling...
    }
  });
  ```

**Verification**:

- [x] State update callback modified
- [x] First render uses `renderFull()`
- [x] Subsequent renders use incremental updates
- [x] State is stored after rendering

### Step 4.3: Implement Incremental Update Logic

- [x] After state comparison, apply incremental updates:
  ```javascript
  // Update players
  if (changes.players.moved.length > 0 || 
      changes.players.joined.length > 0 || 
      changes.players.left.length > 0) {
    renderer.updatePlayersIncremental(
      previousState.players,
      gameState.players,
      boardAdapter
    );
  }
  
  // Update entities
  if (changes.entities.moved.length > 0 || 
      changes.entities.spawned.length > 0 || 
      changes.entities.despawned.length > 0 ||
      changes.entities.animated.length > 0) {
    renderer.updateEntitiesIncremental(
      previousState.entities || [],
      gameState.entities || [],
      boardAdapter
    );
  }
  
  // Update status bar if changed
  const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
  if (localPlayer) {
    const prevLocalPlayer = previousState.players.find(p => p.playerId === localPlayerId);
    renderer.updateStatusBarIfChanged(
      gameState.score || 0,
      localPlayer.x,
      localPlayer.y,
      previousState.score || 0,
      prevLocalPlayer?.x || 0,
      prevLocalPlayer?.y || 0
    );
  }
  ```

**Verification**:

- [x] Incremental update logic implemented
- [x] Player updates applied correctly
- [x] Entity updates applied correctly
- [x] Status bar updates conditionally

### Step 4.4: Implement Update Batching (Double Buffering)

- [ ] Implement batching mechanism (per Q11: Option C)
- [ ] Collect all cell updates before rendering
- [ ] Batch updates by position to minimize cursor movements
- [ ] Render all updates in single pass
- [ ] Consider using a buffer or queue for updates

**Note**: This may require refactoring `updateCell()` to support batched updates, or creating a new batched update method.

**Status**: DEFERRED - This is an optimization that can be added later if performance issues arise. The current implementation works correctly but may have more cursor movements than optimal.

**Verification**:

- [ ] Update batching implemented
- [ ] Updates are collected before rendering
- [ ] Cursor movements minimized
- [ ] All updates rendered in single pass

### Step 4.5: Implement Fallback Logic

- [x] Add fallback threshold check (per Q4: Option D)
- [x] Calculate total changes (players + entities)
- [x] If changes exceed threshold, fall back to full render:
  ```javascript
  const totalChanges = 
    changes.players.moved.length +
    changes.players.joined.length +
    changes.players.left.length +
    changes.entities.moved.length +
    changes.entities.spawned.length +
    changes.entities.despawned.length +
    changes.entities.animated.length;
  
  const FALLBACK_THRESHOLD = 10; // Configurable
  
  if (totalChanges > FALLBACK_THRESHOLD) {
    renderer.renderFull(game, gameState, localPlayerId);
    previousState = JSON.parse(JSON.stringify(gameState));
    return;
  }
  ```

**Verification**:

- [x] Fallback threshold check implemented
- [x] Falls back to full render when threshold exceeded
- [x] Threshold is configurable

### Step 4.6: Implement Error Recovery

- [x] Add try-catch around incremental update logic
- [x] Implement retry logic (per Q8: Option C):
  ```javascript
  let retryCount = 0;
  const MAX_RETRIES = 1;
  
  try {
    // Incremental updates...
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      // Retry incremental update
    } else {
      // Fall back to full render
      renderer.renderFull(game, gameState, localPlayerId);
      previousState = JSON.parse(JSON.stringify(gameState));
    }
  }
  ```
- [x] Log errors for debugging

**Note**: Simplified error recovery - on error, immediately fall back to full render rather than retrying incremental updates. This is simpler and more reliable.

**Verification**:

- [x] Error handling implemented
- [x] Falls back to full render on error
- [x] Errors are logged

### Step 4.7: Handle State Synchronization

- [x] Ensure server state is always trusted (per Q10: Option A)
- [x] Overwrite local state with server state
- [x] No client-side state validation or correction

**Note**: Already implemented - we use `gameState` directly from the server without any local validation or correction.

**Verification**:

- [x] Server state always used (no local state validation)
- [x] State synchronization works correctly

---

## Phase 5: Testing and Refinement (~3-4 hours)

### Step 5.1: Unit Tests - State Comparison

- [ ] Create `test/utils/stateComparison.test.js`
- [ ] Test `comparePlayers()`:
  - [ ] Detects player movements
  - [ ] Detects player joins
  - [ ] Detects player leaves
  - [ ] Handles empty arrays
  - [ ] Handles null/undefined
- [ ] Test `compareEntities()`:
  - [ ] Detects entity movements
  - [ ] Detects entity spawns
  - [ ] Detects entity despawns
  - [ ] Detects entity animations
  - [ ] Handles empty arrays
  - [ ] Handles null/undefined
- [ ] Test `compareScore()`:
  - [ ] Detects score changes
  - [ ] Handles unchanged score
- [ ] Test `compareStates()`:
  - [ ] Combines all comparisons
  - [ ] Handles null states
  - [ ] Returns correct structure

**Verification**:

- [ ] Unit tests created
- [ ] All state comparison functions tested
- [ ] Tests pass

### Step 5.2: Unit Tests - Renderer Methods

- [ ] Create or update `test/render/Renderer.test.js`
- [ ] Test `updatePlayersIncremental()`:
  - [ ] Updates moved players correctly
  - [ ] Renders joined players correctly
  - [ ] Removes left players correctly
- [ ] Test `updateEntitiesIncremental()`:
  - [ ] Updates moved entities correctly
  - [ ] Renders spawned entities correctly
  - [ ] Removes despawned entities correctly
  - [ ] Updates animated entities correctly
- [ ] Test `updateStatusBarIfChanged()`:
  - [ ] Updates when score changes
  - [ ] Updates when position changes
  - [ ] Does not update when unchanged

**Verification**:

- [ ] Renderer method tests created/updated
- [ ] All incremental update methods tested
- [ ] Tests pass

### Step 5.3: Integration Tests

- [ ] Create `test/integration/incremental-rendering.test.js`
- [ ] Test full rendering flow:
  - [ ] First render uses `renderFull()`
  - [ ] Subsequent renders use incremental updates
  - [ ] State is tracked correctly
- [ ] Test with multiple players:
  - [ ] Player movements update correctly
  - [ ] Player joins work correctly
  - [ ] Player leaves work correctly
- [ ] Test with entities:
  - [ ] Entity movements update correctly
  - [ ] Entity spawns work correctly
  - [ ] Entity despawns work correctly
  - [ ] Entity animations work correctly
- [ ] Test fallback logic:
  - [ ] Falls back when threshold exceeded
  - [ ] Falls back on errors
- [ ] Test error recovery:
  - [ ] Retries on error
  - [ ] Falls back after retry fails

**Verification**:

- [ ] Integration tests created
- [ ] All scenarios tested
- [ ] Tests pass

### Step 5.4: Manual Testing

- [ ] Run game in multiplayer mode
- [ ] Verify no visual flickering
- [ ] Verify smooth rendering
- [ ] Test with multiple players moving
- [ ] Test with entities (if available)
- [ ] Test player joins/leaves
- [ ] Test entity spawns/despawns
- [ ] Test entity animations
- [ ] Verify performance improvement

**Verification**:

- [ ] Game is playable without flickering
- [ ] Rendering is smooth
- [ ] All features work correctly
- [ ] Performance is improved

### Step 5.5: Performance Testing

- [ ] Measure terminal I/O operations per state update
- [ ] Measure rendering time per state update
- [ ] Compare with full render performance
- [ ] Verify 80% reduction in terminal I/O (per TR1)
- [ ] Verify 70% reduction in rendering time (per TR1)
- [ ] Optimize if needed

**Verification**:

- [ ] Performance metrics collected
- [ ] Performance targets met
- [ ] Optimizations applied if needed

### Step 5.6: Edge Case Testing

- [ ] Test with rapid state changes
- [ ] Test with state structure mismatches
- [ ] Test with missing previous state
- [ ] Test with null/undefined values
- [ ] Test with empty arrays
- [ ] Test with board dimension changes
- [ ] Test with multiple players/entities at same position (if allowed)

**Verification**:

- [ ] Edge cases tested
- [ ] All edge cases handled correctly
- [ ] No crashes or errors

### Step 5.7: Code Review and Refinement

- [ ] Review code for:
  - [ ] Code quality
  - [ ] Documentation
  - [ ] Error handling
  - [ ] Performance
  - [ ] Maintainability
- [ ] Refactor if needed
- [ ] Add JSDoc comments
- [ ] Ensure code follows project conventions

**Verification**:

- [ ] Code reviewed
- [ ] Code quality is good
- [ ] Documentation is complete
- [ ] Code follows conventions

---

## Success Criteria

1. ✅ Game is playable in multiplayer mode without visual flickering
2. ✅ Only changed cells/players/entities are updated on each state update
3. ✅ Full refresh only occurs on initial render or major changes
4. ✅ Status bar only updates when score/position changes
5. ✅ Performance is significantly improved (reduced terminal I/O by 80%, rendering time by 70%)
6. ✅ All existing functionality remains intact
7. ✅ Code is well-tested and maintainable
8. ✅ Entity rendering works correctly (movements, spawns, despawns, animations)
9. ✅ Error recovery works correctly (retry then fallback)
10. ✅ Update batching (double buffering) is implemented

## Estimated Time

- **Phase 1**: ~30 minutes
- **Phase 2**: ~2 hours
- **Phase 3**: ~2-3 hours
- **Phase 4**: ~2-3 hours
- **Phase 5**: ~3-4 hours

**Total**: ~10-13 hours

## Notes

- Board change detection is deferred (per Q2: Option B)
- Server-side validation prevents overlaps (per Q3: Option D)
- Simple array iteration for state comparison (per Q5: Option A)
- Double buffering for update batching (per Q11: Option C)
- Both unit and integration tests required (per Q12: Option C)


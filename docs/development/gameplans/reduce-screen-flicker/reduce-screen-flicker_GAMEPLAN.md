# Gameplan: Reduce Screen Flicker with Incremental Rendering

## Overview

This gameplan breaks down the incremental rendering implementation into logical phases. The implementation follows Test-Driven Development (TDD) - write tests first, then implement code to make tests pass.

**Approach**: Build incrementally, starting with state comparison utility, then incremental rendering methods, and finally integrate into the rendering pipeline.

## Progress Summary

- ✅ **Phase 1: State Comparison Utility** - COMPLETE
- ⏳ **Phase 2: Incremental Rendering Methods** - NOT STARTED
- ⏳ **Phase 3: Rendering Pipeline Integration** - NOT STARTED
- ⏳ **Phase 4: Testing and Verification** - NOT STARTED

## Prerequisites

- ✅ MVP multiplayer game implemented and working
- ✅ Full screen rendering working correctly
- ✅ State updates received from server every 250ms
- ✅ All existing tests passing
- ✅ Enhancement card created
- ✅ SPECS document created

## Phase 1: State Comparison Utility (~30 minutes)

**Goal**: Create utility function to detect changes between game states.

### Step 1.1: Create State Comparison Module

**Location**: `src/utils/stateComparison.js`

**Action**:
- Create `compareStates(previousState, currentState)` function
- Handle null/undefined states (first render case)
- Compare players arrays:
  - Detect moved players (same playerId, different position)
  - Detect joined players (in current but not previous)
  - Detect left players (in previous but not current)
- Compare scores (simple equality check)
- Return structured change object

**Algorithm**:
1. Handle edge cases (null states)
2. Create `Map<playerId, position>` for previous state
3. Iterate current state players:
   - If not in map → `joined`
   - If in map and position changed → `moved`
4. Iterate previous state players:
   - If not in current → `left`
5. Compare scores

**Test**: Create test file `test/utils/stateComparison.test.js`
- Test first render (previousState === null)
- Test no changes
- Test player moved
- Test player joined
- Test player left
- Test score changed
- Test multiple changes simultaneously
- Test edge cases (null, missing arrays, invalid positions)

**Verification**:
- [x] stateComparison.js created
- [x] Test file created
- [x] Tests written
- [x] Tests pass

### Step 1.2: Export and Document

**Action**:
- Export `compareStates` function as default export
- Add JSDoc comments
- Document return structure
- Document edge cases

**Verification**:
- [x] Function exported correctly
- [x] Documentation complete
- [x] Code committed

**Phase 1 Completion Checklist**:
- [x] All steps completed
- [x] All tests passing
- [x] Code committed

---

## Phase 2: Incremental Rendering Methods (~45 minutes)

**Goal**: Add incremental rendering methods to Renderer class.

### Step 2.1: Add Cell Update Method

**Location**: `src/render/Renderer.js`

**Action**:
- Add `updateCell(x, y, character, color)` method:
  - Calculate screen coordinates (account for title offset)
  - Use ANSI escape codes to position cursor
  - Write character with color using chalk
  - Handle out-of-bounds gracefully

**Test**: Update `test/render/Renderer.test.js`
- Test updateCell updates correct position
- Test updateCell uses correct color
- Test updateCell handles out-of-bounds
- Test updateCell accounts for title offset

**Verification**:
- [ ] updateCell method added
- [ ] Tests written
- [ ] Tests pass

### Step 2.2: Add Cell Content Restoration Method

**Location**: `src/render/Renderer.js`

**Action**:
- Add `restoreCellContent(x, y, board, players, entities)` method:
  - Check for entities at position (future: top-most visible)
  - Check for other players at position
  - Fall back to board cell base character
  - Call `updateCell` with appropriate character and color

**Test**: Update `test/render/Renderer.test.js`
- Test restoreCellContent with board cell
- Test restoreCellContent with other player present
- Test restoreCellContent prioritizes player over board
- Test restoreCellContent handles out-of-bounds

**Verification**:
- [ ] restoreCellContent method added
- [ ] Tests written
- [ ] Tests pass

### Step 2.3: Add Incremental Render Method

**Location**: `src/render/Renderer.js`

**Action**:
- Add `renderIncremental(changes, board, players, entities, localPlayerId)` method:
  - Process moved players:
    - Restore cell content at old position
    - Draw player at new position
  - Process joined players:
    - Draw player at spawn position
  - Process left players:
    - Restore cell content at position
  - Update status bar if score changed
  - Handle errors gracefully (throw for fallback)

**Test**: Update `test/render/Renderer.test.js`
- Test renderIncremental with moved player
- Test renderIncremental with joined player
- Test renderIncremental with left player
- Test renderIncremental with multiple changes
- Test renderIncremental updates status bar when score changed
- Test renderIncremental handles errors

**Verification**:
- [ ] renderIncremental method added
- [ ] Tests written
- [ ] Tests pass

**Phase 2 Completion Checklist**:
- [ ] All steps completed
- [ ] All tests passing
- [ ] Code committed

---

## Phase 3: Rendering Pipeline Integration (~30 minutes)

**Goal**: Integrate incremental rendering into networked mode rendering pipeline.

### Step 3.1: Add Previous State Tracking

**Location**: `src/modes/networkedMode.js`

**Action**:
- Add `previousState` variable (initialized to `null`)
- Store state after each successful render
- Update `previousState` after render completes

**Test**: Manual test - verify state tracking works

**Verification**:
- [ ] previousState variable added
- [ ] State stored after render
- [ ] Manual test confirms tracking

### Step 3.2: Update Render Function

**Location**: `src/modes/networkedMode.js`

**Action**:
- Update `render()` function:
  - Import `compareStates` from stateComparison
  - Check if `previousState === null` → use full render
  - Otherwise: compare states, use incremental render
  - Calculate total changes
  - Fallback to full render if changes > 10
  - Wrap incremental render in try-catch (fallback on error)
  - Update `previousState` after successful render

**Logic**:
```javascript
function render() {
  if (!currentState) return;
  
  try {
    // First render: full render
    if (previousState === null) {
      renderer.clearScreen();
      renderer.renderTitle();
      renderer.renderBoard(board, currentState.players || []);
      const localPlayer = currentState.players?.find(p => p.playerId === localPlayerId);
      const position = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
      renderer.renderStatusBar(currentState.score || 0, position);
      previousState = currentState;
      return;
    }
    
    // Compare states
    const changes = compareStates(previousState, currentState);
    const totalChanges = 
      changes.players.moved.length +
      changes.players.joined.length +
      changes.players.left.length;
    
    // Fallback to full render if too many changes
    if (totalChanges > 10) {
      renderer.clearScreen();
      renderer.renderTitle();
      renderer.renderBoard(board, currentState.players || []);
      const localPlayer = currentState.players?.find(p => p.playerId === localPlayerId);
      const position = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
      renderer.renderStatusBar(currentState.score || 0, position);
      previousState = currentState;
      return;
    }
    
    // Incremental render
    const otherPlayers = (currentState.players || []).filter(
      p => p.playerId !== localPlayerId
    );
    renderer.renderIncremental(
      changes,
      board,
      otherPlayers,
      currentState.entities || [],
      localPlayerId
    );
    
    // Update status bar if score changed
    if (changes.scoreChanged) {
      const localPlayer = currentState.players?.find(p => p.playerId === localPlayerId);
      const position = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
      renderer.renderStatusBar(currentState.score || 0, position);
    }
    
    previousState = currentState;
  } catch (error) {
    logger.error('Error during incremental render, falling back to full render:', error);
    // Fallback to full render
    renderer.clearScreen();
    renderer.renderTitle();
    renderer.renderBoard(board, currentState.players || []);
    const localPlayer = currentState.players?.find(p => p.playerId === localPlayerId);
    const position = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
    renderer.renderStatusBar(currentState.score || 0, position);
    previousState = currentState;
  }
}
```

**Test**: Manual test - verify rendering works correctly

**Verification**:
- [ ] render() function updated
- [ ] compareStates imported
- [ ] Full render on first render
- [ ] Incremental render on subsequent renders
- [ ] Fallback works correctly
- [ ] Manual test confirms smooth rendering

### Step 3.3: Handle Local Player Exclusion

**Action**:
- Ensure local player is excluded from server state rendering
- Filter players array: `players.filter(p => p.playerId !== localPlayerId)`
- Pass filtered array to renderIncremental

**Verification**:
- [ ] Local player excluded from rendering
- [ ] No double-rendering of local player

**Phase 3 Completion Checklist**:
- [ ] All steps completed
- [ ] Rendering pipeline integrated
- [ ] Manual testing confirms smooth rendering
- [ ] Code committed

---

## Phase 4: Testing and Verification (~30 minutes)

**Goal**: Comprehensive testing and verification of incremental rendering.

### Step 4.1: Unit Test Coverage

**Action**:
- Review all unit tests
- Ensure edge cases covered:
  - Null/undefined states
  - Missing players arrays
  - Invalid positions
  - Empty states
- Run all tests, verify 100% pass

**Verification**:
- [ ] All unit tests pass
- [ ] Edge cases covered
- [ ] Test coverage adequate

### Step 4.2: Integration Testing

**Action**:
- Test full rendering pipeline:
  - First render uses full render
  - Subsequent renders use incremental
  - Fallback triggers correctly
  - State tracking works correctly
- Test with multiple players:
  - Multiple players moving simultaneously
  - Players joining/leaving
  - All changes detected correctly

**Verification**:
- [ ] Integration tests pass
- [ ] Multiple player scenarios work
- [ ] State tracking correct

### Step 4.3: Manual Testing

**Action**:
- Start server and client
- Move player around board
- Verify no flicker during movement
- Verify smooth updates
- Test with multiple clients:
  - Start 2-3 clients
  - Move players simultaneously
  - Verify all see smooth updates
  - Verify no flicker

**Verification**:
- [ ] No visible flicker during gameplay
- [ ] Smooth player movement
- [ ] Multi-player rendering smooth
- [ ] Performance acceptable

### Step 4.4: Performance Verification

**Action**:
- Add timing logs (optional, for verification):
  - Log render time for full vs incremental
  - Compare terminal I/O operations
- Verify incremental render is faster for typical updates
- Remove timing logs before commit

**Verification**:
- [ ] Performance improvement confirmed
- [ ] Incremental render faster for typical updates
- [ ] No performance regressions

**Phase 4 Completion Checklist**:
- [ ] All tests passing
- [ ] Manual testing successful
- [ ] Performance verified
- [ ] No visible flicker
- [ ] Code committed

---

## Completion Checklist

- [ ] All phases completed
- [ ] All tests passing
- [ ] No visible flicker during gameplay
- [ ] Smooth rendering with multiple players
- [ ] Performance improvement confirmed
- [ ] Code committed
- [ ] Enhancement card updated to COMPLETE
- [ ] Enhancement card renamed with "X_" prefix (if applicable)

## Notes

- Follow TDD: Write tests first, then implement code
- Commit after each phase step
- Test manually as we go (verify no flicker)
- Keep code simple and maintainable
- Fallback to full render ensures reliability
- Future enhancements can build on this foundation

## Implementation Tips

1. **Start Simple**: Begin with player-only change detection (no entities)
2. **Test Incrementally**: Test each component separately before integration
3. **Visual Verification**: Manual testing is crucial for flicker detection
4. **Error Handling**: Always fallback to full render on errors
5. **Performance**: Don't over-optimize; simple Map-based comparison is sufficient

## Future Enhancements

- Entity change detection (when entities are added)
- Board mutation detection (destructible walls)
- Animation frame updates
- Configurable change threshold
- Performance metrics and monitoring

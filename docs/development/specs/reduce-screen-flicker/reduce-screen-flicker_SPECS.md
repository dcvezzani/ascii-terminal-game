# Specification: Reduce Screen Flicker with Incremental Rendering

## Overview

This specification defines the implementation of incremental rendering to eliminate screen flicker in the multiplayer terminal game. The current MVP implementation uses full screen re-rendering on every state update (every 250ms), causing noticeable flicker. This enhancement implements change detection and incremental cell updates to provide smooth, flicker-free rendering.

**Purpose**: Improve user experience by eliminating screen flicker through incremental rendering that only updates changed cells instead of re-rendering the entire screen.

## Problem Statement

**Current Behavior**:
- Every 250ms, the server sends a `STATE_UPDATE` message
- The client receives the update and calls `renderer.clearScreen()`
- The entire 20x20 board (400 cells) is re-rendered from scratch
- This causes visible flicker, especially during player movement
- Unnecessary terminal I/O operations for unchanged cells

**Impact**:
- Poor visual experience with noticeable flicker
- Difficulty tracking player position during movement
- Unnecessary performance overhead (rendering 400 cells when only 1-2 changed)
- Reduced perceived responsiveness

## Solution

Implement incremental rendering system that:
1. **Detects Changes**: Compare previous state with current state to identify what changed
2. **Updates Selectively**: Only render cells that have changed (players moved, joined, left)
3. **Restores Cell Content**: When clearing a position, restore what was underneath
4. **Falls Back Gracefully**: Use full render when necessary (initial render, too many changes, errors)

## Requirements

### Functional Requirements

#### 1. State Comparison Utility

**Location**: `src/utils/stateComparison.js`

**Function**: `compareStates(previousState, currentState)`

**Purpose**: Efficiently detect changes between two game states.

**Input**:
- `previousState`: Previous game state object (or `null` for first render)
- `currentState`: Current game state object

**Output**: Change detection object:
```javascript
{
  players: {
    moved: [
      {
        playerId: string,
        oldPos: { x: number, y: number },
        newPos: { x: number, y: number }
      }
    ],
    joined: [
      {
        playerId: string,
        pos: { x: number, y: number },
        playerName: string
      }
    ],
    left: [
      {
        playerId: string,
        pos: { x: number, y: number }
      }
    ]
  },
  scoreChanged: boolean
}
```

**Algorithm**:
1. **Player Comparison**:
   - Create `Map<playerId, {x, y}>` for previous state players
   - Iterate current state players:
     - If `playerId` not in map → add to `joined` array
     - If `playerId` in map and position changed → add to `moved` array
   - Iterate previous state players:
     - If `playerId` not in current state → add to `left` array

2. **Score Comparison**:
   - Simple equality check: `previousState.score !== currentState.score`

**Performance**: O(n) where n is number of players, using Map for O(1) lookups.

**Edge Cases**:
- `previousState === null`: Return all current players as `joined`, `scoreChanged = false`
- `currentState === null`: Return all previous players as `left`
- Missing players array: Treat as empty array
- Invalid positions: Skip invalid entries, log warning

#### 2. Incremental Rendering Method

**Location**: `src/render/Renderer.js`

**New Method**: `renderIncremental(changes, board, players, entities, localPlayerId)`

**Purpose**: Update only changed cells instead of full screen render.

**Parameters**:
- `changes`: Change detection object from `compareStates()`
- `board`: Board instance or adapter object
- `players`: Array of player objects (excluding local player)
- `entities`: Array of entity objects (empty for MVP)
- `localPlayerId`: ID of local player (to exclude from rendering)

**Behavior**:

1. **Process Moved Players**:
   - For each moved player:
     - Clear old position: Restore cell content at `oldPos`
     - Draw player at new position: Render player character at `newPos`

2. **Process Joined Players**:
   - For each joined player:
     - Draw player at spawn position

3. **Process Left Players**:
   - For each left player:
     - Clear position: Restore cell content at position

4. **Update Status Bar**:
   - Only if `scoreChanged === true` or local player position changed
   - Re-render status bar with updated information

**Cell Content Restoration**:
When clearing a position (x, y), determine what to render:
1. Check for entities at position (top-most visible entity)
2. Check for other players at position
3. Fall back to board cell base character (`board.getCell(x, y)`)

**Cell Update Method**:
- `updateCell(x, y, character, color)`: Update single cell at position
- Uses ANSI escape codes to position cursor: `cursorTo(x + 1, y + offset + 1)`
- Writes character with color using chalk

#### 3. Rendering Pipeline Updates

**Location**: `src/modes/networkedMode.js`

**Update `render()` function**:

**Current State Tracking**:
- Add `previousState` variable (initialized to `null`)
- Store state after each successful render

**Rendering Logic**:
```javascript
function render() {
  if (!currentState) return;
  
  try {
    // First render: use full render
    if (previousState === null) {
      renderer.clearScreen();
      renderer.renderTitle();
      renderer.renderBoard(board, currentState.players || []);
      renderer.renderStatusBar(currentState.score || 0, localPlayerPosition);
      previousState = currentState;
      return;
    }
    
    // Subsequent renders: use incremental
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
      renderer.renderStatusBar(currentState.score || 0, localPlayerPosition);
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
    
    previousState = currentState;
  } catch (error) {
    // Fallback to full render on error
    logger.error('Error during incremental render, falling back to full render:', error);
    renderer.clearScreen();
    renderer.renderTitle();
    renderer.renderBoard(board, currentState.players || []);
    renderer.renderStatusBar(currentState.score || 0, localPlayerPosition);
    previousState = currentState;
  }
}
```

**Fallback Conditions**:
1. **Too Many Changes**: More than 10 changes (configurable threshold)
2. **Error During Update**: Any exception during incremental render
3. **First Render**: `previousState === null`
4. **Modal State Changed**: If modal system is added later

#### 4. Local Player Handling

**Exclusion from Server State**:
- Local player is excluded from server state rendering
- Local player uses predicted position (rendered separately if prediction is implemented)
- Prevents double-rendering of local player
- Filter players array: `players.filter(p => p.playerId !== localPlayerId)`

**Status Bar Updates**:
- Update status bar when local player position changes
- Update status bar when score changes
- Don't update status bar for other players' movements

### Non-Functional Requirements

1. **Performance**:
   - Incremental rendering should be faster than full render for typical updates (1-3 changes)
   - Terminal I/O operations should be minimized (only changed cells)
   - Change detection should be O(n) where n is number of players

2. **Correctness**:
   - All changes must be accurately detected
   - All changed cells must be correctly updated
   - Cell content restoration must be accurate
   - No visual artifacts or missing updates

3. **Reliability**:
   - Fallback to full render on errors
   - Handle edge cases gracefully (null states, missing players, invalid positions)
   - No crashes or unhandled exceptions

4. **Maintainability**:
   - Clear separation between change detection and rendering
   - Well-documented functions
   - Testable components (state comparison separate from rendering)

## Data Model

### Change Detection Object

```javascript
{
  players: {
    moved: Array<{
      playerId: string,
      oldPos: { x: number, y: number },
      newPos: { x: number, y: number }
    }>,
    joined: Array<{
      playerId: string,
      pos: { x: number, y: number },
      playerName: string
    }>,
    left: Array<{
      playerId: string,
      pos: { x: number, y: number }
    }>
  },
  scoreChanged: boolean
}
```

### State Structure

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
  score: number
}
```

## Implementation Details

### File Structure

**New Files**:
- `src/utils/stateComparison.js`: State comparison utility

**Modified Files**:
- `src/render/Renderer.js`: Add `renderIncremental()` and `updateCell()` methods
- `src/modes/networkedMode.js`: Update `render()` function to use incremental rendering

### State Comparison Implementation

**Algorithm**:
```javascript
export function compareStates(previousState, currentState) {
  const changes = {
    players: { moved: [], joined: [], left: [] },
    scoreChanged: false
  };
  
  // Handle null states
  if (!previousState) {
    if (currentState && currentState.players) {
      changes.players.joined = currentState.players.map(p => ({
        playerId: p.playerId,
        pos: { x: p.x, y: p.y },
        playerName: p.playerName
      }));
    }
    changes.scoreChanged = false;
    return changes;
  }
  
  if (!currentState) {
    if (previousState.players) {
      changes.players.left = previousState.players.map(p => ({
        playerId: p.playerId,
        pos: { x: p.x, y: p.y }
      }));
    }
    return changes;
  }
  
  // Create map of previous players
  const prevPlayerMap = new Map();
  if (previousState.players) {
    previousState.players.forEach(p => {
      prevPlayerMap.set(p.playerId, { x: p.x, y: p.y });
    });
  }
  
  // Compare current players
  if (currentState.players) {
    currentState.players.forEach(p => {
      const prevPos = prevPlayerMap.get(p.playerId);
      if (!prevPos) {
        // Player joined
        changes.players.joined.push({
          playerId: p.playerId,
          pos: { x: p.x, y: p.y },
          playerName: p.playerName
        });
      } else if (prevPos.x !== p.x || prevPos.y !== p.y) {
        // Player moved
        changes.players.moved.push({
          playerId: p.playerId,
          oldPos: prevPos,
          newPos: { x: p.x, y: p.y }
        });
      }
      prevPlayerMap.delete(p.playerId);
    });
  }
  
  // Remaining players in map have left
  prevPlayerMap.forEach((pos, playerId) => {
    changes.players.left.push({
      playerId,
      pos
    });
  });
  
  // Compare scores
  changes.scoreChanged = 
    (previousState.score || 0) !== (currentState.score || 0);
  
  return changes;
}
```

### Incremental Rendering Implementation

**Renderer Methods**:
```javascript
// New method in Renderer class
renderIncremental(changes, board, players, entities, localPlayerId) {
  // Process moved players
  for (const moved of changes.players.moved) {
    // Clear old position
    this.restoreCellContent(
      moved.oldPos.x,
      moved.oldPos.y,
      board,
      players,
      entities
    );
    
    // Draw at new position
    this.updateCell(
      moved.newPos.x,
      moved.newPos.y,
      '@',
      '00FF00' // Green
    );
  }
  
  // Process joined players
  for (const joined of changes.players.joined) {
    this.updateCell(
      joined.pos.x,
      joined.pos.y,
      '@',
      '00FF00'
    );
  }
  
  // Process left players
  for (const left of changes.players.left) {
    this.restoreCellContent(
      left.pos.x,
      left.pos.y,
      board,
      players,
      entities
    );
  }
  
  // Update status bar if needed
  if (changes.scoreChanged) {
    // Status bar update logic
  }
}

updateCell(x, y, character, color) {
  const colorFn = this.getColorFunction(color);
  const screenX = x + 1; // 1-indexed
  const screenY = y + this.titleOffset + 1; // Account for title
  
  this.stdout.write(cursorTo(screenX, screenY));
  this.stdout.write(colorFn(character));
}

restoreCellContent(x, y, board, players, entities) {
  // Check for entities (future)
  // Check for other players
  const otherPlayer = players.find(p => p.x === x && p.y === y);
  if (otherPlayer) {
    this.updateCell(x, y, '@', '00FF00');
    return;
  }
  
  // Fall back to board cell
  const cellChar = board.getCell(x, y);
  const color = cellChar === '#' ? '808080' : 'FFFFFF';
  this.updateCell(x, y, cellChar, color);
}
```

### Rendering Pipeline Integration

**Updated render() function**:
- Store `previousState` variable
- Compare states on each update
- Choose incremental or full render based on conditions
- Update `previousState` after successful render

## Testing Requirements

### Unit Tests

#### State Comparison Tests

**File**: `test/utils/stateComparison.test.js`

**Test Cases**:
1. **First Render** (`previousState === null`):
   - Returns all current players as `joined`
   - `scoreChanged = false`

2. **No Changes**:
   - Empty arrays for moved, joined, left
   - `scoreChanged = false`

3. **Player Moved**:
   - Player in both states with different position
   - Added to `moved` array with correct old/new positions

4. **Player Joined**:
   - Player in current state but not previous
   - Added to `joined` array

5. **Player Left**:
   - Player in previous state but not current
   - Added to `left` array

6. **Score Changed**:
   - `scoreChanged = true` when scores differ

7. **Multiple Changes**:
   - Multiple players moved, joined, left simultaneously
   - All changes detected correctly

8. **Edge Cases**:
   - Null/undefined states
   - Missing players arrays
   - Invalid positions

#### Incremental Rendering Tests

**File**: `test/render/Renderer.test.js` (add to existing)

**Test Cases**:
1. **Moved Player**:
   - Old position cleared and restored
   - New position shows player

2. **Joined Player**:
   - Player appears at spawn position

3. **Left Player**:
   - Position cleared and restored

4. **Cell Content Restoration**:
   - Restores board cell when no entities/players
   - Restores other player when present
   - Restores entity when present (future)

5. **Status Bar Update**:
   - Updates only when score changes
   - Updates only when local player position changes

### Integration Tests

**File**: `test/modes/networkedMode.test.js` (add to existing)

**Test Cases**:
1. **First Render Uses Full Render**:
   - `previousState === null` triggers full render

2. **Subsequent Renders Use Incremental**:
   - Small changes (< 10) use incremental render
   - Only changed cells updated

3. **Fallback to Full Render**:
   - Too many changes (> 10) triggers full render
   - Error during incremental triggers full render

4. **State Tracking**:
   - `previousState` updated after each render
   - State comparison works correctly

### Manual Testing

1. **Visual Verification**:
   - Start server and client
   - Move player around board
   - Verify no flicker during movement
   - Verify smooth updates

2. **Multi-Player Testing**:
   - Start multiple clients
   - Move players simultaneously
   - Verify all players see smooth updates
   - Verify no flicker with multiple players

3. **Performance Testing**:
   - Compare render times (full vs incremental)
   - Monitor terminal I/O operations
   - Verify performance improvement

## Success Criteria

1. **Visual Quality**:
   - ✅ No visible flicker during normal gameplay
   - ✅ Smooth player movement updates
   - ✅ No visual artifacts or missing updates

2. **Performance**:
   - ✅ Incremental render faster than full render for typical updates
   - ✅ Reduced terminal I/O operations (only changed cells)
   - ✅ Change detection completes in < 1ms for typical state

3. **Correctness**:
   - ✅ All player movements detected and rendered
   - ✅ All player joins/leaves detected and rendered
   - ✅ Cell content restoration accurate
   - ✅ Status bar updates correctly

4. **Reliability**:
   - ✅ Fallback to full render works on errors
   - ✅ Handles edge cases gracefully
   - ✅ No crashes or unhandled exceptions

5. **Testing**:
   - ✅ All unit tests pass
   - ✅ Integration tests pass
   - ✅ Manual testing confirms smooth rendering

## Related Features

- **Future**: Entity change detection (when entities are added)
- **Future**: Client-side prediction integration (local player rendering)
- **Future**: Modal system integration (full render on modal state change)
- **Future**: Animation support (entity animations)

## Migration Notes

### Backward Compatibility

- Full render still works as fallback
- No breaking changes to existing rendering API
- Incremental rendering is additive enhancement

### Future Enhancements

This implementation focuses on players only. Future enhancements can add:
- Entity change detection
- Board mutation detection (destructible walls)
- Animation frame updates
- Configurable change threshold

## References

- **Enhancement Card**: `docs/development/cards/enhancements/ENHANCEMENT_reduce_screen_flicker.md`
- **Client Architecture Spec**: `docs/development/specs/client-architecture_SPEC.md`
  - Section: "Incremental Rendering" (lines 557-600)
  - Section: "Rendering System" (lines 367-419)
  - Section: "State Comparison" (lines 236-250)
- **Server Architecture Spec**: `docs/development/specs/server-architecture_SPECS/README.md`
  - Section: "State Update Flow" (lines 236-247)

## Summary

This specification defines the implementation of incremental rendering to eliminate screen flicker. The solution uses efficient change detection (O(n) with Map lookups) and selective cell updates to provide smooth, flicker-free rendering while maintaining backward compatibility through full render fallback.

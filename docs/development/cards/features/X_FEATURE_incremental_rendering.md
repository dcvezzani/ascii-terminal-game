# Feature: Incremental Rendering for Multiplayer Mode

## Context

The application now supports multiplayer mode via WebSocket integration:

- **Server**: Broadcasts full game state updates every 250ms (4 updates/second) to all connected clients
- **Client**: Receives full game state via `STATE_UPDATE` messages in `src/index.js`
- **Renderer**: Currently calls `renderFull()` on every state update, which performs a full screen clear and redraw

**Current Architecture**:

- `src/render/Renderer.js` - Handles all terminal rendering
  - `renderFull()` - Clears entire screen and redraws everything (used in networked mode)
  - `updateCell(x, y, char, colorFn)` - Updates a single cell (exists but not used in networked mode)
  - `updatePlayerPosition(oldX, oldY, newX, newY, board)` - Updates player position incrementally (used in local mode only)
- `src/index.js` - Client entry point
  - `runNetworkedMode()` - Handles WebSocket client and state updates
  - `wsClient.onStateUpdate()` - Calls `renderer.renderFull()` on every state update
- `src/server/index.js` - WebSocket server
  - Broadcasts `STATE_UPDATE` messages every 250ms with full game state

**Location**: Implementation will be in:

- `src/render/Renderer.js` - Add incremental update methods for networked mode
- `src/index.js` - Track previous state and call incremental updates instead of `renderFull()`

## Problem

**Current State**:

- Every `STATE_UPDATE` message (4 times per second) triggers a full screen refresh
- `renderFull()` calls `clearScreen()` which clears the entire terminal
- All board cells are redrawn even if nothing changed
- Status bar is redrawn even if score/position unchanged
- This causes:
  - **Visual flickering** - Screen constantly clearing and redrawing
  - **Poor performance** - Unnecessary terminal I/O operations
  - **Unusable gameplay** - Constant full refreshes make the game difficult to play
  - **High CPU usage** - Redrawing entire board 4 times per second

**Desired State**:

- Client receives full state from server (no change to server behavior)
- Client tracks previous state to detect changes
- Only changed cells are updated (player positions, board changes)
- Status bar only updates when score/position changes
- Full refresh only occurs when necessary (initial render, major state changes)
- Smooth, flicker-free rendering experience

## Desired Feature

Implement incremental/differential rendering for multiplayer mode:

1. **State Tracking**
   - Maintain previous game state in client (`src/index.js`)
   - Compare new state with previous state to detect changes
   - Track: player positions, board cells, score

2. **Incremental Update Methods**
   - Extend `Renderer` class with methods for incremental updates:
     - `updatePlayers(previousPlayers, currentPlayers, board)` - Update only changed player positions
     - `updateBoardCell(x, y, cell)` - Update a single board cell if changed
     - `updateStatusBar(score, x, y, previousScore, previousX, previousY)` - Update status bar only if changed
   - Reuse existing `updateCell()` method

3. **Smart Rendering Logic**
   - On first state update: Use `renderFull()` for initial render
   - On subsequent updates: Use incremental updates
   - Detect what changed:
     - **Player movements**: Update old position (restore cell) and new position (draw player)
     - **Player joins/leaves**: Update affected cells
     - **Board changes**: Update changed cells (if board is mutable)
     - **Score changes**: Update status bar only if score changed

4. **Fallback to Full Refresh**
   - Use full refresh when:
     - First render (no previous state)
     - Major state changes (board size changes, too many changes to track efficiently)
     - Error conditions (state mismatch, rendering errors)

## Requirements

### Functional Requirements

1. **Incremental Player Updates**
   - Track previous player positions
   - When player moves: clear old position, draw new position
   - When player joins: draw player at new position
   - When player leaves: clear player position, restore cell

2. **Incremental Board Updates**
   - Track previous board state (if board is mutable)
   - Update only cells that changed
   - Handle board initialization (first render)

3. **Incremental Status Bar Updates**
   - Only update status bar when score or position changes
   - Avoid unnecessary status bar redraws

4. **State Comparison**
   - Efficiently compare previous and current state
   - Identify changed players (positions, joins, leaves)
   - Identify changed board cells (if applicable)
   - Identify changed score

### Technical Requirements

1. **Performance**
   - Minimize terminal I/O operations
   - Only update visible changes
   - Avoid unnecessary cursor movements

2. **Reliability**
   - Handle edge cases (missing previous state, state mismatches)
   - Fallback to full refresh on errors
   - Ensure state consistency

3. **Compatibility**
   - Maintain backward compatibility with local mode
   - Don't break existing `renderFull()` functionality
   - Support both single-player and multiplayer rendering

### Non-Functional Requirements

1. **Code Quality**
   - Clean, maintainable code
   - Well-documented methods
   - Follow existing code patterns

2. **Testing**
   - Unit tests for state comparison logic
   - Integration tests for incremental rendering
   - Verify no visual artifacts or flickering

## Implementation Approach

### Phase 1: State Tracking

- Add `previousState` variable in `runNetworkedMode()` in `src/index.js`
- Store previous game state after each render
- Initialize `previousState = null` for first render

### Phase 2: State Comparison Utilities

- Create helper functions to compare states:
  - `comparePlayers(prev, curr)` - Returns array of player changes (moved, joined, left)
  - `compareBoard(prev, curr)` - Returns array of changed cells (if board is mutable)
  - `compareScore(prev, curr)` - Returns boolean if score changed

### Phase 3: Incremental Renderer Methods

- Add to `Renderer` class:
  - `updatePlayersIncremental(previousPlayers, currentPlayers, board)` - Handle player position updates
  - `updateStatusBarIfChanged(score, x, y, previousScore, previousX, previousY)` - Conditional status bar update
  - `updateBoardCell(x, y, cell)` - Update single cell (may already exist)

### Phase 4: Integration

- Modify `wsClient.onStateUpdate()` in `src/index.js`:
  - Check if `previousState === null` → use `renderFull()` (first render)
  - Otherwise → use incremental updates
  - Update `previousState` after rendering

### Phase 5: Testing and Refinement

- Test with multiple players moving simultaneously
- Test player joins/leaves
- Test edge cases (rapid state changes, state mismatches)
- Optimize performance if needed

## Technical Details

### State Structure

Current state structure from server:

```javascript
{
  board: {
    width: number,
    height: number,
    grid: string[][]  // 2D array of characters
  },
  players: [
    {
      playerId: string,
      x: number,
      y: number,
      playerName: string
    }
  ],
  score: number
}
```

### Player Change Detection

```javascript
function getPlayerChanges(previousPlayers, currentPlayers) {
  const changes = {
    moved: [], // { playerId, oldX, oldY, newX, newY }
    joined: [], // { playerId, x, y }
    left: [], // { playerId, x, y }
  };

  // Compare previous and current players
  // Identify moves, joins, and leaves

  return changes;
}
```

### Incremental Update Flow

1. Receive new state from server
2. If `previousState === null`:
   - Call `renderer.renderFull()` (initial render)
   - Store state as `previousState`
3. Else:
   - Compare `previousState` with new state
   - For each player change:
     - If moved: `renderer.updateCell(oldX, oldY, boardCell)` then `renderer.updateCell(newX, newY, playerChar)`
     - If joined: `renderer.updateCell(x, y, playerChar)`
     - If left: `renderer.updateCell(x, y, boardCell)`
   - If score changed: `renderer.updateStatusBar(newScore, x, y)`
   - Store new state as `previousState`

## Testing Strategy

### Unit Tests

1. **State Comparison**
   - Test `comparePlayers()` with various scenarios
   - Test `compareBoard()` (if board is mutable)
   - Test `compareScore()`

2. **Renderer Methods**
   - Test `updatePlayersIncremental()` with different player changes
   - Test `updateStatusBarIfChanged()` with changed/unchanged values

### Integration Tests

1. **Incremental Rendering**
   - Test full render on first state update
   - Test incremental updates on subsequent updates
   - Test with multiple players moving
   - Test player joins and leaves

2. **Performance**
   - Measure terminal I/O operations
   - Verify reduced screen flickering
   - Test with high update rates

### Manual Testing

1. **Visual Verification**
   - Run game in multiplayer mode
   - Verify smooth rendering without flickering
   - Verify all players render correctly
   - Verify status bar updates correctly

## Future Enhancements

1. **Optimization**
   - Batch multiple cell updates into single cursor movement
   - Use double buffering if needed
   - Optimize state comparison algorithms

2. **Advanced Features**
   - Support for board changes (if board becomes mutable)
   - Support for animated updates
   - Support for partial board updates (chunks)

3. **Configuration**
   - Configurable update strategy (full vs incremental)
   - Configurable fallback thresholds

## Dependencies

- Existing `Renderer` class methods
- Existing `updateCell()` method
- WebSocket state update mechanism (already implemented)
- No new external dependencies required

## Success Criteria

1. ✅ Game is playable in multiplayer mode without visual flickering
2. ✅ Only changed cells/players are updated on each state update
3. ✅ Full refresh only occurs on initial render or major changes
4. ✅ Status bar only updates when score/position changes
5. ✅ Performance is significantly improved (reduced terminal I/O)
6. ✅ All existing functionality remains intact
7. ✅ Code is well-tested and maintainable

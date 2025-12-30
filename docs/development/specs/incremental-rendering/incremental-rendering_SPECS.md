# Specification: Incremental Rendering for Multiplayer Mode

## Overview

This specification details the implementation of incremental/differential rendering for multiplayer mode to eliminate full screen refreshes and improve performance. The implementation will track previous game state and only update changed cells/players, resulting in smooth, flicker-free rendering.

**Reference Card**: `docs/development/cards/features/FEATURE_incremental_rendering.md`

## Goals

1. Eliminate full screen refreshes on every state update
2. Implement incremental rendering that only updates changed cells/players
3. Maintain smooth, flicker-free gameplay experience
4. Improve performance by reducing terminal I/O operations
5. Maintain backward compatibility with existing rendering methods
6. Support both single-player and multiplayer rendering modes

## Current State

**Current Architecture**:

- `src/render/Renderer.js` - Handles all terminal rendering
  - `renderFull()` - Clears entire screen and redraws everything (used in networked mode)
  - `updateCell(x, y, char, colorFn)` - Updates a single cell (exists but not used in networked mode)
  - `updatePlayerPosition(oldX, oldY, newX, newY, board)` - Updates player position incrementally (used in local mode only)
- `src/index.js` - Client entry point
  - `runNetworkedMode()` - Handles WebSocket client and state updates
  - `wsClient.onStateUpdate()` - Calls `renderer.renderFull()` on every state update
- `src/server/index.js` - WebSocket server
  - Broadcasts `STATE_UPDATE` messages every 250ms (4 updates/second) with full game state

**Current Game Flow (Networked Mode)**:

1. Server broadcasts `STATE_UPDATE` every 250ms
2. Client receives full game state
3. Client calls `renderer.renderFull()` which:
   - Clears entire screen (`clearScreen()`)
   - Redraws title
   - Redraws entire board (all cells)
   - Redraws status bar
4. This happens 4 times per second, causing constant flickering

**Issues**:

- Full screen refresh on every state update (4 times/second)
- All cells redrawn even if nothing changed
- Status bar redrawn even if score/position unchanged
- Visual flickering makes game unusable
- High CPU usage from unnecessary terminal I/O
- Poor performance and user experience

## Target State

**New Architecture**:

- `src/render/Renderer.js` - Enhanced with incremental update methods
  - `updatePlayersIncremental(previousPlayers, currentPlayers, board)` - Update only changed player positions
  - `updateEntitiesIncremental(previousEntities, currentEntities, board)` - Update only changed entity positions and animations
  - `updateStatusBarIfChanged(score, x, y, previousScore, previousX, previousY)` - Conditional status bar update
  - `updateBoardCell(x, y, cell)` - Update single board cell (may already exist)
- `src/index.js` - Enhanced state tracking
  - Track `previousState` variable
  - Compare previous and current state
  - Call incremental updates instead of `renderFull()` on subsequent updates
- `src/utils/stateComparison.js` (optional) - State comparison utilities
  - `comparePlayers(prev, curr)` - Detect player changes
  - `compareEntities(prev, curr)` - Detect entity changes (moves, spawns, despawns, animations)
  - `compareBoard(prev, curr)` - Detect board changes
  - `compareScore(prev, curr)` - Detect score changes

**New Game Flow (Networked Mode)**:

1. Server broadcasts `STATE_UPDATE` every 250ms
2. Client receives full game state
3. Client compares with `previousState`:
   - If `previousState === null` → Use `renderFull()` (initial render)
   - Otherwise → Use incremental updates:
     - Update changed player positions
     - Update changed board cells (if any)
     - Update status bar only if score/position changed
4. Store current state as `previousState`
5. Smooth, flicker-free rendering

**Benefits**:

- Only changed cells/players are updated
- No full screen refreshes on every update
- Smooth, flicker-free gameplay
- Reduced terminal I/O operations
- Better performance and user experience
- Maintains backward compatibility

## Functional Requirements

### FR1: State Tracking

**Requirement**: Client must track previous game state to enable state comparison.

**Details**:

- Maintain `previousState` variable in `runNetworkedMode()` function
- Store full game state after each render
- Initialize `previousState = null` for first render
- Update `previousState` after each successful render

**State Structure**:

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

**Acceptance Criteria**:

- [ ] `previousState` is initialized to `null` on first render
- [ ] `previousState` is updated after each render
- [ ] `previousState` persists across state updates
- [ ] State structure matches server state structure

### FR2: State Comparison

**Requirement**: Client must compare previous and current state to detect changes.

**Details**:

- Compare player arrays to detect:
  - **Moved players**: Same `playerId`, different `x` or `y`
  - **Joined players**: `playerId` in current but not in previous
  - **Left players**: `playerId` in previous but not in current
- Compare entity arrays to detect:
  - **Moved entities**: Same `entityId`, different `x` or `y`
  - **Spawned entities**: `entityId` in current but not in previous
  - **Despawned entities**: `entityId` in previous but not in current
  - **Animated entities**: Same `entityId` and position, different visual representation (glyph, animation frame, etc.)
- Compare board grid to detect changed cells (if board is mutable)
- Compare score to detect changes
- Return structured change information

**Change Detection Structure**:

```javascript
{
  players: {
    moved: [
      { playerId: string, oldX: number, oldY: number, newX: number, newY: number }
    ],
    joined: [
      { playerId: string, x: number, y: number, playerName: string }
    ],
    left: [
      { playerId: string, x: number, y: number }
    ]
  },
  entities: {
    moved: [
      { entityId: string, oldX: number, oldY: number, newX: number, newY: number, entityType: string }
    ],
    spawned: [
      { entityId: string, x: number, y: number, entityType: string, glyph?: string, animationFrame?: number }
    ],
    despawned: [
      { entityId: string, x: number, y: number }
    ],
    animated: [
      { entityId: string, x: number, y: number, oldGlyph: string, newGlyph: string, animationFrame: number }
    ]
  },
  board: {
    changed: [
      { x: number, y: number, oldCell: string, newCell: string }
    ]
  },
  score: {
    changed: boolean,
    oldScore: number,
    newScore: number
  }
}
```

**Acceptance Criteria**:

- [ ] Player movements are correctly detected
- [ ] Player joins are correctly detected
- [ ] Player leaves are correctly detected
- [ ] Entity movements are correctly detected
- [ ] Entity spawns are correctly detected
- [ ] Entity despawns are correctly detected
- [ ] Entity animations are correctly detected
- [ ] Board changes are correctly detected (if applicable)
- [ ] Score changes are correctly detected
- [ ] Comparison handles edge cases (empty arrays, null values)

### FR3: Incremental Player and Entity Updates

**Requirement**: Renderer must update only changed player and entity positions.

**Details**:

**Human Players**:

- For moved players:
  - Clear old position (restore cell content from board)
  - Draw player at new position
- For joined players:
  - Draw player at new position
- For left players:
  - Clear player position (restore cell content from board)

**AI-Controlled Entities**:

- Entities are separate from human players and can move or be animated
- For moved entities:
  - Clear old position (restore cell content from board)
  - Draw entity at new position (may use different glyph/character than players)
- For spawned entities:
  - Draw entity at new position
- For despawned entities:
  - Clear entity position (restore cell content from board)
- For animated entities:
  - Update entity glyph/character at same position (for animation frames)
  - May change visual representation without changing position

**Common Behavior**:

- Use existing `updateCell()` method for individual cell updates
- Handle multiple players/entities at same position (if applicable)
- Distinguish between players and entities in rendering (different glyphs/colors)
- Support entity types (e.g., enemy, collectible, animated object)

**Acceptance Criteria**:

- [ ] Moved players update correctly (old position cleared, new position drawn)
- [ ] Joined players appear at correct position
- [ ] Left players are removed from display
- [ ] Moved entities update correctly (old position cleared, new position drawn)
- [ ] Spawned entities appear at correct position
- [ ] Despawned entities are removed from display
- [ ] Animated entities update their visual representation correctly
- [ ] Old positions are restored with correct cell content
- [ ] Multiple players/entities are handled correctly
- [ ] Players and entities are visually distinguishable

### FR4: Incremental Board Updates

**Requirement**: Renderer must update only changed board cells (if board is mutable).

**Details**:

- Compare previous and current board grids
- Update only cells that changed
- Use `updateCell()` method for individual cell updates
- Handle board initialization (first render uses full render)

**Note**: Current implementation has static board, but this requirement prepares for future board mutability.

**Acceptance Criteria**:

- [ ] Changed board cells are updated correctly
- [ ] Unchanged board cells are not redrawn
- [ ] Board updates work correctly with player updates

### FR5: Incremental Status Bar Updates

**Requirement**: Status bar must only update when score or position changes.

**Details**:

- Compare previous and current score
- Compare previous and current player position (local player)
- Only call `renderStatusBar()` if score or position changed
- Avoid unnecessary status bar redraws

**Acceptance Criteria**:

- [ ] Status bar updates when score changes
- [ ] Status bar updates when local player position changes
- [ ] Status bar does not update when score/position unchanged
- [ ] Status bar updates correctly on first render

### FR6: Smart Rendering Logic

**Requirement**: Client must choose between full render and incremental updates based on state.

**Details**:

- **First render**: Use `renderFull()` when `previousState === null`
- **Subsequent renders**: Use incremental updates when `previousState !== null`
- **Fallback to full render**:
  - When too many changes detected (threshold TBD)
  - When state structure mismatch detected
  - When rendering errors occur
  - When board dimensions change

**Acceptance Criteria**:

- [ ] First render uses `renderFull()`
- [ ] Subsequent renders use incremental updates
- [ ] Fallback to full render works correctly
- [ ] Rendering logic handles edge cases

## Technical Requirements

### TR1: Performance

**Requirement**: Incremental rendering must improve performance compared to full renders.

**Details**:

- Minimize terminal I/O operations
- Only update visible changes
- Avoid unnecessary cursor movements
- Batch updates when possible (if beneficial)

**Performance Metrics**:

- Terminal I/O operations per state update
- Rendering time per state update
- CPU usage during gameplay

**Acceptance Criteria**:

- [ ] Terminal I/O operations reduced by at least 80% (compared to full render)
- [ ] Rendering time reduced by at least 70% (compared to full render)
- [ ] No noticeable performance degradation

### TR2: Reliability

**Requirement**: Incremental rendering must be reliable and handle edge cases.

**Details**:

- Handle missing previous state gracefully
- Handle state structure mismatches
- Handle rendering errors with fallback
- Ensure state consistency

**Error Handling**:

- Fallback to full render on errors
- Log errors for debugging
- Maintain game functionality even if rendering fails

**Acceptance Criteria**:

- [ ] Handles missing previous state correctly
- [ ] Handles state structure mismatches correctly
- [ ] Falls back to full render on errors
- [ ] Game remains functional even with rendering errors

### TR3: Compatibility

**Requirement**: Incremental rendering must maintain backward compatibility.

**Details**:

- Don't break existing `renderFull()` functionality
- Support both single-player and multiplayer modes
- Maintain existing renderer API
- Don't break local mode rendering

**Acceptance Criteria**:

- [ ] Local mode rendering still works correctly
- [ ] `renderFull()` method still works correctly
- [ ] Existing renderer methods unchanged
- [ ] No breaking changes to renderer API

## Data Structures

### State Structure

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
      playerName: string,
      clientId: string  // Human player connection ID
    }
  ],
  entities: [
    {
      entityId: string,
      x: number,
      y: number,
      entityType: string,  // e.g., "enemy", "collectible", "animated"
      glyph?: string,       // Optional: specific character/glyph to render
      animationFrame?: number,  // Optional: current animation frame
      color?: string        // Optional: color for rendering
    }
  ],
  score: number
}
```

**Note**: `entities` array is separate from `players` array. Entities are AI-controlled and may move, spawn, despawn, or animate independently of human players.

### Change Detection Result

```javascript
{
  players: {
    moved: Array<{
      playerId: string,
      oldX: number,
      oldY: number,
      newX: number,
      newY: number
    }>,
    joined: Array<{
      playerId: string,
      x: number,
      y: number,
      playerName: string
    }>,
    left: Array<{
      playerId: string,
      x: number,
      y: number
    }>
  },
  entities: {
    moved: Array<{
      entityId: string,
      oldX: number,
      oldY: number,
      newX: number,
      newY: number,
      entityType: string
    }>,
    spawned: Array<{
      entityId: string,
      x: number,
      y: number,
      entityType: string,
      glyph?: string,
      animationFrame?: number
    }>,
    despawned: Array<{
      entityId: string,
      x: number,
      y: number
    }>,
    animated: Array<{
      entityId: string,
      x: number,
      y: number,
      oldGlyph: string,
      newGlyph: string,
      animationFrame: number
    }>
  },
  board: {
    changed: Array<{
      x: number,
      y: number,
      oldCell: string,
      newCell: string
    }>
  },
  score: {
    changed: boolean,
    oldScore: number,
    newScore: number
  }
}
```

## File Structure

```
src/
├── render/
│   └── Renderer.js              # Enhanced with incremental update methods
├── index.js                      # Enhanced with state tracking
└── utils/
    └── stateComparison.js       # Optional: State comparison utilities
```

## Open Questions

### Q1: State Comparison Location

**Question**: Where should state comparison logic be implemented?

**Options**:

- **Option A**: Inline in `src/index.js` within `onStateUpdate` callback
- **Option B**: Separate utility functions in `src/utils/stateComparison.js`
- **Option C**: Methods on Renderer class
- **Option D**: Separate StateTracker class

**Recommendation**: Option B - Separate utility functions for better testability and maintainability.

**Answer**: **Option B** - Separate utility functions in `src/utils/stateComparison.js`

### Q2: Board Mutability

**Question**: Should we implement board change detection now, or defer until board becomes mutable?

**Options**:

- **Option A**: Implement board change detection now (prepare for future)
- **Option B**: Defer board change detection until board becomes mutable
- **Option C**: Implement but disable (commented out) until needed

**Recommendation**: Option B - Defer until needed, keep implementation simple for now.

**Answer**: **Option B** - Defer board change detection until board becomes mutable

### Q3: Multiple Players/Entities at Same Position

**Question**: How should we handle multiple players or entities at the same position?

**Options**:

- **Option A**: Show only one (first or last, prioritize players over entities)
- **Option B**: Show a special character indicating multiple entities
- **Option C**: Stack entities visually (overlapping, with z-order)
- **Option D**: Prevent multiple entities at same position (server-side validation)
- **Option E**: Show player if present, otherwise show entity (priority system)

**Recommendation**: Option E - Prioritize players over entities, show one at a time for simplicity.

**Answer**: **Option D** - Prevent multiple entities at same position (server-side validation)

- In some cases, the two should not be allowed to overlap
- In other cases, entities should overlap another tile

### Q4: Fallback Threshold

**Question**: When should we fall back to full render instead of incremental updates?

**Options**:

- **Option A**: Never fall back (always use incremental)
- **Option B**: Fall back when >50% of cells changed
- **Option C**: Fall back when >N players changed (e.g., 5+)
- **Option D**: Fall back when both board and players changed significantly

**Recommendation**: Option D - Fall back when too many changes detected (configurable threshold).

**Answer**: **Option D** - Fall back when both board and players changed significantly

### Q5: State Comparison Performance

**Question**: Should we optimize state comparison for performance, or keep it simple?

**Options**:

- **Option A**: Simple comparison (iterate through arrays)
- **Option B**: Use Maps/Sets for O(1) lookups
- **Option C**: Use deep equality library (e.g., lodash.isEqual)
- **Option D**: Custom optimized comparison

**Recommendation**: Option A - Simple comparison is sufficient for current scale, optimize later if needed.

**Answer**: **Option A** - Simple comparison (iterate through arrays)

### Q6: Status Bar Update Strategy

**Question**: Should status bar update be part of incremental rendering or separate?

**Options**:

- **Option A**: Always update status bar with incremental updates
- **Option B**: Only update status bar when score/position changes
- **Option C**: Update status bar separately (different method)
- **Option D**: Make status bar update configurable

**Recommendation**: Option B - Only update when changed, reduces unnecessary redraws.

**Answer**: **Option B** - Only update status bar when score/position changes

### Q7: Player and Entity Position Tracking

**Question**: How should we track player and entity positions for comparison?

**Options**:

- **Option A**: Compare entire player/entity objects
- **Option B**: Create separate Maps: Map<playerId, {x, y}> and Map<entityId, {x, y, glyph?, animationFrame?}>
- **Option C**: Use arrays of positions only
- **Option D**: Store positions separately from full state
- **Option E**: Single Map with type discriminator: Map<id, {type: 'player'|'entity', x, y, ...}>

**Recommendation**: Option B - Separate Maps for players and entities, allows O(1) lookups and handles different data structures.

**Answer**: **Option B** - Create separate Maps: `Map<playerId, {x, y}>` and `Map<entityId, {x, y, glyph?, animationFrame?}>`

### Q8: Error Recovery

**Question**: How should we handle rendering errors during incremental updates?

**Options**:

- **Option A**: Fall back to full render immediately
- **Option B**: Continue with remaining updates, log error
- **Option C**: Retry incremental update once, then fall back
- **Option D**: Disable incremental rendering for rest of session

**Recommendation**: Option A - Fall back immediately to ensure consistent display.

**Answer**: **Option C** - Retry incremental update once, then fall back

### Q9: Initial Render Strategy

**Question**: When should we perform the initial full render?

**Options**:

- **Option A**: On first `STATE_UPDATE` message received
- **Option B**: On `CONNECT` message received (before first state update)
- **Option C**: After `localPlayerId` is set
- **Option D**: On first state update with valid `localPlayerId`

**Recommendation**: Option D - Wait for valid localPlayerId to ensure correct initial render.

**Answer**: **Option D** - On first state update with valid `localPlayerId`

### Q10: State Synchronization

**Question**: How should we handle state synchronization issues (e.g., client out of sync)?

**Options**:

- **Option A**: Always trust server state (overwrite local state)
- **Option B**: Detect sync issues and request full state refresh
- **Option C**: Use version numbers/timestamps to detect sync issues
- **Option D**: No special handling (server is authoritative)

**Recommendation**: Option A - Server is authoritative, always use server state.

**Answer**: **Option A** - Always trust server state (overwrite local state)

### Q11: Update Batching

**Question**: Should we batch multiple cell updates into single operations?

**Options**:

- **Option A**: Update each cell individually (simple)
- **Option B**: Batch updates by row (update entire row at once)
- **Option C**: Batch all updates, then render (double buffering)
- **Option D**: No batching (current approach is fine)

**Recommendation**: Option A - Individual updates are fine for current scale, can optimize later.

**Answer**: **Option C** - Batch all updates, then render (double buffering)

### Q12: Testing Strategy

**Question**: What level of testing should be implemented?

**Options**:

- **Option A**: Unit tests only (state comparison, renderer methods)
- **Option B**: Integration tests only (full rendering flow)
- **Option C**: Both unit and integration tests
- **Option D**: Manual testing only (visual verification)

**Recommendation**: Option C - Both unit and integration tests for comprehensive coverage.

**Answer**: **Option C** - Both unit and integration tests

## Implementation Notes

### Phase 1: State Tracking

- Add `previousState` variable in `runNetworkedMode()` function
- Initialize to `null`
- Store state after each render
- Update after each successful render

### Phase 2: State Comparison

- Implement comparison functions:
  - `comparePlayers(prev, curr)` - Returns player changes
  - `compareEntities(prev, curr)` - Returns entity changes (moves, spawns, despawns, animations)
  - `compareBoard(prev, curr)` - Returns board changes (if applicable)
  - `compareScore(prev, curr)` - Returns score changes
- Handle edge cases (null, empty arrays, etc.)
- Entity comparison must detect:
  - Position changes (moved)
  - New entities (spawned)
  - Removed entities (despawned)
  - Visual changes at same position (animated)

### Phase 3: Incremental Renderer Methods

- Add to `Renderer` class:
  - `updatePlayersIncremental(previousPlayers, currentPlayers, board)`
  - `updateEntitiesIncremental(previousEntities, currentEntities, board)` - Handle entity updates including animations
  - `updateStatusBarIfChanged(score, x, y, previousScore, previousX, previousY)`
  - `updateBoardCell(x, y, cell)` (may already exist)
- Reuse existing `updateCell()` method
- Entity rendering must support:
  - Different glyphs per entity type
  - Animation frames (updating glyph at same position)
  - Entity-specific colors

### Phase 4: Integration

- Modify `wsClient.onStateUpdate()` callback:
  - Check if `previousState === null` → use `renderFull()`
  - Otherwise → use incremental updates:
    - Update changed player positions
    - Update changed entity positions and animations
    - Update changed board cells (if any)
    - Update status bar only if score/position changed
  - Update `previousState` after rendering
- Handle errors with fallback to full render
- Ensure entities are rendered with correct glyphs/colors

### Phase 5: Testing and Refinement

- Test with multiple players
- Test player joins/leaves
- Test with multiple entities
- Test entity spawns/despawns
- Test entity animations (glyph changes at same position)
- Test player and entity interactions (same position handling)
- Test edge cases
- Optimize performance if needed

## Success Criteria

1. ✅ Game is playable in multiplayer mode without visual flickering
2. ✅ Only changed cells/players are updated on each state update
3. ✅ Full refresh only occurs on initial render or major changes
4. ✅ Status bar only updates when score/position changes
5. ✅ Performance is significantly improved (reduced terminal I/O)
6. ✅ All existing functionality remains intact
7. ✅ Code is well-tested and maintainable

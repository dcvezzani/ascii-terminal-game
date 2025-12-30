# Bug: Player Not Rendered After Collision

## Context

After Player B collides with Player A in Player B's terminal window, Player A isn't rendered again until Player A moves in Player A's terminal window. All players should be displayed after collision events, even if they are not moved.

**Verified Behavior**:

- When a player attempts to walk through/past another player, the server correctly detects the collision
- The server resets the player's position to honor the collision (server-side collision detection works correctly)
- However, the client-side rendering doesn't show the other player after the collision is corrected
- The other player disappears from the colliding player's terminal until they move

**Location**:

- Incremental rendering: `src/index.js` - `wsClient.onStateUpdate()` callback
- Player rendering: `src/render/Renderer.js` - `updatePlayersIncremental()` method
- State comparison: `src/utils/stateComparison.js` - `compareStates()` function

## Problem

**Current Behavior** (Verified):

1. Player A is at position (10, 10)
2. Player B attempts to move into position (10, 10) - collision occurs
3. Server correctly detects collision and prevents Player B from moving
4. Server resets Player B's position to previous position (e.g., 9, 10)
5. Server sends STATE_UPDATE with:
   - Player A still at (10, 10) - position unchanged (collision prevented movement)
   - Player B at (9, 10) - position reset by server (move rejected)
6. Client compares previous state with current state
7. Player A's position hasn't changed, so Player A is **not** in `changes.moved`
8. Player A is **not** in `changes.joined` (already in game)
9. Player A is **not** in `changes.left` (still in game)
10. `updatePlayersIncremental()` only renders players in `moved`, `joined`, or `left` arrays
11. Player A is **not rendered** in Player B's terminal (disappears)
12. Player A only reappears when Player A moves (which triggers a position change)

**Note**: Server-side collision detection and position correction work correctly. The issue is purely client-side rendering.

**Expected Behavior**:

1. Player A is at position (10, 10)
2. Player B moves into position (10, 10) - collision occurs
3. Server prevents Player B from moving (collision detection)
4. Server sends STATE_UPDATE with player positions
5. All players should be rendered, **even if their positions haven't changed**
6. Player A should remain visible in Player B's terminal after collision
7. Players should be visible regardless of whether they moved in the last update

## Root Cause

The incremental rendering system only renders players that are detected as changed:

```javascript
// Only render if there are changes
if (
  otherPlayerChanges.moved.length > 0 ||
  otherPlayerChanges.joined.length > 0 ||
  otherPlayerChanges.left.length > 0
) {
  renderer.updatePlayersIncremental(
    previousOtherPlayers,
    otherPlayers,
    boardAdapter,
    otherPlayerChanges
  );
}
```

The `compareStates()` function only detects players that have:

- **moved**: Position changed
- **joined**: New player added
- **left**: Player disconnected

If a player's position hasn't changed, they won't be in any of these arrays, so they won't be rendered. This is a problem when:

- A collision occurs and a player's position is prevented from changing
- A player is stationary but should still be visible
- The previous render may have cleared the player's position (e.g., during collision handling)

**Potential Issues**:

- Incremental rendering only updates "changed" players, not all visible players
- Players with unchanged positions are not re-rendered
- After collisions, stationary players may not be visible
- The rendering system assumes unchanged players are already correctly rendered

## Impact

- **Severity**: MEDIUM
- **User Experience**: Poor - players disappear after collisions
- **Frequency**: Every time a collision occurs and a player's position doesn't change
- **Multiplayer Impact**: Breaks multiplayer experience - players become invisible
- **Visual Impact**: Players disappear from other clients' terminals after collisions

## Desired Fix

All players should be displayed after collision events, even if they are not moved. The rendering system should ensure all visible players are rendered, not just those that changed.

### Requirements

1. **Render All Visible Players**
   - After processing changes, ensure all players in the current state are rendered
   - Don't rely solely on change detection for rendering
   - Re-render players even if their position hasn't changed

2. **Handle Collision Scenarios**
   - When a collision occurs, ensure both players are visible
   - Don't skip rendering players with unchanged positions
   - Ensure stationary players remain visible

3. **Optimize Rendering**
   - Only re-render players that actually need updating (avoid unnecessary renders)
   - But ensure all visible players are rendered at least once per update cycle
   - Consider rendering all players if any player changes occur

### Implementation Options

**Option 1: Always Render All Players After Changes**

- If any player changes occur (moved/joined/left), render all players
- Ensures all players are visible after collisions
- Simple but may be less efficient

**Option 2: Track Rendered Players**

- Keep track of which players were rendered in the last update
- Re-render players that weren't rendered in the last update
- More complex but more efficient

**Option 3: Render All Players Periodically**

- Always render all players every N updates
- Ensures visibility but may cause flickering
- Not ideal for performance

**Option 4: Render All Players When Changes Detected**

- When any player changes are detected, render all players
- Ensures visibility after collisions
- Good balance between correctness and performance

## Technical Details

### Current Implementation

```javascript
// Only render if there are changes
if (
  otherPlayerChanges.moved.length > 0 ||
  otherPlayerChanges.joined.length > 0 ||
  otherPlayerChanges.left.length > 0
) {
  renderer.updatePlayersIncremental(
    previousOtherPlayers,
    otherPlayers,
    boardAdapter,
    otherPlayerChanges
  );
}
```

### Problem Flow

1. Previous state: `[{ playerId: 'A', x: 10, y: 10 }, { playerId: 'B', x: 9, y: 10 }]`
2. Player B tries to move to (10, 10) - collision with Player A
3. Server rejects move, sends state: `[{ playerId: 'A', x: 10, y: 10 }, { playerId: 'B', x: 9, y: 10 }]`
4. `compareStates()` detects no changes (positions unchanged)
5. `otherPlayerChanges.moved = []`, `joined = []`, `left = []`
6. `updatePlayersIncremental()` is **not called** (no changes detected)
7. Player A is not rendered, may have been cleared in previous update

### Proposed Fix

```javascript
// Always render all players if any changes detected, or if this is first incremental update
if (
  otherPlayerChanges.moved.length > 0 ||
  otherPlayerChanges.joined.length > 0 ||
  otherPlayerChanges.left.length > 0
) {
  // Option 4: Render all players when changes detected
  renderer.updatePlayersIncremental(
    previousOtherPlayers,
    otherPlayers,
    boardAdapter,
    otherPlayerChanges
  );

  // Also render all players to ensure visibility
  for (const player of otherPlayers) {
    const playerColorFn = renderer.getColorFunction(PLAYER_CHAR.color);
    renderer.updateCell(player.x, player.y, PLAYER_CHAR.char, playerColorFn);
  }
}
```

Or modify `updatePlayersIncremental()` to always render all players:

```javascript
updatePlayersIncremental(previousPlayers, currentPlayers, board, changes) {
  // Handle changes first
  // ... existing code for moved/joined/left ...

  // Then ensure all current players are rendered
  for (const player of currentPlayers) {
    const playerColorFn = this.getColorFunction(PLAYER_CHAR.color);
    this.updateCell(player.x, player.y, PLAYER_CHAR.char, playerColorFn);
  }
}
```

## Related Features

- **FEATURE_incremental_rendering** - Incremental rendering system
- **FEATURE_websocket_integration** - Multiplayer functionality
- **FEATURE_client_side_prediction** - Client-side prediction (local player rendering)

## Dependencies

- State comparison logic must correctly detect changes
- Renderer must support rendering all players
- Incremental rendering must handle unchanged players

## Status

**Status**: 📋 NOT STARTED

**Priority**: MEDIUM

- Affects multiplayer user experience
- Players disappear after collisions
- Should be fixed before multiplayer release
- Relatively straightforward fix (render all players when changes detected)

## Notes

- This is a rendering visibility issue
- The server correctly sends player positions
- The client receives the information but doesn't render unchanged players
- Fix should ensure all visible players are rendered, not just changed ones
- Consider performance impact of rendering all players vs. only changed players
- May need to optimize to avoid unnecessary re-renders while ensuring visibility

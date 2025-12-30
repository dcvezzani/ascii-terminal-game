# Bug: Player Glyphs Not Visible Until Movement

## Context

In multiplayer mode, when Player A starts the game and doesn't press any keys, and Player B starts the game and presses keys, Player A's glyph doesn't show up in Player B's terminal until Player A presses a key.

**Location**:

- Client rendering: `src/index.js` - `runNetworkedMode()` function
- State update handling: `wsClient.onStateUpdate()` callback
- Initial render logic: `renderFull()` call

## Problem

**Current Behavior**:

1. Player A starts the game and connects to server
2. Player A doesn't press any movement keys
3. Player B starts the game and connects to server
4. Player B presses movement keys and sees their own glyph
5. Player A's glyph does NOT appear in Player B's terminal
6. When Player A finally presses a key, Player A's glyph appears in Player B's terminal

**Expected Behavior**:

1. Player A starts the game and connects to server
2. Player A doesn't press any movement keys
3. Player B starts the game and connects to server
4. Player B should immediately see Player A's glyph at Player A's position
5. Player A's glyph should be visible as soon as Player B's game client is created

## Root Cause

The issue appears to be related to when the initial render occurs and how state updates are processed:

1. **Initial Render Timing**: The client only calls `renderFull()` when `previousState === null` AND `localPlayerId` is set
2. **State Update Processing**: If a STATE_UPDATE arrives before `localPlayerId` is set, it's ignored (returns early)
3. **Player Join Sequence**: The `localPlayerId` is set in `onPlayerJoined` callback, which might fire after the first STATE_UPDATE
4. **Missing Initial Players**: If Player A is already in the game when Player B connects, Player B might receive a STATE_UPDATE with Player A before `localPlayerId` is set, causing that update to be ignored

**Potential Issues**:

- `onStateUpdate` callback returns early if `localPlayerId` is null, even if other players exist in the state
- Initial render might not happen if the first STATE_UPDATE is received before `localPlayerId` is set
- Subsequent STATE_UPDATEs might not trigger a full render if `previousState` is already set

## Impact

- **Severity**: MEDIUM
- **User Experience**: Poor - players can't see each other until someone moves
- **Frequency**: Every time a player connects after another player is already in the game
- **Multiplayer Impact**: Breaks the multiplayer experience - players appear invisible to each other

## Desired Fix

Player glyphs should show up in all clients as soon as the game client is created, regardless of whether:

- The player has pressed any keys
- Other players have moved
- The local player has received their `localPlayerId` yet

### Requirements

1. **Initial Render Should Include All Players**
   - When `renderFull()` is called, it should render ALL players in the gameState, not just the local player
   - Players should be visible immediately upon connection

2. **Handle State Updates Before localPlayerId is Set**
   - If a STATE_UPDATE arrives before `localPlayerId` is set, it should still be processed for other players
   - Or, queue the state update until `localPlayerId` is set, then render

3. **Ensure First Render Happens**
   - The first render should happen as soon as we have a valid gameState with players
   - Should not require `localPlayerId` to be set first (for rendering other players)

## Technical Details

### Current Implementation

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
      // Incremental updates...
    }
  }
});
```

### Problem Flow

1. Player A connects → Server adds Player A → Server broadcasts STATE_UPDATE with Player A
2. Player B connects → Server sends CONNECT response with gameState (includes Player A)
3. Player B receives STATE_UPDATE with Player A
4. Player B's `onStateUpdate` checks: `if (!renderer || !localPlayerId) return;`
5. If `localPlayerId` is not set yet, the STATE_UPDATE is ignored
6. Player B's `onPlayerJoined` fires later, setting `localPlayerId`
7. Next STATE_UPDATE (when Player A moves) triggers render, and Player A appears

### Proposed Solutions

**Option 1: Render other players even if localPlayerId is not set**

- Allow rendering of other players before `localPlayerId` is set
- Only require `localPlayerId` for local player-specific logic (prediction, status bar)

**Option 2: Queue state updates until localPlayerId is set** ✅ **SELECTED**

- Store incoming state updates if `localPlayerId` is not set
- Process queued updates once `localPlayerId` is set
- **Status**: Partially implemented in Phase 4, needs verification/enhancement

**Option 3: Ensure localPlayerId is set before first STATE_UPDATE**

- Modify server to send PLAYER_JOINED before STATE_UPDATE
- Or, set `localPlayerId` from CONNECT response instead of PLAYER_JOINED

**Option 4: Render on CONNECT response**

- Use the gameState from CONNECT response for initial render
- Don't wait for STATE_UPDATE

## Selected Solution

**Option 2: Queue state updates until localPlayerId is set**

This solution has been partially implemented in Phase 4 of the client-side prediction feature:

- State updates are queued when `localPlayerId` is not set
- Queued state updates are processed when `localPlayerId` is set in `onPlayerJoined`

**Current Implementation Status**:

- ✅ Queuing mechanism exists (`queuedStateUpdate` variable)
- ✅ State updates are queued when `localPlayerId` is null
- ✅ Queued state is processed in `onPlayerJoined` callback
- ⚠️ May need verification that all players are rendered correctly

**Next Steps**:

1. Verify current implementation works correctly
2. Test that all players are visible after queued state is processed
3. Ensure `renderFull()` renders all players, not just local player
4. Add tests to verify the fix

## Related Features

- **FEATURE_websocket_integration** - Multiplayer functionality
- **FEATURE_incremental_rendering** - Rendering system
- **FEATURE_client_side_prediction** - Local player rendering

## Dependencies

- WebSocket server must send gameState in CONNECT response
- Client must handle CONNECT response gameState
- Renderer must support rendering multiple players

## Selected Solution

**Option 2: Queue state updates until localPlayerId is set** ✅ **SELECTED**

This solution has been partially implemented in Phase 4 of the client-side prediction feature:

- State updates are queued when `localPlayerId` is not set (line 348-351 in `src/index.js`)
- Queued state updates are processed when `localPlayerId` is set in `onPlayerJoined` callback (line 519-567)

**Current Implementation**:

- ✅ Queuing mechanism exists (`queuedStateUpdate` variable)
- ✅ State updates are queued when `localPlayerId` is null
- ✅ Queued state is processed in `onPlayerJoined` callback
- ✅ `renderFull()` renders all players when `networkState.players` array is provided
- ✅ `renderBoard()` checks all players in the array and renders them

**Potential Issue**:

- The CONNECT response includes `playerId` in the payload, but we're not extracting it to set `localPlayerId` earlier
- This means state updates from CONNECT response get queued even though we could set `localPlayerId` from CONNECT
- May need to extract `playerId` from CONNECT response to set `localPlayerId` earlier, allowing queued state to be processed immediately

**Next Steps**:

1. Verify current implementation works correctly
2. Consider extracting `playerId` from CONNECT response to set `localPlayerId` earlier
3. Test that all players are visible after queued state is processed
4. Add tests to verify the fix

## Status

**Status**: 🔄 IN PROGRESS (Option 2 partially implemented, needs verification/enhancement)

**Priority**: MEDIUM

- Affects multiplayer user experience
- Players appear invisible until they move
- Should be fixed before multiplayer release
- Relatively straightforward fix (Option 2 already partially implemented)

## Notes

- This is a rendering/timing issue
- The server is correctly sending player information
- The client is receiving the information but not rendering it at the right time
- Option 2 (queue state updates) is partially implemented and should work
- May need to enhance by extracting `playerId` from CONNECT response to process queue earlier

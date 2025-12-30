# Bug: Collision at Spawn Position (20, 10)

## Context

When the WebSocket server is already running and 3 clients start up, something appears to occupy position (20, 10) even though nothing is visible there in the client views. Collisions are happening at that point, preventing players from spawning or moving there.

**Location**:
- Player spawning: `src/server/GameServer.js` - `addPlayer()` method
- Board entity management: `src/game/Board.js` - `addEntity()`, `removeEntity()` methods
- Player removal: `src/server/GameServer.js` - `removePlayer()` method
- Spawn position: `src/config/gameConfig.js` - `gameConfig.player.initialX` and `initialY`

**Position Details**:
- Board dimensions: 40 width × 20 height
- Default spawn position: (20, 10) - center of board
- Calculated as: `initialX = Math.floor(40/2) = 20`, `initialY = Math.floor(20/2) = 10`

## Problem

**Current Behavior**:

1. WebSocket server is already running
2. Client 1 connects and spawns at position (20, 10) - center of board
3. Client 2 connects and attempts to spawn at (20, 10)
4. Server detects collision/occupation at (20, 10) and uses spiral search to find nearby position
5. Client 3 connects and attempts to spawn at (20, 10)
6. Server detects collision/occupation at (20, 10) even though **nothing is visible** there in client views
7. Collisions occur at (20, 10) preventing players from moving there
8. Position (20, 10) appears to be occupied by an invisible entity

**Expected Behavior**:

1. WebSocket server is already running
2. Client 1 connects and spawns at position (20, 10)
3. Client 2 connects and spawns at a nearby position (spiral search finds available spot)
4. Client 3 connects and spawns at a nearby position (spiral search finds available spot)
5. Position (20, 10) should only be occupied if a visible player or entity is there
6. No invisible entities should block movement or spawning
7. All occupied positions should correspond to visible entities

## Root Cause

**Potential Issues**:

1. **Player Entity Not Removed on Disconnect**
   - When a player disconnects, their entity may not be properly removed from the board
   - The board's `hasSolidEntity()` check may still detect the entity even though the player is gone
   - Entity remains in board's entity queue but player is removed from game state

2. **Entity Queue Not Synchronized**
   - Board's entity queue may contain stale entries
   - Player removal may not clear the board entity properly
   - Multiple players spawning at same position may leave ghost entities

3. **Spawn Position Collision Detection**
   - The spiral search may not be working correctly
   - `hasSolidEntity()` may be checking for entities that don't exist in game state
   - Board entity tracking may be out of sync with player state

4. **Player Removal Logic**
   - `removePlayer()` may not be calling `board.removeEntity()` correctly
   - Entity ID mismatch between player and board entity
   - Entity may be added to board but not properly tracked

## Impact

- **Severity**: MEDIUM-HIGH
- **User Experience**: Poor - players can't spawn or move to center position
- **Frequency**: Every time multiple clients connect to an already-running server
- **Multiplayer Impact**: Breaks multiplayer experience - spawn position becomes unusable
- **Gameplay Impact**: Players may be unable to access the center of the board

## Desired Fix

Position (20, 10) should only be occupied when a visible player or entity is actually there. The board's entity tracking should be synchronized with the game state.

### Requirements

1. **Proper Entity Cleanup**
   - When a player disconnects, their entity must be removed from the board
   - `removePlayer()` should call `board.removeEntity()` with correct entity ID
   - Entity queue should be cleared of stale entries

2. **Synchronized Entity Tracking**
   - Board entity queue should match game state players
   - No ghost entities should remain after player removal
   - `hasSolidEntity()` should only return true for actual entities

3. **Spawn Position Validation**
   - Spawn position should be checked against actual game state, not just board entities
   - Spiral search should work correctly to find available positions
   - Multiple players should be able to spawn near center without conflicts

4. **Entity ID Consistency**
   - Player entity IDs should be consistent between board and game state
   - Entity removal should use the same ID that was used for addition
   - No orphaned entities should remain in board

## Technical Details

### Current Implementation

**Player Addition** (`GameServer.addPlayer()`):
```javascript
// Add player to board cell queue (players are solid, block movement)
this.game.board.addEntity(startX, startY, {
  char: PLAYER_CHAR.char,
  color: PLAYER_CHAR.color,
  id: playerId,
  solid: true, // Players are solid entities
});
```

**Player Removal** (`GameServer.removePlayer()`):
- Should call `board.removeEntity()` but may not be doing so correctly
- Entity ID may not match between add and remove

**Spawn Position Check**:
```javascript
if (
  !this.game.board.isValidPosition(startX, startY) ||
  this.game.board.isWall(startX, startY) ||
  this.game.board.hasSolidEntity(startX, startY)
) {
  // Spiral search for available position
}
```

### Investigation Steps

1. **Check Player Removal Logic**
   - Verify `removePlayer()` calls `board.removeEntity()`
   - Check entity ID used for removal matches addition
   - Verify entity is actually removed from board queue

2. **Check Board Entity Queue**
   - Inspect board's entity queue after player removal
   - Verify no stale entities remain
   - Check `hasSolidEntity()` implementation

3. **Check Spawn Position Logic**
   - Verify spiral search is working correctly
   - Check if multiple players can spawn near center
   - Verify collision detection is accurate

4. **Check Entity ID Consistency**
   - Verify entity IDs match between board and game state
   - Check for orphaned entities in board queue
   - Verify entity removal uses correct ID

### Proposed Fix

1. **Ensure Proper Entity Removal**
   ```javascript
   removePlayer(playerId) {
     // ... existing code ...
     
     // Remove player entity from board
     const player = this.players.get(playerId);
     if (player) {
       this.game.board.removeEntity(player.x, player.y, playerId);
     }
     
     // ... rest of removal logic ...
   }
   ```

2. **Add Entity Queue Cleanup**
   - Periodically clean up stale entities
   - Verify entity queue matches game state
   - Remove orphaned entities

3. **Improve Spawn Position Validation**
   - Check both board entities and game state players
   - Ensure spiral search finds available positions
   - Add logging to track spawn position conflicts

## Related Features

- **FEATURE_websocket_integration** - Multiplayer functionality
- **FEATURE_player_spawn_system** - Player spawning logic
- **FEATURE_entity_management** - Board entity tracking

## Dependencies

- Board entity queue must be synchronized with game state
- Player removal must properly clean up board entities
- Entity IDs must be consistent between board and game state

## Status

**Status**: 📋 NOT STARTED

**Priority**: MEDIUM-HIGH

- Affects multiplayer user experience
- Prevents players from spawning at center position
- May cause gameplay issues
- Should be fixed before multiplayer release
- Requires investigation of entity tracking system

## Notes

- This is a synchronization issue between board entities and game state
- The server correctly detects collisions, but the collision may be from a ghost entity
- Position (20, 10) is the default spawn position (center of 40×20 board)
- Issue only occurs when server is already running (not on fresh start)
- May be related to player disconnect/reconnect logic
- Need to verify entity cleanup on player removal


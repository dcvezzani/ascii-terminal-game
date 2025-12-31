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

**IDENTIFIED**: The issue is caused by the `Game` class automatically adding a 'local-player' entity when instantiated.

**Root Cause Details**:

1. **GameServer Creates Game Instance**
   - When `GameServer` is constructed, it creates `this.game = new Game()` (line 22 of `GameServer.js`)
   - The `Game` class is designed for local single-player mode

2. **Game Constructor Adds Local Player Entity**
   - The `Game` constructor automatically adds a player entity at the initial position (20, 10)
   - Entity ID: `'local-player'`
   - Entity is solid: `solid: true`
   - This happens in `Game.js` lines 19-24:
     ```javascript
     this.board.addEntity(this.playerX, this.playerY, {
       char: PLAYER_CHAR.char,
       color: PLAYER_CHAR.color,
       id: this.playerId, // 'local-player'
       solid: true,
     });
     ```

3. **Local Player Entity Remains on Board**
   - The 'local-player' entity is never removed from the board
   - It's not tracked in `GameServer.players` map (only networked players are tracked there)
   - The entity remains at (20, 10) permanently

4. **Collision Detection Finds Local Player**
   - When networked players try to spawn at (20, 10), `hasSolidEntity()` returns `true`
   - The check finds the 'local-player' entity that was added during GameServer initialization
   - Spiral search is triggered, but the center position (20, 10) is always blocked

**Why It Happens Even With Single Client**:
- Even with just one networked client, the 'local-player' entity is already on the board
- The first networked player can't spawn at (20, 10) because 'local-player' is there
- This explains why it happens even with a single client

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

**Solution**: Remove the 'local-player' entity when GameServer initializes, since it's not needed for networked mode.

**Important**: This fix will NOT break local mode because:
- Local mode (`runLocalMode`) creates its own `Game` instance directly (line 35 of `localMode.js`)
- Local mode does NOT use `GameServer` at all
- `GameServer` is only used server-side for networked multiplayer mode
- The `Game` class will still add the 'local-player' entity when used in local mode

**Option 1: Remove Local Player Entity in GameServer Constructor** (Recommended - Simplest)
```javascript
constructor() {
  super();
  this.game = new Game();
  
  // Remove the local-player entity added by Game constructor
  // This entity is only needed for local single-player mode, not networked mode
  // Local mode creates its own Game instance and doesn't use GameServer
  const centerX = gameConfig.player.initialX;
  const centerY = gameConfig.player.initialY;
  this.game.board.removeEntity(centerX, centerY, 'local-player');
  
  // ... rest of constructor ...
}
```

**Option 2: Modify Game Constructor to Accept Options** (Cleaner - Makes Intent Explicit)
```javascript
// In Game.js
constructor(options = {}) {
  this.board = new Board();
  this.playerX = gameConfig.player.initialX;
  this.playerY = gameConfig.player.initialY;
  this.score = gameConfig.game.initialScore;
  this.running = false;
  this.playerId = 'local-player';

  // Only add local player if not explicitly disabled
  // Default behavior (no options) adds player for local mode compatibility
  if (options.addLocalPlayer !== false) {
    try {
      this.board.addEntity(this.playerX, this.playerY, {
        char: PLAYER_CHAR.char,
        color: PLAYER_CHAR.color,
        id: this.playerId,
        solid: true,
      });
    } catch (error) {
      console.error(`Failed to add player to board: ${error.message}`);
    }
  }
}

// In GameServer.js
constructor() {
  super();
  // Don't add local player entity - we'll add networked players via addPlayer()
  this.game = new Game({ addLocalPlayer: false });
  // ... rest of constructor ...
}
```

**Option 3: Create Separate Board-Only Initialization**
- Create a method to initialize just the board without the player
- Use that in GameServer instead of full Game instance
- More complex but cleaner separation of concerns

**Recommended**: 
- **Option 1** is simplest and most direct fix (safest, minimal changes)
- **Option 2** is cleaner and makes the intent explicit (better long-term maintainability)

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


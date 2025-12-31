# Enhancement: Game State Persistence

## Context

Currently, when the WebSocket server crashes or is restarted, all game state is lost. Players must reconnect and start a new game from scratch. There is no mechanism to save or restore game state, which means:

- All player positions are lost
- All entities are lost
- Game score and progress are lost
- Players must rejoin and respawn at default positions

**Location**:
- Game state management: `src/server/GameServer.js` - `getGameState()` method
- Server startup: `src/server/index.js` - `startServer()` function
- Game state structure: Players, entities, board, score, running status

**Current State**:
- Game state is only stored in memory
- No persistence mechanism exists
- Server restart = complete state loss
- Players must manually reconnect and rejoin

## Problem

**Current Limitations**:

1. **No State Persistence**: Game state exists only in memory
2. **Server Crashes Lose Everything**: Any crash or restart wipes all progress
3. **No Recovery Mechanism**: Cannot restore previous game state
4. **Poor User Experience**: Players lose progress on server issues
5. **No Graceful Degradation**: All or nothing - either server is running or everything is lost

**Impact**:
- Server crashes result in complete game state loss
- Players must restart from beginning
- No way to recover from unexpected shutdowns
- Poor reliability for multiplayer sessions

## Desired Enhancement

A game state persistence system that periodically caches the game state to disk, allowing the server to restore the most recent cached state when restarted after a crash.

### Requirements

1. **Periodic State Caching**
   - Cache game state to disk at regular intervals (e.g., every 30 seconds, 1 minute, or configurable)
   - Cache should include all necessary state: players, entities, board, score, running status
   - Cache should be atomic (write to temp file, then rename) to prevent corruption

2. **State Restoration on Startup**
   - On server startup, check for cached state file
   - If cached state exists, restore game state from cache
   - Restore players, entities, board state, score, running status
   - Allow players to reconnect and resume from where they left off

3. **Cache File Management**
   - Store cache file in a persistent location (e.g., `./data/game-state-cache.json`)
   - Handle cache file corruption gracefully (fall back to new game if cache is invalid)
   - Option to clear cache manually or on command
   - Consider multiple cache files (backup/rotation) for safety

4. **Configuration**
   - Configurable cache interval (default: 30 seconds or 1 minute)
   - Configurable cache file path
   - Option to enable/disable persistence
   - Option to clear cache on startup (for testing/development)

5. **Player Reconnection**
   - When state is restored, disconnected players should be available for reconnection
   - Players should be able to reconnect with their previous `playerId`
   - Player positions and state should be restored from cache

## Technical Details

### Current Game State Structure

From `GameServer.getGameState()`:
```javascript
{
  board: {
    width: number,
    height: number,
    grid: string[][] // 2D array of base characters
  },
  players: Array<{
    playerId: string,
    playerName: string,
    clientId: string,
    x: number,
    y: number
  }>,
  entities: Array<{
    entityId: string,
    entityType: string,
    x: number,
    y: number,
    // ... other entity properties
  }>,
  score: number,
  running: boolean
}
```

### Proposed Implementation

**Option 1: Simple JSON File Cache** (Recommended)
- Write game state to JSON file periodically
- Read JSON file on startup if it exists
- Simple, human-readable, easy to debug
- Use atomic writes (write to temp, then rename)

**Option 2: Database Storage**
- Store state in SQLite or similar database
- More robust, supports queries
- Overkill for current needs
- More complex implementation

**Option 3: Binary Format**
- Custom binary format for efficiency
- Smaller file size
- Not human-readable, harder to debug
- More complex implementation

### Cache File Format

```json
{
  "version": "1.0",
  "timestamp": 1234567890,
  "gameState": {
    "board": { ... },
    "players": [ ... ],
    "entities": [ ... ],
    "score": 0,
    "running": true
  },
  "disconnectedPlayers": {
    "playerId": {
      "player": { ... },
      "disconnectedAt": 1234567890
    }
  }
}
```

### Implementation Steps

1. **Add Cache Interval**
   - Add configuration for cache interval
   - Set up periodic timer in GameServer
   - Cache state at regular intervals

2. **Implement Cache Writing**
   - Create function to serialize game state to JSON
   - Write to temp file first, then rename (atomic write)
   - Handle write errors gracefully

3. **Implement Cache Reading**
   - On server startup, check for cache file
   - Read and parse JSON cache file
   - Validate cache file structure
   - Restore game state from cache

4. **Update GameServer**
   - Add method to restore state from cache
   - Restore players, entities, board
   - Restore disconnected players
   - Handle restoration errors

5. **Add Configuration**
   - Add cache interval to serverConfig
   - Add cache file path to serverConfig
   - Add enable/disable flag

6. **Handle Edge Cases**
   - Corrupted cache file (fall back to new game)
   - Missing cache file (start new game)
   - Version mismatch (handle migration or ignore)
   - Invalid state data (validate before restoring)

## Related Features

- **FEATURE_websocket_integration** - Multiplayer functionality that would benefit from persistence
- **FEATURE_player_reconnection** - Reconnection system that would work with cached state
- **FEATURE_entity_management** - Entity system that needs to be persisted

## Dependencies

- File system access for reading/writing cache files
- JSON serialization/deserialization
- Configuration system for cache settings
- Error handling for cache operations

## Open Questions

1. **Cache Interval**: How often should state be cached?
   - Every 30 seconds?
   - Every 1 minute?
   - Configurable?
   - Based on state changes (event-driven)?

2. **Cache File Location**: Where should cache files be stored?
   - `./data/game-state-cache.json`?
   - `./cache/game-state.json`?
   - Configurable path?

3. **Cache File Format**: What format should be used?
   - JSON (human-readable, easy to debug)?
   - Binary (smaller, faster)?
   - Compressed JSON?

4. **Cache Retention**: How many cache files should be kept?
   - Single file (overwrite)?
   - Multiple files with rotation?
   - Timestamped backups?

5. **State Validation**: How to handle invalid/corrupted cache?
   - Fall back to new game?
   - Attempt to repair?
   - Log error and continue?

6. **Version Compatibility**: How to handle cache format changes?
   - Version field in cache?
   - Migration logic?
   - Ignore incompatible versions?

7. **Performance Impact**: Will caching affect server performance?
   - Should caching be async?
   - Should it be throttled?
   - Should it skip if state hasn't changed?

8. **Disconnected Players**: How long should disconnected players be kept in cache?
   - Use same grace period?
   - Keep indefinitely until reconnection?
   - Expire after certain time?

9. **Board State**: How to cache board state efficiently?
   - Current format (2D array of characters)?
   - Full Cell objects with entities?
   - Compressed format?

10. **Startup Behavior**: Should cache be cleared on startup?
    - Always restore if available?
    - Option to start fresh?
    - Command-line flag?

## Status

**Status**: 📋 NOT STARTED

**Priority**: MEDIUM

- Improves server reliability
- Better user experience (no progress loss on crashes)
- Not critical for MVP but valuable for production
- Relatively straightforward implementation
- Can be added incrementally

## Notes

- This is a reliability/durability enhancement
- Should not impact normal game performance significantly
- Cache writes should be non-blocking if possible
- Consider using async file operations
- May want to cache on state changes rather than time-based
- Could be extended to support save/load functionality in the future
- Consider adding cache file rotation/backup for safety


# Enhancement: Persistent Player Position Cache

## Context

Currently, when a client disconnects and reconnects, the server maintains their player position in memory for a grace period (1 minute). However, this has limitations:

- **Memory-only storage**: Player positions are stored in `disconnectedPlayers` Map, which is lost on server restart
- **Limited grace period**: Players must reconnect within 1 minute or their position is lost
- **No persistence**: Server crashes/restarts result in complete loss of disconnected player data
- **No long-term recovery**: Players who take longer to reconnect lose their progress

**Location**:
- Player disconnection: `src/server/GameServer.js` - `markPlayerDisconnected()` method (line 171)
- Player restoration: `src/server/GameServer.js` - `restorePlayer()` method (line 222)
- Disconnected players storage: `src/server/GameServer.js` - `disconnectedPlayers` Map (line 28)
- Grace period: `src/server/GameServer.js` - `disconnectGracePeriod` (line 34, default: 60000ms)
- Player purging: `src/server/GameServer.js` - `purgeDisconnectedPlayers()` method (line 259)

**Current State**:
- Players are moved to `disconnectedPlayers` Map when they disconnect
- Player data (including position) is kept in memory for 1 minute
- After grace period, players are permanently removed
- On server restart, all disconnected player data is lost
- Reconnection only works if player reconnects within grace period

## Problem

**Current Limitations**:

1. **Memory-only storage**: Player positions exist only in memory, lost on server restart
2. **Short grace period**: 1-minute window is too short for network issues or client crashes
3. **No crash recovery**: Server crashes lose all disconnected player positions
4. **No long-term persistence**: Players who take longer to reconnect lose their progress
5. **Poor user experience**: Accidental disconnections result in position loss if reconnection is delayed

**Impact**:
- Players lose progress on accidental disconnections if they can't reconnect quickly
- Server crashes/restarts lose all disconnected player positions
- Network issues that take longer than 1 minute result in position loss
- Poor reliability for players with unstable connections

## Desired Enhancement

A persistent player position cache system that saves all human player positions to disk, allowing players to reconnect and resume from their last position even after:
- Server crashes/restarts
- Extended disconnection periods (beyond grace period)
- Network issues that delay reconnection
- Client crashes that require restart

### Requirements

1. **Persistent Position Storage**
   - Cache all human player positions to disk periodically
   - Store player ID, name, position (x, y), and timestamp
   - Persist even after grace period expires
   - Atomic writes (write to temp file, then rename) to prevent corruption

2. **Position Restoration on Reconnection**
   - On player reconnection, check persistent cache for their last position
   - Restore player to their cached position if available
   - Fall back to spawn position if cache is missing or invalid
   - Handle position conflicts (e.g., another player at cached position)

3. **Cache File Management**
   - Store cache file in persistent location (e.g., `./data/player-positions-cache.json`)
   - Handle cache file corruption gracefully (fall back to spawn position)
   - Option to clear cache manually or on command
   - Consider cache expiration (e.g., remove positions older than 24 hours)

4. **Configuration**
   - Configurable cache file path
   - Configurable cache expiration time (default: 24 hours or indefinite)
   - Option to enable/disable persistent caching
   - Option to clear cache on startup (for testing/development)

5. **Integration with Existing Reconnection**
   - Work alongside existing `disconnectedPlayers` Map
   - Use persistent cache as fallback if player not in `disconnectedPlayers`
   - Maintain backward compatibility with current reconnection flow
   - Cache should be checked after grace period expires

## Technical Details

### Current Player Structure

From `GameServer`:
```javascript
{
  playerId: string,
  playerName: string,
  clientId: string,
  x: number,
  y: number
}
```

### Current Reconnection Flow

1. Player disconnects → `markPlayerDisconnected()` called
2. Player moved to `disconnectedPlayers` Map with timestamp
3. Player removed from board but position stored in memory
4. If player reconnects within grace period → `restorePlayer()` restores from `disconnectedPlayers`
5. After grace period → `purgeDisconnectedPlayers()` removes player permanently

### Proposed Implementation

**Option 1: Simple JSON File Cache** (Recommended)
- Write player positions to JSON file periodically (e.g., every 30 seconds or on disconnect)
- Read JSON file on reconnection if player not in `disconnectedPlayers`
- Simple, human-readable, easy to debug
- Use atomic writes (write to temp, then rename)

**Option 2: Per-Player Cache Files**
- Store each player's position in separate file (e.g., `player-{playerId}.json`)
- More granular, easier to manage individual players
- More file I/O operations
- More complex cleanup

**Option 3: Database Storage**
- Store positions in SQLite or similar database
- More robust, supports queries
- Overkill for current needs
- More complex implementation

### Cache File Format

```json
{
  "version": "1.0",
  "lastUpdated": 1234567890,
  "players": {
    "player-uuid-1": {
      "playerId": "player-uuid-1",
      "playerName": "Player-abc123",
      "x": 20,
      "y": 10,
      "cachedAt": 1234567890,
      "lastSeen": 1234567890
    },
    "player-uuid-2": {
      "playerId": "player-uuid-2",
      "playerName": "Player-def456",
      "x": 25,
      "y": 15,
      "cachedAt": 1234567890,
      "lastSeen": 1234567890
    }
  }
}
```

### Implementation Steps

1. **Add Cache Writing**
   - Create function to serialize player positions to JSON
   - Write to temp file first, then rename (atomic write)
   - Cache on player disconnect and periodically (e.g., every 30 seconds)
   - Handle write errors gracefully

2. **Add Cache Reading**
   - Create function to read and parse JSON cache file
   - Validate cache file structure
   - Return player position if found, null otherwise

3. **Update Reconnection Logic**
   - Modify `restorePlayer()` to check persistent cache if player not in `disconnectedPlayers`
   - Check cache after grace period expires
   - Restore player to cached position if available
   - Handle position conflicts (spawn at nearby position if cached position occupied)

4. **Add Configuration**
   - Add cache file path to serverConfig
   - Add cache expiration time to serverConfig
   - Add enable/disable flag

5. **Add Cache Management**
   - Periodic cache cleanup (remove expired positions)
   - Manual cache clearing command/API
   - Cache file rotation/backup

6. **Handle Edge Cases**
   - Corrupted cache file (fall back to spawn position)
   - Missing cache file (start new game)
   - Version mismatch (handle migration or ignore)
   - Invalid position data (validate before restoring)
   - Position conflicts (spawn at nearby valid position)

## Related Features

- **ENHANCEMENT_game_state_persistence** - Full game state persistence (this enhancement is a subset focused on player positions)
- **FEATURE_websocket_integration** - Multiplayer functionality that would benefit from persistent positions
- **FEATURE_player_reconnection** - Reconnection system that would work with cached positions

## Dependencies

- File system access for reading/writing cache files
- JSON serialization/deserialization
- Configuration system for cache settings
- Error handling for cache operations
- Position validation and conflict resolution

## Open Questions

1. **Cache Frequency**: How often should positions be cached?
   - On every player disconnect?
   - Periodically (e.g., every 30 seconds)?
   - On every player movement (too frequent)?
   - Event-driven (on disconnect + periodic backup)?

2. **Cache File Location**: Where should cache files be stored?
   - `./data/player-positions-cache.json`?
   - `./cache/player-positions.json`?
   - Configurable path?

3. **Cache Expiration**: How long should positions be kept?
   - Indefinitely (until player reconnects)?
   - 24 hours?
   - 7 days?
   - Configurable?

4. **Position Conflicts**: How to handle cached position conflicts?
   - If another player is at cached position, spawn nearby?
   - If wall/entity is at cached position, spawn nearby?
   - Always validate position before restoring?

5. **Cache Format**: What format should be used?
   - JSON (human-readable, easy to debug)?
   - Binary (smaller, faster)?
   - Compressed JSON?

6. **Cache Cleanup**: When should expired positions be removed?
   - On server startup?
   - Periodically (e.g., every hour)?
   - On cache write?

7. **Integration with Grace Period**: How should this work with existing grace period?
   - Use cache only after grace period expires?
   - Use cache as primary source, `disconnectedPlayers` as fallback?
   - Use both (check `disconnectedPlayers` first, then cache)?

8. **Performance Impact**: Will caching affect server performance?
   - Should caching be async?
   - Should it be throttled?
   - Should it skip if position hasn't changed?

9. **Player Identification**: How to identify players for cache lookup?
   - Use `playerId` (UUID)?
   - Use `playerName` (may change)?
   - Use both?

10. **Cache Validation**: How to validate cached positions?
    - Check if position is within board bounds?
    - Check if position is valid (not a wall)?
    - Check if position is occupied by another player/entity?

## Status

**Status**: 📋 NOT STARTED

**Priority**: MEDIUM-HIGH

- Improves user experience significantly (no position loss on disconnection)
- Better reliability for players with unstable connections
- Complements existing reconnection system
- Relatively straightforward implementation
- Can be implemented independently or as part of full game state persistence
- Higher priority than full game state persistence (more focused scope)

## Notes

- This is a user experience and reliability enhancement
- Should not impact normal game performance significantly
- Cache writes should be non-blocking if possible
- Consider using async file operations
- May want to cache on disconnect + periodic backup for safety
- Could be extended to support player preferences/settings in the future
- Consider adding cache file rotation/backup for safety
- This enhancement can be implemented independently of full game state persistence
- Focuses specifically on human player positions (not all entities)
- Simpler scope than full game state persistence, making it easier to implement and test


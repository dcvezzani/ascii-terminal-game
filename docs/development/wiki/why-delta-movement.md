# Why Delta-Based Movement Instead of Absolute Coordinates?

## Overview

The server architecture uses **delta-based movement** (dx, dy) instead of absolute coordinates (x, y) for player movement. This document explains the business and technical reasons for this design decision.

## The Design

**Current Implementation**: Clients send movement deltas
```javascript
// Client sends
{ type: 'MOVE', payload: { dx: 1, dy: 0 } }  // Move right one cell

// Server validates and applies
player.x += dx;  // Server calculates final position
player.y += dy;
```

**Alternative**: Clients could send absolute coordinates
```javascript
// Client would send
{ type: 'MOVE', payload: { x: 11, y: 10 } }  // Move to this position

// Server would need to validate
if (isValidPosition(x, y) && isReachableFrom(player.x, player.y, x, y)) {
  player.x = x;
  player.y = y;
}
```

## Business/Technical Reasons for Delta-Based Movement

### 1. **Security & Anti-Cheating**

**Problem with absolute coordinates**: A malicious client could send `{x: 100, y: 100}` to teleport or move to invalid positions.

**Solution with deltas**: 
- Deltas are constrained to `-1, 0, or 1` (one cell at a time)
- Server validates: `if (dx < -1 || dx > 1 || dy < -1 || dy > 1)` → reject
- Prevents teleportation, speed hacks, and invalid positions

**Code Example**:
```javascript
// Simple, effective validation
if (dx < -1 || dx > 1 || dy < -1 || dy > 1) {
  logger.warn(`Invalid move: dx or dy out of range`);
  return;
}
```

### 2. **Server Authority**

**With deltas**: Server calculates final position:
```javascript
player.x += dx;  // Server controls the math
player.y += dy;  // Server is authoritative
```

**With absolute coordinates**: Client claims position, server must trust or do more complex validation.

**Benefit**: Server maintains complete control over game state. The server is the single source of truth for player positions.

### 3. **Simplified Validation**

**Deltas**: Simple range check (`-1 ≤ dx ≤ 1`)
```javascript
if (dx < -1 || dx > 1 || dy < -1 || dy > 1) {
  logger.warn(`Invalid move: dx or dy out of range`);
  return;
}
```

**Absolute coordinates**: More complex validation needed:
- Check bounds: `0 ≤ x < width && 0 ≤ y < height`
- Check if position is reachable from current position
- Check movement speed/rate limiting
- More code, more edge cases

**Benefit**: Less code, fewer bugs, easier to maintain.

### 4. **Movement Constraints**

**Enforces game rules**: One cell per move
- Prevents multi-cell jumps
- Enforces turn-based/step-by-step movement
- Natural rate limiting (one move per input)

**Code Example**:
```javascript
// Game rule: players move one cell at a time
// Delta validation enforces this automatically
if (dx < -1 || dx > 1) return false;  // Can't move more than 1 cell
```

### 5. **Collision Detection**

**With deltas**: Server validates each step:
```javascript
validateMove(playerId, dx, dy) {
  const newX = player.x + dx;  // Calculate next position
  const newY = player.y + dy;
  // Check if new position is valid (bounds, walls, collisions)
}
```

**With absolute coordinates**: Server must verify the path is valid, not just the destination.

**Benefit**: Easier to detect and prevent collisions, wall clipping, and invalid moves.

### 6. **Network Efficiency** (Minor)

**Deltas**: Small, predictable values (`-1`, `0`, `1`)
**Absolute coordinates**: Could be larger numbers (e.g., `x: 15, y: 18`)

**Note**: The difference is minimal, but deltas are slightly more compact. This is a minor benefit, not the primary reason.

### 7. **State Consistency**

**With deltas**: Server maintains authoritative position
- Client sends "I want to move right" (dx=1)
- Server validates and applies: `player.x += 1`
- Server broadcasts authoritative state

**With absolute coordinates**: Risk of client/server position desync
- Client thinks: "I'm at (10, 10)"
- Server thinks: "You're at (9, 10)"
- Client sends: `{x: 11, y: 10}` → Server must reconcile

**Benefit**: Reduces desynchronization issues. Server always knows the true position.

### 8. **Replay/Undo Capability**

**Deltas**: Easy to replay moves
- Store: `[{dx: 1, dy: 0}, {dx: 0, dy: 1}, ...]`
- Replay by applying deltas in sequence

**Absolute coordinates**: Harder to replay
- Must track full position history
- Can't easily "undo" a move

**Benefit**: Future feature support (replay, undo, game history).

## Trade-offs

### Advantages of Absolute Coordinates

- **Client flexibility**: Client can request any position (if you want that flexibility)
- **Simpler client code**: Just send where you want to go
- **Better for free movement**: Works well for games with continuous movement (not grid-based)

### Why Deltas Are Better for This Game

- **Grid-based movement**: One cell at a time
- **Security is important**: Prevent cheating
- **Server-authoritative architecture**: Server must control state
- **Turn-based/step-by-step gameplay**: Natural fit for deltas

## Real-World Analogy

**Deltas** = "I want to move one step right"
- Server: "OK, I'll move you one step right from your current position"
- Server maintains control

**Absolute coordinates** = "I want to be at position (15, 10)"
- Server: "Wait, where are you now? Is that reachable? Let me check..."
- More trust, more validation needed

## Implementation Details

### Server-Side Validation

```javascript
// src/server/server.js
handleMove(clientId, message) {
  const { dx, dy } = message.payload;

  // Validate dx, dy are numbers and in range
  if (typeof dx !== 'number' || typeof dy !== 'number') {
    logger.warn(`Invalid move: dx or dy is not a number`);
    return;
  }

  if (dx < -1 || dx > 1 || dy < -1 || dy > 1) {
    logger.warn(`Invalid move: dx or dy out of range`);
    return;
  }

  // Attempt move
  this.gameServer.movePlayer(playerId, dx, dy);
}
```

### GameServer Movement

```javascript
// src/server/GameServer.js
movePlayer(playerId, dx, dy) {
  if (!this.validateMove(playerId, dx, dy)) {
    return false;
  }

  const player = this.getPlayer(playerId);
  player.x += dx;  // Server calculates final position
  player.y += dy;

  return true;
}
```

## Conclusion

For this grid-based, server-authoritative game, **deltas are the better choice** because they:

1. ✅ **Prevent cheating** (can't teleport or move too far)
2. ✅ **Simplify validation** (just check -1, 0, 1)
3. ✅ **Maintain server authority** (server calculates final position)
4. ✅ **Enforce game rules** (one cell per move)
5. ✅ **Reduce desync risk** (server is source of truth)

This is a common pattern in multiplayer games, especially grid-based or turn-based games.

## Related Documentation

- **Server Architecture Specs**: `docs/development/specs/server-architecture_SPECS/README.md`
- **Movement Flow Diagram**: `docs/development/specs/server-architecture_SPECS/server-architecture_interactions_3-movement.mmd`
- **GameServer Implementation**: `src/server/GameServer.js`
- **Server Message Handling**: `src/server/server.js`

---

**Last Updated**: 2025-01-XX

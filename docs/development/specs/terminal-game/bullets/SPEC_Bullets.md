# Spec: Bullets

## Purpose

The **Bullets** spec describes the projectile entity system that allows players to fire bullets at each other. Bullets are entities that travel in a straight line, can destroy players on impact, and are destroyed when hitting walls, going out of bounds, or hitting players.

---

## 1. Overview

### Bullet Properties

A bullet is an entity with the following characteristics:

| Property | Type | Description |
|----------|------|-------------|
| `bulletId` | string | Unique identifier for the bullet |
| `playerId` | string | ID of the player who fired the bullet (for scoring) |
| `x` | number | Current X position |
| `y` | number | Current Y position |
| `dx` | number | Direction X (-1, 0, or 1) |
| `dy` | number | Direction Y (-1, 0, or 1) |
| `glyph` | string | Visual representation (U+2022 •) |

### Constraints

- **One bullet per player**: A player can only have one active bullet at a time
- **Movement speed**: 1 cell per tick
- **Destruction conditions**: Wall collision, out of bounds, player hit, self-hit

---

## 2. Firing Bullets

### Input

Bullets are fired using directional inputs combined with a fire action:

| Key | Direction |
|-----|-----------|
| Arrow Up / `k` | Fire upward (dx=0, dy=-1) |
| Arrow Down / `j` | Fire downward (dx=0, dy=1) |
| Arrow Left / `h` | Fire left (dx=-1, dy=0) |
| Arrow Right / `l` | Fire right (dx=1, dy=0) |

### Firing Rules

1. Player must be spawned (x and y not null)
2. Player must not already have an active bullet
3. Bullet spawns at the player's current position
4. Bullet immediately begins moving in the specified direction

### Firing Flow

```
Player presses fire+direction key
    ↓
Check: Does player have an active bullet?
    ↓ No
Create bullet at player position with direction
    ↓
Add bullet to game state
    ↓
Broadcast FIRE message to all clients
```

---

## 3. Bullet Movement

### Movement Rules

- Bullets move 1 cell per tick in their assigned direction
- Movement is processed on the server each tick
- Bullet position updates: `x += dx`, `y += dy`

### Movement Validation

Before moving, validate:

1. **Bounds check**: Will new position be within board boundaries?
2. **Wall check**: Will new position collide with a wall (`#`)?
3. **Player check**: Will new position collide with a player?

### Movement Flow

```
For each active bullet:
    ↓
Calculate new position (x + dx, y + dy)
    ↓
Check: Out of bounds?
    ↓ Yes → Destroy bullet, continue to next bullet
    ↓ No
Check: Wall at new position?
    ↓ Yes → Destroy bullet, continue to next bullet
    ↓ No
Check: Player at new position?
    ↓ Yes → Handle player hit
    ↓ No
Move bullet to new position
```

---

## 4. Collision Handling

### Player Hit

When a bullet collides with a player:

1. **If hitting another player**:
   - Destroy the hit player
   - Destroy the bullet
   - Award a point to the bullet's owner (playerId)

2. **If hitting own player**:
   - Destroy the bullet only
   - Player is unaffected

### Player Destruction Flow

```
Bullet hits player
    ↓
Is hit player the bullet owner?
    ↓ Yes
    Destroy bullet only
    ↓ No
    Destroy hit player
    Destroy bullet
    Award point to bullet owner
    Schedule player respawn (3 seconds)
```

### Player Respawn

When a player is destroyed:

1. Player enters "dead" state (x and y set to null)
2. After 3 seconds, attempt respawn:
   - Select random spawn point
   - Check if spawn point is occupied
   - If occupied: retry after another 3 seconds
   - If available: spawn player at that position

### Wall / Out of Bounds

When a bullet hits a wall or goes out of bounds:

1. Destroy the bullet
2. Remove from game state
3. No points awarded

---

## 5. State Synchronization

### Client-Side Prediction

Bullets use the same client-side prediction pattern as player movement:

1. **Immediate feedback**: Client predicts bullet movement locally
2. **Server authority**: Server validates and broadcasts authoritative state
3. **Reconciliation**: Client corrects to server state on mismatch

### Bullet State in Game State

```javascript
{
  bullets: Array<{
    bulletId: string,
    playerId: string,
    x: number,
    y: number,
    dx: number,
    dy: number
  }>
}
```

### Message Types

| Message | Direction | Payload |
|---------|-----------|---------|
| `FIRE` | Client → Server | `{ dx, dy }` |
| `BULLET_CREATE` | Server → Client | `{ bulletId, playerId, x, y, dx, dy }` |
| `BULLET_DESTROY` | Server → Client | `{ bulletId }` |
| `PLAYER_KILL` | Server → Client | `{ killerId, victimId }` |
| `PLAYER_RESPAWN` | Server → Client | `{ playerId, x, y }` |

---

## 6. Server Implementation

### Location

`src/server/GameServer.js`

### New Methods

#### `fireBullet(playerId, dx, dy)`

Creates a new bullet for the specified player.

**Validation**:
- Player exists
- Player is spawned
- Player does not have an active bullet

**Returns**: `{ success: boolean, bulletId?: string, error?: string }`

#### `updateBullets()`

Called each tick to move all bullets and handle collisions.

**Process**:
1. Iterate through all active bullets
2. Calculate new positions
3. Check collisions (bounds, walls, players)
4. Handle destruction and scoring
5. Broadcast updates

#### `destroyBullet(bulletId)`

Removes a bullet from the game state.

#### `getPlayerBullet(playerId)`

Returns the active bullet for a player, or null if none exists.

### Bullet Storage

```javascript
// In GameServer class
this.bullets = new Map<string, Bullet>();  // bulletId → Bullet

// Helper: player's active bullet
getPlayerBullet(playerId) {
  for (const bullet of this.bullets.values()) {
    if (bullet.playerId === playerId) {
      return bullet;
    }
  }
  return null;
}
```

---

## 7. Client Implementation

### Location

`src/modes/networkedMode.js`

### Input Handling

Update `InputHandler` to support bullet firing:

```javascript
// New fire callback
inputHandler.onFire((dx, dy) => {
  if (wsClient.isConnected() && localPlayerId) {
    const fireMessage = MessageHandler.createMessage(
      MessageTypes.FIRE,
      { dx, dy }
    );
    wsClient.send(fireMessage);
    
    // Client-side prediction: create bullet locally
    if (!hasActiveBullet()) {
      createPredictedBullet(localPlayerId, dx, dy);
    }
  }
});
```

### Bullet Prediction

```javascript
let predictedBullets = new Map<string, Bullet>();

function createPredictedBullet(playerId, dx, dy) {
  const player = getLocalPlayerPosition();
  if (!player) return;
  
  const bulletId = `predicted-${playerId}`;
  predictedBullets.set(bulletId, {
    bulletId,
    playerId,
    x: player.x,
    y: player.y,
    dx,
    dy
  });
  
  // Render bullet immediately
  renderBullet(bulletId, player.x, player.y);
}
```

### Rendering

```javascript
function renderBullets() {
  // Render server bullets
  for (const bullet of (currentState.bullets || [])) {
    renderer.updateCell(bullet.x, bullet.y, '•', BULLET_COLOR);
  }
  
  // Render predicted bullets (not yet in server state)
  for (const bullet of predictedBullets.values()) {
    if (!currentState.bullets?.find(b => b.playerId === bullet.playerId)) {
      renderer.updateCell(bullet.x, bullet.y, '•', BULLET_COLOR);
    }
  }
}
```

---

## 8. Input Handler Updates

### Location

`src/input/InputHandler.js`

### New Key Bindings

Add fire+direction key handling:

| Key | Action | Direction |
|-----|--------|-----------|
| `k` | `fire` | `{ dx: 0, dy: -1 }` |
| `j` | `fire` | `{ dx: 0, dy: 1 }` |
| `h` | `fire` | `{ dx: -1, dy: 0 }` |
| `l` | `fire` | `{ dx: 1, dy: 0 }` |

Note: Arrow keys could also be used with a modifier or in a separate fire mode.

### Implementation

```javascript
onFire(callback) {
  this.fireCallback = callback;
}

// In key handler
handleKey(key) {
  // ... existing movement handling ...
  
  // Fire handling (vim-style)
  if (key === 'k' && this.fireCallback) {
    this.fireCallback(0, -1);
  } else if (key === 'j' && this.fireCallback) {
    this.fireCallback(0, 1);
  } else if (key === 'h' && this.fireCallback) {
    this.fireCallback(-1, 0);
  } else if (key === 'l' && this.fireCallback) {
    this.fireCallback(1, 0);
  }
}
```

---

## 9. Scoring

### Point Awarding

When a bullet kills another player:
- Killer's score increases by 1
- Score tracked in server state
- Broadcast to all clients via `PLAYER_KILL` message

### Score State

```javascript
// In game state
{
  scores: Map<string, number>  // playerId → score
}
```

---

## 10. Respawn System

### Location

`src/server/respawnManager.js` (new file) or within `GameServer.js`

### Respawn Queue

```javascript
respawnQueue: Array<{
  playerId: string,
  respawnAt: number  // timestamp
}>
```

### Respawn Process

```javascript
function processRespawns() {
  const now = Date.now();
  
  for (const respawn of respawnQueue) {
    if (now >= respawn.respawnAt) {
      const spawnPoint = findAvailableSpawnPoint();
      if (spawnPoint) {
        spawnPlayer(respawn.playerId, spawnPoint.x, spawnPoint.y);
        // Remove from queue
      } else {
        // Retry in 3 seconds
        respawn.respawnAt = now + 3000;
      }
    }
  }
}

function findAvailableSpawnPoint() {
  const available = spawnPoints.filter(point => 
    !isPositionOccupied(point.x, point.y)
  );
  
  if (available.length === 0) return null;
  
  return available[Math.floor(Math.random() * available.length)];
}
```

---

## 11. Testing Requirements

### Unit Tests

**File**: `test/server/GameServer.bullets.test.js`

**Test Cases**:

1. **Firing**:
   - Player can fire bullet in each direction
   - Cannot fire if player has active bullet
   - Cannot fire if player not spawned
   - Bullet spawns at player position

2. **Movement**:
   - Bullet moves in correct direction
   - Bullet moves 1 cell per tick
   - Multiple bullets move independently

3. **Collision - Walls**:
   - Bullet destroyed on wall collision
   - Bullet does not move into wall

4. **Collision - Bounds**:
   - Bullet destroyed when going out of bounds
   - Handles all four boundaries

5. **Collision - Players**:
   - Bullet destroys other player
   - Killer gets point
   - Bullet destroyed after player hit
   - Self-hit destroys bullet only

6. **Respawn**:
   - Destroyed player respawns after 3 seconds
   - Occupied spawn point causes retry
   - Player spawns at random available point

### Integration Tests

1. **End-to-end firing**: Client fire → server create → client render
2. **Kill flow**: Bullet hit → player death → respawn
3. **Concurrent bullets**: Multiple players firing simultaneously

---

## 12. Configuration

### Server Config

```json
{
  "bullets": {
    "speed": 1,
    "glyph": "•",
    "respawnDelay": 3000
  }
}
```

### Client Config

```json
{
  "bullets": {
    "color": "FFFF00",
    "predictionEnabled": true
  }
}
```

---

## 13. Related Specs

- **Client**: [../client/SPEC_Client.md](../client/SPEC_Client.md) - Client-side prediction patterns
- **Server**: [../server/SPEC_Server.md](../server/SPEC_Server.md) - Server architecture
- **User Inputs**: [../user-inputs/SPEC_User_Inputs.md](../user-inputs/SPEC_User_Inputs.md) - Input handling

---

## 14. Summary

This specification defines the bullet system for player-vs-player combat:

- Players fire bullets using `h`, `j`, `k`, `l` keys (vim-style directions)
- One bullet per player at a time
- Bullets move 1 cell/tick in the fired direction
- Bullets are destroyed on: walls, out of bounds, player hits
- Hitting another player: victim destroyed, killer scores, bullet destroyed
- Hitting self: bullet destroyed, player unaffected
- Destroyed players respawn after 3 seconds at a random available spawn point
- Client-side prediction provides responsive feedback
- Server is authoritative for all bullet state

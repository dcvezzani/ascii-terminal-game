# Enhancement: General-Purpose Scoped Event System

## Context

Currently, when game events occur (like collisions, player movements, entity spawns, alignment detection, combat events), there's no way for different parts of the system to be notified about these events. Events are handled silently - for example, a collision is detected and the move is blocked, but no event is emitted to notify other systems.

**Note**: While this enhancement is initially motivated by collision events (see `BUG_player_not_rendered_after_collision.md`), the solution must be **general-purpose** and capable of handling **any type of game event** (collisions, combat, alignment detection, spawns, despawns, state changes, etc.).

**Current Implementation**:

- Collision detection happens in `src/server/GameServer.js` in the `movePlayer()` method (lines 262-271)
- When a collision is detected, the method returns `false`
- The caller (`handleMoveMessage()` in `src/server/index.js`) receives `false` and sends a `MOVE_FAILED` error message
- No event is emitted, so other systems (like state broadcasting, rendering) cannot react to events
- No way to target events to specific entities, groups, or all entities

**Location**:

- Server-side game logic: `src/server/GameServer.js`
- Message handling: `src/server/index.js`
- Game entities: Players (human-controlled) and Entities (AI-controlled: enemies, collectibles, animated objects)

## Problem

Without a scoped event system:

- **No visibility into game events**: Other parts of the system cannot know when events occur (collisions, spawns, movements, etc.)
- **No event targeting**: Cannot target events to specific entities, groups, or all entities
- **Difficult to handle event-related rendering**: Clients cannot detect events to trigger special rendering logic (e.g., render all players after collision)
- **Tight coupling**: Event handling is tightly coupled to game logic, making it hard to extend
- **No event history**: There's no way to track or log events for debugging or analytics
- **Limited extensibility**: Adding new event-related features requires modifying core game logic

**Current Limitations**:

- State updates don't include event information
- Clients can't distinguish between different event types
- Rendering system can't react to events (see `BUG_player_not_rendered_after_collision.md`)
- Cannot target events to specific scopes (all entities, groups, single entity)

## Desired Feature

A **general-purpose** event system that supports scoped event emission and listening for **any type of game event**:

1. **Event Emission**: Emit events with scope information (all entities, groups, or targeted entities)
2. **Event Listening**: Listen for events at different scopes (global, group, or targeted)
3. **Event Scoping**: Support three event scopes:
   - **Global Events**: Affect all entities (players and AI entities)
   - **Group Events**: Affect a group of entities (e.g., all players, all enemies, all entities in a region)
   - **Targeted Events**: Affect a single specific entity (by entityId or playerId)
4. **Event Types**: Support any event type, not just collisions:
   - Collision events: `"bump"`, `"playerCollision"`, `"wallCollision"`
   - Combat events: `"shot"`, `"damage"`, `"heal"`, `"death"`
   - Alignment events: `"alignedVertically"`, `"alignedHorizontally"`, `"formation"`
   - Entity events: `"spawn"`, `"despawn"`, `"move"`, `"animate"`
   - State events: `"playerJoined"`, `"playerLeft"`, `"gameStateChange"`
   - Custom events: Any game-specific event type
5. **Event Information**: Events should include relevant context (event type, scope, target information, event-specific data, etc.)
6. **Decoupled Design**: Event detection and event handling should be decoupled
7. **Extensible**: Easy to add new event types without modifying core event system

## Requirements

### Event System Architecture

- [ ] Create an event emitter system (or use Node.js `EventEmitter`)
- [ ] Support three event scopes: `"global"`, `"group"`, `"targeted"`
- [ ] Define event types (e.g., "bump", "playerCollision", "wallCollision", "entitySpawn", "entityDespawn", "playerJoined", etc.)
- [ ] Emit events from game logic (e.g., `GameServer.movePlayer()`, entity management, etc.)
- [ ] Allow listeners to subscribe to events by scope and/or event type
- [ ] Include relevant event data (scope, target information, event-specific data, timestamp, etc.)

### Event Scoping

- [ ] **Global Events**: Emit to all entities (players and AI entities)
  - Example: `emit('gameStart', { scope: 'global', ... })`
  - All players and entities receive the event
- [ ] **Group Events**: Emit to a specific group of entities
  - Example: `emit('bump', { scope: 'group', group: 'players', ... })`
  - Only players receive the event
  - Groups can be: `'players'`, `'entities'`, `'enemies'`, `'collectibles'`, custom groups, or entities in a region
- [ ] **Targeted Events**: Emit to a single specific entity
  - Example: `emit('bump', { scope: 'targeted', targetId: 'player-123', ... })`
  - Only the specified entity receives the event
  - Target can be a `playerId` or `entityId`

### Event Type Support

The system must support **any event type**, not just collisions. Examples include:

- **Collision Events**: `"bump"`, `"playerCollision"`, `"wallCollision"`, `"entityCollision"`
- **Combat Events**: `"shot"`, `"damage"`, `"heal"`, `"death"`, `"attack"`, `"defend"`
- **Alignment Events**: `"alignedVertically"`, `"alignedHorizontally"`, `"formation"`, `"lineOfSight"`
- **Entity Events**: `"spawn"`, `"despawn"`, `"move"`, `"animate"`, `"stateChange"`
- **State Events**: `"playerJoined"`, `"playerLeft"`, `"gameStateChange"`, `"scoreChange"`
- **Custom Events**: Any game-specific event type (e.g., `"powerupCollected"`, `"doorOpened"`, `"triggerActivated"`)

**Design Principle**: The event system should be **event-type agnostic**. Adding a new event type should not require changes to the core event system, only emitting and listening for the new event type.

### Integration Points

- [ ] Emit collision events in `GameServer.movePlayer()` when collisions are detected (targeted to the colliding player)
- [ ] Emit collision events that affect groups (e.g., all players in a region)
- [ ] Emit global events (e.g., game state changes that affect everyone)
- [ ] Listen for events in `src/server/index.js` to include event info in state updates
- [ ] Allow future listeners (e.g., logging, analytics, sound effects, rendering triggers)

### Event Data Structure

**Standard Event Structure** (all events must include):

- [ ] Event type: String identifier (e.g., `"bump"`, `"shot"`, `"alignedVertically"`, `"spawn"`, etc.)
- [ ] Scope: `"global"`, `"group"`, or `"targeted"`
- [ ] Timestamp: When the event occurred

**Scope-Specific Fields**:

- [ ] For `"targeted"`: `targetId` (playerId or entityId)
- [ ] For `"group"`: `group` (group identifier: 'players', 'entities', 'enemies', etc.)
- [ ] For `"global"`: no target needed

**Event-Specific Data** (varies by event type, but must be consistent for each event type):

- [ ] Collision events: `playerId`, `attemptedPosition`, `currentPosition`, `collisionType`, `otherPlayerId` (if applicable)
- [ ] Combat events: `attackerId`, `targetId`, `damage`, `weaponType`, `position`
- [ ] Alignment events: `entityId`, `alignmentType` ('vertical' | 'horizontal'), `alignedWith` (array of entityIds), `position`
- [ ] Spawn events: `entityId`, `entityType`, `position`, `initialState`
- [ ] Movement events: `entityId`, `oldPosition`, `newPosition`, `direction`
- [ ] State events: `stateType`, `oldValue`, `newValue`, `affectedEntities`

**Design Principle**: Event data structure should be flexible enough to accommodate any event type while maintaining consistency for the same event type across the codebase.

### Technical Requirements

- [ ] Use Node.js `EventEmitter` or similar event system
- [ ] Events should be synchronous (emitted immediately when collision detected)
- [ ] Multiple listeners should be supported
- [ ] Event data should be immutable (pass copies, not references)
- [ ] Events should not block the move operation (non-blocking)

## Implementation Details

### Event System Options

**Option 1: Use Node.js EventEmitter with Scope Wrapper**

- Extend `GameServer` class with `EventEmitter`
- Create wrapper methods for scoped events: `emitGlobal()`, `emitGroup()`, `emitTargeted()`
- Use `this.emit('bump', eventData)` with scope information in eventData
- Listeners can filter by scope: `gameServer.on('bump', (event) => { if (event.scope === 'targeted' && event.targetId === myId) { ... } })`

**Option 2: Custom Scoped Event System**

- Create a custom event emitter class with built-in scope support
- Methods: `emitGlobal(type, data)`, `emitGroup(type, group, data)`, `emitTargeted(type, targetId, data)`
- Listeners register with scope filters: `on('bump', { scope: 'targeted', targetId: 'player-123' }, callback)`
- More control, but requires more implementation

**Option 3: Multiple Event Emitters**

- Separate emitters for global, group, and targeted events
- `globalEvents.emit('bump', data)`, `groupEvents.emit('bump', group, data)`, `targetedEvents.emit('bump', targetId, data)`
- Listeners subscribe to specific emitters
- More explicit, but more complex

**Recommendation**: Option 1 with scope wrapper - standard EventEmitter with scope information in event data, supports multiple listeners, flexible filtering

### Event Emission Examples

```javascript
// Example 1: Targeted collision event (affects only the colliding player)
// In GameServer.movePlayer()
if (hasCollision) {
  this.emit('bump', {
    scope: 'targeted',
    targetId: playerId,
    type: 'playerCollision',
    playerId,
    attemptedPosition: { x: newX, y: newY },
    currentPosition: { x: player.x, y: player.y },
    timestamp: Date.now(),
    otherPlayerId: otherPlayer.playerId,
  });
  return false;
}

// Example 2: Targeted combat event (player shot by bullet)
this.emit('shot', {
  scope: 'targeted',
  targetId: playerId,
  type: 'shot',
  attackerId: bullet.ownerId,
  damage: bullet.damage,
  position: { x: player.x, y: player.y },
  timestamp: Date.now(),
});

// Example 3: Group alignment event (all entities aligned vertically)
const alignedEntities = this.detectVerticalAlignment(entityId);
if (alignedEntities.length > 1) {
  this.emit('alignedVertically', {
    scope: 'group',
    group: 'entities',
    type: 'alignedVertically',
    alignedWith: alignedEntities.map(e => e.entityId),
    position: { x: entity.x, y: entity.y },
    timestamp: Date.now(),
  });
}

// Example 4: Group area effect (all players in a region)
this.emit('areaEffect', {
  scope: 'group',
  group: 'players',
  type: 'damage',
  area: { x: 10, y: 10, radius: 5 },
  damage: 10,
  timestamp: Date.now(),
});

// Example 5: Global game state change (all entities affected)
this.emit('gameStateChange', {
  scope: 'global',
  type: 'gamePaused',
  paused: true,
  timestamp: Date.now(),
});

// Example 6: Targeted entity spawn event
this.emit('spawn', {
  scope: 'targeted',
  targetId: newEntity.entityId,
  type: 'spawn',
  entityId: newEntity.entityId,
  entityType: newEntity.type,
  position: { x: newEntity.x, y: newEntity.y },
  initialState: newEntity.state,
  timestamp: Date.now(),
});
```

### Event Listening Examples

```javascript
// Example 1: Listen for all collision events (any scope)
gameServer.on('bump', eventData => {
  logger.debug(`Collision event: ${eventData.playerId} bumped`);
  // Include collision info in state update
});

// Example 2: Listen for targeted combat events (player shot)
gameServer.on('shot', eventData => {
  if (eventData.scope === 'targeted') {
    const target = this.getEntity(eventData.targetId);
    if (target) {
      target.health -= eventData.damage;
      // Handle damage, death, etc.
    }
  }
});

// Example 3: Listen for alignment events (entities aligned)
gameServer.on('alignedVertically', eventData => {
  if (eventData.scope === 'group') {
    // Trigger formation bonuses, special abilities, etc.
    logger.debug(`Entities aligned vertically: ${eventData.alignedWith.join(', ')}`);
  }
});

gameServer.on('alignedHorizontally', eventData => {
  if (eventData.scope === 'group') {
    // Handle horizontal alignment
  }
});

// Example 4: Listen for group events affecting all players
gameServer.on('areaEffect', eventData => {
  if (eventData.scope === 'group' && eventData.group === 'players') {
    // Apply area effect to all players
    this.players.forEach(player => {
      // Apply effect based on distance from area center
    });
  }
});

// Example 5: Listen for global events
gameServer.on('gameStateChange', eventData => {
  if (eventData.scope === 'global') {
    // Handle global game state change (pause, game over, etc.)
  }
});

// Example 6: Listen for entity spawn/despawn events
gameServer.on('spawn', eventData => {
  // Handle entity spawning (add to game state, notify clients, etc.)
});

gameServer.on('despawn', eventData => {
  // Handle entity despawning (remove from game state, cleanup, etc.)
});
```

### Files to Modify

1. **`src/server/GameServer.js`**:
   - Extend class with `EventEmitter`
   - Emit events in `movePlayer()` when collisions detected
   - Emit events for other game actions (entity spawns, etc.)

2. **`src/server/index.js`**:
   - Listen for collision events
   - Include collision information in state updates (future enhancement)
   - Set up event listeners during server initialization

3. **Tests**:
   - Add tests for event emission
   - Add tests for event listening
   - Verify event data structure
   - Test event scoping (global, group, targeted)
   - Test event isolation (server events don't leak to client)

**Note**: Client-side event system is **not** part of this enhancement. Client events will be a future enhancement that uses similar patterns but remains isolated from server events.

## Benefits

- **Decoupling**: Event detection separated from event handling
- **Extensibility**: Easy to add new event types and handlers
- **Scoped Targeting**: Events can affect all entities, groups, or specific entities
- **Visibility**: Other systems can react to events at appropriate scopes
- **Debugging**: Events can be logged or tracked with scope information
- **Future-proof**: Enables event-based features (sound effects, animations, statistics, area effects, etc.)
- **Flexibility**: Supports complex game mechanics (area effects, targeted abilities, global events)

## Related Features

- **BUG_player_not_rendered_after_collision** - This enhancement will help fix this bug by allowing clients to detect collisions
- **FEATURE_websocket_integration** - Event system will enable collision information in state updates
- **FEATURE_incremental_rendering** - Events can trigger special rendering logic for collisions

## Dependencies

- Node.js `events` module (built-in, no external dependencies)
- `GameServer` class must be modified to extend `EventEmitter`
- Event listeners must be set up in server initialization

## Design Considerations

### Server-Only Implementation (Phase 1)

**Current Focus**: This enhancement focuses on implementing event handling in the **WebSocket server only**.

- Events are emitted and handled within the server codebase
- Client code does not have event handling in this phase
- Client-server communication remains through official WebSocket messages (STATE_UPDATE, MOVE, etc.)

### Future Client Event System (Phase 2)

**Design for Extensibility**: The event handling patterns should be designed so they can be easily adapted for client-side use in the future.

**Considerations**:

- Use standard patterns (Node.js EventEmitter) that work in both server and client environments
- Keep event data structures serializable (for potential future WebSocket transmission)
- Design event scopes (global, group, targeted) that make sense for both server and client contexts
- Ensure event system is modular and can be imported/used independently

**Client Event Use Cases** (Future):

- Client-side prediction events (movement prediction, reconciliation triggers)
- Local rendering events (collision rendering, animation triggers)
- UI events (status bar updates, help screen toggles)
- Input handling events (keypress processing, movement queuing)

### Event Isolation

**Server and Client Events Must Be Isolated**:

- Server events are internal to server codebase
- Client events (future) will be internal to client codebase
- **No direct event communication** between server and client
- Communication between server and client happens **only through official WebSocket messages**

**WebSocket Communication**:

- Server emits events → Server listeners process → Server sends WebSocket messages (e.g., STATE_UPDATE with collision info)
- Client receives WebSocket messages → Client processes → Client may emit local events (future) for client-side handling
- Events are **not** transmitted directly over WebSocket
- WebSocket messages are the **only** bridge between server and client event systems

**Example Flow**:

```
Server: Collision detected → Server emits 'bump' event → Server listener includes collision info in STATE_UPDATE → WebSocket message sent
Client: Receives STATE_UPDATE → Processes state → (Future) Client may emit local 'collisionReceived' event for rendering
```

**Benefits of Isolation**:

- Server and client can evolve independently
- Different event types and scopes for server vs client
- No tight coupling between server and client event systems
- Clear separation of concerns
- Easier to test and maintain

## Status

**Status**: 📋 NOT STARTED

**Priority**: MEDIUM-HIGH

- Enables fixing `BUG_player_not_rendered_after_collision`
- Improves system architecture and extensibility
- Relatively straightforward implementation
- No breaking changes to existing functionality

## Notes

- This is a foundational enhancement that enables other features
- Should be implemented before fixing collision-related rendering bugs
- **General-Purpose Design**: While initially motivated by collision events, the system must support **any event type**
- Event system supports multiple event types:
  - Collisions: `"bump"`, `"playerCollision"`, `"wallCollision"`
  - Combat: `"shot"`, `"damage"`, `"heal"`, `"death"`
  - Alignment: `"alignedVertically"`, `"alignedHorizontally"`, `"formation"`
  - Entity lifecycle: `"spawn"`, `"despawn"`, `"move"`, `"animate"`
  - State changes: `"playerJoined"`, `"playerLeft"`, `"gameStateChange"`
  - Custom: Any game-specific event type
- Scoped events allow for complex game mechanics:
  - **Global events**: Game-wide state changes, global effects
  - **Group events**: Area effects, team-based events, entity type-specific events, alignment detection
  - **Targeted events**: Player-specific actions, single entity interactions, combat targeting
- Event scoping enables efficient event handling (only relevant entities process events)
- **Extensible**: Adding new event types should not require changes to the core event system
- Can be extended for future game features (combat, abilities, area effects, alignment-based mechanics, etc.)

## Future Enhancements

Once the scoped event system is in place, it can be used for:

- **Collision Events**:
  - Including collision information in state updates
  - Client-side collision detection and rendering
  - Collision sound effects
  - Collision animations
  - Collision statistics/analytics

- **Game Mechanics**:
  - Area effects (damage, healing, buffs) affecting groups
  - Targeted abilities affecting single entities
  - Global game state changes (paused, game over, etc.)
  - Entity spawn/despawn events
  - Player join/leave events

- **Advanced Features**:
  - Event-driven AI behavior
  - Event-based quest system
  - Event logging and replay
  - Event-based achievements
  - Event-driven animations and effects

# Specification: General-Purpose Scoped Event System

## Overview

This specification details the implementation of a general-purpose scoped event system for the WebSocket server to enable event-driven architecture. The system will support three event scopes (global, group, targeted) and can handle any type of game event (collisions, combat, alignment detection, spawns, state changes, etc.). While initially motivated by collision events, the solution must be general-purpose and extensible.

**Reference Card**: `docs/development/cards/enhancements/ENHANCEMENT_event_system_collision_events.md`

## Goals

1. Implement a general-purpose event system that supports any event type
2. Support three event scopes: global (all entities), group (groups of entities), targeted (single entity)
3. Enable event-driven architecture for game logic (collisions, combat, alignment, etc.)
4. Decouple event detection from event handling
5. Design patterns that can be easily adapted for future client-side event system
6. Maintain complete isolation between server and client event systems
7. Enable fixing collision-related rendering bugs through event-driven state updates

## Current State

**Current Architecture**:

- `src/server/GameServer.js` - Manages server-side game state
  - `movePlayer()` - Detects collisions but only returns `false`, no event emission
  - No event system exists
- `src/server/index.js` - Handles WebSocket messages and game server coordination
  - `handleMoveMessage()` - Receives `false` from `movePlayer()` and sends `MOVE_FAILED` error
  - No way to react to collision events or other game events
- No event emission or listening capabilities
- Events are handled silently (collision detected → move blocked → error sent)

**Current Game Flow (Event Handling)**:

1. Player attempts move → `GameServer.movePlayer()` called
2. Collision detected → Method returns `false`
3. `handleMoveMessage()` receives `false` → Sends `MOVE_FAILED` error to client
4. No event emitted → Other systems cannot react to collision
5. State update broadcasted (periodic) → No collision information included

**Issues**:

- No visibility into game events (collisions, spawns, movements, etc.)
- No way to target events to specific entities, groups, or all entities
- Difficult to handle event-related rendering (see `BUG_player_not_rendered_after_collision.md`)
- Tight coupling between event detection and handling
- No event history for debugging or analytics
- Limited extensibility (adding new event types requires modifying core logic)

## Target State

**New Architecture**:

- `src/server/GameServer.js` - Enhanced with EventEmitter
  - Extends Node.js `EventEmitter`
  - Emits events when collisions, spawns, or other game events occur
  - Supports scoped event emission (global, group, targeted)
- `src/server/index.js` - Enhanced with event listeners
  - Listens for game events
  - Includes event information in state updates (future)
  - Sets up event listeners during server initialization
- Event system supports any event type (collisions, combat, alignment, spawns, etc.)
- Events are scoped (global, group, targeted) for efficient handling

**New Game Flow (Event-Driven)**:

1. Player attempts move → `GameServer.movePlayer()` called
2. Collision detected → Event emitted with scope and event data
3. Event listeners process event → Include collision info in state update
4. State update broadcasted → Includes collision information
5. Client receives update → Can react to collision (future: client events)

**Benefits**:

- Decoupled event detection and handling
- Extensible (easy to add new event types)
- Scoped targeting (efficient event processing)
- Visibility into all game events
- Foundation for event-driven features (combat, abilities, area effects, etc.)
- Enables fixing collision-related rendering bugs

## Functional Requirements

### FR1: Event System Foundation

**Requirement**: Implement a general-purpose event system using Node.js EventEmitter.

**Details**:

- Extend `GameServer` class with `EventEmitter`
- Support standard EventEmitter methods: `emit()`, `on()`, `once()`, `off()`, `removeAllListeners()`
- Events are synchronous (emitted immediately when detected)
- Multiple listeners supported for same event type
- Event data is immutable (pass copies, not references)
- Events are non-blocking (don't block game operations)

**Event Emission**:

- `gameServer.emit(eventType, eventData)` - Emit event with type and data
- Event type is a string identifier (e.g., `"bump"`, `"shot"`, `"spawn"`)
- Event data includes scope, target information, and event-specific data

**Event Listening**:

- `gameServer.on(eventType, callback)` - Listen for all events of a type
- `gameServer.once(eventType, callback)` - Listen for event once
- `gameServer.off(eventType, callback)` - Remove listener
- Callbacks receive event data as parameter

**Acceptance Criteria**:

- [ ] `GameServer` extends `EventEmitter`
- [ ] Events can be emitted from game logic
- [ ] Multiple listeners can subscribe to same event type
- [ ] Event data is passed correctly to listeners
- [ ] Events are synchronous and non-blocking
- [ ] Event system works with any event type

### FR2: Event Scoping

**Requirement**: Support three event scopes: global, group, and targeted.

**Details**:

**Global Events**:

- Affect all entities (players and AI entities)
- No target filtering needed
- Example: Game state changes, global effects
- Scope identifier: `"global"`

**Group Events**:

- Affect a specific group of entities
- Groups can be: `'players'`, `'entities'`, `'enemies'`, `'collectibles'`, custom groups, or entities in a region
- Only entities in the specified group receive the event
- Scope identifier: `"group"`
- Requires `group` field in event data

**Targeted Events**:

- Affect a single specific entity
- Target can be a `playerId` or `entityId`
- Only the specified entity receives the event
- Scope identifier: `"targeted"`
- Requires `targetId` field in event data

**Scope Filtering**:

- Listeners can filter events by scope
- Example: `gameServer.on('bump', (event) => { if (event.scope === 'targeted' && event.targetId === myId) { ... } })`
- Listeners can listen for all scopes or filter by scope

**Acceptance Criteria**:

- [ ] Global events can be emitted and received
- [ ] Group events can be emitted with group identifier
- [ ] Targeted events can be emitted with targetId
- [ ] Listeners can filter events by scope
- [ ] Scope information is included in all event data

### FR3: Event Type Support

**Requirement**: Support any event type, not just collisions. The system must be event-type agnostic.

**Details**:

**Event Types** (examples, not exhaustive):

- **Collision Events**: `"bump"`, `"playerCollision"`, `"wallCollision"`, `"entityCollision"`
- **Combat Events**: `"shot"`, `"damage"`, `"heal"`, `"death"`, `"attack"`, `"defend"`
- **Alignment Events**: `"alignedVertically"`, `"alignedHorizontally"`, `"formation"`, `"lineOfSight"`
- **Entity Events**: `"spawn"`, `"despawn"`, `"move"`, `"animate"`, `"stateChange"`
- **State Events**: `"playerJoined"`, `"playerLeft"`, `"gameStateChange"`, `"scoreChange"`
- **Custom Events**: Any game-specific event type

**Design Principle**:

- Adding a new event type should **not** require changes to the core event system
- Only requires emitting and listening for the new event type
- Event data structure should be flexible but consistent for same event type

**Event Type Registration**:

- No registration required - event types are strings
- Event types are discovered through usage
- Event type naming should be consistent (e.g., camelCase or kebab-case)

**Acceptance Criteria**:

- [ ] Any event type can be emitted
- [ ] Any event type can be listened to
- [ ] Adding new event types doesn't require core system changes
- [ ] Event types are case-sensitive strings
- [ ] Event type naming is consistent

### FR4: Event Data Structure

**Requirement**: Define standard event data structure that supports all event types while maintaining consistency.

**Details**:

**Standard Event Structure** (all events must include):

```javascript
{
  scope: 'global' | 'group' | 'targeted',  // Required: Event scope
  type: string,                             // Required: Event type identifier
  timestamp: number,                        // Required: When event occurred (Date.now())
  // ... event-specific data
}
```

**Scope-Specific Fields**:

- For `"targeted"`: `targetId` (string - playerId or entityId)
- For `"group"`: `group` (string - group identifier)
- For `"global"`: No additional scope fields needed

**Event-Specific Data** (varies by event type, but must be consistent for each event type):

**Collision Events**:

```javascript
{
  scope: 'targeted',
  type: 'bump' | 'playerCollision' | 'wallCollision',
  targetId: string,              // Player who collided
  playerId: string,               // Same as targetId for collisions
  attemptedPosition: { x, y },   // Position player tried to move to
  currentPosition: { x, y },      // Player's current position (unchanged)
  collisionType: 'player' | 'wall' | 'boundary',
  otherPlayerId?: string,         // If collision with another player
  timestamp: number
}
```

**Combat Events**:

```javascript
{
  scope: 'targeted',
  type: 'shot' | 'damage' | 'heal' | 'death',
  targetId: string,              // Entity that was shot/damaged/healed
  attackerId?: string,            // Entity that caused the event
  damage?: number,                // Amount of damage/healing
  weaponType?: string,            // Type of weapon/ability
  position: { x, y },            // Where event occurred
  timestamp: number
}
```

**Alignment Events**:

```javascript
{
  scope: 'group',
  type: 'alignedVertically' | 'alignedHorizontally' | 'formation',
  group: 'entities' | 'players',
  entityId: string,               // Entity that triggered alignment detection
  alignmentType: 'vertical' | 'horizontal',
  alignedWith: string[],          // Array of entityIds that are aligned
  position: { x, y },            // Position of alignment
  timestamp: number
}
```

**Entity Events**:

```javascript
{
  scope: 'targeted',
  type: 'spawn' | 'despawn' | 'move' | 'animate',
  targetId: string,              // Entity ID
  entityId: string,               // Same as targetId
  entityType?: string,            // Type of entity
  position?: { x, y },           // Current/new position
  oldPosition?: { x, y },        // Previous position (for move)
  initialState?: object,         // Initial state (for spawn)
  timestamp: number
}
```

**State Events**:

```javascript
{
  scope: 'global' | 'group' | 'targeted',
  type: 'playerJoined' | 'playerLeft' | 'gameStateChange' | 'scoreChange',
  stateType?: string,            // Type of state change
  oldValue?: any,                // Previous value
  newValue?: any,                // New value
  affectedEntities?: string[],   // Entities affected by state change
  timestamp: number
}
```

**Design Principles**:

- Event data should be serializable (plain objects, no functions or circular references)
- Event data should be immutable (pass copies, not references)
- Same event type should have consistent data structure across codebase
- Event data should include all context needed for event handlers

**Acceptance Criteria**:

- [ ] All events include `scope`, `type`, and `timestamp`
- [ ] Scope-specific fields are present when required
- [ ] Event-specific data is consistent for same event type
- [ ] Event data is serializable
- [ ] Event data is immutable (copies passed, not references)

### FR5: Collision Event Emission

**Requirement**: Emit collision events from `GameServer.movePlayer()` when collisions are detected.

**Details**:

**Player Collision**:

- When player attempts to move into another player's position
- Emit targeted event to the colliding player
- Include collision information (attempted position, current position, other player ID)

**Wall Collision**:

- When player attempts to move into a wall
- Emit targeted event to the colliding player
- Include collision information (attempted position, current position, collision type)

**Entity Collision** (future):

- When player attempts to move into an entity's position
- Emit targeted event to the colliding player
- Include collision information (attempted position, current position, entity ID)

**Event Emission Points**:

- In `GameServer.movePlayer()`:
  - After detecting player collision → Emit `"bump"` or `"playerCollision"` event
  - After detecting wall collision → Emit `"bump"` or `"wallCollision"` event
  - Events are emitted before returning `false`

**Acceptance Criteria**:

- [ ] Player collisions emit targeted events
- [ ] Wall collisions emit targeted events
- [ ] Collision events include correct scope and target information
- [ ] Collision events include all relevant collision data
- [ ] Events are emitted synchronously when collision detected
- [ ] Event emission doesn't block move operation

### FR6: Event Listening and Processing

**Requirement**: Set up event listeners in server initialization to process game events.

**Details**:

**Listener Setup**:

- Event listeners set up in `src/server/index.js` during server initialization
- Listeners can be added/removed dynamically
- Multiple listeners can handle same event type

**Event Processing**:

- Listeners process events synchronously (in order of registration)
- Listeners can modify game state, log events, include info in state updates, etc.
- Listeners should not throw errors (wrap in try-catch if needed)

**Initial Listeners** (Phase 1):

- Collision event listener → Include collision info in state updates (future)
- Event logging listener → Log events for debugging
- State update listener → Trigger state broadcasts when needed

**Acceptance Criteria**:

- [ ] Event listeners can be set up during server initialization
- [ ] Listeners receive event data correctly
- [ ] Multiple listeners can handle same event type
- [ ] Listeners can filter events by scope
- [ ] Listeners process events synchronously
- [ ] Listener errors don't crash server

### FR7: Event Isolation (Server-Only)

**Requirement**: Server events must be completely isolated from client events. Communication happens only through WebSocket messages.

**Details**:

**Server Event Isolation**:

- Server events are internal to server codebase
- Events are **not** transmitted directly over WebSocket
- Events are processed by server listeners
- Server listeners can include event information in WebSocket messages

**WebSocket Communication**:

- Server emits event → Server listener processes → Server sends WebSocket message (e.g., STATE_UPDATE with event info)
- Client receives WebSocket message → Client processes → (Future) Client may emit local events
- WebSocket messages are the **only** bridge between server and client

**Event Flow Example**:

```
Server: Collision detected
  → Server emits 'bump' event (internal)
  → Server listener includes collision info in STATE_UPDATE
  → WebSocket message sent to clients
Client: Receives STATE_UPDATE
  → Client processes state
  → (Future) Client may emit local 'collisionReceived' event for rendering
```

**Acceptance Criteria**:

- [ ] Server events are not transmitted over WebSocket
- [ ] Server events are processed internally
- [ ] Event information can be included in WebSocket messages
- [ ] Client and server event systems are completely isolated
- [ ] Communication only through official WebSocket messages

## Technical Requirements

### TR1: EventEmitter Integration

**Requirement**: Integrate Node.js EventEmitter into GameServer class.

**Details**:

- Extend `GameServer` class with `EventEmitter`
- Import `EventEmitter` from `'events'` module
- Use `class GameServer extends EventEmitter`
- Initialize in constructor: `super()` call

**Implementation**:

```javascript
import { EventEmitter } from 'events';

export class GameServer extends EventEmitter {
  constructor() {
    super();
    // ... existing initialization
  }
}
```

**Acceptance Criteria**:

- [ ] `GameServer` extends `EventEmitter`
- [ ] EventEmitter methods available (`emit`, `on`, `once`, `off`, etc.)
- [ ] No breaking changes to existing GameServer API
- [ ] EventEmitter properly initialized

### TR2: Event Emission Performance

**Requirement**: Event emission must be performant and non-blocking.

**Details**:

- Events are emitted synchronously (immediately when detected)
- Event emission should not block game operations
- Multiple listeners should not cause performance issues
- Event data should be lightweight (avoid deep copying large objects)

**Performance Considerations**:

- Event data should be minimal (only necessary information)
- Avoid emitting events in tight loops
- Consider batching events if needed (future optimization)
- Event listeners should be efficient

**Acceptance Criteria**:

- [ ] Event emission doesn't block game operations
- [ ] Multiple listeners don't cause performance degradation
- [ ] Event emission is fast (< 1ms overhead)
- [ ] Event data is lightweight

### TR3: Event Data Immutability

**Requirement**: Event data must be immutable to prevent side effects.

**Details**:

- Event data should be plain objects (not references to game state)
- Pass copies of data, not references
- Listeners should not modify original game state through event data
- Use object spread or `JSON.parse(JSON.stringify())` for deep copies if needed

**Implementation**:

```javascript
// Good: Pass copy of data
this.emit('bump', {
  scope: 'targeted',
  targetId: playerId,
  position: { x: player.x, y: player.y }, // Copy, not reference
  timestamp: Date.now(),
});

// Bad: Pass reference
this.emit('bump', {
  scope: 'targeted',
  targetId: playerId,
  player: player, // Reference - can be modified by listeners
});
```

**Acceptance Criteria**:

- [ ] Event data is immutable (copies, not references)
- [ ] Listeners cannot modify original game state through event data
- [ ] Event data is serializable
- [ ] No circular references in event data

### TR4: Error Handling

**Requirement**: Event system must handle errors gracefully.

**Details**:

- Event listeners should wrap logic in try-catch
- Listener errors should not crash the server
- Event emission errors should be logged
- Failed event processing should not block game operations

**Error Handling Strategy**:

- Wrap listener callbacks in try-catch
- Log errors with context (event type, scope, target)
- Continue processing other listeners even if one fails
- Don't throw errors from event emission

**Acceptance Criteria**:

- [ ] Listener errors don't crash server
- [ ] Errors are logged with context
- [ ] Other listeners continue processing if one fails
- [ ] Event emission doesn't throw errors

## Data Structures

### Event Data Structure

**Standard Event**:

```javascript
{
  scope: 'global' | 'group' | 'targeted',
  type: string,
  timestamp: number,
  // Scope-specific fields
  targetId?: string,    // For 'targeted'
  group?: string,        // For 'group'
  // Event-specific data (varies by event type)
}
```

### Collision Event Data

**Player Collision**:

```javascript
{
  scope: 'targeted',
  type: 'bump' | 'playerCollision',
  targetId: string,              // Player who collided
  playerId: string,               // Same as targetId
  attemptedPosition: { x: number, y: number },
  currentPosition: { x: number, y: number },
  collisionType: 'player',
  otherPlayerId: string,          // Player being collided with
  timestamp: number
}
```

**Wall Collision**:

```javascript
{
  scope: 'targeted',
  type: 'bump' | 'wallCollision',
  targetId: string,              // Player who collided
  playerId: string,               // Same as targetId
  attemptedPosition: { x: number, y: number },
  currentPosition: { x: number, y: number },
  collisionType: 'wall',
  timestamp: number
}
```

### Combat Event Data

**Shot Event**:

```javascript
{
  scope: 'targeted',
  type: 'shot',
  targetId: string,              // Entity that was shot
  attackerId: string,            // Entity that shot
  damage: number,
  weaponType?: string,
  position: { x: number, y: number },
  timestamp: number
}
```

### Alignment Event Data

**Vertical Alignment**:

```javascript
{
  scope: 'group',
  type: 'alignedVertically',
  group: 'entities' | 'players',
  entityId: string,              // Entity that triggered detection
  alignmentType: 'vertical',
  alignedWith: string[],         // Array of entityIds
  position: { x: number, y: number },
  timestamp: number
}
```

## Questions for Clarification

### Q1: Event Emission Wrapper Methods

**Question**: Should we create wrapper methods for scoped event emission (e.g., `emitGlobal()`, `emitGroup()`, `emitTargeted()`) or use standard `emit()` with scope in event data?

**Options**:

- **Option A**: Wrapper methods (`emitGlobal(type, data)`, `emitGroup(type, group, data)`, `emitTargeted(type, targetId, data)`)
  - Pros: More explicit, type-safe, easier to use
  - Cons: More code, wrapper overhead

- **Option B**: Standard `emit()` with scope in event data (`emit(type, { scope, ...data })`)
  - Pros: Standard EventEmitter pattern, flexible, less code
  - Cons: Scope must be manually included, less type-safe

**✅ SELECTED**: Option B (standard `emit()` with scope in data) - more flexible, standard pattern, easier to extend

### Q2: Event Type Constants

**Question**: Should we define event type constants (e.g., `EventTypes.BUMP`, `EventTypes.SHOT`) or use string literals?

**Options**:

- **Option A**: Event type constants file (`src/server/EventTypes.js`)
  - Pros: Type-safe, centralized, prevents typos
  - Cons: More files, must import constants

- **Option B**: String literals (e.g., `"bump"`, `"shot"`)
  - Pros: Simple, no imports needed, flexible
  - Cons: Typos possible, no autocomplete

**✅ SELECTED**: Option A (event type constants file `src/server/EventTypes.js`) - better for maintainability, prevents typos, enables refactoring

### Q3: Event Listener Registration

**Question**: Where should event listeners be registered?

**Options**:

- **Option A**: In `src/server/index.js` during server initialization
  - Pros: Centralized, easy to see all listeners
  - Cons: Can become large file

- **Option B**: In separate listener files (e.g., `src/server/listeners/collisionListener.js`)
  - Pros: Modular, organized, easier to test
  - Cons: More files, must import and register

- **Option C**: In `GameServer` class methods
  - Pros: Co-located with game logic
  - Cons: Mixes concerns, harder to test

**✅ SELECTED**: Option B (separate listener files) - modular, organized, easier to test, scalable

### Q4: Event Data Validation

**Question**: Should we validate event data structure before emission?

**Options**:

- **Option A**: Validate event data (ensure required fields present)
  - Pros: Catches errors early, ensures consistency
  - Cons: Performance overhead, more code

- **Option B**: No validation (trust emitter to provide correct data)
  - Pros: Fast, simple, flexible
  - Cons: Errors caught later, potential inconsistencies

**✅ SELECTED**: Option B (no validation for Phase 1) - fast, simple, flexible. Add validation later if needed.

### Q5: Event History/Logging

**Question**: Should we maintain event history or just log events?

**Options**:

- **Option A**: Maintain event history (store recent events in memory)
  - Pros: Can replay events, debugging, analytics
  - Cons: Memory usage, complexity

- **Option B**: Just log events (no history storage)
  - Pros: Simple, low memory, logs provide history
  - Cons: No in-memory replay

**✅ SELECTED**: Option B (just log events for Phase 1) - simple, low memory, logs sufficient. Add history later if needed.

### Q6: Group Definition

**Question**: How should groups be defined? Predefined groups or dynamic groups?

**Options**:

- **Option A**: Predefined groups (`'players'`, `'entities'`, `'enemies'`, etc.)
  - Pros: Simple, consistent, easy to use
  - Cons: Less flexible

- **Option B**: Dynamic groups (any string identifier)
  - Pros: Flexible, can create custom groups
  - Cons: No validation, potential inconsistencies

- **Option C**: Both (predefined + dynamic)
  - Pros: Best of both worlds
  - Cons: More complex

**✅ SELECTED**: Option B (dynamic groups) - flexible, simple, can add predefined constants later

### Q7: Event Priority/Ordering

**Question**: Should events have priority or ordering guarantees?

**Options**:

- **Option A**: Event priority system (high, medium, low priority)
  - Pros: Control event processing order
  - Cons: Complexity, may not be needed

- **Option B**: First-come-first-served (listeners process in registration order)
  - Pros: Simple, predictable
  - Cons: No priority control

**✅ SELECTED**: Option B (FIFO - first-come-first-served) - simple, sufficient for Phase 1, can add priority later if needed

### Q8: Event Batching

**Question**: Should we support event batching (emit multiple events at once)?

**Options**:

- **Option A**: Support batching (`emitBatch([event1, event2, ...])`)
  - Pros: Efficient for multiple events, atomic processing
  - Cons: Complexity, may not be needed

- **Option B**: No batching (emit events individually)
  - Pros: Simple, standard pattern
  - Cons: Less efficient for multiple events

**✅ SELECTED**: Option B (no batching) - simple, sufficient for Phase 1, can add batching later if needed

## Implementation Considerations

### Phase 1: Core Event System

**Focus**: Implement basic event system with scoping support.

1. Extend `GameServer` with `EventEmitter`
2. Emit collision events from `movePlayer()`
3. Set up basic event listeners in `src/server/index.js`
4. Test event emission and listening

### Phase 2: Event Integration

**Focus**: Integrate events into state updates and other systems.

1. Include collision information in state updates
2. Add event logging
3. Add more event types (spawns, despawns, etc.)
4. Test end-to-end event flow

### Future Phases

- Client-side event system (isolated from server)
- Event history and replay
- Event batching
- Event priority system
- Advanced group definitions

## Success Criteria

1. ✅ `GameServer` extends `EventEmitter` and can emit events
2. ✅ Events support three scopes: global, group, targeted
3. ✅ Collision events are emitted when collisions detected
4. ✅ Event listeners can subscribe to events
5. ✅ Event system supports any event type (not just collisions)
6. ✅ Server and client event systems are isolated
7. ✅ Events are non-blocking and performant
8. ✅ Event data is immutable and serializable
9. ✅ Error handling prevents server crashes
10. ✅ Event system enables fixing collision-related rendering bugs

## Related Features

- **BUG_player_not_rendered_after_collision** - Event system will enable collision information in state updates
- **FEATURE_websocket_integration** - Event system integrates with WebSocket message flow
- **FEATURE_incremental_rendering** - Events can trigger special rendering logic

## Dependencies

- Node.js `events` module (built-in)
- `GameServer` class must be modified
- WebSocket server must be running
- Event listeners must be set up during server initialization

## Notes

- This is a foundational enhancement that enables other features
- Event system is general-purpose, not limited to collisions
- Server events are isolated from client events
- Communication between server and client happens only through WebSocket messages
- Event patterns should be designed for future client-side adaptation
- Event system should be extensible without modifying core code

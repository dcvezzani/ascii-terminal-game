# General-Purpose Scoped Event System - Implementation Gameplan

## Overview

This gameplan implements a general-purpose scoped event system for the WebSocket server to enable event-driven architecture. The system supports three event scopes (global, group, targeted) and can handle any type of game event (collisions, combat, alignment detection, spawns, state changes, etc.). While initially motivated by collision events, the solution is general-purpose and extensible.

**Reference Card**: `docs/development/cards/enhancements/ENHANCEMENT_event_system_collision_events.md`

**Reference Specs**: `docs/development/specs/event-system/event-system_SPECS.md`

## Goals

1. Implement a general-purpose event system using Node.js EventEmitter
2. Support three event scopes: global (all entities), group (groups of entities), targeted (single entity)
3. Create event type constants for type safety and maintainability
4. Emit collision events from game logic (player collisions, wall collisions)
5. Set up modular event listener infrastructure
6. Enable event-driven architecture for future game features
7. Maintain complete isolation between server and client event systems

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

**Problems**:
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
- `src/server/EventTypes.js` - Event type constants
  - Centralized event type definitions
  - Type-safe event type references
- `src/server/listeners/` - Modular event listener files
  - `collisionListener.js` - Handles collision events
  - Future: `combatListener.js`, `alignmentListener.js`, etc.
- `src/server/index.js` - Enhanced with event listener registration
  - Registers event listeners during server initialization
  - Event listeners can include event info in state updates (future)

**New Game Flow (Event-Driven)**:
1. Player attempts move → `GameServer.movePlayer()` called
2. Collision detected → Event emitted with scope and event data
3. Event listeners process event → Include collision info in state update (future)
4. State update broadcasted → Includes collision information (future)
5. Client receives update → Can react to collision (future: client events)

**Benefits**:
- Decoupled event detection and handling
- Extensible (easy to add new event types)
- Scoped targeting (efficient event processing)
- Visibility into all game events
- Foundation for event-driven features (combat, abilities, area effects, etc.)
- Enables fixing collision-related rendering bugs

## Progress Summary

- ✅ **Phase 1: EventEmitter Integration** - COMPLETE
- ⏳ **Phase 2: Event Type Constants** - NOT STARTED
- ⏳ **Phase 3: Collision Event Emission** - NOT STARTED
- ⏳ **Phase 4: Event Listener Infrastructure** - NOT STARTED
- ⏳ **Phase 5: Event Listener Registration** - NOT STARTED
- ⏳ **Phase 6: Testing** - NOT STARTED

## Implementation Phases

---

## Phase 1: EventEmitter Integration (~30 minutes)

**Goal**: Extend `GameServer` class with Node.js `EventEmitter` to enable event emission and listening.

### Step 1.1: Import EventEmitter

- [x] Open `src/server/GameServer.js`
- [x] Add import for `EventEmitter` from `'events'` module:
  ```javascript
  import { EventEmitter } from 'events';
  ```

**Verification**:
- [x] `EventEmitter` imported from `'events'` module
- [x] Import statement is at the top of the file

### Step 1.2: Extend GameServer with EventEmitter

- [x] Modify `GameServer` class declaration to extend `EventEmitter`:
  ```javascript
  export class GameServer extends EventEmitter {
    constructor() {
      super(); // Call EventEmitter constructor
      // ... existing initialization
    }
  }
  ```

**Verification**:
- [x] `GameServer` extends `EventEmitter`
- [x] `super()` is called in constructor
- [x] Existing constructor logic is preserved
- [x] No breaking changes to existing GameServer API

### Step 1.3: Verify EventEmitter Methods Available

- [x] Verify that EventEmitter methods are available:
  - `gameServer.emit(eventType, eventData)`
  - `gameServer.on(eventType, callback)`
  - `gameServer.once(eventType, callback)`
  - `gameServer.off(eventType, callback)`
  - `gameServer.removeAllListeners(eventType)`

**Verification**:
- [x] EventEmitter methods are accessible on `GameServer` instances
- [x] Can call `emit()`, `on()`, `once()`, `off()`, `removeAllListeners()`
- [x] No errors when using EventEmitter methods

### Step 1.4: Create Unit Tests

- [x] Create `test/server/GameServer.eventEmitter.test.js`
- [x] Test that `GameServer` extends `EventEmitter`
- [x] Test that `super()` is called in constructor
- [x] Test that EventEmitter methods are available
- [x] Test that events can be emitted and received

**Test Cases**:
- [x] `should extend EventEmitter`
- [x] `should have EventEmitter methods available`
- [x] `should emit events`
- [x] `should receive events with listeners`
- [x] `should support multiple listeners for same event type`
- [x] `should support removing listeners`

**Verification**:
- [x] All tests pass
- [x] Tests verify EventEmitter integration
- [x] Tests verify no breaking changes to existing API

---

## Phase 2: Event Type Constants (~20 minutes)

**Goal**: Create a centralized event type constants file for type safety and maintainability.

### Step 2.1: Create EventTypes.js File

- [ ] Create `src/server/EventTypes.js`
- [ ] Define event type constants as an object:
  ```javascript
  /**
   * Event Type Constants
   * Centralized definitions for all event types used in the game server
   */
  export const EventTypes = {
    // Collision Events
    BUMP: 'bump',
    PLAYER_COLLISION: 'playerCollision',
    WALL_COLLISION: 'wallCollision',
    ENTITY_COLLISION: 'entityCollision',
    
    // Combat Events (for future use)
    SHOT: 'shot',
    DAMAGE: 'damage',
    HEAL: 'heal',
    DEATH: 'death',
    ATTACK: 'attack',
    DEFEND: 'defend',
    
    // Alignment Events (for future use)
    ALIGNED_VERTICALLY: 'alignedVertically',
    ALIGNED_HORIZONTALLY: 'alignedHorizontally',
    FORMATION: 'formation',
    LINE_OF_SIGHT: 'lineOfSight',
    
    // Entity Events (for future use)
    SPAWN: 'spawn',
    DESPAWN: 'despawn',
    MOVE: 'move',
    ANIMATE: 'animate',
    STATE_CHANGE: 'stateChange',
    
    // State Events (for future use)
    PLAYER_JOINED: 'playerJoined',
    PLAYER_LEFT: 'playerLeft',
    GAME_STATE_CHANGE: 'gameStateChange',
    SCORE_CHANGE: 'scoreChange',
  };
  ```

**Verification**:
- [ ] `EventTypes.js` file created
- [ ] All event types defined as constants
- [ ] Constants use descriptive names
- [ ] Values are lowercase strings (consistent with EventEmitter pattern)

### Step 2.2: Export EventTypes

- [ ] Ensure `EventTypes` is exported as a named export
- [ ] Add JSDoc comments for documentation

**Verification**:
- [ ] `EventTypes` is exported
- [ ] JSDoc comments are present
- [ ] File follows project code style

### Step 2.3: Create Unit Tests

- [ ] Create `test/server/EventTypes.test.js`
- [ ] Test that all event type constants are defined
- [ ] Test that constants are strings
- [ ] Test that constants are unique

**Test Cases**:
- [ ] `should define all collision event types`
- [ ] `should define all combat event types`
- [ ] `should define all alignment event types`
- [ ] `should define all entity event types`
- [ ] `should define all state event types`
- [ ] `should have all constants as strings`
- [ ] `should have unique values for all constants`

**Verification**:
- [ ] All tests pass
- [ ] Tests verify all event types are defined
- [ ] Tests verify type safety

---

## Phase 3: Collision Event Emission (~45 minutes)

**Goal**: Emit collision events from `GameServer.movePlayer()` when collisions are detected.

### Step 3.1: Import EventTypes in GameServer

- [ ] Open `src/server/GameServer.js`
- [ ] Add import for `EventTypes`:
  ```javascript
  import { EventTypes } from './EventTypes.js';
  ```

**Verification**:
- [ ] `EventTypes` imported
- [ ] Import statement is correct

### Step 3.2: Emit Player Collision Events

- [ ] Find the player collision detection code in `movePlayer()` method
- [ ] Before returning `false` for player collision, emit a targeted event:
  ```javascript
  // Check for collision with other players
  const hasCollision = Array.from(this.players.values()).some(
    otherPlayer =>
      otherPlayer.playerId !== playerId && otherPlayer.x === newX && otherPlayer.y === newY
  );

  if (hasCollision) {
    const otherPlayer = Array.from(this.players.values()).find(
      p => p.playerId !== playerId && p.x === newX && p.y === newY
    );
    
    // Emit targeted collision event
    this.emit(EventTypes.BUMP, {
      scope: 'targeted',
      type: EventTypes.PLAYER_COLLISION,
      targetId: playerId,
      playerId: playerId,
      attemptedPosition: { x: newX, y: newY },
      currentPosition: { x: player.x, y: player.y },
      collisionType: 'player',
      otherPlayerId: otherPlayer.playerId,
      timestamp: Date.now(),
    });
    
    logger.debug(`Player collision for player ${playerId} at (${newX}, ${newY})`);
    return false;
  }
  ```

**Verification**:
- [ ] Player collision event is emitted before returning `false`
- [ ] Event includes all required fields (scope, type, targetId, etc.)
- [ ] Event data is immutable (copies, not references)
- [ ] Event includes `timestamp`
- [ ] Existing collision detection logic is preserved

### Step 3.3: Emit Wall Collision Events

- [ ] Find the wall collision detection code in `movePlayer()` method
- [ ] Before returning `false` for wall collision, emit a targeted event:
  ```javascript
  if (this.game.board.isWall(newX, newY)) {
    // Emit targeted collision event
    this.emit(EventTypes.BUMP, {
      scope: 'targeted',
      type: EventTypes.WALL_COLLISION,
      targetId: playerId,
      playerId: playerId,
      attemptedPosition: { x: newX, y: newY },
      currentPosition: { x: player.x, y: player.y },
      collisionType: 'wall',
      timestamp: Date.now(),
    });
    
    logger.debug(`Wall collision for player ${playerId} at (${newX}, ${newY})`);
    return false;
  }
  ```

**Verification**:
- [ ] Wall collision event is emitted before returning `false`
- [ ] Event includes all required fields
- [ ] Event data is immutable
- [ ] Event includes `timestamp`
- [ ] Existing wall collision detection logic is preserved

### Step 3.4: Verify Event Emission Doesn't Break Existing Logic

- [ ] Verify that `movePlayer()` still returns `false` on collision
- [ ] Verify that `movePlayer()` still returns `true` on successful move
- [ ] Verify that event emission doesn't block the move operation
- [ ] Verify that event emission is synchronous

**Verification**:
- [ ] Existing collision handling logic works correctly
- [ ] Event emission doesn't affect return values
- [ ] Event emission is non-blocking
- [ ] No performance degradation

### Step 3.5: Create Unit Tests

- [ ] Create `test/server/GameServer.collisionEvents.test.js`
- [ ] Test that player collision events are emitted
- [ ] Test that wall collision events are emitted
- [ ] Test that event data structure is correct
- [ ] Test that events are emitted synchronously
- [ ] Test that event emission doesn't break move logic

**Test Cases**:
- [ ] `should emit player collision event when player collides with another player`
- [ ] `should emit wall collision event when player collides with wall`
- [ ] `should include correct event data in player collision event`
- [ ] `should include correct event data in wall collision event`
- [ ] `should emit event before returning false`
- [ ] `should not emit event on successful move`
- [ ] `should emit event synchronously`
- [ ] `should not block move operation`

**Verification**:
- [ ] All tests pass
- [ ] Tests verify event emission
- [ ] Tests verify event data structure
- [ ] Tests verify no breaking changes

---

## Phase 4: Event Listener Infrastructure (~30 minutes)

**Goal**: Create modular event listener files for organized event handling.

### Step 4.1: Create Listeners Directory

- [ ] Create `src/server/listeners/` directory
- [ ] Create `src/server/listeners/index.js` for exporting all listeners

**Verification**:
- [ ] `listeners/` directory exists
- [ ] `index.js` file created

### Step 4.2: Create Collision Listener

- [ ] Create `src/server/listeners/collisionListener.js`
- [ ] Implement collision event listener:
  ```javascript
  import { EventTypes } from '../EventTypes.js';
  import { logger } from '../../utils/logger.js';

  /**
   * Collision Event Listener
   * Handles collision events (player collisions, wall collisions)
   */
  export function setupCollisionListener(gameServer) {
    // Listen for all collision events
    gameServer.on(EventTypes.BUMP, (eventData) => {
      try {
        // Log collision event
        logger.debug(`Collision event: ${eventData.type} for player ${eventData.playerId} at (${eventData.attemptedPosition.x}, ${eventData.attemptedPosition.y})`);
        
        // Future: Include collision info in state updates
        // Future: Trigger special rendering logic
        // Future: Play collision sound effects
      } catch (error) {
        logger.error('Error handling collision event:', error);
      }
    });
  }
  ```

**Verification**:
- [ ] `collisionListener.js` file created
- [ ] Listener function is exported
- [ ] Listener handles collision events
- [ ] Error handling is implemented
- [ ] Logging is included

### Step 4.3: Export Listeners from Index

- [ ] Open `src/server/listeners/index.js`
- [ ] Export all listener setup functions:
  ```javascript
  export { setupCollisionListener } from './collisionListener.js';
  // Future: export other listeners here
  ```

**Verification**:
- [ ] All listeners are exported
- [ ] Exports are named exports
- [ ] File follows project code style

### Step 4.4: Create Unit Tests

- [ ] Create `test/server/listeners/collisionListener.test.js`
- [ ] Test that collision listener is set up correctly
- [ ] Test that listener receives collision events
- [ ] Test that listener handles errors gracefully

**Test Cases**:
- [ ] `should set up collision listener`
- [ ] `should receive player collision events`
- [ ] `should receive wall collision events`
- [ ] `should log collision events`
- [ ] `should handle errors gracefully`

**Verification**:
- [ ] All tests pass
- [ ] Tests verify listener setup
- [ ] Tests verify event handling
- [ ] Tests verify error handling

---

## Phase 5: Event Listener Registration (~20 minutes)

**Goal**: Register event listeners during server initialization.

### Step 5.1: Import Listeners in Server Index

- [ ] Open `src/server/index.js`
- [ ] Add import for listener setup functions:
  ```javascript
  import { setupCollisionListener } from './listeners/index.js';
  ```

**Verification**:
- [ ] Listeners imported
- [ ] Import statement is correct

### Step 5.2: Register Listeners During Server Initialization

- [ ] Find server initialization code (where `gameServer` is created)
- [ ] Register event listeners after `gameServer` is created:
  ```javascript
  // Create game server instance
  const gameServer = new GameServer();
  
  // Set up event listeners
  setupCollisionListener(gameServer);
  // Future: setupCombatListener(gameServer);
  // Future: setupAlignmentListener(gameServer);
  ```

**Verification**:
- [ ] Event listeners are registered during server initialization
- [ ] Listeners are registered after `gameServer` is created
- [ ] All listeners are registered
- [ ] Registration order is logical

### Step 5.3: Verify Listeners Are Active

- [ ] Verify that collision events trigger listeners
- [ ] Verify that listeners log events correctly
- [ ] Verify that multiple listeners can be registered

**Verification**:
- [ ] Collision events trigger listeners
- [ ] Listeners log events
- [ ] Multiple listeners work correctly

### Step 5.4: Create Integration Tests

- [ ] Create `test/server/integration/eventSystem.test.js`
- [ ] Test that event system works end-to-end
- [ ] Test that events are emitted and received
- [ ] Test that listeners process events correctly

**Test Cases**:
- [ ] `should emit and receive collision events`
- [ ] `should trigger listeners when events are emitted`
- [ ] `should process events in correct order`
- [ ] `should handle multiple listeners for same event type`
- [ ] `should not crash on listener errors`

**Verification**:
- [ ] All tests pass
- [ ] Tests verify end-to-end event flow
- [ ] Tests verify listener processing
- [ ] Tests verify error handling

---

## Phase 6: Testing (~60 minutes)

**Goal**: Comprehensive testing of the event system.

### Step 6.1: Review Existing Tests

- [ ] Review all unit tests created in previous phases
- [ ] Ensure all tests pass
- [ ] Ensure test coverage is adequate

**Verification**:
- [ ] All unit tests pass
- [ ] Test coverage is adequate
- [ ] Tests are well-structured

### Step 6.2: Create Additional Unit Tests

- [ ] Test event scoping (global, group, targeted)
- [ ] Test event data immutability
- [ ] Test event emission performance
- [ ] Test error handling in listeners

**Test Cases**:
- [ ] `should support global events`
- [ ] `should support group events`
- [ ] `should support targeted events`
- [ ] `should pass immutable event data`
- [ ] `should emit events efficiently`
- [ ] `should handle listener errors gracefully`

**Verification**:
- [ ] All additional tests pass
- [ ] Tests verify event scoping
- [ ] Tests verify data immutability
- [ ] Tests verify performance

### Step 6.3: Create Integration Tests

- [ ] Test event system with real game server
- [ ] Test collision events in multiplayer scenario
- [ ] Test event listener registration and activation
- [ ] Test event system isolation (server-only)

**Test Cases**:
- [ ] `should emit collision events in multiplayer game`
- [ ] `should trigger listeners when collisions occur`
- [ ] `should not affect client event system`
- [ ] `should handle concurrent events`

**Verification**:
- [ ] All integration tests pass
- [ ] Tests verify real-world scenarios
- [ ] Tests verify event system isolation
- [ ] Tests verify concurrent event handling

### Step 6.4: Manual Testing

- [ ] Start WebSocket server
- [ ] Connect multiple clients
- [ ] Trigger collisions (player-to-player, player-to-wall)
- [ ] Verify events are logged
- [ ] Verify event system doesn't break existing functionality

**Manual Test Checklist**:
- [ ] Server starts without errors
- [ ] Multiple clients can connect
- [ ] Player collisions trigger events
- [ ] Wall collisions trigger events
- [ ] Events are logged correctly
- [ ] Existing game functionality works
- [ ] No performance degradation

**Verification**:
- [ ] All manual tests pass
- [ ] Event system works in real scenarios
- [ ] No regressions introduced
- [ ] Performance is acceptable

---

## Success Criteria

1. ✅ `GameServer` extends `EventEmitter` and can emit events
2. ✅ Event type constants are defined and used throughout codebase
3. ✅ Collision events are emitted when collisions detected
4. ✅ Event listeners can subscribe to events
5. ✅ Event system supports three scopes: global, group, targeted
6. ✅ Event system supports any event type (not just collisions)
7. ✅ Event listeners are modular and organized
8. ✅ Event system is isolated (server-only)
9. ✅ Events are non-blocking and performant
10. ✅ Event data is immutable and serializable
11. ✅ Error handling prevents server crashes
12. ✅ All tests pass (unit and integration)
13. ✅ No breaking changes to existing functionality

## Notes

- Event system is general-purpose, not limited to collisions
- Server events are isolated from client events
- Communication between server and client happens only through WebSocket messages
- Event patterns are designed for future client-side adaptation
- Event system should be extensible without modifying core code
- Future enhancements: Include collision info in state updates, add more event types, add event history

## Related Features

- **BUG_player_not_rendered_after_collision** - Event system will enable collision information in state updates
- **FEATURE_websocket_integration** - Event system integrates with WebSocket message flow
- **FEATURE_incremental_rendering** - Events can trigger special rendering logic


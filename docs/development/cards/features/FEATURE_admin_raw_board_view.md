# Feature: Admin Raw Board View

## Context

For debugging and development purposes, there is a need for an admin feature that provides a raw view of all entities on the board. This view allows inspection of the board state without the normal game mechanics interfering.

**Location**:
- Client mode: `src/modes/networkedMode.js` - Main networked mode function
- Input handling: `src/input/InputHandler.js` - Keyboard input handling
- Rendering: `src/render/Renderer.js` - Board rendering
- Board state: `src/game/Board.js` and `src/game/Cell.js` - Cell queue system

**Current System**:
- Players move around the board and their glyphs follow them
- Collision detection prevents movement through walls and solid entities
- Cell queue priority: solid entities > non-solid entities > base cell
- Rendering shows top-most entity/player at each position

## Problem

**Current Limitations**:

1. **No Raw Board View**: There's no way to see all entities in their current positions without player movement interfering
2. **No Entity Inspection**: Cannot easily inspect what's in a cell's queue without modifying code
3. **Player Movement Interference**: Player glyphs move around, making it hard to see the static board state
4. **Collision Rules Apply**: Cannot move to positions to inspect them if they're blocked
5. **No Cell Queue Details**: Cannot see the full cell queue contents (all entities at a position)

**Use Cases**:

- Debugging entity placement issues
- Inspecting cell queue contents
- Verifying board state after operations
- Understanding entity priority and rendering
- Troubleshooting collision detection issues

## Desired Feature

An admin mode that provides a raw view of the board where:

1. **All Entities Stay in Place**: Player entities and all other entities remain at their current positions
2. **Cursor Glyph**: A special "cursor" glyph is introduced that can be moved with movement keys
3. **No Collision Rules**: The cursor can move over walls and through solid entities
4. **Highest Priority**: The cursor has higher cell queue priority than even solid entities (always visible on top)
5. **Cell Inspection**: When the cursor is at a position and spacebar is pressed, the entire cell queue is logged to the client log

### Requirements

1. **Admin Mode Activation**
   - How to activate admin mode (key combination, command, etc.)
   - Visual indicator that admin mode is active
   - How to exit admin mode

2. **Raw Board View**
   - All entities (including player entities) remain in their current positions
   - Player glyphs do not move when movement keys are pressed
   - Board state is frozen/static for inspection

3. **Cursor Glyph**
   - Special glyph character for the cursor (e.g., 'X', '+', '█', or configurable)
   - Cursor position starts at a default location (e.g., center, last player position, or configurable)
   - Cursor is rendered on top of everything (highest priority)

4. **Cursor Movement**
   - Movement keys (arrow keys or WASD) move the cursor
   - No collision detection for cursor movement
   - Cursor can move over walls
   - Cursor can move through solid entities
   - Cursor movement is not sent to server (client-side only)

5. **Cell Queue Inspection**
   - Spacebar at cursor position logs cell queue details
   - Logged information should include:
     - Position (x, y)
     - Base cell character
     - Solid entity (if any) with full details
     - All non-solid entities with full details
     - Cell queue order/priority
   - Logging goes to client log (`clientLogger`)

6. **Rendering Priority**
   - Cursor must have highest priority (above solid entities)
   - This may require extending the Cell queue system or rendering cursor separately
   - Cursor should always be visible when in admin mode

## Technical Details

### Current Cell Queue System

**Priority Order** (from `Cell.getDisplay()`):
1. Solid entity (if present)
2. Non-solid entities (FIFO - first added)
3. Base cell (wall or empty space)

**Cell Structure**:
```javascript
class Cell {
  baseChar: string;           // Base board cell
  solidEntity: Object | null; // Single solid entity
  nonSolidEntities: Array;    // Array of non-solid entities
}
```

### Proposed Implementation

**Option 1: Extend Cell Queue Priority**
- Add a new priority level above solid entities
- Cursor entity has special priority flag
- Modify `Cell.getDisplay()` to check for cursor first

**Option 2: Render Cursor Separately**
- Render cursor as overlay after all board rendering
- Cursor is not part of cell queue
- Simpler but requires separate rendering pass

**Option 3: Special Cursor Entity**
- Cursor is added as entity with special type/flag
- Has highest zOrder/priority value
- Rendered as part of normal entity system but always on top

### Cursor Movement

**Input Handling**:
- Intercept movement keys in admin mode
- Update cursor position (client-side only)
- Do not send movement to server
- Do not trigger collision detection

**Position Tracking**:
- Store cursor position in admin mode state
- Initialize cursor at default position
- Update cursor position on movement key press

### Cell Queue Logging

**Log Format**:
```
[Admin] Cell Queue at (x, y):
  Base Cell: {char}
  Solid Entity: {details} | null
  Non-Solid Entities: [{entity1}, {entity2}, ...]
  Queue Order: [solid, non-solid-1, non-solid-2, ...]
```

**Details to Log**:
- Entity ID
- Character/glyph
- Color
- Solid flag
- zOrder/priority (if applicable)
- Any other entity properties

## Related Features

- **FEATURE_websocket_integration** - Multiplayer mode where admin view would be used
- **FEATURE_incremental_rendering** - Rendering system that would need to support cursor
- **FEATURE_entity_management** - Entity system that cursor would interact with

## Dependencies

- Input handler must support admin mode key detection
- Renderer must support cursor rendering with highest priority
- Board/Cell system must support cell queue inspection
- Client logger must be available for logging

## Open Questions

1. **Activation Method**: How should admin mode be activated?
   - Key combination (e.g., Ctrl+A, Alt+A)?
   - Command line flag?
   - Special key sequence?
   - Configurable?

2. **Cursor Glyph**: What character should represent the cursor?
   - 'X' (cross)
   - '+' (plus)
   - '█' (block)
   - '◉' (circle)
   - Configurable?

3. **Cursor Start Position**: Where should cursor start?
   - Center of board
   - Last player position
   - (0, 0)
   - Configurable?

4. **Visual Indicator**: How should admin mode be indicated?
   - Status bar message
   - Title change
   - Cursor color/style
   - All of the above?

5. **Exit Method**: How should admin mode be exited?
   - Same key combination
   - Escape key
   - Special command
   - Configurable?

6. **Server Interaction**: Should admin mode be client-side only or also available server-side?
   - Client-side only (current requirement)
   - Server-side admin commands
   - Both?

7. **Cell Queue Access**: How to access cell queue from client?
   - Board instance from server state
   - Need to reconstruct cell queue from gameState
   - Server must send cell queue details?

8. **Cursor Priority Implementation**: Which approach for cursor priority?
   - Extend cell queue system
   - Render cursor separately
   - Special entity type

## Status

**Status**: 📋 NOT STARTED

**Priority**: LOW-MEDIUM

- Development/debugging tool
- Not required for gameplay
- Useful for troubleshooting
- Can be refined during implementation

## Notes

- This is a development/debugging feature
- Should not interfere with normal gameplay
- Can be refined and extended as needed
- May be useful for other admin features in the future
- Requirements can be refined during implementation


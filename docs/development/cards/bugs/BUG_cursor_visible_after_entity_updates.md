# Bug: Cursor Visible After Entity Updates

## Context

When updates for entities (other than the player's glyph) are made, the cursor is left visible at the bottom of the terminal. The cursor should be hidden after all rendering takes place.

**Location**:

- Entity rendering: `src/render/Renderer.js` - `updateEntitiesIncremental()` method
- Cursor management: `src/render/Renderer.js` - `initialize()` method

## Problem

**Current Behavior**:

1. Entity updates occur (moved, spawned, despawned, or animated entities)
2. `updateEntitiesIncremental()` is called to render the changes
3. After rendering, the cursor is moved to `(0, statusBarOffset + 1)` to position it below the status bar
4. The cursor remains **visible** at the bottom of the terminal
5. The cursor is not hidden after entity rendering completes

**Expected Behavior**:

1. Entity updates occur (moved, spawned, despawned, or animated entities)
2. `updateEntitiesIncremental()` is called to render the changes
3. After rendering, the cursor should be **hidden** (not just moved)
4. The cursor should not be visible anywhere on the screen after rendering completes

## Root Cause

The `updateEntitiesIncremental()` method moves the cursor to a safe position but does not hide it:

```javascript
// Move cursor out of the way to prevent it from being visible on screen
process.stdout.write(ansiEscapes.cursorTo(0, this.statusBarOffset + 1));
```

However, moving the cursor is not sufficient - it should also be hidden. The renderer has access to `cliCursor.hide()` and `ansiEscapes.cursorHide` (used in `initialize()`), but these are not called after entity updates.

**Potential Issues**:

- Cursor is only moved, not hidden after entity rendering
- Same issue may exist for `updatePlayersIncremental()` (though it also moves cursor)
- Cursor visibility is only managed during initialization, not after incremental updates

## Impact

- **Severity**: LOW-MEDIUM
- **User Experience**: Visual glitch - cursor is visible at bottom of terminal
- **Frequency**: Every time entities are updated (moved, spawned, despawned, animated)
- **Visual Impact**: Cursor appears as a blinking character at the bottom of the screen

## Desired Fix

The cursor should be hidden after all rendering operations complete, not just moved to a different position.

### Requirements

1. **Hide Cursor After Entity Updates**
   - Call `cliCursor.hide()` or `ansiEscapes.cursorHide` after `updateEntitiesIncremental()` completes
   - Ensure cursor is hidden, not just moved

2. **Consistent Cursor Management**
   - Apply same fix to `updatePlayersIncremental()` if it has the same issue
   - Ensure cursor is hidden after all incremental rendering operations

3. **No Performance Impact**
   - Cursor hiding should be fast and not impact rendering performance
   - Should only hide cursor once per update cycle, not per entity

## Technical Details

### Current Implementation

```javascript
updateEntitiesIncremental(previousEntities, currentEntities, board, changes) {
  // ... render entity changes ...

  // Move cursor out of the way to prevent it from being visible on screen
  process.stdout.write(ansiEscapes.cursorTo(0, this.statusBarOffset + 1));
}
```

### Proposed Fix

```javascript
updateEntitiesIncremental(previousEntities, currentEntities, board, changes) {
  // ... render entity changes ...

  // Move cursor out of the way and hide it
  process.stdout.write(ansiEscapes.cursorTo(0, this.statusBarOffset + 1));
  cliCursor.hide(); // or: process.stdout.write(ansiEscapes.cursorHide);
}
```

### Cursor Hiding Methods Available

The renderer already uses:

- `cliCursor.hide()` - Used in `initialize()`
- `ansiEscapes.cursorHide` - Also used in `initialize()`

Both methods are available and should be used after entity updates.

## Related Features

- **FEATURE_incremental_rendering** - Incremental rendering system
- **FEATURE_websocket_integration** - Multiplayer mode with entity updates
- Entity rendering and animation system

## Dependencies

- `cli-cursor` package - Already installed and used
- `ansi-escapes` package - Already installed and used
- Renderer class - Must maintain cursor state

## Status

**Status**: 📋 NOT STARTED

**Priority**: LOW-MEDIUM

- Visual glitch, not a functional bug
- Affects user experience
- Easy to fix (one line of code)
- Should be fixed before release
- May also affect player updates (should check `updatePlayersIncremental()`)

## Notes

- This is a visual/UX bug, not a functional bug
- Game functionality is not affected
- Fix should be straightforward - add cursor hiding after entity updates
- Consider checking `updatePlayersIncremental()` for the same issue
- Cursor is already hidden during initialization, just needs to be hidden after updates

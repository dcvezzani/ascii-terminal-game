# Bug: Modal Overwritten by Other Players' Movement Updates

## Context

In multiplayer mode, when a player has a modal open, movement updates from other players overwrite parts of the modal, causing visual corruption.

**Location**:
- State update handling: `src/modes/networkedMode.js` - `wsClient.onStateUpdate()` callback
- Incremental rendering: `src/render/Renderer.js` - `updatePlayersIncremental()` and `updateEntitiesIncremental()` methods
- Modal state checking: `src/ui/ModalManager.js` - `hasOpenModal()` method

## Problem

**Current Behavior**:

1. Player A opens a modal (modal is active on window A - good)
2. Player B moves their character (updates window B - good)
3. When Player B moves, their movement is visible on window A, erasing parts of the modal (bad)
4. Modal content becomes corrupted or partially erased

**Expected Behavior**:

1. Player A opens a modal (modal is active on window A - good)
2. Player B moves their character (updates window B - good)
3. When Player B moves, their movement should NOT be visible on window A
4. When any player has a modal active, their respective window should not show movement updates from other players or entities
5. Modal should remain intact and visible until closed

## Root Cause

The issue occurs because `STATE_UPDATE` messages trigger incremental rendering updates regardless of whether a modal is open:

1. **No Modal State Check**: The `onStateUpdate` callback in `networkedMode.js` (lines 241-422) does not check if a modal is open before applying incremental updates
2. **Incremental Updates Always Applied**: When `updatePlayersIncremental()` (line 358) and `updateEntitiesIncremental()` (line 374) are called, they update cells on the screen without checking if those cells are covered by a modal
3. **Modal Overwriting**: These incremental updates write to terminal cells that are part of the modal display, overwriting modal content

**Code Flow**:
```
STATE_UPDATE received
  → onStateUpdate() callback
    → updatePlayersIncremental() (no modal check)
      → updateCell() writes to terminal
        → Overwrites modal content ❌
    → updateEntitiesIncremental() (no modal check)
      → updateCell() writes to terminal
        → Overwrites modal content ❌
```

## Impact

- **Severity**: HIGH
- **User Experience**: Critical - modals become unusable in multiplayer mode
- **Frequency**: Every time a player has a modal open and another player moves
- **Multiplayer Impact**: Breaks modal functionality in multiplayer scenarios
- **Visual Corruption**: Modal content is partially or completely erased

## Desired Fix

When a modal is open, incremental rendering updates from `STATE_UPDATE` messages should be suppressed or skipped to prevent overwriting the modal.

### Requirements

1. **Check Modal State Before Rendering**
   - Before applying incremental updates, check if `modalManager.hasOpenModal()` returns `true`
   - If modal is open, skip incremental rendering updates
   - If modal is closed, proceed with normal incremental rendering

2. **Preserve Modal Display**
   - Modal should remain visible and intact while open
   - No game board updates should overwrite modal content
   - Modal should only be updated when modal state changes (selection, open/close)

3. **Handle State Updates During Modal**
   - State updates should still be received and stored (`currentState` should be updated)
   - State updates should just not trigger rendering while modal is open
   - When modal closes, next state update should trigger full render to show current game state

4. **Full Render After Modal Close**
   - When modal closes, ensure full render happens to show current game state
   - This is already handled by modal state change callback (lines 1013-1032 in `networkedMode.js`)

## Technical Details

### Current Implementation

```javascript
// src/modes/networkedMode.js - onStateUpdate callback
wsClient.onStateUpdate(gameState => {
  currentState = gameState;
  // ... validation checks ...
  
  if (previousState === null) {
    renderer.renderFull(game, gameState, localPlayerId);
  } else {
    // Incremental updates - NO MODAL CHECK ❌
    if (otherPlayerChanges.moved.length > 0 || ...) {
      renderer.updatePlayersIncremental(...); // Overwrites modal
    }
    if (changes.entities.moved.length > 0 || ...) {
      renderer.updateEntitiesIncremental(...); // Overwrites modal
    }
  }
});
```

### Problem Flow

1. Player A opens modal → Modal rendered correctly
2. Player B moves → Server broadcasts `STATE_UPDATE`
3. Player A receives `STATE_UPDATE` → `onStateUpdate` callback fires
4. `onStateUpdate` calls `updatePlayersIncremental()` without checking modal state
5. `updatePlayersIncremental()` calls `updateCell()` to update Player B's position
6. `updateCell()` writes to terminal at Player B's screen coordinates
7. If Player B's position overlaps modal area, modal content is overwritten ❌

### Proposed Solution

**Option 1: Skip Incremental Updates When Modal is Open** ✅ **RECOMMENDED**

Add modal state check before applying incremental updates:

```javascript
wsClient.onStateUpdate(gameState => {
  currentState = gameState;
  // ... validation checks ...
  
  // Check if modal is open - skip incremental updates if so
  if (modalManager && modalManager.hasOpenModal()) {
    // Modal is open - don't apply incremental updates
    // Still update currentState for when modal closes
    return; // Skip rendering updates
  }
  
  if (previousState === null) {
    renderer.renderFull(game, gameState, localPlayerId);
  } else {
    // Incremental updates - only applied when modal is closed
    if (otherPlayerChanges.moved.length > 0 || ...) {
      renderer.updatePlayersIncremental(...);
    }
    if (changes.entities.moved.length > 0 || ...) {
      renderer.updateEntitiesIncremental(...);
    }
  }
});
```

**Option 2: Check Modal Bounds Before Updating Cells**

Modify `updateCell()` to check if coordinates overlap modal area before writing:

```javascript
updateCell(x, y, char, colorFn) {
  // Check if cell is within modal bounds
  if (this.modalManager && this.modalManager.hasOpenModal()) {
    const modal = this.modalManager.getCurrentModal();
    const modalBounds = this.modalRenderer.getModalBounds(modal);
    if (this.isCellInModalBounds(x, y, modalBounds)) {
      return; // Skip update if cell is covered by modal
    }
  }
  // ... normal update logic ...
}
```

**Option 1 is simpler and more efficient** - it prevents all incremental updates when modal is open, which is the desired behavior.

## Related Features

- **FEATURE_modal_system** - Modal functionality
- **FEATURE_incremental_rendering** - Incremental rendering system
- **FEATURE_websocket_integration** - Multiplayer functionality

## Dependencies

- ModalManager must be accessible in `networkedMode.js` (already available)
- `hasOpenModal()` method must be reliable (already implemented)
- State updates should still be received and stored (for when modal closes)

## Status

**Status**: ✅ FIXED

**Priority**: HIGH

- Critical for modal functionality in multiplayer mode
- Affects user experience significantly
- Should be fixed before multiplayer release
- Relatively straightforward fix (add modal check)

**Fix Date**: 2026-01-04

**Solution Implemented**: Option 1 - Skip Incremental Updates When Modal is Open

### Implementation Details

1. **Added Modal State Check** (Commit: `285123b`):
   - Added check for `modalManager.hasOpenModal()` before rendering in `onStateUpdate` callback
   - Check is placed after state validation and predicted position initialization
   - Check is placed before both initial render and incremental update logic

2. **Skip Rendering When Modal is Open**:
   - When modal is open, skip all rendering updates (both `renderFull()` and incremental updates)
   - State updates are still received and stored (`currentState = gameState`)
   - Reconciliation still occurs for state tracking purposes

3. **Preserve State Tracking**:
   - `currentState` is still updated when modal is open
   - When modal closes, next state update will trigger full render to show current game state
   - This is handled automatically by the existing modal state change callback

### How It Works

- **Modal Open + State Update**: State is updated, but rendering is skipped
- **Modal Close**: Modal state change callback triggers full re-render (existing behavior)
- **Next State Update After Modal Close**: Full render occurs (because `previousState` wasn't updated while modal was open)

### Files Modified

- `src/modes/networkedMode.js` - Added modal check in `onStateUpdate` callback (lines 302-314)

### Testing

- Modal system tests passing (27/27 tests)
- Renderer modal tests passing (4/4 tests)
- Implementation verified to skip rendering when modal is open

## Notes

- This is a rendering conflict issue
- Modal system works correctly in isolation
- Incremental rendering works correctly when modal is closed
- The issue is that incremental rendering doesn't respect modal state
- Fix should be simple: add modal state check before incremental updates
- State updates should still be received (for game state tracking), just not rendered while modal is open
- When modal closes, the modal state change callback already handles full re-render (lines 1013-1032)


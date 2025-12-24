# Bug: Help Screen Not Cleared After Display

## Context

When the user presses H or ? to display the help screen, the help information is shown correctly. However, when the user wants to return to the game, the help screen is not replaced cleanly. The user must press R (restart) to refresh the screen and return to the game view.

**Location**: 
- Help display: `src/render/Renderer.js` - `renderHelp()` method
- Help control: `src/index.js` - `onHelp` callback

## Problem

**Current Behavior**:
1. User presses H or ? during gameplay
2. Help screen is displayed correctly
3. User wants to return to game (no clear way to do this)
4. Help screen remains visible, not replaced by game board
5. User must press R (restart) to refresh and see the game again

**Expected Behavior**:
1. User presses H or ? during gameplay
2. Help screen is displayed correctly
3. User presses any key (or specific key) to return to game
4. Help screen is cleared and game board is redrawn
5. User can continue playing without needing to restart

## Root Cause

The help screen is displayed but there's no mechanism to:
1. Detect when user wants to return from help screen
2. Clear the help screen
3. Redraw the game board after help is dismissed

The `onHelp` callback only calls `renderer.renderHelp()` but doesn't set up a way to return to the game view.

## Impact

- **Severity**: MEDIUM
- **User Experience**: Poor - user must restart game to continue playing after viewing help
- **Workaround**: User can press R to restart, but this resets game state (position, score)
- **Frequency**: Every time user views help

## Desired Fix

1. **Add return mechanism**: When help is displayed, allow user to press a key to return
2. **Clear help screen**: Properly clear the help screen when returning
3. **Redraw game**: Redraw the full game board after help is dismissed
4. **Preserve game state**: Don't reset game state when returning from help

## Requirements

### Help Screen Return
- [ ] Add mechanism to detect when user wants to return from help
- [ ] Allow any key press (or specific key like ESC, Enter, or Space) to return
- [ ] Clear help screen properly
- [ ] Redraw game board after help is dismissed
- [ ] Preserve game state (position, score, board state)

### Implementation Options

**Option 1: Any key press returns from help**
- When help is displayed, any key press (except quit) returns to game
- Simple and intuitive
- May conflict with other controls

**Option 2: Specific key to return**
- ESC, Enter, or Space returns from help
- More explicit control
- Requires user to know which key to press

**Option 3: Toggle help on/off**
- Pressing H or ? again toggles help off
- Consistent with help activation
- Requires tracking help state

### Code Changes Needed

1. **Track help state**: Add flag to track if help is currently displayed
2. **Modify input handler**: When help is active, handle return key differently
3. **Update help callback**: Set help state when displaying help
4. **Add return logic**: Clear help and redraw game when returning

## Technical Details

### Current Implementation

```javascript
// src/index.js
onHelp: () => {
  if (renderer) {
    renderer.renderHelp();
  }
},
```

### Proposed Implementation

```javascript
// Track help state
let showingHelp = false;

onHelp: () => {
  if (renderer && game) {
    if (showingHelp) {
      // Return to game
      showingHelp = false;
      renderer.renderFull(game);
    } else {
      // Show help
      showingHelp = true;
      renderer.renderHelp();
    }
  }
},
```

Or handle any key when help is shown:

```javascript
// In input handler callbacks, check help state
onMoveUp: () => {
  if (showingHelp) {
    // Return to game
    showingHelp = false;
    renderer.renderFull(game);
    return;
  }
  // ... normal movement logic
},
```

## Related Features

- **FEATURE_terminal_game_mvp** - Main game feature
- Help display functionality (Phase 6.3)

## Dependencies

- InputHandler - Must handle keys when help is displayed
- Renderer - Must clear help and redraw game
- Game - Must preserve state when returning from help

## Status

**Status**: ✅ FIXED

**Priority**: MEDIUM

- Affects user experience
- Has workaround (press R to restart)
- Should be fixed before release

## Solution Implemented

**Fix Date**: Implemented following gameplan `fix-help-screen-clear_GAMEPLAN.md`

**Solution**: Option 1 - Any key press returns from help screen

### Implementation Details

1. **Added Help State Tracking** (Phase 1):
   - Added `showingHelp` boolean variable in `main()` function
   - Tracks whether help screen is currently displayed

2. **Updated Help Callback** (Phase 2):
   - Implemented toggle logic in `onHelp` callback
   - If `showingHelp` is `true`: Close help and redraw game
   - If `showingHelp` is `false`: Show help screen

3. **Updated Input Callbacks** (Phase 3):
   - All movement callbacks (Arrow/WASD) check `showingHelp` state
   - If help is displayed, any movement key closes help and returns to game
   - Restart callback closes help first if displayed, then restarts
   - Quit works regardless of help state (no changes needed)

### How It Works

- **Show Help**: Press H or ? to display help screen
- **Return from Help**: Press any movement key (Arrow/WASD) or H/? again to return
- **Restart with Help**: Press R while help is shown - closes help and restarts
- **Quit with Help**: Press Q/ESC while help is shown - quits game

### Benefits

- ✅ User can return from help without restarting game
- ✅ Game state preserved when returning from help
- ✅ Intuitive - any movement key returns to game
- ✅ Help can be toggled on/off with H/?
- ✅ No visual artifacts when transitioning

### Files Modified

- `src/index.js` - Added help state tracking and updated all callbacks

## Notes

- This is a UX bug, not a functional bug
- Game still works, but user experience is poor
- Fix should be straightforward - mainly adding state tracking and return logic
- Consider making help toggleable (press H/? again to close)


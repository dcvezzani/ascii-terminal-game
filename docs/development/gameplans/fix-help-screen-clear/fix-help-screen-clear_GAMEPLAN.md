# Gameplan: Fix Help Screen Not Cleared Bug

## Overview

This gameplan addresses the bug where the help screen is not cleared properly after being displayed. The fix will implement Option 1: any key press (except quit) will return from the help screen and redraw the game.

**Related Bug**: `BUG_help_screen_not_cleared.md`

## Goal

Implement a mechanism where:
1. When help is displayed, any key press (except quit) returns to the game
2. Help screen is properly cleared
3. Game board is redrawn after help is dismissed
4. Game state is preserved (no reset)

## Prerequisites

- Node.js installed
- Terminal/console access
- Git initialized
- All existing tests passing (271 tests)

---

## Phase 1: Add Help State Tracking (~10 minutes)

### Step 1.1: Add Help State Variable

- [ ] Update `src/index.js`
- [ ] Add `showingHelp` boolean variable to track help display state
- [ ] Initialize to `false` in main function

**Verification**:
- [ ] Variable declared and initialized
- [ ] Variable accessible in all callback functions

---

## Phase 2: Update Help Callback (~15 minutes)

### Step 2.1: Implement Toggle Logic

- [ ] Update `onHelp` callback in `src/index.js`
- [ ] Check `showingHelp` state
- [ ] If `false`: Set `showingHelp = true` and call `renderer.renderHelp()`
- [ ] If `true`: Set `showingHelp = false` and call `renderer.renderFull(game)`

**Verification**:
- [ ] Help toggles on/off with H or ? key
- [ ] Game redraws when help is closed
- [ ] Game state preserved when returning from help

---

## Phase 3: Update Input Callbacks (~20 minutes)

### Step 3.1: Add Help Return Logic to Movement Callbacks

- [ ] Update `onMoveUp` callback
- [ ] Check if `showingHelp` is `true`
- [ ] If true: Close help and return (don't move player)
- [ ] If false: Execute normal movement logic

- [ ] Update `onMoveDown` callback
- [ ] Check if `showingHelp` is `true`
- [ ] If true: Close help and return (don't move player)
- [ ] If false: Execute normal movement logic

- [ ] Update `onMoveLeft` callback
- [ ] Check if `showingHelp` is `true`
- [ ] If true: Close help and return (don't move player)
- [ ] If false: Execute normal movement logic

- [ ] Update `onMoveRight` callback
- [ ] Check if `showingHelp` is `true`
- [ ] If true: Close help and return (don't move player)
- [ ] If false: Execute normal movement logic

**Verification**:
- [ ] Any movement key closes help and returns to game
- [ ] Player doesn't move when closing help
- [ ] Game board redraws correctly

### Step 3.2: Add Help Return Logic to Restart Callback

- [ ] Update `onRestart` callback
- [ ] Check if `showingHelp` is `true`
- [ ] If true: Close help first, then restart game
- [ ] If false: Execute normal restart logic

**Verification**:
- [ ] R key closes help if displayed, then restarts
- [ ] Restart works correctly when help is not displayed

### Step 3.3: Handle Quit Key

- [ ] Update `onQuit` callback (if needed)
- [ ] Quit should work regardless of help state
- [ ] No changes needed if quit already works correctly

**Verification**:
- [ ] Q/ESC quits game even when help is displayed
- [ ] Cleanup happens correctly

---

## Phase 4: Testing (~15 minutes)

### Step 4.1: Manual Testing

- [ ] Start game
- [ ] Press H to show help
- [ ] Press any movement key (Arrow/WASD) - should return to game
- [ ] Press H again - should show help
- [ ] Press R while help is shown - should close help and restart
- [ ] Press Q while help is shown - should quit game
- [ ] Verify game state preserved when returning from help

**Verification**:
- [ ] All scenarios work correctly
- [ ] No visual artifacts
- [ ] Game state preserved

### Step 4.2: Update Tests (if needed)

- [ ] Check if existing tests need updates
- [ ] Add tests for help toggle functionality (if time permits)
- [ ] Verify all existing tests still pass

**Verification**:
- [ ] All 271 tests still pass
- [ ] No test failures introduced

---

## Phase 5: Documentation and Cleanup (~5 minutes)

### Step 5.1: Update Bug Card

- [ ] Update `BUG_help_screen_not_cleared.md`
- [ ] Mark as FIXED
- [ ] Document the solution implemented
- [ ] Add any notes about the fix

**Verification**:
- [ ] Bug card updated
- [ ] Solution documented

### Step 5.2: Git Commit

- [ ] Create commit with descriptive message
- [ ] Include reference to bug card

**Verification**:
- [ ] Changes committed
- [ ] Commit message clear and descriptive

---

## Completion Checklist

- [ ] Help state tracking implemented
- [ ] Help toggles on/off with H/?
- [ ] Any key press (except quit) returns from help
- [ ] Help screen cleared properly
- [ ] Game board redrawn after help dismissed
- [ ] Game state preserved
- [ ] All tests passing
- [ ] Manual testing completed
- [ ] Bug card updated
- [ ] Git commit created

---

## Time Estimate

- **Total**: ~65 minutes
- Phase 1: ~10 minutes
- Phase 2: ~15 minutes
- Phase 3: ~20 minutes
- Phase 4: ~15 minutes
- Phase 5: ~5 minutes

---

## Notes

- This is a bug fix, so focus on minimal changes
- Preserve all existing functionality
- Option 1 (any key returns) is simple and intuitive
- Consider edge cases (help + restart, help + quit)
- Ensure no visual artifacts when transitioning

---

## Progress Summary

- ⏳ **Phase 1: Add Help State Tracking** - NOT STARTED
- ⏳ **Phase 2: Update Help Callback** - NOT STARTED
- ⏳ **Phase 3: Update Input Callbacks** - NOT STARTED
- ⏳ **Phase 4: Testing** - NOT STARTED
- ⏳ **Phase 5: Documentation and Cleanup** - NOT STARTED


# Feature: Disable Unsupported Keys

## Context

Currently, when the game is running in raw mode, pressing keys that are not explicitly handled by the game (such as 'f', 'g', 'x', etc.) will still cause those characters to appear in the terminal. This creates a poor user experience as unwanted characters clutter the terminal display.

**Location**: Implementation will be in:

- `src/input/InputHandler.js` - Handle unsupported keys gracefully

## Problem

**Current Behavior**:

- User presses unsupported key (e.g., 'f', 'g', 'x', number keys, etc.)
- Character appears in terminal
- Terminal display gets cluttered with unwanted characters
- User must manually clear or restart game to clean up

**Impact**:

- Poor user experience
- Terminal display becomes messy
- Unclear which keys are actually supported
- May interfere with game display

## Desired Feature

Prevent unsupported keys from appearing in the terminal by:

1. Silently ignoring unsupported keypresses
2. Not displaying any characters for unsupported keys
3. Only processing explicitly supported keys (Arrow/WASD, Q/ESC, R, H/?)
4. Maintaining clean terminal display

## Requirements

### Functional Requirements

1. **Silent Key Handling**
   - Unsupported keys should be ignored silently
   - No characters should appear in terminal for unsupported keys
   - No error messages or feedback needed

2. **Supported Keys**
   - Movement: Arrow keys (↑ ↓ ← →), WASD (w, s, a, d)
   - Controls: Q (quit), ESC (quit), Ctrl+C (quit), R (restart), H/? (help)
   - All other keys should be ignored

3. **Implementation**
   - Update `InputHandler.handleKeypress()` to explicitly handle unsupported keys
   - Return early or do nothing for unsupported keys
   - Ensure no characters are written to terminal

### Technical Requirements

- No changes to existing supported key functionality
- Maintain all current key mappings
- No performance impact
- Works in raw mode terminal

## Implementation Approach

### Option 1: Explicit Unsupported Key Handling

- In `handleKeypress()`, check if key is supported
- If not supported, return early without any action
- Simple and explicit

### Option 2: Whitelist Approach

- Define list of supported keys
- Only process keys in whitelist
- Ignore all others

### Option 3: Default Case Handling

- Add default case in switch statements
- Explicitly ignore unsupported keys
- Clear and maintainable

**Recommended**: Option 1 or 3 - explicit handling in `handleKeypress()` method

## Technical Details

### Current Implementation

The `InputHandler.handleKeypress()` method currently:

- Handles arrow keys via `key.name`
- Handles character keys (WASD, Q, R, H, ?)
- Doesn't explicitly handle unsupported keys
- Unsupported keys may still trigger terminal output

### Proposed Changes

1. **Update `handleKeypress()` method**:
   - Add explicit check for unsupported keys
   - Return early if key is not supported
   - Ensure no terminal output for unsupported keys

2. **Key Support Matrix**:
   - **Supported**: Arrow keys, W/A/S/D, Q, ESC, Ctrl+C, R, H, ?
   - **Ignored**: All other keys (letters, numbers, symbols, function keys, etc.)

## Benefits

- ✅ Clean terminal display
- ✅ Better user experience
- ✅ Clear indication of which keys are supported
- ✅ No unwanted characters cluttering display
- ✅ Professional appearance

## Related Features

- **FEATURE_terminal_game_mvp** - Main game feature
- Input handling (Phase 4)

## Dependencies

- InputHandler class (`src/input/InputHandler.js`) - must exist
- Raw mode terminal input

## Status

**Status**: 📋 NOT STARTED

## Priority

**Priority**: MEDIUM

- Improves user experience
- Not critical for functionality
- Should be done before release
- Quick to implement

## Notes

- This is a UX improvement
- Should be straightforward to implement
- May need to test with various key types
- Consider edge cases (function keys, special keys, etc.)

## Open Questions

- [ ] Should we provide any feedback for unsupported keys?
  - **Answer**: No, silent ignore is best
- [ ] Should we log unsupported keys for debugging?
  - **Answer**: Only in development mode, if at all
- [ ] What about modifier keys (Shift, Ctrl, Alt)?
  - **Answer**: Only handle Ctrl+C explicitly, ignore others

# Enhancement: Centralized Game Configuration

## Context

The game had hardcoded values scattered across multiple files:

- Board dimensions (20x20) in `Board.js` and `Renderer.js`
- Player initial position (10, 10) in `Game.js`
- Renderer offsets in `Renderer.js`
- Terminal size requirements in `index.js`

This violated DRY (Don't Repeat Yourself) principles and made it difficult to change game settings. To modify the board size, a developer would need to update values in multiple places, which is error-prone.

**Location**: Configuration file created at:

- `src/config/gameConfig.js`

## Problem

Without centralized configuration:

- Hardcoded values duplicated across multiple files
- Changing board size required updates in 4+ places
- Risk of inconsistencies (e.g., board width in Board.js different from Renderer.js)
- Difficult to maintain and modify game settings
- No single source of truth for game configuration

## Desired Feature

A centralized configuration file that:

1. Contains all game settings in one place
2. Calculates derived values automatically (player position, status bar offset)
3. Makes it easy to change board size or other settings
4. Ensures consistency across all components
5. Follows DRY principles

## Requirements

### Configuration File Structure

- [x] Create `src/config/gameConfig.js` ✅
- [x] Define board dimensions (width, height) ✅
- [x] Define player initial position (calculated as center of board) ✅
- [x] Define renderer offsets (title, board, status bar) ✅
- [x] Calculate status bar offset dynamically from board height ✅
- [x] Define terminal size requirements ✅
- [x] Define initial game state (score) ✅

### Code Refactoring

- [x] Update `Board.js` to use `gameConfig.board.width/height` ✅
- [x] Update `Game.js` to use `gameConfig.player.initialX/Y` ✅
- [x] Update `Game.js` to use `gameConfig.game.initialScore` ✅
- [x] Update `Renderer.js` to use config for all dimensions and offsets ✅
- [x] Update `index.js` to use `gameConfig.terminal.minRows/minColumns` ✅
- [x] Remove all hardcoded values from source files ✅

### Verification

- [x] All tests pass after refactoring ✅ (271 tests passing)
- [x] Game runs correctly with config ✅
- [x] Board size can be changed by editing only config file ✅
- [x] Player position updates automatically when board size changes ✅
- [x] Status bar offset updates automatically when board height changes ✅

## Technical Requirements

### Configuration Format

- Use ES Modules (export)
- Use JavaScript object for configuration
- Use getter for calculated values (player position)
- Calculate derived values (status bar offset)

### Code Changes

- Import config in all affected files
- Replace hardcoded values with config references
- Maintain backward compatibility (same default values)
- No breaking changes to public APIs

### Testing

- All existing tests should pass
- No new tests needed (refactoring only)
- Verify game still works correctly

## Implementation Details

### Configuration Structure

```javascript
export const gameConfig = {
  board: {
    width: 20,
    height: 20,
  },
  get player() {
    return {
      initialX: Math.floor(this.board.width / 2),
      initialY: Math.floor(this.board.height / 2),
    };
  },
  renderer: {
    titleOffset: 2,
    boardOffset: 5,
    // statusBarOffset calculated dynamically
  },
  terminal: {
    minRows: 25,
    minColumns: 30,
  },
  game: {
    initialScore: 0,
  },
};
```

### Files Modified

1. **Created**: `src/config/gameConfig.js`
2. **Updated**: `src/game/Board.js`
3. **Updated**: `src/game/Game.js`
4. **Updated**: `src/render/Renderer.js`
5. **Updated**: `src/index.js`

## Benefits

- **DRY**: Single source of truth for all game settings
- **Maintainability**: Easy to change board size or other settings
- **Consistency**: No risk of mismatched values across files
- **Flexibility**: Easy to add new configuration options
- **Documentation**: Configuration file serves as documentation

## Usage

To change board size, edit `src/config/gameConfig.js`:

```javascript
board: {
  width: 30,   // Change this
  height: 30,  // Change this
},
```

Player position and status bar offset will update automatically.

## Related Features

- **FEATURE_terminal_game_mvp** - The main feature this enhances
- All game components that use configuration

## Dependencies

- ES Modules support
- All game components must be able to import config

## Status

**Status**: ✅ COMPLETE

**Implementation**:

- Configuration file created
- All files refactored to use config
- All 271 tests passing
- Game runs correctly
- Code is now DRY and maintainable

## Priority

**Priority**: MEDIUM

- Improves code quality and maintainability
- Makes future enhancements easier
- Reduces risk of configuration errors

## Notes

- This is a refactoring enhancement, not a new feature
- No user-facing changes
- All existing functionality preserved
- Makes it easier to add configuration options in the future

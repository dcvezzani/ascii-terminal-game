# Feature: Unit Tests for Board and Game Classes

## Context

We have implemented the core game engine (Phase 2) with:

- `Board` class (`src/game/Board.js`) - 20x20 grid with walls and empty spaces
- `Game` class (`src/game/Game.js`) - Game state management and player movement

Currently, these classes have been manually tested but lack automated unit tests. We need comprehensive test coverage to ensure reliability and catch regressions as we continue development.

**Location**: Test files will be created in `src/game/` directory:

- `src/game/Board.test.js`
- `src/game/Game.test.js`

## Problem

Without automated unit tests, we risk:

- Introducing bugs when modifying existing code
- Not catching edge cases
- Difficulty verifying behavior after refactoring
- Manual testing is time-consuming and error-prone

We need automated tests to ensure the core game logic works correctly and continues to work as we add features.

## Desired Feature

Comprehensive unit test suite using Vitest for:

1. **Board class** - Test all methods and edge cases
2. **Game class** - Test game state management and player movement

Tests should cover:

- Happy path scenarios
- Edge cases (boundary conditions, invalid inputs)
- Error conditions
- State transitions

## Requirements

### Board Class Tests (`src/game/Board.test.js`)

#### Test Suite: Board Initialization

- [x] Board is created with correct dimensions (20x20)
- [x] Grid is initialized as 2D array
- [x] Outer walls are present on all four sides (top, bottom, left, right)
- [x] Interior cells are all empty spaces (`.`)
- [x] Corner cells are walls

#### Test Suite: `getCell(x, y)` Method

- [x] Returns correct cell content for valid positions
- [x] Returns `#` for wall positions (edges)
- [x] Returns `.` for empty positions (interior)
- [x] Returns `null` for invalid X coordinate (negative)
- [x] Returns `null` for invalid X coordinate (too large)
- [x] Returns `null` for invalid Y coordinate (negative)
- [x] Returns `null` for invalid Y coordinate (too large)
- [x] Returns `null` for both coordinates invalid

#### Test Suite: `setCell(x, y, value)` Method

- [x] Successfully sets cell value for valid position
- [x] Returns `true` when set is successful
- [x] Returns `false` for invalid X coordinate (negative)
- [x] Returns `false` for invalid X coordinate (too large)
- [x] Returns `false` for invalid Y coordinate (negative)
- [x] Returns `false` for invalid Y coordinate (too large)
- [x] Cell value is actually updated after successful set
- [x] Can set different values (not just `.` and `#`)

#### Test Suite: `isWall(x, y)` Method

- [x] Returns `true` for top edge wall (y=0)
- [x] Returns `true` for bottom edge wall (y=19)
- [x] Returns `true` for left edge wall (x=0)
- [x] Returns `true` for right edge wall (x=19)
- [x] Returns `true` for corner positions
- [x] Returns `false` for interior empty spaces
- [x] Returns `false` for invalid positions (handles gracefully)

#### Test Suite: `isValidPosition(x, y)` Method

- [x] Returns `true` for valid positions (0-19 for both x and y)
- [x] Returns `true` for corner positions (0,0), (0,19), (19,0), (19,19)
- [x] Returns `true` for center position (10, 10)
- [x] Returns `false` for negative X coordinate
- [x] Returns `false` for negative Y coordinate
- [x] Returns `false` for X coordinate equal to width (20)
- [x] Returns `false` for Y coordinate equal to height (20)
- [x] Returns `false` for X coordinate greater than width
- [x] Returns `false` for Y coordinate greater than height

### Game Class Tests (`src/game/Game.test.js`)

#### Test Suite: Game Initialization

- [x] Game is created with Board instance
- [x] Player starts at center position (10, 10)
- [x] Score is initialized to 0
- [x] Game is not running initially (`isRunning()` returns `false`)
- [x] `getPlayerPosition()` returns correct initial position
- [x] `getScore()` returns 0

#### Test Suite: `start()` and `stop()` Methods

- [x] `start()` sets running state to `true`
- [x] `isRunning()` returns `true` after `start()`
- [x] `stop()` sets running state to `false`
- [x] `isRunning()` returns `false` after `stop()`
- [x] Can start and stop multiple times

#### Test Suite: `movePlayer(dx, dy)` Method - Successful Movement

- [x] Moves player right (dx=1, dy=0) successfully
- [x] Moves player left (dx=-1, dy=0) successfully
- [x] Moves player up (dx=0, dy=-1) successfully
- [x] Moves player down (dx=0, dy=1) successfully
- [x] Moves player diagonally (dx=1, dy=1) successfully
- [x] Returns `true` when movement is successful
- [x] Player position is updated correctly after movement
- [x] Can move multiple times in sequence

#### Test Suite: `movePlayer(dx, dy)` Method - Wall Collision

- [x] Cannot move into left wall (x=0)
- [x] Cannot move into right wall (x=19)
- [x] Cannot move into top wall (y=0)
- [x] Cannot move into bottom wall (y=19)
- [x] Returns `false` when movement is blocked by wall
- [x] Player position does not change when blocked by wall
- [x] Can move to edge of board but not into wall

#### Test Suite: `movePlayer(dx, dy)` Method - Boundary Checks

- [x] Cannot move outside board bounds (negative coordinates)
- [x] Cannot move outside board bounds (coordinates >= 20)
- [x] Returns `false` when movement is out of bounds
- [x] Player position does not change when out of bounds

#### Test Suite: `movePlayer(dx, dy)` Method - Edge Cases

- [x] Moving with dx=0, dy=0 (no movement) - should handle gracefully
- [x] Moving large distances (dx=10, dy=10) - should be blocked if out of bounds
- [x] Moving from center to near wall, then trying to move into wall

#### Test Suite: `reset()` Method

- [x] Resets player position to center (10, 10)
- [x] Resets score to 0
- [x] Creates new Board instance
- [x] Sets running state to `true`
- [x] Board is reinitialized with walls and empty spaces
- [x] Can reset multiple times

#### Test Suite: State Consistency

- [x] Player position remains consistent after multiple operations
- [x] Score remains 0 (as per MVP requirements)
- [x] Board state is maintained correctly
- [x] Game state is consistent after reset

## Technical Requirements

### Test Framework

- Use **Vitest** (already configured)
- Use ES Modules (import/export)
- Tests should run in non-interactive mode (`npm test`)

### Test Structure

- Use `describe()` blocks to group related tests
- Use `test()` or `it()` for individual test cases
- Use descriptive test names that explain what is being tested
- Use `expect()` assertions from Vitest

### Test Data

- Create fresh Board/Game instances for each test (avoid shared state)
- Test with known positions (corners, edges, center)
- Test boundary conditions explicitly

### Code Coverage Goals

- Aim for 100% coverage of Board class methods
- Aim for 100% coverage of Game class methods
- Cover all branches (if/else conditions)
- Cover edge cases and error conditions

## Open Questions

- [ ] Should we test private methods (like `_initializeGrid()`)?
  - **Answer**: No, only test public API. Private methods are implementation details.
- [ ] Should we use test fixtures or helper functions?
  - **Answer**: Use helper functions for common setup if needed, but keep tests simple.
- [ ] Should we test that Board and Game work together?
  - **Answer**: Yes, Game tests will naturally test the integration with Board.

## Related Features

- **FEATURE_terminal_game_mvp** - The main feature being tested
- Phase 8 of the gameplan includes testing, but this card focuses specifically on unit tests for Phase 2 code

## Dependencies

- Vitest framework (already installed and configured)
- Board class (`src/game/Board.js`) - must exist
- Game class (`src/game/Game.js`) - must exist

## Status

**Status**: ✅ COMPLETE

**Test Results**:

- Board tests: 37 tests passing
- Game tests: 43 tests passing
- Total: 80 tests passing
- All tests run in non-interactive mode (`npm test`)

## Priority

**Priority**: MEDIUM

- Important for code quality and regression prevention
- Can be done in parallel with other phases
- Should be completed before Phase 8 (Testing & Polish) or as part of it

## Notes

- These tests focus on the core game logic (Phase 2)
- Additional tests will be needed for rendering, input handling, etc. (later phases)
- Tests should be fast and run in non-interactive mode
- Consider adding tests as we implement new features (TDD approach)

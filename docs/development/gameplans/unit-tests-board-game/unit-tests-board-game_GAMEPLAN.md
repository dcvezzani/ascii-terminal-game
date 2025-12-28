# Unit Tests for Board and Game Classes - Implementation Gameplan

## Overview

This gameplan implements comprehensive unit tests for the Board and Game classes using Vitest. Tests will be created in phases, with each test verified to pass before moving to the next.

**Reference**: `docs/development/cards/features/FEATURE_unit_tests_board_game.md`

## Progress Summary

- ✅ **Phase 1: Board Class Tests** - COMPLETE
- ✅ **Phase 2: Game Class Tests** - COMPLETE

## Prerequisites

- Vitest framework installed and configured
- Board class (`src/game/Board.js`) exists
- Game class (`src/game/Game.js`) exists
- ES Modules support configured

---

## Phase 1: Board Class Tests (~30 minutes)

### Step 1.1: Create Test File Structure

- [x] Create `src/game/Board.test.js`
- [x] Import Board class
- [x] Import test functions from Vitest (describe, test, expect)

**Verification**:

- [x] Test file created
- [x] Imports are correct
- [x] File structure is ready

### Step 1.2: Board Initialization Tests

- [x] Test: Board is created with correct dimensions (20x20)
- [x] Test: Grid is initialized as 2D array
- [x] Test: Outer walls are present on all four sides
- [x] Test: Interior cells are all empty spaces
- [x] Test: Corner cells are walls

**Verification**:

- [x] All initialization tests pass
- [x] Tests verify board structure correctly

### Step 1.3: getCell() Method Tests

- [x] Test: Returns correct cell content for valid positions
- [x] Test: Returns `#` for wall positions (edges)
- [x] Test: Returns `.` for empty positions (interior)
- [x] Test: Returns `null` for invalid X coordinate (negative)
- [x] Test: Returns `null` for invalid X coordinate (too large)
- [x] Test: Returns `null` for invalid Y coordinate (negative)
- [x] Test: Returns `null` for invalid Y coordinate (too large)
- [x] Test: Returns `null` for both coordinates invalid

**Verification**:

- [x] All getCell() tests pass
- [x] Edge cases handled correctly

### Step 1.4: setCell() Method Tests

- [x] Test: Successfully sets cell value for valid position
- [x] Test: Returns `true` when set is successful
- [x] Test: Returns `false` for invalid X coordinate (negative)
- [x] Test: Returns `false` for invalid X coordinate (too large)
- [x] Test: Returns `false` for invalid Y coordinate (negative)
- [x] Test: Returns `false` for invalid Y coordinate (too large)
- [x] Test: Cell value is actually updated after successful set
- [x] Test: Can set different values (not just `.` and `#`)

**Verification**:

- [x] All setCell() tests pass
- [x] Cell updates are verified

### Step 1.5: isWall() Method Tests

- [x] Test: Returns `true` for top edge wall (y=0)
- [x] Test: Returns `true` for bottom edge wall (y=19)
- [x] Test: Returns `true` for left edge wall (x=0)
- [x] Test: Returns `true` for right edge wall (x=19)
- [x] Test: Returns `true` for corner positions
- [x] Test: Returns `false` for interior empty spaces
- [x] Test: Returns `false` for invalid positions (handles gracefully)

**Verification**:

- [x] All isWall() tests pass
- [x] All wall positions identified correctly

### Step 1.6: isValidPosition() Method Tests

- [x] Test: Returns `true` for valid positions (0-19 for both x and y)
- [x] Test: Returns `true` for corner positions
- [x] Test: Returns `true` for center position (10, 10)
- [x] Test: Returns `false` for negative X coordinate
- [x] Test: Returns `false` for negative Y coordinate
- [x] Test: Returns `false` for X coordinate equal to width (20)
- [x] Test: Returns `false` for Y coordinate equal to height (20)
- [x] Test: Returns `false` for X coordinate greater than width
- [x] Test: Returns `false` for Y coordinate greater than height

**Verification**:

- [x] All isValidPosition() tests pass
- [x] All boundary conditions tested

---

## Phase 2: Game Class Tests (~30 minutes)

### Step 2.1: Create Test File Structure

- [x] Create `src/game/Game.test.js`
- [x] Import Game class
- [x] Import test functions from Vitest

**Verification**:

- [x] Test file created
- [x] Imports are correct

### Step 2.2: Game Initialization Tests

- [x] Test: Game is created with Board instance
- [x] Test: Player starts at center position (10, 10)
- [x] Test: Score is initialized to 0
- [x] Test: Game is not running initially
- [x] Test: `getPlayerPosition()` returns correct initial position
- [x] Test: `getScore()` returns 0

**Verification**:

- [x] All initialization tests pass

### Step 2.3: start() and stop() Method Tests

- [x] Test: `start()` sets running state to `true`
- [x] Test: `isRunning()` returns `true` after `start()`
- [x] Test: `stop()` sets running state to `false`
- [x] Test: `isRunning()` returns `false` after `stop()`
- [x] Test: Can start and stop multiple times

**Verification**:

- [x] All start/stop tests pass

### Step 2.4: movePlayer() - Successful Movement Tests

- [x] Test: Moves player right (dx=1, dy=0) successfully
- [x] Test: Moves player left (dx=-1, dy=0) successfully
- [x] Test: Moves player up (dx=0, dy=-1) successfully
- [x] Test: Moves player down (dx=0, dy=1) successfully
- [x] Test: Moves player diagonally (dx=1, dy=1) successfully
- [x] Test: Returns `true` when movement is successful
- [x] Test: Player position is updated correctly after movement
- [x] Test: Can move multiple times in sequence

**Verification**:

- [x] All successful movement tests pass

### Step 2.5: movePlayer() - Wall Collision Tests

- [x] Test: Cannot move into left wall (x=0)
- [x] Test: Cannot move into right wall (x=19)
- [x] Test: Cannot move into top wall (y=0)
- [x] Test: Cannot move into bottom wall (y=19)
- [x] Test: Returns `false` when movement is blocked by wall
- [x] Test: Player position does not change when blocked by wall
- [x] Test: Can move to edge of board but not into wall

**Verification**:

- [x] All wall collision tests pass

### Step 2.6: movePlayer() - Boundary Check Tests

- [x] Test: Cannot move outside board bounds (negative coordinates)
- [x] Test: Cannot move outside board bounds (coordinates >= 20)
- [x] Test: Returns `false` when movement is out of bounds
- [x] Test: Player position does not change when out of bounds

**Verification**:

- [x] All boundary check tests pass

### Step 2.7: movePlayer() - Edge Case Tests

- [x] Test: Moving with dx=0, dy=0 (no movement) - should handle gracefully
- [x] Test: Moving large distances (dx=10, dy=10) - should be blocked if out of bounds
- [x] Test: Moving from center to near wall, then trying to move into wall

**Verification**:

- [x] All edge case tests pass

### Step 2.8: reset() Method Tests

- [x] Test: Resets player position to center (10, 10)
- [x] Test: Resets score to 0
- [x] Test: Creates new Board instance
- [x] Test: Sets running state to `true`
- [x] Test: Board is reinitialized with walls and empty spaces
- [x] Test: Can reset multiple times

**Verification**:

- [x] All reset() tests pass

### Step 2.9: State Consistency Tests

- [x] Test: Player position remains consistent after multiple operations
- [x] Test: Score remains 0 (as per MVP requirements)
- [x] Test: Board state is maintained correctly
- [x] Test: Game state is consistent after reset

**Verification**:

- [x] All state consistency tests pass

---

## Completion Checklist

- [x] All Board class tests implemented and passing
- [x] All Game class tests implemented and passing
- [x] Tests run in non-interactive mode (`npm test`)
- [x] All test cases from feature card are covered
- [x] Code coverage is good (aim for 100% of methods)
- [x] Tests are well-organized and readable

## Test Results Summary

- **Board Tests**: 37 tests passing
- **Game Tests**: 43 tests passing
- **Total**: 80 tests passing
- **Test Files**: 2 passed
- **All tests verified**: ✅

## Notes

- Run `npm test` after each step to verify tests pass
- Mark off tests in the feature card as they pass
- Keep tests simple and focused on one thing
- Use descriptive test names

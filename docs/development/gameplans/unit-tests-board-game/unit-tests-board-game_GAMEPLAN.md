# Unit Tests for Board and Game Classes - Implementation Gameplan

## Overview

This gameplan implements comprehensive unit tests for the Board and Game classes using Vitest. Tests will be created in phases, with each test verified to pass before moving to the next.

**Reference**: `docs/development/cards/features/FEATURE_unit_tests_board_game.md`

## Progress Summary

- ⏳ **Phase 1: Board Class Tests** - NOT STARTED
- ⏳ **Phase 2: Game Class Tests** - NOT STARTED

## Prerequisites

- Vitest framework installed and configured
- Board class (`src/game/Board.js`) exists
- Game class (`src/game/Game.js`) exists
- ES Modules support configured

---

## Phase 1: Board Class Tests (~30 minutes)

### Step 1.1: Create Test File Structure

- [ ] Create `src/game/Board.test.js`
- [ ] Import Board class
- [ ] Import test functions from Vitest (describe, test, expect)

**Verification**:
- [ ] Test file created
- [ ] Imports are correct
- [ ] File structure is ready

### Step 1.2: Board Initialization Tests

- [ ] Test: Board is created with correct dimensions (20x20)
- [ ] Test: Grid is initialized as 2D array
- [ ] Test: Outer walls are present on all four sides
- [ ] Test: Interior cells are all empty spaces
- [ ] Test: Corner cells are walls

**Verification**:
- [ ] All initialization tests pass
- [ ] Tests verify board structure correctly

### Step 1.3: getCell() Method Tests

- [ ] Test: Returns correct cell content for valid positions
- [ ] Test: Returns `#` for wall positions (edges)
- [ ] Test: Returns `.` for empty positions (interior)
- [ ] Test: Returns `null` for invalid X coordinate (negative)
- [ ] Test: Returns `null` for invalid X coordinate (too large)
- [ ] Test: Returns `null` for invalid Y coordinate (negative)
- [ ] Test: Returns `null` for invalid Y coordinate (too large)
- [ ] Test: Returns `null` for both coordinates invalid

**Verification**:
- [ ] All getCell() tests pass
- [ ] Edge cases handled correctly

### Step 1.4: setCell() Method Tests

- [ ] Test: Successfully sets cell value for valid position
- [ ] Test: Returns `true` when set is successful
- [ ] Test: Returns `false` for invalid X coordinate (negative)
- [ ] Test: Returns `false` for invalid X coordinate (too large)
- [ ] Test: Returns `false` for invalid Y coordinate (negative)
- [ ] Test: Returns `false` for invalid Y coordinate (too large)
- [ ] Test: Cell value is actually updated after successful set
- [ ] Test: Can set different values (not just `.` and `#`)

**Verification**:
- [ ] All setCell() tests pass
- [ ] Cell updates are verified

### Step 1.5: isWall() Method Tests

- [ ] Test: Returns `true` for top edge wall (y=0)
- [ ] Test: Returns `true` for bottom edge wall (y=19)
- [ ] Test: Returns `true` for left edge wall (x=0)
- [ ] Test: Returns `true` for right edge wall (x=19)
- [ ] Test: Returns `true` for corner positions
- [ ] Test: Returns `false` for interior empty spaces
- [ ] Test: Returns `false` for invalid positions (handles gracefully)

**Verification**:
- [ ] All isWall() tests pass
- [ ] All wall positions identified correctly

### Step 1.6: isValidPosition() Method Tests

- [ ] Test: Returns `true` for valid positions (0-19 for both x and y)
- [ ] Test: Returns `true` for corner positions
- [ ] Test: Returns `true` for center position (10, 10)
- [ ] Test: Returns `false` for negative X coordinate
- [ ] Test: Returns `false` for negative Y coordinate
- [ ] Test: Returns `false` for X coordinate equal to width (20)
- [ ] Test: Returns `false` for Y coordinate equal to height (20)
- [ ] Test: Returns `false` for X coordinate greater than width
- [ ] Test: Returns `false` for Y coordinate greater than height

**Verification**:
- [ ] All isValidPosition() tests pass
- [ ] All boundary conditions tested

---

## Phase 2: Game Class Tests (~30 minutes)

### Step 2.1: Create Test File Structure

- [ ] Create `src/game/Game.test.js`
- [ ] Import Game class
- [ ] Import test functions from Vitest

**Verification**:
- [ ] Test file created
- [ ] Imports are correct

### Step 2.2: Game Initialization Tests

- [ ] Test: Game is created with Board instance
- [ ] Test: Player starts at center position (10, 10)
- [ ] Test: Score is initialized to 0
- [ ] Test: Game is not running initially
- [ ] Test: `getPlayerPosition()` returns correct initial position
- [ ] Test: `getScore()` returns 0

**Verification**:
- [ ] All initialization tests pass

### Step 2.3: start() and stop() Method Tests

- [ ] Test: `start()` sets running state to `true`
- [ ] Test: `isRunning()` returns `true` after `start()`
- [ ] Test: `stop()` sets running state to `false`
- [ ] Test: `isRunning()` returns `false` after `stop()`
- [ ] Test: Can start and stop multiple times

**Verification**:
- [ ] All start/stop tests pass

### Step 2.4: movePlayer() - Successful Movement Tests

- [ ] Test: Moves player right (dx=1, dy=0) successfully
- [ ] Test: Moves player left (dx=-1, dy=0) successfully
- [ ] Test: Moves player up (dx=0, dy=-1) successfully
- [ ] Test: Moves player down (dx=0, dy=1) successfully
- [ ] Test: Moves player diagonally (dx=1, dy=1) successfully
- [ ] Test: Returns `true` when movement is successful
- [ ] Test: Player position is updated correctly after movement
- [ ] Test: Can move multiple times in sequence

**Verification**:
- [ ] All successful movement tests pass

### Step 2.5: movePlayer() - Wall Collision Tests

- [ ] Test: Cannot move into left wall (x=0)
- [ ] Test: Cannot move into right wall (x=19)
- [ ] Test: Cannot move into top wall (y=0)
- [ ] Test: Cannot move into bottom wall (y=19)
- [ ] Test: Returns `false` when movement is blocked by wall
- [ ] Test: Player position does not change when blocked by wall
- [ ] Test: Can move to edge of board but not into wall

**Verification**:
- [ ] All wall collision tests pass

### Step 2.6: movePlayer() - Boundary Check Tests

- [ ] Test: Cannot move outside board bounds (negative coordinates)
- [ ] Test: Cannot move outside board bounds (coordinates >= 20)
- [ ] Test: Returns `false` when movement is out of bounds
- [ ] Test: Player position does not change when out of bounds

**Verification**:
- [ ] All boundary check tests pass

### Step 2.7: movePlayer() - Edge Case Tests

- [ ] Test: Moving with dx=0, dy=0 (no movement) - should handle gracefully
- [ ] Test: Moving large distances (dx=10, dy=10) - should be blocked if out of bounds
- [ ] Test: Moving from center to near wall, then trying to move into wall

**Verification**:
- [ ] All edge case tests pass

### Step 2.8: reset() Method Tests

- [ ] Test: Resets player position to center (10, 10)
- [ ] Test: Resets score to 0
- [ ] Test: Creates new Board instance
- [ ] Test: Sets running state to `true`
- [ ] Test: Board is reinitialized with walls and empty spaces
- [ ] Test: Can reset multiple times

**Verification**:
- [ ] All reset() tests pass

### Step 2.9: State Consistency Tests

- [ ] Test: Player position remains consistent after multiple operations
- [ ] Test: Score remains 0 (as per MVP requirements)
- [ ] Test: Board state is maintained correctly
- [ ] Test: Game state is consistent after reset

**Verification**:
- [ ] All state consistency tests pass

---

## Completion Checklist

- [ ] All Board class tests implemented and passing
- [ ] All Game class tests implemented and passing
- [ ] Tests run in non-interactive mode (`npm test`)
- [ ] All test cases from feature card are covered
- [ ] Code coverage is good (aim for 100% of methods)
- [ ] Tests are well-organized and readable

## Notes

- Run `npm test` after each step to verify tests pass
- Mark off tests in the feature card as they pass
- Keep tests simple and focused on one thing
- Use descriptive test names


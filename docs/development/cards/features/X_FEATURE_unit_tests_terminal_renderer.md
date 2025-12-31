# Feature: Unit Tests for Terminal Utilities and Renderer Classes

## Context

We have implemented the terminal rendering system (Phase 3) with:

- `terminal.js` utilities (`src/utils/terminal.js`) - Terminal size checking and helper functions
- `Renderer` class (`src/render/Renderer.js`) - Terminal rendering with colors and cursor control

Currently, these classes have been manually tested but lack automated unit tests. We need comprehensive test coverage to ensure reliability and catch regressions as we continue development.

**Location**: Test files will be created in:

- `src/utils/terminal.test.js`
- `src/render/Renderer.test.js`

## Problem

Without automated unit tests, we risk:

- Introducing bugs when modifying rendering code
- Not catching edge cases in terminal size validation
- Difficulty verifying behavior after refactoring
- Manual testing is time-consuming and error-prone

We need automated tests to ensure the terminal rendering system works correctly and continues to work as we add features.

## Desired Feature

Comprehensive unit test suite using Vitest for:

1. **Terminal utilities** - Test all helper functions and size validation
2. **Renderer class** - Test rendering methods (may require mocking for terminal output)

Tests should cover:

- Happy path scenarios
- Edge cases (boundary conditions, invalid inputs)
- Error conditions
- Terminal size validation

## Requirements

### Terminal Utilities Tests (`src/utils/terminal.test.js`)

#### Test Suite: `getTerminalSize()`

- [x] Returns object with rows and columns properties
- [x] Returns valid numbers (not null/undefined)
- [x] Returns reasonable default values if process.stdout.rows/columns unavailable
- [x] Values are positive integers

#### Test Suite: `validateTerminalSize()`

- [x] Returns valid: true for terminal meeting minimum requirements
- [x] Returns valid: false for terminal too small (rows)
- [x] Returns valid: false for terminal too small (columns)
- [x] Returns valid: false for terminal too small (both dimensions)
- [x] Returns correct current size in result object
- [x] Returns error message when terminal too small
- [x] Uses default minimums (25x30) when not specified
- [x] Accepts custom minimum size parameters
- [x] Handles edge case: terminal exactly at minimum size

#### Test Suite: `getHorizontalCenter()`

- [x] Returns correct center offset for content
- [x] Returns 0 or positive number (never negative)
- [x] Centers correctly for odd-width content
- [x] Centers correctly for even-width content
- [x] Uses current terminal width when not specified
- [x] Accepts custom terminal width parameter
- [x] Handles content wider than terminal (returns 0)

#### Test Suite: `getVerticalCenter()`

- [x] Returns correct center offset for content
- [x] Returns 0 or positive number (never negative)
- [x] Centers correctly for odd-height content
- [x] Centers correctly for even-height content
- [x] Uses current terminal height when not specified
- [x] Accepts custom terminal height parameter
- [x] Handles content taller than terminal (returns 0)

### Renderer Class Tests (`src/render/Renderer.test.js`)

**Note**: Renderer tests may require mocking `process.stdout.write` and terminal functions since they interact with the terminal directly.

#### Test Suite: Renderer Initialization

- [x] Renderer is created with correct default offsets
- [x] Constructor sets boardWidth and boardHeight correctly
- [x] All offset properties are set (titleOffset, boardOffset, statusBarOffset)

#### Test Suite: `initialize()`

- [x] Calls cliCursor.hide()
- [x] Writes cursor hide escape sequence
- [x] Prepares terminal for rendering

#### Test Suite: `clearScreen()`

- [x] Writes clear screen escape sequence
- [x] Moves cursor to (0, 0)
- [x] Clears terminal output

#### Test Suite: `renderTitle()`

- [x] Writes title text to correct position
- [x] Centers title horizontally
- [x] Applies correct styling (bold, cyan)
- [x] Uses correct row offset

#### Test Suite: `renderBoard()`

- [x] Renders all board cells
- [x] Centers board horizontally
- [x] Renders player character (@) at correct position with green color
- [x] Renders walls (#) with gray color
- [x] Renders empty spaces (.) with white color
- [x] Handles all board positions correctly
- [x] Uses correct row offsets for each board row

#### Test Suite: `renderStatusBar()`

- [x] Renders status text with score
- [x] Renders status text with position coordinates
- [x] Renders control instructions
- [x] Centers status bar horizontally
- [x] Uses correct row offset
- [x] Applies dim styling

#### Test Suite: `renderFull()`

- [x] Calls clearScreen()
- [x] Calls renderTitle()
- [x] Calls renderBoard() with correct parameters
- [x] Calls renderStatusBar() with correct parameters
- [x] Moves cursor out of the way after rendering
- [x] Renders complete game state correctly

#### Test Suite: `updateCell()`

- [x] Calculates correct screen position from board coordinates
- [x] Moves cursor to correct position
- [x] Writes character with correct color
- [x] Handles all board positions
- [x] Uses horizontal centering offset correctly

#### Test Suite: `updatePlayerPosition()`

- [x] Clears old position (restores cell content)
- [x] Draws new position with player character
- [x] Uses correct colors (green for player, gray/white for cells)
- [x] Updates status bar with new position
- [x] Handles movement correctly

#### Test Suite: `cleanup()`

- [x] Shows cursor (cliCursor.show())
- [x] Writes cursor show escape sequence
- [x] Clears screen
- [x] Moves cursor to (0, 0)
- [x] Restores terminal state

#### Test Suite: Edge Cases

- [x] Handles board positions at edges correctly
- [x] Handles player at (0, 0) correctly
- [x] Handles player at (19, 19) correctly
- [x] Handles rendering when terminal is small (graceful degradation)

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

### Mocking Strategy

- Mock `process.stdout.write` for Renderer tests
- Mock `cli-cursor` functions if needed
- Mock terminal size functions for testing centering logic
- Use `vi.spyOn()` or `vi.mock()` from Vitest for mocking

### Test Data

- Create fresh Renderer instances for each test (avoid shared state)
- Test with known terminal sizes
- Test with various board positions
- Test boundary conditions explicitly

### Code Coverage Goals

- Aim for 100% coverage of terminal utility functions
- Aim for high coverage of Renderer class methods
- Cover all branches (if/else conditions)
- Cover edge cases and error conditions

## Open Questions

- [ ] How to test terminal output without actually writing to terminal?
  - **Answer**: Mock `process.stdout.write` and verify calls
- [ ] Should we test actual terminal escape sequences?
  - **Answer**: Yes, verify correct escape sequences are written
- [ ] How to test cursor positioning?
  - **Answer**: Verify `ansi-escapes.cursorTo()` calls with correct coordinates
- [ ] Should we test color output?
  - **Answer**: Yes, verify chalk color functions are called correctly

## Related Features

- **FEATURE_terminal_game_mvp** - The main feature being tested
- **FEATURE_unit_tests_board_game** - Similar test structure
- Phase 3 of the gameplan includes terminal rendering

## Dependencies

- Vitest framework (already installed and configured)
- Terminal utilities (`src/utils/terminal.js`) - must exist
- Renderer class (`src/render/Renderer.js`) - must exist
- Mocking capabilities for terminal I/O

## Status

**Status**: ✅ COMPLETE

**Test Results**:

- Terminal utilities tests: 27 tests passing
- Renderer tests: 51 tests passing
- Total: 78 tests passing
- All tests run in non-interactive mode (`npm test`)

## Priority

**Priority**: MEDIUM

- Important for code quality and regression prevention
- Can be done in parallel with other phases
- Should be completed before final integration or as part of Phase 8

## Notes

- These tests focus on the terminal rendering system (Phase 3)
- Renderer tests will require mocking terminal I/O
- Terminal utility tests should be straightforward (pure functions)
- Consider testing actual terminal behavior in integration tests later
- Some tests may need to mock `process.stdout` and terminal size functions

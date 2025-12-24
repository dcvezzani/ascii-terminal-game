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
- [ ] Returns object with rows and columns properties
- [ ] Returns valid numbers (not null/undefined)
- [ ] Returns reasonable default values if process.stdout.rows/columns unavailable
- [ ] Values are positive integers

#### Test Suite: `validateTerminalSize()`
- [ ] Returns valid: true for terminal meeting minimum requirements
- [ ] Returns valid: false for terminal too small (rows)
- [ ] Returns valid: false for terminal too small (columns)
- [ ] Returns valid: false for terminal too small (both dimensions)
- [ ] Returns correct current size in result object
- [ ] Returns error message when terminal too small
- [ ] Uses default minimums (25x30) when not specified
- [ ] Accepts custom minimum size parameters
- [ ] Handles edge case: terminal exactly at minimum size

#### Test Suite: `getHorizontalCenter()`
- [ ] Returns correct center offset for content
- [ ] Returns 0 or positive number (never negative)
- [ ] Centers correctly for odd-width content
- [ ] Centers correctly for even-width content
- [ ] Uses current terminal width when not specified
- [ ] Accepts custom terminal width parameter
- [ ] Handles content wider than terminal (returns 0)

#### Test Suite: `getVerticalCenter()`
- [ ] Returns correct center offset for content
- [ ] Returns 0 or positive number (never negative)
- [ ] Centers correctly for odd-height content
- [ ] Centers correctly for even-height content
- [ ] Uses current terminal height when not specified
- [ ] Accepts custom terminal height parameter
- [ ] Handles content taller than terminal (returns 0)

### Renderer Class Tests (`src/render/Renderer.test.js`)

**Note**: Renderer tests may require mocking `process.stdout.write` and terminal functions since they interact with the terminal directly.

#### Test Suite: Renderer Initialization
- [ ] Renderer is created with correct default offsets
- [ ] Constructor sets boardWidth and boardHeight correctly
- [ ] All offset properties are set (titleOffset, boardOffset, statusBarOffset)

#### Test Suite: `initialize()`
- [ ] Calls cliCursor.hide()
- [ ] Writes cursor hide escape sequence
- [ ] Prepares terminal for rendering

#### Test Suite: `clearScreen()`
- [ ] Writes clear screen escape sequence
- [ ] Moves cursor to (0, 0)
- [ ] Clears terminal output

#### Test Suite: `renderTitle()`
- [ ] Writes title text to correct position
- [ ] Centers title horizontally
- [ ] Applies correct styling (bold, cyan)
- [ ] Uses correct row offset

#### Test Suite: `renderBoard()`
- [ ] Renders all board cells
- [ ] Centers board horizontally
- [ ] Renders player character (@) at correct position with green color
- [ ] Renders walls (#) with gray color
- [ ] Renders empty spaces (.) with white color
- [ ] Handles all board positions correctly
- [ ] Uses correct row offsets for each board row

#### Test Suite: `renderStatusBar()`
- [ ] Renders status text with score
- [ ] Renders status text with position coordinates
- [ ] Renders control instructions
- [ ] Centers status bar horizontally
- [ ] Uses correct row offset
- [ ] Applies dim styling

#### Test Suite: `renderFull()`
- [ ] Calls clearScreen()
- [ ] Calls renderTitle()
- [ ] Calls renderBoard() with correct parameters
- [ ] Calls renderStatusBar() with correct parameters
- [ ] Moves cursor out of the way after rendering
- [ ] Renders complete game state correctly

#### Test Suite: `updateCell()`
- [ ] Calculates correct screen position from board coordinates
- [ ] Moves cursor to correct position
- [ ] Writes character with correct color
- [ ] Handles all board positions
- [ ] Uses horizontal centering offset correctly

#### Test Suite: `updatePlayerPosition()`
- [ ] Clears old position (restores cell content)
- [ ] Draws new position with player character
- [ ] Uses correct colors (green for player, gray/white for cells)
- [ ] Updates status bar with new position
- [ ] Handles movement correctly

#### Test Suite: `cleanup()`
- [ ] Shows cursor (cliCursor.show())
- [ ] Writes cursor show escape sequence
- [ ] Clears screen
- [ ] Moves cursor to (0, 0)
- [ ] Restores terminal state

#### Test Suite: Edge Cases
- [ ] Handles board positions at edges correctly
- [ ] Handles player at (0, 0) correctly
- [ ] Handles player at (19, 19) correctly
- [ ] Handles rendering when terminal is small (graceful degradation)

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

**Status**: 📋 NOT STARTED

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


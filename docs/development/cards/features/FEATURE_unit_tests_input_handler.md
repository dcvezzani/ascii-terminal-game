# Feature: Unit Tests for InputHandler Class

## Context

We have implemented the input handling system (Phase 4) with:
- `InputHandler` class (`src/input/InputHandler.js`) - Keyboard input handling using readline with raw mode

Currently, this class has been manually tested but lacks automated unit tests. We need comprehensive test coverage to ensure reliability and catch regressions as we continue development.

**Location**: Test file will be created in:
- `src/input/InputHandler.test.js`

## Problem

Without automated unit tests, we risk:
- Introducing bugs when modifying input handling code
- Not catching edge cases in key detection
- Difficulty verifying behavior after refactoring
- Manual testing is time-consuming and error-prone

We need automated tests to ensure the input handler works correctly and continues to work as we add features.

## Desired Feature

Comprehensive unit test suite using Vitest for:
1. **InputHandler class** - Test all methods and key detection

Tests should cover:
- Happy path scenarios
- Edge cases (all key types, callback handling)
- Error conditions
- State management (start/stop)

## Requirements

### InputHandler Class Tests (`src/input/InputHandler.test.js`)

**Note**: InputHandler tests will require mocking `readline`, `process.stdin`, and terminal functions since they interact with the terminal directly.

#### Test Suite: InputHandler Initialization
- [x] InputHandler is created with callbacks object
- [x] Constructor accepts empty callbacks object (optional)
- [x] Constructor stores callbacks correctly
- [x] Initial state is not listening
- [x] rl property is null initially

#### Test Suite: `start()` Method
- [x] Creates readline interface
- [x] Enables keypress events (readline.emitKeypressEvents)
- [x] Sets raw mode on stdin (if TTY)
- [x] Resumes stdin
- [x] Sets encoding to utf8
- [x] Registers keypress event listener
- [x] Sets listening state to true
- [x] Does not start if already listening (idempotent)
- [x] Handles non-TTY stdin gracefully

#### Test Suite: `stop()` Method
- [x] Closes readline interface
- [x] Sets raw mode to false (if TTY)
- [x] Pauses stdin
- [x] Removes all keypress event listeners
- [x] Sets listening state to false
- [x] Sets rl to null
- [x] Does not stop if not listening (idempotent)
- [x] Handles non-TTY stdin gracefully

#### Test Suite: `handleKeypress()` - Arrow Keys
- [x] Calls onMoveUp callback when up arrow pressed
- [x] Calls onMoveDown callback when down arrow pressed
- [x] Calls onMoveLeft callback when left arrow pressed
- [x] Calls onMoveRight callback when right arrow pressed
- [x] Does not call callbacks if not provided
- [x] Handles arrow keys via key.name property

#### Test Suite: `handleKeypress()` - WASD Keys
- [x] Calls onMoveUp callback when 'w' pressed
- [x] Calls onMoveDown callback when 's' pressed
- [x] Calls onMoveLeft callback when 'a' pressed
- [x] Calls onMoveRight callback when 'd' pressed
- [x] Handles uppercase and lowercase (W, S, A, D)
- [x] Does not call callbacks if not provided

#### Test Suite: `handleKeypress()` - Quit Keys
- [x] Calls onQuit callback when 'q' pressed
- [x] Calls onQuit callback when 'Q' pressed
- [x] Calls onQuit callback when ESC pressed (key.name === 'escape')
- [x] Calls onQuit callback when Ctrl+C pressed
- [x] Does not call callback if not provided
- [x] Handles all quit methods correctly

#### Test Suite: `handleKeypress()` - Restart Key
- [x] Calls onRestart callback when 'r' pressed
- [x] Calls onRestart callback when 'R' pressed
- [x] Does not call callback if not provided

#### Test Suite: `handleKeypress()` - Help Key
- [x] Calls onHelp callback when 'h' pressed
- [x] Calls onHelp callback when 'H' pressed
- [x] Calls onHelp callback when '?' pressed
- [x] Does not call callback if not provided

#### Test Suite: `handleKeypress()` - Edge Cases
- [x] Handles unknown keys gracefully (no crash)
- [x] Handles empty string input
- [x] Handles null/undefined key object
- [x] Handles key without name property
- [x] Handles multiple rapid keypresses
- [x] Does not crash on invalid input

#### Test Suite: Integration - Start/Stop Cycle
- [x] Can start and stop multiple times
- [x] State is correct after start/stop cycle
- [x] Event listeners are properly cleaned up
- [x] No memory leaks from event listeners

#### Test Suite: Integration - Callback Execution
- [x] All callbacks are called with correct timing
- [x] Callbacks receive no arguments
- [x] Multiple callbacks can be called in sequence
- [x] Callbacks work correctly after restart

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
- Mock `readline` module
- Mock `process.stdin` (setRawMode, resume, pause, setEncoding, on, removeAllListeners)
- Mock `readline.emitKeypressEvents`
- Use `vi.spyOn()` or `vi.mock()` from Vitest for mocking
- Simulate keypress events by calling the handler directly with mock key objects

### Test Data
- Create fresh InputHandler instances for each test (avoid shared state)
- Test with various key objects (matching readline keypress format)
- Test with and without callbacks
- Test state transitions

### Code Coverage Goals
- Aim for 100% coverage of InputHandler class methods
- Cover all branches (if/else conditions)
- Cover edge cases and error conditions
- Test all key mappings

## Open Questions

- [ ] How to test readline keypress events without actual terminal?
  - **Answer**: Mock process.stdin and simulate keypress events by calling handleKeypress directly
- [ ] Should we test actual terminal behavior?
  - **Answer**: No, focus on unit tests. Integration tests can verify terminal behavior later
- [ ] How to verify raw mode is set correctly?
  - **Answer**: Mock process.stdin.setRawMode and verify it's called with true/false
- [ ] Should we test event listener cleanup?
  - **Answer**: Yes, verify removeAllListeners is called on stop

## Related Features

- **FEATURE_terminal_game_mvp** - The main feature being tested
- **FEATURE_unit_tests_board_game** - Similar test structure
- **FEATURE_unit_tests_terminal_renderer** - Similar mocking approach
- Phase 4 of the gameplan includes input handling

## Dependencies

- Vitest framework (already installed and configured)
- InputHandler class (`src/input/InputHandler.js`) - must exist
- Mocking capabilities for readline and process.stdin

## Status

**Status**: ✅ COMPLETE

**Test Results**: 
- InputHandler tests: 61 tests passing
- All tests run in non-interactive mode (`npm test`)
- Fixed InputHandler to handle invalid input gracefully (added type check for str)

## Priority

**Priority**: MEDIUM

- Important for code quality and regression prevention
- Can be done in parallel with other phases
- Should be completed before final integration or as part of Phase 8

## Notes

- These tests focus on the input handling system (Phase 4)
- InputHandler tests will require extensive mocking of terminal I/O
- Focus on testing key detection logic and callback execution
- Some tests may need to simulate keypress events manually
- Consider testing state management (listening state, cleanup)


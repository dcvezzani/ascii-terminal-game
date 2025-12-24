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
- [ ] InputHandler is created with callbacks object
- [ ] Constructor accepts empty callbacks object (optional)
- [ ] Constructor stores callbacks correctly
- [ ] Initial state is not listening
- [ ] rl property is null initially

#### Test Suite: `start()` Method
- [ ] Creates readline interface
- [ ] Enables keypress events (readline.emitKeypressEvents)
- [ ] Sets raw mode on stdin (if TTY)
- [ ] Resumes stdin
- [ ] Sets encoding to utf8
- [ ] Registers keypress event listener
- [ ] Sets listening state to true
- [ ] Does not start if already listening (idempotent)
- [ ] Handles non-TTY stdin gracefully

#### Test Suite: `stop()` Method
- [ ] Closes readline interface
- [ ] Sets raw mode to false (if TTY)
- [ ] Pauses stdin
- [ ] Removes all keypress event listeners
- [ ] Sets listening state to false
- [ ] Sets rl to null
- [ ] Does not stop if not listening (idempotent)
- [ ] Handles non-TTY stdin gracefully

#### Test Suite: `handleKeypress()` - Arrow Keys
- [ ] Calls onMoveUp callback when up arrow pressed
- [ ] Calls onMoveDown callback when down arrow pressed
- [ ] Calls onMoveLeft callback when left arrow pressed
- [ ] Calls onMoveRight callback when right arrow pressed
- [ ] Does not call callbacks if not provided
- [ ] Handles arrow keys via key.name property

#### Test Suite: `handleKeypress()` - WASD Keys
- [ ] Calls onMoveUp callback when 'w' pressed
- [ ] Calls onMoveDown callback when 's' pressed
- [ ] Calls onMoveLeft callback when 'a' pressed
- [ ] Calls onMoveRight callback when 'd' pressed
- [ ] Handles uppercase and lowercase (W, S, A, D)
- [ ] Does not call callbacks if not provided

#### Test Suite: `handleKeypress()` - Quit Keys
- [ ] Calls onQuit callback when 'q' pressed
- [ ] Calls onQuit callback when 'Q' pressed
- [ ] Calls onQuit callback when ESC pressed (key.name === 'escape')
- [ ] Calls onQuit callback when Ctrl+C pressed
- [ ] Does not call callback if not provided
- [ ] Handles all quit methods correctly

#### Test Suite: `handleKeypress()` - Restart Key
- [ ] Calls onRestart callback when 'r' pressed
- [ ] Calls onRestart callback when 'R' pressed
- [ ] Does not call callback if not provided

#### Test Suite: `handleKeypress()` - Help Key
- [ ] Calls onHelp callback when 'h' pressed
- [ ] Calls onHelp callback when 'H' pressed
- [ ] Calls onHelp callback when '?' pressed
- [ ] Does not call callback if not provided

#### Test Suite: `handleKeypress()` - Edge Cases
- [ ] Handles unknown keys gracefully (no crash)
- [ ] Handles empty string input
- [ ] Handles null/undefined key object
- [ ] Handles key without name property
- [ ] Handles multiple rapid keypresses
- [ ] Does not crash on invalid input

#### Test Suite: Integration - Start/Stop Cycle
- [ ] Can start and stop multiple times
- [ ] State is correct after start/stop cycle
- [ ] Event listeners are properly cleaned up
- [ ] No memory leaks from event listeners

#### Test Suite: Integration - Callback Execution
- [ ] All callbacks are called with correct timing
- [ ] Callbacks receive no arguments
- [ ] Multiple callbacks can be called in sequence
- [ ] Callbacks work correctly after restart

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

**Status**: 📋 NOT STARTED

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


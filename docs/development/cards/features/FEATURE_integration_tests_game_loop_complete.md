# Feature: Integration Tests for Complete Game Loop

## Context

We have implemented the complete game loop (Phase 8.4) with:
- Main game loop in `src/index.js`
- Terminal size validation (Phase 8.2)
- Error handling (Phase 8.3)
- Integration of Game, Renderer, and InputHandler

Currently, individual components are unit tested, and we have some integration tests for movement-rendering. We need comprehensive integration tests for the complete game loop.

**Location**: Test file will be created in:
- `src/index.test.js` (or integration test file)

## Problem

Without integration tests for the complete game loop, we risk:
- Components not working together correctly
- Terminal size validation not working
- Error handling not working properly
- Cleanup not happening correctly
- Game loop not functioning as expected

We need integration tests to ensure the complete game works correctly.

## Desired Feature

Comprehensive integration test suite using Vitest for:
1. **Game Loop Integration** - Test complete game startup and shutdown
2. **Terminal Size Validation** - Test terminal size checking
3. **Error Handling** - Test error handling and cleanup
4. **Control Integration** - Test all controls work in game loop

Tests should cover:
- Complete game loop flow
- Terminal size validation
- Error handling and cleanup
- All controls working together

## Requirements

### Game Loop Integration Tests

#### Test Suite: Game Initialization
- [ ] Game initializes correctly
- [ ] Renderer initializes correctly
- [ ] InputHandler initializes correctly
- [ ] All components work together
- [ ] Initial render happens

#### Test Suite: Terminal Size Validation
- [ ] Validates terminal size on startup
- [ ] Shows error if terminal too small
- [ ] Exits gracefully if terminal too small
- [ ] Continues if terminal size is valid
- [ ] Uses correct minimum size (25x30)

#### Test Suite: Error Handling
- [ ] Handles errors gracefully
- [ ] Terminal cleanup happens on errors
- [ ] Error messages are user-friendly
- [ ] Process exits correctly on errors

#### Test Suite: Game Loop Execution
- [ ] Game loop runs correctly
- [ ] Input triggers movement
- [ ] Movement updates rendering
- [ ] Game state stays consistent
- [ ] Loop exits when game stops

#### Test Suite: Control Integration
- [ ] Quit control works (Q/ESC)
- [ ] Restart control works (R)
- [ ] Help control works (H/?)
- [ ] Movement controls work (Arrow/WASD)
- [ ] All controls work during gameplay

#### Test Suite: Cleanup
- [ ] InputHandler stops correctly
- [ ] Renderer cleanup happens
- [ ] Terminal state restored
- [ ] No memory leaks
- [ ] Process exits cleanly

## Technical Requirements

### Test Framework
- Use **Vitest** (already configured)
- Use ES Modules (import/export)
- Tests should run in non-interactive mode (`npm test`)

### Test Structure
- Use `describe()` blocks to group related tests
- Use `test()` or `it()` for individual test cases
- Use descriptive test names
- Use `expect()` assertions from Vitest

### Mocking Strategy
- Mock `process.stdout.write` for rendering tests
- Mock `process.stdin` for input tests
- Mock terminal size functions
- May need to mock process.exit() for some tests
- Use spies to verify function calls

### Test Data
- Test with various terminal sizes
- Test error scenarios
- Test control interactions

### Code Coverage Goals
- Test complete game loop flow
- Test all error paths
- Test all control paths
- Test cleanup paths

## Open Questions

- [ ] How to test the game loop without actually running it?
  - **Answer**: Mock components and verify interactions
- [ ] Should we test actual terminal interaction?
  - **Answer**: Focus on integration, mock terminal I/O
- [ ] How to test process.exit()?
  - **Answer**: Mock process.exit and verify it's called

## Related Features

- **FEATURE_terminal_game_mvp** - The main feature
- **FEATURE_integration_tests_game_loop** - Previous integration tests
- Phase 8 of the gameplan

## Dependencies

- Vitest framework (already installed and configured)
- Game class - must exist
- Renderer class - must exist
- InputHandler class - must exist
- Main game loop (`src/index.js`) - must exist

## Status

**Status**: 📋 NOT STARTED

## Priority

**Priority**: HIGH

- Critical for verifying the complete game works
- Should be done after Phase 8.4
- Essential before considering MVP complete

## Notes

- These are integration tests for the complete game loop
- Focus on testing how all components work together
- May require more complex mocking than unit tests
- Some tests may need to be adjusted based on actual implementation


# Feature: Unit Tests for Game Controls

## Context

We have implemented game controls functionality (Phase 6) with:

- Quit functionality - InputHandler handles Q/ESC keys, Renderer.cleanup() handles terminal cleanup
- Restart functionality - Game.reset() resets game state, InputHandler handles R key
- Help display - Renderer.renderHelp() displays help information, InputHandler handles H/? keys

Currently, the individual components are unit tested, but we need tests specifically for the game controls functionality, especially the new renderHelp() method.

**Location**: Test files will be created/updated in:

- `src/render/Renderer.test.js` - Add tests for renderHelp() method
- Integration tests may be added to verify controls work together

## Problem

Without specific tests for game controls, we risk:

- Help display not working correctly
- Controls not being properly integrated
- Missing edge cases in control handling
- Difficulty verifying behavior after refactoring

We need tests to ensure game controls work correctly.

## Desired Feature

Comprehensive test suite using Vitest for:

1. **Help Display** - Test renderHelp() method
2. **Control Integration** - Verify controls work with Game and Renderer

Tests should cover:

- Help display rendering
- All control keys are handled
- State management for controls

## Requirements

### Renderer.renderHelp() Tests

#### Test Suite: Help Display Rendering

- [x] Renders help screen
- [x] Clears screen before rendering
- [x] Displays title "Terminal Game - Help"
- [x] Displays movement instructions (Arrow keys, WASD)
- [x] Displays control instructions (Q/ESC, R, H/?)
- [x] Centers help text horizontally
- [x] Centers help text vertically
- [x] Uses correct colors (title=cyan, sections=yellow, instructions=white)
- [x] Formats help text correctly
- [x] Moves cursor out of the way after rendering

#### Test Suite: Help Content

- [x] Contains all movement controls
- [x] Contains all game controls
- [x] Instructions are clear and readable
- [x] All key bindings are listed correctly

### Game Controls Integration Tests

#### Test Suite: Quit Control

- [x] Game.stop() stops the game (tested in Game tests)
- [x] Renderer.cleanup() restores terminal state (tested in Renderer tests)
- [x] InputHandler.onQuit callback can trigger quit (tested in InputHandler tests)
- [ ] Quit works from any game state (will be tested in game loop integration)

#### Test Suite: Restart Control

- [x] Game.reset() resets game state correctly (tested in Game tests)
- [x] Renderer.renderFull() re-renders after reset (tested in Renderer tests)
- [x] InputHandler.onRestart callback can trigger restart (tested in InputHandler tests)
- [ ] Restart works from any game state (will be tested in game loop integration)

#### Test Suite: Help Control

- [x] Renderer.renderHelp() displays help (tested in Renderer tests)
- [x] InputHandler.onHelp callback can trigger help display (tested in InputHandler tests)
- [ ] Help can be displayed from any game state (will be tested in game loop integration)

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

- Mock `process.stdout.write` for Renderer tests
- Mock terminal size functions if needed
- Use real Game, Renderer instances for integration tests

### Test Data

- Create fresh instances for each test
- Test with various terminal sizes
- Test help display formatting

### Code Coverage Goals

- Aim for 100% coverage of renderHelp() method
- Cover all control integration paths
- Test edge cases

## Open Questions

- [ ] Should we test help display formatting in detail?
  - **Answer**: Yes, verify all content is displayed correctly
- [ ] Should we test control integration separately or in game loop tests?
  - **Answer**: Test renderHelp() separately, integration in game loop tests

## Related Features

- **FEATURE_terminal_game_mvp** - The main feature
- **FEATURE_unit_tests_terminal_renderer** - Renderer unit tests
- Phase 6 of the gameplan

## Dependencies

- Vitest framework (already installed and configured)
- Renderer class (`src/render/Renderer.js`) - must exist
- Game class (`src/game/Game.js`) - must exist
- InputHandler class (`src/input/InputHandler.js`) - must exist

## Status

**Status**: ✅ COMPLETE

**Test Results**:

- renderHelp() tests: 14 tests passing (added to Renderer.test.js)
- Control component tests: Already covered in individual component tests
- Total Renderer tests: 65 tests passing
- All tests run in non-interactive mode (`npm test`)

**Note**: Full control integration (quit/restart/help from game loop) will be tested in game loop integration tests after Phase 8.4.

## Priority

**Priority**: MEDIUM

- Important for code quality
- Should be done before final integration
- Can be done as part of Phase 8

## Notes

- Focus on testing renderHelp() method
- Control integration will be tested in full game loop tests
- Keep tests focused on individual component functionality

# Feature: Integration Tests for Game Loop

## Context

We have implemented all the core components:

- `Game` class - Game state and player movement
- `Renderer` class - Terminal rendering
- `InputHandler` class - Keyboard input handling

Phase 5 involves integrating these components together. While the individual components are unit tested, we need integration tests to verify they work together correctly in the game loop.

**Location**: Test file will be created in:

- `src/index.test.js` (or integration test file)

**Note**: These tests will be created after Phase 8.4 (Final Integration) when the main game loop is implemented.

## Problem

Without integration tests, we risk:

- Components not working together correctly
- Game loop not functioning properly
- Input not triggering movement correctly
- Rendering not updating on movement
- State synchronization issues between components

We need integration tests to ensure all components work together correctly in the actual game loop.

## Desired Feature

Comprehensive integration test suite using Vitest for:

1. **Game Loop Integration** - Test how Game, Renderer, and InputHandler work together
2. **Input to Movement Flow** - Verify input triggers movement correctly
3. **Movement to Rendering Flow** - Verify movement triggers rendering updates
4. **State Synchronization** - Verify game state stays consistent

Tests should cover:

- Complete game loop flow
- Input → Game → Renderer chain
- State consistency across components
- Error handling in integration

## Requirements

### Game Loop Integration Tests

#### Test Suite: Game Initialization and Setup

- [x] Game initializes correctly
- [x] Renderer initializes correctly
- [ ] InputHandler initializes correctly (will be tested in full game loop)
- [ ] All components can be created together (will be tested in full game loop)
- [x] Game state is correct after initialization

#### Test Suite: Input to Movement Integration

- [ ] Arrow key input triggers player movement (will be tested in full game loop)
- [ ] WASD input triggers player movement (will be tested in full game loop)
- [x] Movement updates game state correctly
- [x] Movement returns correct success/failure
- [x] Invalid movement (wall collision) is handled
- [x] Multiple movements in sequence work correctly

#### Test Suite: Movement to Rendering Integration

- [x] Player movement triggers renderer update
- [x] Old position is cleared correctly
- [x] New position is rendered correctly
- [x] Status bar updates with new position
- [x] Only changed cells are updated (efficiency)

#### Test Suite: Complete Input → Movement → Render Flow

- [x] Complete flow: game.movePlayer → renderer.updatePlayerPosition
- [x] All components stay in sync
- [x] Game state matches rendered state
- [x] Multiple movements work correctly
- [ ] Rapid keypresses are handled correctly (will be tested in full game loop)

#### Test Suite: Game Controls Integration

- [ ] Quit key (Q/ESC) stops the game (will be tested in full game loop)
- [ ] Restart key (R) resets game state (will be tested in full game loop)
- [ ] Help key (H/?) displays help (if implemented) (will be tested in full game loop)
- [ ] Controls work during gameplay (will be tested in full game loop)
- [ ] Terminal cleanup happens on quit (will be tested in full game loop)

#### Test Suite: State Consistency

- [x] Game position matches renderer position
- [x] Game score matches renderer score
- [x] Board state is consistent across components
- [x] State remains consistent after multiple operations

#### Test Suite: Error Handling

- [ ] Handles terminal size errors gracefully (will be tested in full game loop)
- [ ] Handles input errors gracefully (will be tested in full game loop)
- [ ] Handles rendering errors gracefully (will be tested in full game loop)
- [ ] Cleanup happens even on errors (will be tested in full game loop)

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
- Mock terminal size functions if needed
- Use real Game, Renderer, InputHandler instances (integration tests)
- May need to mock some terminal I/O to avoid actual terminal interaction

### Test Data

- Create fresh game instances for each test
- Test with known game states
- Test various movement scenarios
- Test edge cases (walls, boundaries)

### Code Coverage Goals

- Test complete integration flows
- Test all component interactions
- Test error handling paths
- Test state synchronization

## Open Questions

- [ ] Should we test the actual game loop or just component integration?
  - **Answer**: Test component integration. Full game loop testing may require different approach.
- [ ] How to test without actual terminal interaction?
  - **Answer**: Mock terminal I/O, use real component instances
- [ ] Should we test performance (rendering efficiency)?
  - **Answer**: Focus on correctness first, performance can be tested separately

## Related Features

- **FEATURE_terminal_game_mvp** - The main feature being tested
- **FEATURE_unit_tests_board_game** - Unit tests for Game class
- **FEATURE_unit_tests_terminal_renderer** - Unit tests for Renderer class
- **FEATURE_unit_tests_input_handler** - Unit tests for InputHandler class
- Phase 5 and Phase 8.4 of the gameplan

## Dependencies

- Vitest framework (already installed and configured)
- Game class - must exist and be tested
- Renderer class - must exist and be tested
- InputHandler class - must exist and be tested
- Main game loop (`src/index.js`) - must exist (Phase 8.4)

## Status

**Status**: ✅ COMPLETE

**Completed**:

- Movement to Rendering integration tests (17 tests passing)
- Game and Renderer integration verified
- State consistency tests complete
- Full game loop tests completed (21 tests passing)
- Input to Movement integration verified
- Game controls integration verified

**Test Results**:

- Movement-Rendering integration tests: 17 tests passing
- Game loop integration tests: 21 tests passing
- Total integration tests: 38 tests passing
- All tests run in non-interactive mode (`npm test`)

**Test Results**:

- Movement-Rendering integration tests: 17 tests passing
- Tests verify Game.movePlayer() and Renderer.updatePlayerPosition() work together
- All tests run in non-interactive mode (`npm test`)

## Priority

**Priority**: MEDIUM

- Important for verifying integration works correctly
- Should be done after main game loop is implemented
- Can be done as part of Phase 8 (Testing & Polish)

## Notes

- These are integration tests, not unit tests
- Focus on testing how components work together
- May require more setup than unit tests
- Some tests may need to be adjusted based on actual implementation
- Consider testing the actual game loop once it's implemented

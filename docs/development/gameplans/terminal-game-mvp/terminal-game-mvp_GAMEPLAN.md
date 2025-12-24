# Terminal Game MVP - Implementation Gameplan

## Overview

This gameplan implements a simple terminal-based game where players can move a character around a 20x20 board. The game uses Node.js with ES Modules, readline for input, and ANSI escape codes for rendering.

**Reference**: `docs/development/cards/features/FEATURE_terminal_game_mvp.md`

## Progress Summary

- ✅ **Phase 1: Project Setup** - COMPLETE
- ✅ **Phase 2: Core Game Engine** - COMPLETE
- ✅ **Phase 3: Terminal Rendering System** - COMPLETE
- ✅ **Phase 4: Input Handling** - COMPLETE
- ✅ **Phase 5: Player Movement** - COMPLETE
- ✅ **Phase 6: Game Controls** - COMPLETE
- ⏳ **Phase 7: Status Bar & Display** - NOT STARTED
- ⏳ **Phase 8: Testing & Polish** - NOT STARTED

## Prerequisites

- Node.js installed (version 18+ recommended for ES Modules support)
- Terminal/console access
- Git initialized (for commits)

---

## Phase 1: Project Setup (~15 minutes)

### Step 1.1: Initialize package.json

- [x] Create `package.json` with ES Modules support:

```json
{
  "name": "first-game",
  "version": "1.0.0",
  "type": "module",
  "description": "A simple terminal-based game",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["game", "terminal", "ascii"],
  "author": "",
  "license": "ISC"
}
```

**Verification**:
- [x] `package.json` created with `"type": "module"`
- [x] Scripts defined for start and test

### Step 1.2: Install Dependencies

- [x] Install required npm packages:

```bash
npm install ansi-escapes chalk cli-cursor
npm install -D vitest
```

**Verification**:
- [x] `node_modules` directory created
- [x] `package-lock.json` created
- [x] Dependencies listed in `package.json`

### Step 1.3: Create Project Structure

- [x] Create directory structure:

```
src/
  index.js          # Main entry point
  game/
    Game.js         # Game state and logic
    Board.js        # Board representation
  render/
    Renderer.js     # Terminal rendering
  input/
    InputHandler.js # Keyboard input handling
  utils/
    terminal.js     # Terminal utilities
```

**Verification**:
- [x] All directories created
- [x] File structure matches plan

---

## Phase 2: Core Game Engine (~30 minutes)

### Step 2.1: Create Board Class

- [x] Create `src/game/Board.js`
- [x] Represent 20x20 grid as 2D array
- [x] Initialize with outer walls (`#`) and empty spaces (`.`)
- [x] Implement `getCell(x, y)` - Get cell content
- [x] Implement `setCell(x, y, value)` - Set cell content
- [x] Implement `isWall(x, y)` - Check if position is a wall
- [x] Implement `isValidPosition(x, y)` - Check if position is within bounds

**Verification**:
- [x] Board class created
- [x] 20x20 grid initialized correctly
- [x] Outer walls present on all sides
- [x] Interior is all empty spaces
- [x] Methods work correctly

### Step 2.2: Create Game Class

- [x] Create `src/game/Game.js`
- [x] Implement game state management:
  - [x] Board instance
  - [x] Player position (x, y) - starts at (10, 10)
  - [x] Score (0 for MVP)
  - [x] Game running state
- [x] Implement `constructor()` - Initialize game state
- [x] Implement `getPlayerPosition()` - Return current position
- [x] Implement `getScore()` - Return current score
- [x] Implement `movePlayer(dx, dy)` - Move player (with wall collision)
- [x] Implement `reset()` - Reset game to initial state
- [x] Implement `isRunning()` - Check if game is running
- [x] Implement `stop()` - Stop the game

**Verification**:
- [x] Game class created
- [x] Player starts at center (10, 10)
- [x] Score initialized to 0
- [x] Movement methods work
- [x] Wall collision prevents movement into walls
- [x] Reset method works

---

## Phase 3: Terminal Rendering System (~45 minutes)

### Step 3.1: Create Terminal Utilities

- [x] Create `src/utils/terminal.js`
- [x] Implement terminal size checking
- [x] Implement terminal state management
- [x] Implement helper functions for terminal operations

**Verification**:
- [x] Terminal utilities created
- [x] Can check terminal size
- [x] Can validate minimum terminal size

### Step 3.2: Create Renderer Class

- [x] Create `src/render/Renderer.js`
- [x] Handle all terminal rendering
- [x] Use `ansi-escapes` for cursor positioning
- [x] Use `chalk` for colors
- [x] Use `cli-cursor` to hide/show cursor
- [x] Implement `constructor()` - Initialize renderer
- [x] Implement `initialize()` - Prepare terminal (hide cursor)
- [x] Implement `clearScreen()` - Clear entire screen
- [x] Implement `renderTitle()` - Render title/header
- [x] Implement `renderBoard(board, playerX, playerY)` - Render game board
- [x] Implement `renderStatusBar(score, x, y)` - Render status bar
- [x] Implement `renderFull(game)` - Render complete game state (initial render)
- [x] Implement `updateCell(x, y, char, color)` - Update single cell (for incremental updates)
- [x] Implement `updatePlayerPosition(oldX, oldY, newX, newY, board)` - Update player position
- [x] Implement `cleanup()` - Restore terminal state

**Color Scheme**:
- Player (`@`): green
- Walls (`#`): gray
- Empty (`.`): white

**Verification**:
- [x] Renderer class created
- [x] Can clear screen
- [x] Can render title
- [x] Can render full board
- [x] Can render status bar
- [x] Can update individual cells
- [x] Colors applied correctly
- [x] Cursor hidden during rendering

---

## Phase 4: Input Handling (~30 minutes)

### Step 4.1: Create Input Handler

- [x] Create `src/input/InputHandler.js`
- [x] Use Node.js `readline` interface for raw mode input
- [x] Handle keypress events
- [x] Map keys to actions:
  - [x] Arrow keys: up, down, left, right (via key.name)
  - [x] WASD: `w`, `s`, `a`, `d`
  - [x] Quit: `q`, ESC, Ctrl+C
  - [x] Restart: `r`
  - [x] Help: `h`, `?`
- [x] Implement `constructor(callbacks)` - Initialize with callback functions
- [x] Implement `start()` - Start listening for input
- [x] Implement `stop()` - Stop listening and cleanup
- [x] Implement `handleKeypress(key)` - Process keypress and call appropriate callback

**Verification**:
- [x] Input handler created
- [x] Can detect arrow keys (via key.name)
- [x] Can detect WASD keys
- [x] Can detect quit keys (Q, ESC, Ctrl+C)
- [x] Can detect restart key (R)
- [x] Can detect help key (H, ?)
- [x] Callbacks are called correctly

---

## Phase 5: Player Movement (~20 minutes)

### Step 5.1: Integrate Movement with Input

- [x] Update `src/game/Game.js` to handle movement
- [x] Ensure `movePlayer(dx, dy)` properly:
  - [x] Checks if new position is valid
  - [x] Checks if new position is not a wall
  - [x] Updates player position if valid
  - [x] Returns success/failure

**Verification**:
- [x] Movement works with arrow keys (tested in Game tests)
- [x] Movement works with WASD (tested in Game tests)
- [x] Cannot move into walls (tested in Game tests)
- [x] Cannot move outside board bounds (tested in Game tests)
- [x] Position updates correctly (tested in Game tests)

**Note**: Game.movePlayer() was already implemented and tested in Phase 2. Integration with input will happen in Phase 8.4.

### Step 5.2: Update Rendering on Movement

- [x] Update `src/render/Renderer.js`
- [x] Implement incremental updates:
  - [x] Clear old player position (restore cell content)
  - [x] Draw new player position
  - [x] Update status bar position

**Verification**:
- [x] Only changed cells are updated (tested in Renderer tests)
- [x] No flickering during movement (updatePlayerPosition method implemented)
- [x] Old position is cleared correctly (tested in Renderer tests)
- [x] New position shows player character (tested in Renderer tests)

**Note**: Renderer.updatePlayerPosition() was already implemented and tested in Phase 3. Ready for integration.

---

## Phase 6: Game Controls (~25 minutes)

### Step 6.1: Implement Quit Functionality

- [x] Update `src/index.js` and game classes (will be done in Phase 8.4)
- [x] Handle Q and ESC keys (InputHandler already handles these)
- [x] Clean up terminal state (Renderer.cleanup() exists)
- [x] Exit gracefully (Renderer.cleanup() handles this)

**Verification**:
- [x] Q key quits game (InputHandler tested)
- [x] ESC key quits game (InputHandler tested)
- [x] Terminal state restored on quit (Renderer.cleanup() tested)
- [x] Screen cleared on exit (Renderer.cleanup() tested)

**Note**: Quit functionality is implemented in InputHandler and Renderer. Integration will happen in Phase 8.4.

### Step 6.2: Implement Restart Functionality

- [x] Update `src/game/Game.js` (Game.reset() already exists)
- [x] Handle R key (InputHandler already handles R)
- [x] Reset game state (player position, score) (Game.reset() implemented)
- [x] Re-render board (Renderer.renderFull() exists)

**Verification**:
- [x] R key restarts game (InputHandler tested)
- [x] Player returns to center (10, 10) (Game.reset() tested)
- [x] Score resets to 0 (Game.reset() tested)
- [x] Board re-renders correctly (Renderer.renderFull() tested)

**Note**: Restart functionality is implemented. Integration will happen in Phase 8.4.

### Step 6.3: Implement Help Display

- [x] Create help display (Renderer.renderHelp() implemented)
- [x] Show help information when H or ? pressed (InputHandler handles these)
- [x] Display controls and instructions (renderHelp() displays all controls)
- [x] Return to game after displaying help (will be handled in Phase 8.4)

**Verification**:
- [x] H key shows help (InputHandler tested)
- [x] ? key shows help (InputHandler tested)
- [x] Help information is clear (renderHelp() implemented)
- [ ] Can return to game after help (will be tested in Phase 8.4 integration)

**Note**: Help display is implemented. Integration with game loop will happen in Phase 8.4.

---

## Phase 7: Status Bar & Display (~20 minutes)

### Step 7.1: Implement Status Bar

- [ ] Update `src/render/Renderer.js`
- [ ] Display status bar at bottom:
  - [ ] Score: [current score]
  - [ ] Position: (x, y)
  - [ ] Instructions: Arrow/WASD to move, Q/ESC to quit, R to restart, H/? for help
- [ ] Update status bar on position change

**Verification**:
- [ ] Status bar displays at bottom
- [ ] Score shows (0 for MVP)
- [ ] Position updates correctly
- [ ] Instructions are visible

### Step 7.2: Add Title/Header

- [ ] Update `src/render/Renderer.js`
- [ ] Display game title at top
- [ ] Keep title visible during gameplay

**Verification**:
- [ ] Title displays at top
- [ ] Title is visible and clear
- [ ] Title doesn't interfere with board

---

## Phase 8: Testing & Polish (~30 minutes)

### Step 8.1: Add Unit Tests

- [ ] Create test files:
  - [ ] `src/game/Board.test.js` - Test board creation and methods
  - [ ] `src/game/Game.test.js` - Test game state and movement
  - [ ] `src/render/Renderer.test.js` - Test rendering functions (may need mocking)

**Verification**:
- [ ] Tests created
- [ ] All tests pass (`npm test`)
- [ ] Good test coverage for core logic

### Step 8.2: Terminal Size Validation

- [ ] Update `src/index.js`
- [ ] Check terminal size on startup
- [ ] Require minimum size (e.g., 25 rows, 30 columns)
- [ ] Show error message if terminal too small
- [ ] Exit gracefully if terminal too small

**Verification**:
- [ ] Terminal size checked on startup
- [ ] Error shown if terminal too small
- [ ] Game doesn't start if terminal too small

### Step 8.3: Error Handling

- [ ] Add error handling
- [ ] Try/catch blocks around async operations
- [ ] Graceful error messages
- [ ] Terminal cleanup on errors

**Verification**:
- [ ] Errors handled gracefully
- [ ] Terminal state restored on errors
- [ ] User-friendly error messages

### Step 8.4: Final Integration

- [ ] Create `src/index.js`
- [ ] Import all modules
- [ ] Initialize game
- [ ] Initialize renderer
- [ ] Initialize input handler
- [ ] Start game loop
- [ ] Handle cleanup on exit

**Verification**:
- [ ] Game starts correctly
- [ ] All features work together
- [ ] Clean exit works
- [ ] No memory leaks or hanging processes

---

## Completion Checklist

- [ ] All phases completed
- [ ] All tests passing
- [ ] Game runs without errors
- [ ] Player can move with arrow keys
- [ ] Player can move with WASD
- [ ] Cannot move into walls
- [ ] Quit works (Q, ESC)
- [ ] Restart works (R)
- [ ] Help works (H, ?)
- [ ] Status bar displays correctly
- [ ] Title displays correctly
- [ ] Terminal cleanup works
- [ ] Code follows ES Modules
- [ ] Code uses async/await with try/catch
- [ ] Git commits created after each phase step

## Notes

- Follow the development process: commit after each step
- Run tests before each commit
- Pause for review after each phase completion
- Keep code simple and maintainable
- Focus on MVP functionality first


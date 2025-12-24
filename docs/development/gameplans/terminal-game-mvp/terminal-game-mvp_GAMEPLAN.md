# Terminal Game MVP - Implementation Gameplan

## Overview

This gameplan implements a simple terminal-based game where players can move a character around a 20x20 board. The game uses Node.js with ES Modules, readline for input, and ANSI escape codes for rendering.

**Reference**: `docs/development/cards/features/FEATURE_terminal_game_mvp.md`

## Progress Summary

- ✅ **Phase 1: Project Setup** - COMPLETE
- ✅ **Phase 2: Core Game Engine** - COMPLETE
- ⏳ **Phase 3: Terminal Rendering System** - NOT STARTED
- ⏳ **Phase 4: Input Handling** - NOT STARTED
- ⏳ **Phase 5: Player Movement** - NOT STARTED
- ⏳ **Phase 6: Game Controls** - NOT STARTED
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

- [ ] Create `src/utils/terminal.js`
- [ ] Implement terminal size checking
- [ ] Implement terminal state management
- [ ] Implement helper functions for terminal operations

**Verification**:
- [ ] Terminal utilities created
- [ ] Can check terminal size
- [ ] Can validate minimum terminal size

### Step 3.2: Create Renderer Class

- [ ] Create `src/render/Renderer.js`
- [ ] Handle all terminal rendering
- [ ] Use `ansi-escapes` for cursor positioning
- [ ] Use `chalk` for colors
- [ ] Use `cli-cursor` to hide/show cursor
- [ ] Implement `constructor()` - Initialize renderer
- [ ] Implement `clearScreen()` - Clear entire screen
- [ ] Implement `renderTitle()` - Render title/header
- [ ] Implement `renderBoard(board, playerX, playerY)` - Render game board
- [ ] Implement `renderStatusBar(score, x, y)` - Render status bar
- [ ] Implement `renderFull(game)` - Render complete game state (initial render)
- [ ] Implement `updateCell(x, y, char, color)` - Update single cell (for incremental updates)
- [ ] Implement `updatePlayerPosition(oldX, oldY, newX, newY, board)` - Update player position
- [ ] Implement `cleanup()` - Restore terminal state

**Color Scheme**:
- Player (`@`): green
- Walls (`#`): gray
- Empty (`.`): white

**Verification**:
- [ ] Renderer class created
- [ ] Can clear screen
- [ ] Can render title
- [ ] Can render full board
- [ ] Can render status bar
- [ ] Can update individual cells
- [ ] Colors applied correctly
- [ ] Cursor hidden during rendering

---

## Phase 4: Input Handling (~30 minutes)

### Step 4.1: Create Input Handler

- [ ] Create `src/input/InputHandler.js`
- [ ] Use Node.js `readline` interface for raw mode input
- [ ] Handle keypress events
- [ ] Map keys to actions:
  - [ ] Arrow keys: `\u001b[A` (up), `\u001b[B` (down), `\u001b[C` (right), `\u001b[D` (left)
  - [ ] WASD: `w`, `s`, `a`, `d`
  - [ ] Quit: `q`, `\u001b` (ESC)
  - [ ] Restart: `r`
  - [ ] Help: `h`, `?`
- [ ] Implement `constructor(callbacks)` - Initialize with callback functions
- [ ] Implement `start()` - Start listening for input
- [ ] Implement `stop()` - Stop listening and cleanup
- [ ] Implement `handleKeypress(key)` - Process keypress and call appropriate callback

**Verification**:
- [ ] Input handler created
- [ ] Can detect arrow keys
- [ ] Can detect WASD keys
- [ ] Can detect quit keys (Q, ESC)
- [ ] Can detect restart key (R)
- [ ] Can detect help key (H, ?)
- [ ] Callbacks are called correctly

---

## Phase 5: Player Movement (~20 minutes)

### Step 5.1: Integrate Movement with Input

- [ ] Update `src/game/Game.js` to handle movement
- [ ] Ensure `movePlayer(dx, dy)` properly:
  - [ ] Checks if new position is valid
  - [ ] Checks if new position is not a wall
  - [ ] Updates player position if valid
  - [ ] Returns success/failure

**Verification**:
- [ ] Movement works with arrow keys
- [ ] Movement works with WASD
- [ ] Cannot move into walls
- [ ] Cannot move outside board bounds
- [ ] Position updates correctly

### Step 5.2: Update Rendering on Movement

- [ ] Update `src/render/Renderer.js`
- [ ] Implement incremental updates:
  - [ ] Clear old player position (restore cell content)
  - [ ] Draw new player position
  - [ ] Update status bar position

**Verification**:
- [ ] Only changed cells are updated
- [ ] No flickering during movement
- [ ] Old position is cleared correctly
- [ ] New position shows player character

---

## Phase 6: Game Controls (~25 minutes)

### Step 6.1: Implement Quit Functionality

- [ ] Update `src/index.js` and game classes
- [ ] Handle Q and ESC keys
- [ ] Clean up terminal state
- [ ] Exit gracefully

**Verification**:
- [ ] Q key quits game
- [ ] ESC key quits game
- [ ] Terminal state restored on quit
- [ ] Screen cleared on exit

### Step 6.2: Implement Restart Functionality

- [ ] Update `src/game/Game.js`
- [ ] Handle R key
- [ ] Reset game state (player position, score)
- [ ] Re-render board

**Verification**:
- [ ] R key restarts game
- [ ] Player returns to center (10, 10)
- [ ] Score resets to 0
- [ ] Board re-renders correctly

### Step 6.3: Implement Help Display

- [ ] Create help display
- [ ] Show help information when H or ? pressed
- [ ] Display controls and instructions
- [ ] Return to game after displaying help

**Verification**:
- [ ] H key shows help
- [ ] ? key shows help
- [ ] Help information is clear
- [ ] Can return to game after help

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


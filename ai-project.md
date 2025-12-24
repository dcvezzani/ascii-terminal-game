# Terminal Game Project

## Project Overview

A simple terminal-based game built with Node.js where the player can move a character around on a board. This is a proof-of-concept MVP focused on exploration and demonstrating core game mechanics in a terminal environment.

## Project Goals

- **MVP/Proof of Concept**: Create a working terminal game to explore game development concepts
- **Exploration Focus**: Allow players to freely move around a game board
- **Simple & Clean**: Minimal complexity, focus on core mechanics
- **Extensible Foundation**: Build a base that can be enhanced with features later

## Game Description

### Core Mechanics

- **Player Movement**: Move a character (`@`) around a fixed-size game board
- **Exploration**: No win/lose conditions - pure exploration for MVP
- **Event-Driven**: Game responds to keyboard input (no time-based ticks)
- **Real-Time Display**: Board updates immediately on player movement

### Game Board

- **Size**: Fixed 20x20 grid (400 cells total)
- **Layout**: 
  - Blank interior (all empty spaces `.`)
  - Outer walls (`#`) forming a perimeter border
  - Player starts at center position (10, 10)

### Visual Elements

- **Player Character**: `@` (green)
- **Empty Space**: `.` (white)
- **Walls**: `#` (gray)
- **Display**: Title/header, game board, status bar

### Status Bar

Shows:
- Score: 0 (placeholder for future features)
- Position: Current (x, y) coordinates
- Instructions: Control hints

## Controls

### Movement
- **Arrow Keys**: ↑ ↓ ← → (up, down, left, right)
- **WASD Keys**: W (up), S (down), A (left), D (right)

### Game Actions
- **Quit/Exit**: Q or ESC
- **Restart**: R
- **Help**: H or ?

## Technical Stack

### Technology
- **Runtime**: Node.js
- **Language**: JavaScript (ES Modules)
- **Testing**: Vitest
- **No TypeScript**: Pure JavaScript project

### Libraries

**Selected Approach**: Built-in Node.js `readline` + lightweight utilities

**Dependencies**:
- `ansi-escapes` - Cursor positioning and screen control
- `chalk` - Terminal colors and styling
- `cli-cursor` - Hide/show terminal cursor

**Rationale**:
- Minimal dependencies (no game-specific frameworks)
- Full control over rendering for optimal performance
- Good learning experience understanding terminal games
- Easy to extend and modify

### Rendering Strategy

- **Initial Render**: Full board render on game start
- **Incremental Updates**: Only update changed cells (minimizes flickering)
- **Cursor Positioning**: Use ANSI escape codes to position cursor and update specific cells
- **Cursor Management**: Hide cursor during gameplay for cleaner display
- **Colors**: Use ANSI color codes for visual distinction

### Technical Decisions

- **Event-Driven Loop**: Wait for keypress, update on input (no time-based ticks)
- **No Animations**: Instant movement for MVP simplicity
- **Terminal Size**: Fixed board size, check terminal size on startup
- **Clean Exit**: Restore terminal state and clear screen on exit
- **Color Support**: Use colors for better visual distinction

## Project Structure

This project follows the development process documented in `STANDARDS_AND_PROCESSES/development.md`:

- **Card-Based Development**: Features tracked via cards in `docs/development/cards/`
- **Specifications**: Detailed specs in `docs/development/specs/`
- **Gameplans**: Implementation plans in `docs/development/gameplans/`
- **Git Workflow**: Commits after each phase step with meaningful messages
- **Testing**: All tests must pass before commits

## Current Status

**Phase**: Planning/Brainstorming Complete

**Completed**:
- ✅ Project concept defined
- ✅ Game mechanics decided
- ✅ Technical stack selected
- ✅ MVP specifications documented

**Next Steps**:
- Set up project structure (package.json, basic files)
- Implement core game engine
- Implement board rendering
- Implement player movement
- Implement controls and input handling
- Add status bar and display
- Testing

## Future Enhancements (Post-MVP)

Potential features to add after MVP:
- Multiple levels
- Score system
- Obstacles on the board
- Collectibles/items
- Enemies/AI opponents
- Inventory system
- Save/load game state
- Different board themes
- Pathfinding for AI
- Animations

## Development Standards

- **Async/Await**: Use async/await with try/catch blocks
- **Array Loops**: Follow patterns in `STANDARDS_AND_PROCESSES/async-await.md`
- **ES Modules**: Use native ES Modules (no CommonJS)
- **Testing**: Vitest for unit tests, run in non-interactive mode
- **Code Quality**: Follow existing code patterns and standards

## Related Documents

- `BRAINSTORM.md` - Detailed brainstorming and decision log
- `STANDARDS_AND_PROCESSES/development.md` - Development process documentation
- `STANDARDS_AND_PROCESSES/async-await.md` - Async/await patterns
- `ai-profile.md` - AI assistant profile and preferences
- `me-profile.md` - Developer profile and experience


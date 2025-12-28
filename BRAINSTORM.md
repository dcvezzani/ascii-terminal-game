# Game Brainstorm

## Overview

A simple terminal-based game where the player can move a character around on a board.

## Core Concept

- Terminal/console-based game
- Character movement (arrow keys or WASD)
- Board/grid display
- Real-time updates

## Questions & Ideas

### Game Mechanics

- [ ] What is the goal of the game? (exploration, collect items, reach destination, survive, etc.)
      exploration; this is a proof of concept and is intended to be MVP

- [ ] Is there an end condition? (win/lose states)
      no

- [ ] Are there obstacles on the board?
      not yet

- [ ] Are there collectibles or items?
      not yet

- [ ] Is there an enemy or AI opponent?
      not yet

### Board/Grid

- [ ] What size should the board be? (fixed size, dynamic, scrollable viewport?)
      fixed size for now

- [x] What characters/symbols represent:
  - [x] Player character: `@` (classic roguelike character)
  - [x] Empty spaces: `.` (dot for empty floor)
  - [x] Walls/obstacles: `#` (hash for walls)
  - [x] Items/collectibles: (none for MVP)

- [ ] Should the board be randomly generated or predefined?
      the board should be blank

- [ ] Should there be borders around the board?
      outer walls would be fine

### Controls

- [ ] Movement controls:
  - [ ] Arrow keys (↑ ↓ ← →)
  - [ ] WASD keys
  - [x] Both supported

- [ ] Other controls:
  - [x] Quit/exit (q, ESC)
  - [x] Restart (r)
  - [x] Help/info (h, ?)

### Display

- [x] How should the board be rendered?
  - [x] Update only changed cells (minimizes flickering)
  - [x] Use cursor positioning to update specific cells
  - [x] Hide cursor during gameplay
  - [x] Initial full render, then incremental updates

- [ ] Should there be a status bar? (score, position, instructions)
      yes; score should be 0 for now

- [ ] Should there be a title/header?
      yes

### Technical Considerations

#### Node.js Library Options

**Option 1: Simple/Lightweight (Recommended for MVP)**

- **`terminal-game-io`** - Specifically designed for simple terminal games
  - Handles keyboard input and ASCII frame output
  - Works in Node.js and browser
  - Simple API, minimal dependencies
  - Good for: Simple character movement games

- **Built-in `readline` + Manual ANSI codes**
  - No dependencies
  - Full control but more manual work
  - Use with `ansi-escapes` for cursor control
  - Use with `chalk` for colors
  - Good for: Learning, minimal dependencies

- **`node-keypress`** or **`keypress`** - Simple key handling
  - Lightweight keypress event handling
  - Pair with manual screen clearing/rendering
  - Good for: Custom rendering logic

**Option 2: Medium Complexity (More Features)**

- **`neo-blessed`** - Enhanced fork of blessed
  - High-level terminal interface library
  - Widgets, layouts, event handling
  - Better maintained than original `blessed`
  - Good for: More complex UI needs, multiple screens

- **`blessed`** - Original terminal UI library
  - Similar to neo-blessed but less maintained
  - Still widely used
  - Good for: Complex terminal applications

- **`terminal-kit`** - Comprehensive terminal utilities
  - 256 colors, styles, keyboard/mouse handling
  - Screen buffers, input fields, progress bars
  - More features than needed for simple game
  - Good for: Rich terminal applications

**Option 3: Overkill (Not Recommended for Simple Game)**

- **`ink`** - React for CLI
  - React-based terminal UI
  - Too complex for simple game
  - Good for: Complex CLI apps with React knowledge

- **`nodegame`** - Multiplayer game framework
  - Designed for large-scale multiplayer games
  - Overkill for single-player terminal game

#### Recommendation

**Selected: Built-in `readline` + `ansi-escapes` + `chalk` + `cli-cursor`**

Rationale:

- **No external game-specific dependencies** - uses standard Node.js + lightweight utilities
- **Full control** over rendering for minimal flickering (cursor positioning)
- **Good learning experience** - understand how terminal games work
- **Minimal dependencies**: `ansi-escapes`, `chalk`, `cli-cursor` (all small, well-maintained)
- **Perfect for MVP** - simple, clean, extensible

Libraries to install:

- `ansi-escapes` - cursor positioning, screen clearing
- `chalk` - colors and styling
- `cli-cursor` - hide/show cursor

If we need more UI features later, we can migrate to `neo-blessed`.

#### Additional Libraries to Consider

- **`ansi-escapes`** - ANSI escape codes for cursor control, clearing screen
- **`chalk`** - Terminal string styling (colors, bold, etc.)
- **`cli-cursor`** - Show/hide terminal cursor
- **`readline-sync`** - Synchronous readline (if needed)

#### Other Technical Questions

- [x] How to handle terminal size changes?
  - For MVP: Fixed board size, check terminal size on startup, show error if too small
- [x] Should we support color/ANSI codes?
  - Yes, use colors for better visual distinction (player, walls, etc.)
- [x] Should we clear the terminal on exit?
  - Yes, restore terminal state and clear screen
- [x] Should we hide the cursor during gameplay?
  - Yes, hide cursor for cleaner display

### Game Loop

- [x] Event-driven (wait for keypress) or time-based (tick every X ms)?
  - Event-driven: Wait for keypress, update on input (simpler for MVP)
- [x] Should there be animations or just instant movement?
  - Instant movement for MVP (no animations needed)

## Initial Thoughts

### MVP Specifications

**Board:**

- Fixed size: 20x20 (400 cells total)
- Blank interior (all `.` except walls)
- Outer walls (`#`) around perimeter
- Player starts at center (10, 10)

**Display:**

- Title/header at top
- Game board in middle
- Status bar at bottom showing:
  - Score: 0
  - Position: (x, y)
  - Instructions: Arrow/WASD to move, Q/ESC to quit, R to restart, H/? for help

**Controls:**

- Movement: Arrow keys (↑ ↓ ← →) and WASD
- Quit: Q or ESC
- Restart: R
- Help: H or ?

**Rendering:**

- Initial full render
- Update only changed cells using cursor positioning
- Hide cursor during gameplay
- Use colors: player (green), walls (gray), empty (white)

### Potential Enhancements (Future)

- Multiple levels
- Score system
- Enemies that move
- Inventory system
- Save/load game state
- Different board themes
- Pathfinding for AI

## Notes

- Keep it simple for the first version
- Focus on core movement mechanics first
- Can add features incrementally

# Terminal Game

A simple terminal-based game built with Node.js where the player can move a character around on a board. This is a proof-of-concept MVP focused on exploration and demonstrating core game mechanics in a terminal environment.

## Requirements

### Terminal Font Requirement

**⚠️ IMPORTANT**: This application **requires** a terminal with a ZZT-compatible font installed and configured.

The game uses IBM Code Page 437 (CP437) characters to display authentic ZZT-style graphics. Without a CP437-compatible font, characters will not display correctly.

**Recommended Fonts**:

- **Perfect DOS VGA** - Best match for ZZT aesthetic
- **IBM VGA** - Original IBM CP437 font
- **Terminus** - Modern CP437-compatible font
- **Unifont** - Unicode font with CP437 support

**How to Configure**:

1. Download and install a CP437-compatible font (TTF format)
2. Configure your terminal to use the font:
   - **iTerm2**: Preferences → Profiles → Text → Change Font
   - **macOS Terminal**: Preferences → Profiles → Text → Font
   - **Windows Terminal**: Settings → Appearance → Font
3. Restart your terminal after changing the font

**Verification**:
Run this command to test CP437 character display:

```bash
node -e "process.stdout.write(Buffer.from([1, 219, 178, 177]))"
```

You should see: ☺ █ ▓ ▒

If these characters don't display correctly, verify your terminal font is set to a CP437-compatible font.

### System Requirements

- **Node.js**: Version 18 or higher
- **Terminal**: Terminal emulator with CP437 font support
- **Operating System**: macOS, Linux, or Windows

## Installation

1. **Clone or download this repository**

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Install and configure a CP437 font** (see Terminal Font Requirement above)

## Running the Game

### Single-Player Mode (Local)

```bash
npm start
```

Or directly:

```bash
node src/index.js
```

### Multiplayer Mode (Networked)

The game supports multiplayer via WebSocket. To run in multiplayer mode:

1. **Start the WebSocket server** (in one terminal):

   ```bash
   npm run server
   ```

   Or directly:

   ```bash
   node src/server/server.js
   ```

   The server will start on port 3000 by default and display:
   ```
   WebSocket game server is running. Press Ctrl+C to stop.
   ```

2. **Start clients** (in additional terminals):

   ```bash
   npm start
   ```

   The client will automatically connect to the server if `serverConfig.websocket.enabled` is set to `true` in `src/config/serverConfig.js`.

**Note**: By default, WebSocket mode is disabled. To enable it, set `serverConfig.websocket.enabled = true` in `src/config/serverConfig.js`.

## Game Description

### Core Mechanics

- **Player Movement**: Move a character around a fixed-size game board
- **Exploration**: No win/lose conditions - pure exploration for MVP
- **Event-Driven**: Game responds to keyboard input (no time-based ticks)
- **Real-Time Display**: Board updates immediately on player movement

### Game Board

- **Size**: Fixed 40x20 grid
- **Layout**:
  - Blank interior (empty spaces)
  - Outer walls forming a perimeter border
  - Player starts at center position

### Visual Elements

- **Player Character**: ZZT-style character (smiley face ☺)
- **Empty Space**: Space character
- **Walls**: ZZT-style block characters (█)
- **Display**: Title/header, game board, status bar

### Status Bar

Shows:

- Score: Current score
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

**Dependencies**:

- `ansi-escapes` - Cursor positioning and screen control
- `chalk` - Terminal colors and styling
- `cli-cursor` - Hide/show terminal cursor
- `ws` - WebSocket library for multiplayer support
- `uuid` - UUID generation for client/player IDs

**Dev Dependencies**:

- `vitest` - Testing framework
- `prettier` - Code formatter
- `husky` - Git hooks manager
- `lint-staged` - Run linters on staged files

### Rendering Strategy

- **Initial Render**: Full board render on game start
- **Incremental Updates**: Only update changed cells (minimizes flickering)
- **Cursor Positioning**: Use ANSI escape codes to position cursor and update specific cells
- **Cursor Management**: Hide cursor during gameplay for cleaner display
- **Colors**: Use ANSI color codes for visual distinction

## Project Structure

```
first-game/
├── src/
│   ├── config/          # Game and server configuration
│   ├── constants/        # Game constants (characters, etc.)
│   ├── game/            # Game logic (Board, Game classes)
│   ├── input/           # Input handling
│   ├── network/         # WebSocket client and message handling
│   ├── render/          # Rendering logic
│   ├── server/          # WebSocket server (GameServer, ConnectionManager)
│   ├── utils/           # Utility functions (logger, etc.)
│   ├── index.js         # Main entry point (client)
│   └── server.js         # Server entry point
├── test/                # Test files
│   ├── config/          # Configuration tests
│   ├── game/            # Game logic tests
│   ├── helpers/         # Test helpers (server lifecycle)
│   ├── integration/     # Integration tests
│   ├── network/         # Network/message tests
│   ├── server/          # Server tests
│   └── ...
├── docs/                # Documentation
│   └── development/     # Development process docs
├── STANDARDS_AND_PROCESSES/  # Development standards
└── package.json
```

## Development

This project follows a card-based development process documented in `STANDARDS_AND_PROCESSES/development.md`:

- **Card-Based Development**: Features tracked via cards in `docs/development/cards/`
- **Specifications**: Detailed specs in `docs/development/specs/`
- **Gameplans**: Implementation plans in `docs/development/gameplans/`
- **Git Workflow**: Commits after each phase step with meaningful messages
- **Testing**: All tests must pass before commits

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Development Standards

- **Async/Await**: Use async/await with try/catch blocks
- **Array Loops**: Follow patterns in `STANDARDS_AND_PROCESSES/async-await.md`
- **ES Modules**: Use native ES Modules (no CommonJS)
- **Testing**: Vitest for unit tests, run in non-interactive mode
- **Code Quality**: Follow existing code patterns and standards

## Configuration

### WebSocket Server Configuration

Server settings can be configured in `src/config/serverConfig.js`:

```javascript
export const serverConfig = {
  websocket: {
    enabled: false,        // Enable/disable WebSocket mode
    port: 3000,            // WebSocket server port
    host: '0.0.0.0',       // Server host (0.0.0.0 = accessible from network)
    updateInterval: 250,   // State update interval in milliseconds (4 updates/second)
  },
  logging: {
    level: 'info',         // Logging level: 'debug', 'info', 'warn', 'error'
  },
  reconnection: {
    enabled: true,         // Enable reconnection support
    maxAttempts: 5,        // Maximum reconnection attempts
    retryDelay: 1000,     // Delay between reconnection attempts (milliseconds)
  },
};
```

### Network Requirements

- **Port**: Default port 3000 must be available
- **Firewall**: If running on a network, ensure port 3000 is open
- **Host**: `0.0.0.0` allows connections from any network interface
- **Reconnection**: Players have a 1-minute grace period to reconnect after disconnection

## Troubleshooting

### Characters Don't Display Correctly

1. **Verify CP437 font is installed and selected** in your terminal
2. **Restart your terminal** after changing the font
3. **Test CP437 display** using the verification command above
4. **Check terminal encoding** - should be UTF-8 (default)

### Terminal Size Issues

- Ensure your terminal window is at least 30 columns wide and 25 rows tall
- The game will show an error if the terminal is too small

### Game Won't Start

- Verify Node.js version: `node --version` (should be 18+)
- Check dependencies are installed: `npm install`
- Check terminal supports raw mode (most modern terminals do)

### WebSocket Server Issues

- **Port already in use**: Another process may be using port 3000. Change the port in `serverConfig.js` or stop the conflicting process
- **Connection refused**: Ensure the server is running before starting clients
- **Can't connect from network**: Check firewall settings and ensure `host` is set to `'0.0.0.0'` (not `'localhost'`)
- **Reconnection not working**: Ensure `reconnection.enabled` is `true` in `serverConfig.js`

## Related Documents

- `BRAINSTORM.md` - Detailed brainstorming and decision log
- `ai-project.md` - Project overview and technical details
- `STANDARDS_AND_PROCESSES/development.md` - Development process documentation
- `STANDARDS_AND_PROCESSES/async-await.md` - Async/await patterns
- `ai-profile.md` - AI assistant profile and preferences
- `me-profile.md` - Developer profile and experience

## License

ISC

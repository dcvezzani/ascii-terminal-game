# @dcvezzani/ascii-tag

A simple terminal-based multiplayer game. Move your character around a shared board and explore.

**Node.js 22 or higher is required.**

## Quick start

```bash
npx @dcvezzani/ascii-tag
```

On first run, default config is created in `.ascii-tag/` in the current directory. Optionally scaffold config first:

```bash
npx @dcvezzani/ascii-tag init
```

## Run client and server

- **Client only** (connect to an existing server):
  ```bash
  ascii-tag
  # or
  ascii-tag client
  ```

- **Server** (start a game server in the current directory):
  ```bash
  ascii-tag server
  ```

  Use a specific board:
  ```bash
  ascii-tag server --board classic.json
  ```

- **Init** (create default config in `.ascii-tag/`):
  ```bash
  ascii-tag init
  ```

## How to play

- **Movement**: Arrow keys (↑ ↓ ← →) or WASD
- **Quit**: Q or ESC
- **Restart**: R
- **Help**: H or ?

The game shows a board, your character (`@`), and a status bar with position. There are no win/lose conditions—explore and move around. In multiplayer, other players appear on the same board.

## Config

Config is read from the **current working directory** where you run the command:

- **`.ascii-tag/client.json`** – client options (WebSocket URL, logging, rendering)
- **`.ascii-tag/server.json`** – server options (port, board, spawn points)

If a file is missing, it is created with defaults on first run. Edit these files to point the client at a different server or change server port/board.

## Requirements

- **Node.js 22 or higher**

## Version and help

```bash
ascii-tag --version
ascii-tag --help
```

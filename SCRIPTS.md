# Project Scripts Overview

This document outlines the available scripts in the `first-game` project, their purposes, and how to use them. These scripts are accessible via `npm run <script-name>` unless otherwise noted.

---

## Complete Script List

Every script in `package.json` is listed below. Details follow in the sections after.

| Script | Purpose |
|--------|---------|
| `start` | Launch client/standalone game |
| `client` | Alias for start (same as `start`) |
| `server` | Start multiplayer game server |
| `test` | Run all tests once (Vitest) |
| `test:watch` | Run tests in watch mode |
| `diagrams:components` | Server: components diagram (.mmd → .svg) |
| `diagrams:interactions:init` | Server: interactions 1 – initialization |
| `diagrams:interactions:connection` | Server: interactions 2 – connection |
| `diagrams:interactions:movement` | Server: interactions 3 – movement |
| `diagrams:interactions:broadcast` | Server: interactions 4 – broadcast |
| `diagrams:interactions:disconnect` | Server: interactions 5 – disconnect |
| `diagrams:interactions` | Server: run all 5 interaction diagrams |
| `diagrams:data-structures` | Server: data structures diagram |
| `diagrams:all` | Server: components + interactions + data-structures |
| `diagrams:client:components` | Client: components diagram |
| `diagrams:client:init` | Client: interactions 1 – initialization |
| `diagrams:client:connection` | Client: interactions 2 – connection |
| `diagrams:client:movement` | Client: interactions 3 – movement prediction |
| `diagrams:client:state` | Client: interactions 4 – state update |
| `diagrams:client:rendering` | Client: interactions 5 – rendering |
| `diagrams:client:data` | Client: data structures diagram |
| `diagrams:client:interactions` | Client: run all 5 interaction diagrams |
| `diagrams:client:all` | Client: components + interactions + data |
| `diagrams:generate` | Auto-discover all .mmd files and convert to .svg |

---

## Game/Application Scripts

### `start`
- **Launch the client/standalone game.**
- **Command:** `npm start` _or_ `npm run start`
- **Details:** Runs `src/index.js` to start the terminal-based game in single-player or client mode.

### `client`
- **Alias for `start`.**
- **Command:** `npm run client`
- **Details:** Identical to `start`. Provided for clarity when referring to the client-side code.

### `server`
- **Starts the game server for multiplayer.**
- **Command:** `npm run server`
- **Details:** Runs `src/server/index.js` to start the multiplayer game server (via Node.js). Uses default board `./boards/classic.json` (60×25) unless `--board <path>` is passed. Used for networked games.

---

## Testing Scripts

### `test`
- **Run all tests once (non-interactive, default mode).**
- **Command:** `npm test` _or_ `npm run test`
- **Details:** Executes all unit tests using [Vitest](https://vitest.dev/). Recommended for CI or as a pre-commit check.

### `test:watch`
- **Run tests in watch mode (interactive).**
- **Command:** `npm run test:watch`
- **Details:** Continuously watches for code changes and re-runs relevant tests. Useful for TDD during development.

---

## Diagram Generation Scripts (Mermaid)

These scripts generate diagrams from Mermaid `.mmd` files and output them as `.svg` files. They require
[@mermaid-js/mermaid-cli](https://github.com/mermaid-js/mermaid-cli) (`mmdc`) as a dev dependency.

### Server diagrams (single scripts)
- **`diagrams:components`** — Server components diagram.
- **`diagrams:interactions:init`** — Server interactions 1 – initialization.
- **`diagrams:interactions:connection`** — Server interactions 2 – connection.
- **`diagrams:interactions:movement`** — Server interactions 3 – movement.
- **`diagrams:interactions:broadcast`** — Server interactions 4 – broadcast.
- **`diagrams:interactions:disconnect`** — Server interactions 5 – disconnect.
- **`diagrams:data-structures`** — Server data structures diagram.

### `diagrams:interactions`
- **Runs all server-side interaction diagram generation scripts in sequence** (init, connection, movement, broadcast, disconnect).
- **Command:** `npm run diagrams:interactions`

### `diagrams:all`
- **Full regeneration of all server architecture diagrams** (components, interactions, and data structures).
- **Command:** `npm run diagrams:all`

### Client diagrams (single scripts)
- **`diagrams:client:components`** — Client components diagram.
- **`diagrams:client:init`** — Client interactions 1 – initialization.
- **`diagrams:client:connection`** — Client interactions 2 – connection.
- **`diagrams:client:movement`** — Client interactions 3 – movement prediction.
- **`diagrams:client:state`** — Client interactions 4 – state update.
- **`diagrams:client:rendering`** — Client interactions 5 – rendering.
- **`diagrams:client:data`** — Client data structures diagram.

### `diagrams:client:interactions`
- **Runs all client-side interaction diagram scripts in sequence** (init, connection, movement, state, rendering).
- **Command:** `npm run diagrams:client:interactions`

### `diagrams:client:all`
- **Full regeneration of all client architecture diagrams** (components, interactions, and data).
- **Command:** `npm run diagrams:client:all`

### `diagrams:generate`
- **Auto-discovers and converts all `.mmd` diagrams in the project.**
- **Command:** `npm run diagrams:generate`
- **Script:** Runs `scripts/generate-diagrams.js`.
- **Usage:**
  - `npm run diagrams:generate` (scans the whole project)
  - `node scripts/generate-diagrams.js [dir1] [dir2] ...` (to limit to specific dirs)
- **Features:** Recursively finds all `.mmd` files and converts to `.svg`, skipping excluded folders.

---

## How to Add New Scripts
- Edit `package.json` under the `scripts` section.
- For large scripting logic, add a new file in `scripts/` and create a script entry referencing it.

---

For additional details, see each script's `package.json` entry or consult the referenced files.
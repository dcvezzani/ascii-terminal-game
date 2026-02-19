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
| `server:debug` | Start server with Node inspector (debug) |
| `test` | Run all tests once (Vitest) |
| `test:run` | Alias for test (run tests once) |
| `test:watch` | Run tests in watch mode |
| `map:deserialize` | Convert .txt map file to JSON (run-length encoded) |
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
- **Details:** Runs `src/server/index.js` to start the multiplayer game server (via Node.js). Uses default board `boards/classic.json` (60×25) unless `--board <path>` is passed. Used for networked games.

### `server:debug`
- **Start the game server with Node inspector (for debugging).**
- **Command:** `npm run server:debug`
- **Details:** Runs `node --inspect-brk src/server/index.js` so you can attach a debugger (e.g. Chrome DevTools or VS Code) to the server process.

---

## Testing Scripts

### `test`
- **Run all tests once (non-interactive, default mode).**
- **Command:** `npm test` _or_ `npm run test`
- **Details:** Executes all unit tests using [Vitest](https://vitest.dev/). Recommended for CI or as a pre-commit check.

### `test:run`
- **Run all tests once (alias for `test`).**
- **Command:** `npm run test:run`
- **Details:** Same as `test`; runs `vitest run`. Useful in scripts or CI when the `test:run` name is preferred.

### `test:watch`
- **Run tests in watch mode (interactive).**
- **Command:** `npm run test:watch`
- **Details:** Continuously watches for code changes and re-runs relevant tests. Useful for TDD during development.

---

## Map/Board Scripts

### `map:deserialize`
- **Convert a `.txt` map file to run-length encoded JSON.**
- **Command:** `npm run map:deserialize -- <input-map-file.txt> [output-map-file.json]`
- **Details:** Runs `scripts/deserializeBoard.js`. Reads a text map file, validates dimensions, maps characters, run-length encodes the data, and writes JSON. If the output path is omitted, it defaults to the input path with `.txt` replaced by `.json`.

---

## Diagram Generation (Mermaid)

Diagram generation uses a single script that auto-discovers Mermaid `.mmd` files and converts them to `.svg`. It requires [@mermaid-js/mermaid-cli](https://github.com/mermaid-js/mermaid-cli) (`mmdc`) as a dev dependency.

### `diagrams:generate`
- **Auto-discover and convert all `.mmd` diagrams in the project to `.svg`.**
- **Command:** `npm run diagrams:generate`
- **Script:** Runs `scripts/generate-diagrams.js`.
- **Usage:**
  - `npm run diagrams:generate` — scans the whole project for `.mmd` files and converts each to `.svg`.
  - `node scripts/generate-diagrams.js [dir1] [dir2] ...` — limit conversion to specific directories.
  - `node scripts/generate-diagrams.js --help` (or `-h`) — show usage and examples.
- **Features:** Recursively finds all `.mmd` files and converts them to `.svg`, skipping `node_modules`, `.git`, `logs`, and `data`.

---

## How to Add New Scripts
- Edit `package.json` under the `scripts` section.
- For large scripting logic, add a new file in `scripts/` and create a script entry referencing it.

---

For additional details, see each script's `package.json` entry or consult the referenced files.
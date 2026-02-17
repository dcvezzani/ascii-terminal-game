# Gameplan: Publish @dcvezzani/ascii-tag to npm

## Overview

This gameplan breaks down implementation of the **publish-to-npm** feature into logical phases. The goal is to publish the terminal game as the npm package **`@dcvezzani/ascii-tag`** with a runnable CLI, cwd-based config (`.ascii-tag/`), Node 22 enforcement, and minimal tarball contents. Implementation follows the [Publish to npm spec](../../specs/build-distribution/publish-to-npm_SPECS.md); run tests after each step and commit when passing.

**Approach:** Add a single CLI entry that parses argv and delegates to client or server. Introduce cwd-based config loading (read or create with defaults) so the same client/server code can run from repo config (run-from-source) or from cwd config (CLI). Ship boards in `dist/boards/`, support board discovery from package + cwd, then finalize package.json and README for publish.

**Reference:** `docs/development/specs/build-distribution/publish-to-npm_SPECS.md`

## Progress Summary

- [ ] **Phase 1: Package identity and Node version check** – NOT STARTED
- [ ] **Phase 2: CLI entry and argument parsing** – NOT STARTED
- [ ] **Phase 3: Cwd-based config (load or create with defaults)** – NOT STARTED
- [ ] **Phase 4: Wire client to cwd config when run via CLI** – NOT STARTED
- [ ] **Phase 5: Wire server to cwd config and board discovery** – NOT STARTED
- [ ] **Phase 6: init command and --board resolution** – NOT STARTED
- [ ] **Phase 7: dist/boards and package contents** – NOT STARTED
- [ ] **Phase 8: README and publish verification** – NOT STARTED

## Prerequisites

- [ ] All existing tests passing (`npm run test`)
- [ ] [Publish to npm spec](../../specs/build-distribution/publish-to-npm_SPECS.md) and [Build and Distribution spec](../../specs/build-distribution/build-distribution_SPECS.md) reviewed
- [ ] Feature card [FEATURE_publish_ascii_tag_to_npm](../../cards/features/FEATURE_publish_ascii_tag_to_npm.md) and Open Q&A reviewed

---

## Phase 1: Package identity and Node version check (~30 min)

**Goal:** Set package name to `@dcvezzani/ascii-tag`, add `engines.node >= 22`, and create a CLI stub that checks Node version and handles `--version` / `--help` before any other logic.

### Step 1.1: package.json identity and engines

**Location:** `package.json`.

**Action:**
1. Set `"name": "@dcvezzani/ascii-tag"` (or keep current name for local dev and use a publish script that sets name—spec says published package name is `@dcvezzani/ascii-tag`; decide whether to rename in repo or only at publish).
2. Add `"engines": { "node": ">=22" }`.
3. Add `"bin": { "ascii-tag": "<path-to-cli-script>" }` (e.g. `"src/cli.js"`). Create a minimal `src/cli.js` that only runs a Node version check and exits (no subcommands yet).

**Verification:**
- [ ] `package.json` has `name`, `engines`, and `bin` pointing to a real file
- [ ] `node src/cli.js` runs without syntax errors

**Commit:** e.g. `Feature: Add package identity and engines (Node >=22) for npm publish`

---

### Step 1.2: Node version check and --version / --help

**Location:** `src/cli.js`.

**Action:**
1. At the top of the CLI (before any subcommand logic), read `process.version` and compare to Node 22. If below 22, print a clear error to stderr (e.g. "Node.js 22 or higher is required. Detected: <version>.") and `process.exit(1)`.
2. Parse argv for `--version` and `--help`. If `--version`: print package version (from package.json via readFileSync + JSON.parse, or a small helper) to stdout and exit 0. If `--help`: print short usage (e.g. commands: client, server, init) to stdout and exit 0.
3. Add unit tests for: Node version check (mock process.version or test with a message); --version output; --help output.

**Verification:**
- [ ] Running with Node &lt; 22 exits non-zero and prints error message
- [ ] `node src/cli.js --version` prints version; `node src/cli.js --help` prints usage
- [ ] Tests pass for version check and flag handling

**Commit:** e.g. `Feature: CLI Node 22 check and --version/--help`

---

**Phase 1 Completion Checklist:**
- [ ] package.json name, engines, bin set; src/cli.js exists
- [ ] Node 22 enforced at startup; --version and --help work
- [ ] All tests pass

---

## Phase 2: CLI entry and argument parsing (~25 min)

**Goal:** CLI parses first positional as subcommand: missing or `client` → client; `server` → server; `init` → init. For `server`, accept optional `--board <filename>`. No real client/server/init logic yet—only dispatch to stubs or exit with "not implemented" messages so flow is testable.

### Step 2.1: Subcommand parsing and dispatch

**Location:** `src/cli.js`.

**Action:**
1. After handling --version/--help, read first positional argument (e.g. `process.argv[2]`). If undefined or `client` → set subcommand to `client`; if `server` → `server`; if `init` → `init`. Otherwise print "Unknown command" to stderr and exit 1.
2. For `server`, parse `--board <path>` from argv (next argument after `--board`).
3. Call internal functions `runClient()`, `runServer(boardPath)`, or `runInit()`. Initially each can log "Running client" (etc.) and exit 0, or call the real entry points with placeholders for config.
4. Add tests: argv → correct subcommand and --board value; unknown command exits 1.

**Verification:**
- [ ] `ascii-tag`, `ascii-tag client` → client path; `ascii-tag server` → server path; `ascii-tag server --board foo.json` → server with board path; `ascii-tag init` → init path
- [ ] Unknown subcommand exits non-zero
- [ ] Tests pass

**Commit:** e.g. `Feature: CLI subcommand parsing (client, server, init) and --board`

---

**Phase 2 Completion Checklist:**
- [ ] Subcommands and --board parsed correctly
- [ ] All tests pass

---

## Phase 3: Cwd-based config (load or create with defaults) (~45 min)

**Goal:** Implement config resolution for `.ascii-tag/client.json` and `.ascii-tag/server.json` in cwd. If file is missing, create directory and file with defaults, print one-line message, then return the config object. Default client `websocket.url` must use the same port as default server config.

### Step 3.1: Default config values module

**Location:** New file e.g. `src/config/defaults.js` (or under `src/cli/`).

**Action:**
1. Define default server config object (same shape as current `config/serverConfig.json`): e.g. `websocket.port` (e.g. 3000), `logging`, `board`, `spawnPoints`. Export as `getDefaultServerConfig()` or a constant.
2. Define default client config object (same shape as current client config): `websocket.url` = `ws://localhost:<serverDefaultPort>`, plus `logging`, `rendering`, `prediction`, `statusBar` defaults. Export as `getDefaultClientConfig()` or a constant. Use the same port as server default.
3. Add tests that default client URL port matches default server port.

**Verification:**
- [ ] Defaults match existing config shape; client URL port equals server port
- [ ] Tests pass

**Commit:** e.g. `Feature: Default client and server config for CLI (aligned port)`

---

### Step 3.2: Ensure config file exists (read or create, print message)

**Location:** New file e.g. `src/cli/ensureConfig.js` or `src/config/cwdConfig.js`.

**Action:**
1. Implement `ensureClientConfig(cwd)` and `ensureServerConfig(cwd)` (or one function with type). Given cwd path:
   - Path to client config = `path.join(cwd, '.ascii-tag', 'client.json')` (server: `server.json`).
   - If file exists: read with `readFileSync`, `JSON.parse`, return parsed object.
   - If file does not exist: ensure `path.join(cwd, '.ascii-tag')` exists (mkdirSync), write default JSON (from Step 3.1) to the file, print one line to stderr (e.g. "Created default config at .ascii-tag/client.json"), return the default object.
2. Handle JSON parse errors (invalid existing file): throw or exit with clear message.
3. Add tests: missing file → creates file and returns defaults; existing file → returns parsed content; invalid JSON → error.

**Verification:**
- [ ] Missing config creates `.ascii-tag/` and file, prints message, returns defaults
- [ ] Existing config is read and returned
- [ ] Tests pass

**Commit:** e.g. `Feature: Ensure cwd config exists (create with defaults and message)`

---

**Phase 3 Completion Checklist:**
- [ ] Default config values defined and port aligned
- [ ] ensureClientConfig / ensureServerConfig create or read config; message on create
- [ ] All tests pass

---

## Phase 4: Wire client to cwd config when run via CLI (~30 min)

**Goal:** When the CLI runs the client subcommand, load config via `ensureClientConfig(process.cwd())` and run the existing client logic with that config instead of the repo `config/clientConfig.js`. Do not change run-from-source behavior (when running `node src/index.js`, keep using repo config).

### Step 4.1: Client entry that accepts config

**Location:** `src/index.js` and/or a new client entry used only by the CLI.

**Action:**
1. Refactor so client startup can receive a config object (e.g. export a `runClient(config)` or have `src/index.js` accept an optional config path/env). When config is provided (by CLI), use it; otherwise load from repo `config/clientConfig.js` as today.
2. In `src/cli.js`, for client subcommand: call `ensureClientConfig(process.cwd())`, then call the client entry with that config. Ensure logger level and all client options (websocket.url, rendering, prediction, statusBar) come from the provided config.
3. Add test: run client with cwd that has `.ascii-tag/client.json` (or ensureConfig creates it) and confirm client uses that config (e.g. mock or assert websocket URL).

**Verification:**
- [ ] `ascii-tag` / `ascii-tag client` from a directory uses `.ascii-tag/client.json` (created if missing)
- [ ] Running `node src/index.js` from repo still uses repo config
- [ ] Tests pass

**Commit:** e.g. `Feature: Wire CLI client to cwd-based config`

---

**Phase 4 Completion Checklist:**
- [ ] Client run via CLI uses cwd config
- [ ] Run-from-source unchanged
- [ ] All tests pass

---

## Phase 5: Wire server to cwd config and board discovery (~50 min)

**Goal:** When the CLI runs the server subcommand, load config via `ensureServerConfig(process.cwd())`. Resolve boards from `dist/boards/` (package) and `{cwd}/boards`. Present combined list with a randomly chosen default. Server startup uses cwd config for port, logging, spawnPoints, etc.

### Step 5.1: Package root and dist/boards path

**Location:** New helper e.g. `src/cli/packagePaths.js` or in server startup.

**Action:**
1. Resolve package root (directory containing package.json). Use `import.meta.url` to get current module path, then walk up to find `package.json`, or use a known relative path from `src/cli.js` to repo root. When published, CLI may live in `node_modules/@dcvezzani/ascii-tag`; resolve so `dist/boards` is relative to package root.
2. Implement `getPackageBoardsDir()` returning path to `dist/boards` (or `boards` in repo if not yet using dist). For now, can point to existing `boards/` in repo so tests pass; Phase 7 will add `dist/boards` and copy boards.
3. Add test or manual check that path resolves correctly when run from repo and when run from a directory (no change to board list until Step 5.2).

**Verification:**
- [ ] Package root and boards directory path resolve correctly
- [ ] Tests pass

**Commit:** e.g. `Feature: Resolve package root and dist/boards path for CLI`

---

### Step 5.2: Board discovery (dist/boards + cwd/boards) and random default

**Location:** Server startup path used by CLI (e.g. new `src/server/startFromCli.js` or extend `src/server/index.js`).

**Action:**
1. Implement `listAvailableBoards(cwd)`: list files in `getPackageBoardsDir()` and in `path.join(cwd, 'boards')`. Filter to board files (e.g. `.json`). Return combined list (e.g. package boards first, then cwd). When server is run without `--board`, show interactive list with this combined set; default selection = random element from the list.
2. Wire server CLI path to use `ensureServerConfig(process.cwd())` for port, logging, spawnPoints. When no `--board` is given, use board discovery and interactive selection with random default; when `--board <path>` is given, resolve path (cwd first, then package) and skip interactive list (Phase 6).
3. Add tests: listAvailableBoards returns package + cwd boards; default selection is one of the list (random).

**Verification:**
- [ ] Server started via CLI uses cwd config
- [ ] Board list includes package boards and cwd/boards; default is random
- [ ] All tests pass

**Commit:** e.g. `Feature: Server cwd config and board discovery (dist/boards + cwd/boards, random default)`

---

**Phase 5 Completion Checklist:**
- [ ] Server run via CLI uses cwd config and discovered boards
- [ ] Random default board selection
- [ ] All tests pass

---

## Phase 6: init command and --board resolution (~25 min)

**Goal:** `ascii-tag init` creates `.ascii-tag/` and writes `client.json` and `server.json` only if each does not exist; never overwrite. For `ascii-tag server --board <path>`, resolve path: look in cwd first, then in package `dist/boards`.

### Step 6.1: init – create only missing files

**Location:** `src/cli.js` or `src/cli/init.js`.

**Action:**
1. For `init` subcommand: ensure `.ascii-tag` exists. For `client.json`: if not exists, write default and print "Created default config at .ascii-tag/client.json". For `server.json`: if not exists, write default and print message. If either file already exists, skip (do not overwrite).
2. Add tests: init in empty dir creates both files; init again does not overwrite; init with only client.json present creates only server.json.

**Verification:**
- [ ] `ascii-tag init` creates missing config files only; never overwrites
- [ ] Tests pass

**Commit:** e.g. `Feature: ascii-tag init (create only missing config files)`

---

### Step 6.2: --board path resolution (cwd then package)

**Location:** Server startup when `--board <path>` is provided.

**Action:**
1. Resolve `--board <path>`: try `path.join(cwd, path)` first; if file exists, use it. Else try path relative to package (e.g. `path.join(getPackageRoot(), 'dist', 'boards', path)` or similar). If not found, log error and exit 1.
2. Add test: resolve returns cwd path when file exists in cwd; falls back to package when not in cwd.

**Verification:**
- [ ] `ascii-tag server --board my.json` uses cwd/my.json or package dist/boards/my.json
- [ ] Tests pass

**Commit:** e.g. `Feature: --board path resolution (cwd then package)`

---

**Phase 6 Completion Checklist:**
- [ ] init creates only missing files; --board resolves correctly
- [ ] All tests pass

---

## Phase 7: dist/boards and package contents (~30 min)

**Goal:** Boards shipped with the package live in `dist/boards/`. Ensure build or copy step places board files there. Set `package.json` "files" so the tarball includes only runtime code, `dist/boards/`, and README.md.

### Step 7.1: Populate dist/boards and wire package root

**Location:** Repo root and package resolution.

**Action:**
1. Create `dist/boards/` and copy (or symlink for dev) the default board file(s) from `boards/` (e.g. `classic.json` and dimensions or equivalent). Ensure board discovery in Phase 5 uses `dist/boards` when running from installed package; when running from repo, can use repo `boards/` or `dist/boards` so one path works for both.
2. Ensure `getPackageBoardsDir()` returns `dist/boards` relative to package root so that when published, the CLI finds boards inside the package.

**Verification:**
- [ ] `dist/boards/` contains default board(s); server can list and load them
- [ ] All tests pass

**Commit:** e.g. `Feature: Ship boards in dist/boards for npm package`

---

### Step 7.2: package.json "files"

**Location:** `package.json`.

**Action:**
1. Add `"files": [ ... ]` listing: CLI script, `src/` (or only the files needed for client and server), `dist/boards/`, `README.md`. Exclude tests, `docs/`, `config/` (repo config), gameplans, and other dev-only files. Ensure `npm pack` produces a tarball that includes only these.

**Verification:**
- [ ] `npm pack` and inspect tarball: contains bin, src, dist/boards, README; no test files or internal docs
- [ ] All tests pass

**Commit:** e.g. `Feature: package.json files for minimal npm tarball`

---

**Phase 7 Completion Checklist:**
- [ ] dist/boards populated; package root resolution works for installed package
- [ ] "files" limits tarball to runtime + dist/boards + README
- [ ] All tests pass

---

## Phase 8: README and publish verification (~30 min)

**Goal:** Package README includes quick start (npx, init, run client/server), how to play, config reference (`.ascii-tag/`), and Node 22 requirement. Document publish steps and verify with `npm pack` and a quick smoke test.

### Step 8.1: README for npm

**Location:** `README.md` (or a dedicated file that becomes README when publishing; if repo README is dev-focused, consider a separate `README.npm.md` that is copied or used as the published README, or add a "Using the published package" section).

**Action:**
1. Ensure README (or the section used for npm) includes:
   - Quick start: `npx @dcvezzani/ascii-tag`, optional `ascii-tag init`
   - Run client and server: how to start each
   - How to play: short controls and goal
   - Config: `.ascii-tag/client.json` and `.ascii-tag/server.json` in the directory where you run the command
   - Node 22 or higher required
2. Add or update so the published package's README matches the spec.

**Verification:**
- [ ] README content matches spec requirements
- [ ] All tests pass

**Commit:** e.g. `Feature: README content for npm (quick start, play, config, Node 22)`

---

### Step 8.2: Publish verification checklist

**Action:**
1. Run full test suite (`npm run test`).
2. Run `npm pack` and unpack the tarball in a temp directory. From there, run `node package/bin/ascii-tag --version` and `node package/bin/ascii-tag --help`. Optionally run `ascii-tag init` and then `ascii-tag client` (with server not running, expect connection error) to confirm config creation and client path.
3. Document in gameplan or a short PUBLISH.md: version bump (semver), run tests, `npm publish` (manual), and that publish is under scope `@dcvezzani/ascii-tag` (may require `npm publish --access public` for scoped package first publish).

**Verification:**
- [ ] All tests pass
- [ ] Packed tarball runs --version and --help; init and client path work from unpacked dir
- [ ] Publish steps documented

**Commit:** e.g. `Feature: Publish verification and checklist for @dcvezzani/ascii-tag`

---

**Phase 8 Completion Checklist:**
- [ ] README meets spec
- [ ] npm pack and smoke test pass
- [ ] Publish process documented

---

## Completion Checklist

- [ ] Phase 1: Package identity and Node check – complete
- [ ] Phase 2: CLI entry and argument parsing – complete
- [ ] Phase 3: Cwd-based config (load or create) – complete
- [ ] Phase 4: Client wired to cwd config – complete
- [ ] Phase 5: Server wired to cwd config and board discovery – complete
- [ ] Phase 6: init and --board resolution – complete
- [ ] Phase 7: dist/boards and package "files" – complete
- [ ] Phase 8: README and publish verification – complete
- [ ] All tests passing (`npm run test`)
- [ ] Feature card status updated; card and gameplan renamed with `X_` prefix when done

---

## Notes

- **Run-from-source:** Keep `node src/index.js` and `node src/server/index.js` (or npm scripts) using repo `config/` so developers are unchanged. Only the CLI entry uses cwd config.
- **Bin path:** Use `src/cli.js` or `dist/cli.js`; if using `dist/`, add a build step that copies or transpiles only what’s needed, or point bin at `src/cli.js` for simplicity until a build step is added.
- **First publish:** For scoped package `@dcvezzani/ascii-tag`, first publish may require `npm publish --access public` if the scope is not already configured for restricted access.

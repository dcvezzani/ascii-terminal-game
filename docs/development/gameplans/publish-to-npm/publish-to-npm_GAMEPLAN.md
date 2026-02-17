# Gameplan: Publish @dcvezzani/ascii-tag to npm

## Overview

This gameplan breaks down implementation of the **publish-to-npm** feature into logical phases. The goal is to publish the terminal game as the npm package **`@dcvezzani/ascii-tag`** with a runnable CLI, cwd-based config (`.ascii-tag/`), Node 22 enforcement, and minimal tarball contents. Implementation follows the [Publish to npm spec](../../specs/build-distribution/publish-to-npm_SPECS.md).

**Approach:** Add a single CLI entry that parses argv and delegates to client or server. Introduce cwd-based config loading (read or create with defaults) so the same client/server code can run from repo config (run-from-source) or from cwd config (CLI). Ship boards in `dist/boards/`, support board discovery from package + cwd, then finalize package.json and README for publish.

**Reference:** `docs/development/specs/build-distribution/publish-to-npm_SPECS.md`

### Development process (per `.cursor/STANDARDS_AND_PROCESSES/development.md`)

- **TDD:** For each step: (1) **Write tests first.** (2) **Run tests** — expect failures (red). (3) **Implement** code to make tests pass. (4) **Run tests again** — must pass (green). (5) **Verify** the step checklist. (6) **Git commit** with message below.
- **Test command:** `npm test` (Vitest, non-interactive). All tests must pass before every commit.
- **Commits:** One commit **per step** (not per phase). After tests pass:
  1. `git add -A`
  2. `npm test` (confirm pass)
  3. `git commit -m "..."` using the format below
- **Phase completion:** When all steps in a phase are done, mark the phase COMPLETE in Progress Summary, then **pause for review** before starting the next phase.

**Commit message format:**

```
[Phase N: Phase label / Step N.M – Step label] Feature(publish-to-npm): Brief description

- Detailed change 1
- Detailed change 2
- All tests passing
```

## Progress Summary

- [x] **Phase 1: Package identity and Node version check** – COMPLETE
- [x] **Phase 2: CLI entry and argument parsing** – COMPLETE
- [x] **Phase 3: Cwd-based config (load or create with defaults)** – COMPLETE
- [x] **Phase 4: Wire client to cwd config when run via CLI** – COMPLETE
- [x] **Phase 5: Wire server to cwd config and board discovery** – COMPLETE
- [x] **Phase 6: init command and --board resolution** – COMPLETE
- [x] **Phase 7: dist/boards and package contents** – COMPLETE
- [x] **Phase 8: README and publish verification** – COMPLETE

## Prerequisites

- [ ] All existing tests passing (`npm run test`)
- [ ] [Publish to npm spec](../../specs/build-distribution/publish-to-npm_SPECS.md) and [Build and Distribution spec](../../specs/build-distribution/build-distribution_SPECS.md) reviewed
- [ ] Feature card [FEATURE_publish_ascii_tag_to_npm](../../cards/features/FEATURE_publish_ascii_tag_to_npm.md) and Open Q&A reviewed

---

## Phase 1: Package identity and Node version check (~30 min)

**Goal:** Set package name to `@dcvezzani/ascii-tag`, add `engines.node >= 22`, and create a CLI stub that checks Node version and handles `--version` / `--help` before any other logic.

### Step 1.1: package.json identity and engines

**Location:** `package.json`, new `src/cli.js`.

**Action (TDD):**
1. **Write tests first:** Add tests (e.g. in `test/cli.test.js`) that assert: `package.json` has `name`, `engines.node`, and `bin`; `src/cli.js` exists and can be required/imported without throwing. If no testable behavior yet, at least add a test that the CLI file exists and runs (e.g. spawn or import and call a stub).
2. **Run tests** — expect failures (no bin, no cli.js yet).
3. **Implement:** Set `"name": "@dcvezzani/ascii-tag"` in package.json (or keep current name for local dev if you prefer; spec says published name is `@dcvezzani/ascii-tag`). Add `"engines": { "node": ">=22" }`. Add `"bin": { "ascii-tag": "src/cli.js" }`. Create minimal `src/cli.js` that exits (e.g. empty or only a Node version check stub) so `node src/cli.js` runs without syntax errors.
4. **Run tests** — expect pass.
5. **Verify** checklist below, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] `package.json` has `name`, `engines`, and `bin` pointing to a real file
- [ ] `node src/cli.js` runs without syntax errors

**Commit message:**
```
[Phase 1: Package identity and Node version check / Step 1.1 – package.json identity and engines] Feature(publish-to-npm): Add package identity and engines for npm publish

- Set package name to @dcvezzani/ascii-tag (or document publish-time name)
- Added engines.node >= 22
- Added bin ascii-tag -> src/cli.js
- Created minimal src/cli.js
- All tests passing
```

---

### Step 1.2: Node version check and --version / --help

**Location:** `src/cli.js`.

**Action (TDD):**
1. **Write tests first:** In `test/cli.test.js`: (a) When Node version is below 22 (mock or skip on Node >= 22), CLI exits non-zero and stderr contains "Node.js 22" or "required". (b) When argv contains `--version`, stdout contains package version and process exits 0. (c) When argv contains `--help`, stdout contains usage (e.g. "client", "server", "init") and process exits 0. Use child process or inject argv for tests.
2. **Run tests** — expect failures (behavior not implemented).
3. **Implement:** At top of CLI, read `process.version`, compare to Node 22; if below 22, print clear error to stderr and `process.exit(1)`. Parse argv for `--version` and `--help`. For `--version`, read package.json (e.g. from repo root via `import.meta.url` or path), print version, exit 0. For `--help`, print short usage, exit 0.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] Running with Node < 22 exits non-zero and prints error message
- [ ] `node src/cli.js --version` prints version; `node src/cli.js --help` prints usage

**Commit message:**
```
[Phase 1: Package identity and Node version check / Step 1.2 – Node version check and --version/--help] Feature(publish-to-npm): CLI Node 22 check and --version/--help

- Enforce Node >= 22 at startup with clear stderr message
- --version prints package version from package.json
- --help prints usage (client, server, init)
- All tests passing
```

---

**Phase 1 Completion Checklist:**
- [ ] All steps 1.1–1.2 completed; all tests passing
- [ ] package.json name, engines, bin set; src/cli.js exists
- [ ] Node 22 enforced at startup; --version and --help work
- [ ] **Update Progress Summary:** mark Phase 1 COMPLETE; **pause for review** before Phase 2

---

## Phase 2: CLI entry and argument parsing (~25 min)

**Goal:** CLI parses first positional as subcommand: missing or `client` → client; `server` → server; `init` → init. For `server`, accept optional `--board <filename>`. No real client/server/init logic yet—only dispatch to stubs so flow is testable.

### Step 2.1: Subcommand parsing and dispatch

**Location:** `src/cli.js`.

**Action (TDD):**
1. **Write tests first:** In `test/cli.test.js`: (a) argv with no positional (after --version/--help handled) or with `client` → subcommand is client. (b) argv with `server` → subcommand is server. (c) argv with `server --board foo.json` → board path is `foo.json`. (d) argv with `init` → subcommand is init. (e) argv with unknown subcommand → exit non-zero, stderr mentions unknown/error. Test via a parseArgs(argv) export or by running CLI in a child process and asserting exit code and output.
2. **Run tests** — expect failures (parsing not implemented).
3. **Implement:** After --version/--help, read first positional. Map undefined or `client` → client; `server` → server; `init` → init. For server, parse `--board <path>`. Call `runClient()`, `runServer(boardPath)`, or `runInit()` (stubs that exit 0). Unknown subcommand: stderr message, exit 1.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] `ascii-tag` and `ascii-tag client` → client path; `ascii-tag server` → server path; `ascii-tag server --board foo.json` → server with board path; `ascii-tag init` → init path
- [ ] Unknown subcommand exits non-zero

**Commit message:**
```
[Phase 2: CLI entry and argument parsing / Step 2.1 – Subcommand parsing and dispatch] Feature(publish-to-npm): CLI subcommand parsing (client, server, init) and --board

- Parse first positional as client|server|init; default to client
- Parse --board <path> for server subcommand
- Unknown subcommand exits 1 with stderr message
- All tests passing
```

---

**Phase 2 Completion Checklist:**
- [ ] All steps in Phase 2 completed; all tests passing
- [ ] Subcommands and --board parsed correctly
- [ ] **Update Progress Summary:** mark Phase 2 COMPLETE; **pause for review** before Phase 3

---

## Phase 3: Cwd-based config (load or create with defaults) (~45 min)

**Goal:** Implement config resolution for `.ascii-tag/client.json` and `.ascii-tag/server.json` in cwd. If file is missing, create directory and file with defaults, print one-line message, then return the config object. Default client `websocket.url` must use the same port as default server config.

### Step 3.1: Default config values module

**Location:** New file e.g. `src/config/defaults.js` (or under `src/cli/`).

**Action (TDD):**
1. **Write tests first:** In `test/config/defaults.test.js`: (a) `getDefaultServerConfig()` returns object with `websocket.port`, `logging`, `board`, `spawnPoints` (same shape as current serverConfig). (b) `getDefaultClientConfig()` returns object with `websocket.url` of form `ws://localhost:<port>`. (c) The port in client default URL equals `getDefaultServerConfig().websocket.port`.
2. **Run tests** — expect failures (module/function do not exist).
3. **Implement:** Create defaults module; define default server config (port e.g. 3000, logging, board, spawnPoints). Define default client config with `websocket.url` using same port. Export `getDefaultServerConfig()` and `getDefaultClientConfig()`.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] Defaults match existing config shape; client URL port equals server port

**Commit message:**
```
[Phase 3: Cwd-based config / Step 3.1 – Default config values module] Feature(publish-to-npm): Default client and server config for CLI (aligned port)

- Added getDefaultServerConfig() and getDefaultClientConfig()
- Client websocket.url port matches server default port
- All tests passing
```

---

### Step 3.2: Ensure config file exists (read or create, print message)

**Location:** New file e.g. `src/cli/ensureConfig.js` or `src/config/cwdConfig.js`.

**Action (TDD):**
1. **Write tests first:** In `test/cli/ensureConfig.test.js` (or similar): (a) When client config file does not exist in cwd, `ensureClientConfig(cwd)` creates `.ascii-tag/` and `client.json` with default content, returns parsed object; use temp dir. (b) When file exists, returns parsed content without writing. (c) When file exists but is invalid JSON, throws (or exits) with clear message. (d) Same for `ensureServerConfig(cwd)`. (e) When creating file, stderr (or stdout) receives one-line message containing ".ascii-tag/client.json" (capture via spy or child process).
2. **Run tests** — expect failures (functions not implemented).
3. **Implement:** `ensureClientConfig(cwd)` and `ensureServerConfig(cwd)`. Path = `path.join(cwd, '.ascii-tag', 'client.json')` or `server.json`. If exists: read, JSON.parse, return. If not: mkdirSync `.ascii-tag`, write default JSON, print one line to stderr, return default. On parse error, throw with clear message.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] Missing config creates `.ascii-tag/` and file, prints message, returns defaults
- [ ] Existing config is read and returned; invalid JSON throws

**Commit message:**
```
[Phase 3: Cwd-based config / Step 3.2 – Ensure config file exists] Feature(publish-to-npm): Ensure cwd config exists (create with defaults and message)

- ensureClientConfig(cwd) and ensureServerConfig(cwd)
- Create .ascii-tag/ and default JSON if missing; print one-line message
- Return parsed config; throw on invalid JSON
- All tests passing
```

---

**Phase 3 Completion Checklist:**
- [ ] All steps 3.1–3.2 completed; all tests passing
- [ ] Default config values defined and port aligned
- [ ] ensureClientConfig / ensureServerConfig create or read config; message on create
- [ ] **Update Progress Summary:** mark Phase 3 COMPLETE; **pause for review** before Phase 4

---

## Phase 4: Wire client to cwd config when run via CLI (~30 min)

**Goal:** When the CLI runs the client subcommand, load config via `ensureClientConfig(process.cwd())` and run the existing client logic with that config instead of the repo `config/clientConfig.js`. Do not change run-from-source behavior (when running `node src/index.js`, keep using repo config).

### Step 4.1: Client entry that accepts config

**Location:** `src/index.js`, `src/cli.js`.

**Action (TDD):**
1. **Write tests first:** (a) When client is started with an explicit config object (e.g. `runClient(config)`), it uses that config (e.g. websocket.url) rather than repo config; test via mock or by asserting the URL passed to WebSocketClient. (b) When `node src/index.js` is run with no config override, repo config is used (existing behavior). (c) When CLI runs client subcommand in a temp cwd, ensureClientConfig is called and client receives cwd config (integration or unit with stub).
2. **Run tests** — expect failures (no runClient(config) or CLI wiring yet).
3. **Implement:** Refactor client to accept optional config (e.g. export `runClient(config)`; when config provided, use it for logger, websocket.url, rendering, prediction, statusBar). Default (no config) = load from repo `config/clientConfig.js` as today. In `src/cli.js`, for client subcommand: call `ensureClientConfig(process.cwd())`, then `runClient(config)`.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] `ascii-tag` / `ascii-tag client` from a directory uses `.ascii-tag/client.json` (created if missing)
- [ ] Running `node src/index.js` from repo still uses repo config

**Commit message:**
```
[Phase 4: Wire client to cwd config / Step 4.1 – Client entry that accepts config] Feature(publish-to-npm): Wire CLI client to cwd-based config

- Refactored client to accept optional config; runClient(config)
- CLI client subcommand uses ensureClientConfig(process.cwd())
- Run-from-source still uses repo config when no config passed
- All tests passing
```

---

**Phase 4 Completion Checklist:**
- [ ] All steps in Phase 4 completed; all tests passing
- [ ] Client run via CLI uses cwd config; run-from-source unchanged
- [ ] **Update Progress Summary:** mark Phase 4 COMPLETE; **pause for review** before Phase 5

---

## Phase 5: Wire server to cwd config and board discovery (~50 min)

**Goal:** When the CLI runs the server subcommand, load config via `ensureServerConfig(process.cwd())`. Resolve boards from `dist/boards/` (package) and `{cwd}/boards`. Present combined list with a randomly chosen default. Server startup uses cwd config for port, logging, spawnPoints, etc.

### Step 5.1: Package root and dist/boards path

**Location:** New helper e.g. `src/cli/packagePaths.js` or in server startup.

**Action (TDD):**
1. **Write tests first:** In `test/cli/packagePaths.test.js`: (a) `getPackageRoot()` returns a path that contains `package.json` (read and assert file exists). (b) `getPackageBoardsDir()` returns a path under package root (e.g. ending in `boards` or `dist/boards`). When run from repo, paths are valid; use implementation that works for both repo and installed package (e.g. import.meta.url).
2. **Run tests** — expect failures (module/function do not exist).
3. **Implement:** Resolve package root via `import.meta.url` and walk up to find `package.json`. Implement `getPackageBoardsDir()` returning path to `dist/boards` (or `boards` in repo until Phase 7). Export both.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] Package root and boards directory path resolve correctly

**Commit message:**
```
[Phase 5: Wire server to cwd config and board discovery / Step 5.1 – Package root and dist/boards path] Feature(publish-to-npm): Resolve package root and dist/boards path for CLI

- getPackageRoot() via import.meta.url
- getPackageBoardsDir() returns dist/boards (or boards) relative to package root
- All tests passing
```

---

### Step 5.2: Board discovery (dist/boards + cwd/boards) and random default

**Location:** Server startup path used by CLI (e.g. new `src/server/startFromCli.js` or extend `src/server/index.js`).

**Action (TDD):**
1. **Write tests first:** (a) `listAvailableBoards(cwd)` returns array that includes files from getPackageBoardsDir() and from path.join(cwd, 'boards') (use temp dirs and fixture files). (b) When server is run via CLI without --board, ensureServerConfig(process.cwd()) is used and board list is combined; default selection is one of the list (assert random choice is in list, or stub Math.random). (c) Server started via CLI uses port/logging/spawnPoints from cwd config.
2. **Run tests** — expect failures (listAvailableBoards and CLI server wiring not implemented).
3. **Implement:** `listAvailableBoards(cwd)`: readdirSync package boards dir and cwd/boards (if exists), filter to board files (.json), return combined list. Wire CLI server path to ensureServerConfig(process.cwd()); when no --board, use listAvailableBoards, show interactive list (or stub for test), default = random element. When --board given, defer to Phase 6.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] Server started via CLI uses cwd config
- [ ] Board list includes package boards and cwd/boards; default is random

**Commit message:**
```
[Phase 5: Wire server to cwd config and board discovery / Step 5.2 – Board discovery and random default] Feature(publish-to-npm): Server cwd config and board discovery (dist/boards + cwd/boards, random default)

- listAvailableBoards(cwd) from package and cwd/boards
- CLI server uses ensureServerConfig(process.cwd()); random default board selection
- All tests passing
```

---

**Phase 5 Completion Checklist:**
- [ ] All steps 5.1–5.2 completed; all tests passing
- [ ] Server run via CLI uses cwd config and discovered boards; random default
- [ ] **Update Progress Summary:** mark Phase 5 COMPLETE; **pause for review** before Phase 6

---

## Phase 6: init command and --board resolution (~25 min)

**Goal:** `ascii-tag init` creates `.ascii-tag/` and writes `client.json` and `server.json` only if each does not exist; never overwrite. For `ascii-tag server --board <path>`, resolve path: look in cwd first, then in package `dist/boards`.

### Step 6.1: init – create only missing files

**Location:** `src/cli.js` or `src/cli/init.js`.

**Action (TDD):**
1. **Write tests first:** In `test/cli/init.test.js`: (a) In empty temp dir, run init (or call runInit(cwd)); both `.ascii-tag/client.json` and `.ascii-tag/server.json` exist with default content. (b) Run init again in same dir; file contents unchanged (no overwrite). (c) With only client.json present, run init; server.json is created, client.json unchanged. (d) Message printed when creating each file (stderr/spy).
2. **Run tests** — expect failures (runInit not implemented or does not skip existing).
3. **Implement:** For init subcommand: ensure `.ascii-tag` exists. For each of client.json and server.json, if file does not exist write default and print one-line message; if exists, skip.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] `ascii-tag init` creates missing config files only; never overwrites

**Commit message:**
```
[Phase 6: init command and --board resolution / Step 6.1 – init create only missing files] Feature(publish-to-npm): ascii-tag init (create only missing config files)

- runInit(cwd) creates .ascii-tag/ and client.json/server.json only if missing
- Never overwrite existing files; print message when creating
- All tests passing
```

---

### Step 6.2: --board path resolution (cwd then package)

**Location:** Server startup when `--board <path>` is provided (e.g. in CLI server path or shared resolver).

**Action (TDD):**
1. **Write tests first:** (a) `resolveBoardPath(cwd, path)` when path exists at path.join(cwd, path) returns that absolute path. (b) When path does not exist in cwd but exists in getPackageBoardsDir(), returns package path. (c) When path exists in neither, throws or returns null; caller exits 1 with message.
2. **Run tests** — expect failures (resolveBoardPath not implemented).
3. **Implement:** resolveBoardPath(cwd, path): try path.join(cwd, path), if exists return it; else try path.join(getPackageBoardsDir(), path); if not found, throw or return null and let server startup log and exit 1. Wire server --board to use this resolver.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] `ascii-tag server --board my.json` uses cwd/my.json or package dist/boards/my.json; not found exits 1

**Commit message:**
```
[Phase 6: init command and --board resolution / Step 6.2 – --board path resolution] Feature(publish-to-npm): --board path resolution (cwd then package)

- resolveBoardPath(cwd, path): try cwd then package dist/boards
- Server startup uses resolver for --board; exit 1 if not found
- All tests passing
```

---

**Phase 6 Completion Checklist:**
- [ ] All steps 6.1–6.2 completed; all tests passing
- [ ] init creates only missing files; --board resolves correctly
- [ ] **Update Progress Summary:** mark Phase 6 COMPLETE; **pause for review** before Phase 7

---

## Phase 7: dist/boards and package contents (~30 min)

**Goal:** Boards shipped with the package live in `dist/boards/`. Ensure build or copy step places board files there. Set `package.json` "files" so the tarball includes only runtime code, `dist/boards/`, and README.md.

### Step 7.1: Populate dist/boards and wire package root

**Location:** Repo root; `getPackageBoardsDir()` (from Phase 5).

**Action (TDD):**
1. **Write tests first:** (a) Directory `dist/boards/` exists and contains at least one board file (e.g. classic.json or equivalent). (b) `getPackageBoardsDir()` returns path that resolves to dist/boards; listAvailableBoards(cwd) when run from repo includes files from dist/boards. (c) Server can load a board from path returned by getPackageBoardsDir() (integration or unit with real path).
2. **Run tests** — expect failures (dist/boards may not exist or getPackageBoardsDir may still point to boards/).
3. **Implement:** Create `dist/boards/`; copy default board file(s) from `boards/` (e.g. classic.json and dimensions/config if needed). Ensure getPackageBoardsDir() returns path to `dist/boards` relative to package root. Update any board-loader path logic so server uses dist/boards when available.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] `dist/boards/` contains default board(s); server can list and load them

**Commit message:**
```
[Phase 7: dist/boards and package contents / Step 7.1 – Populate dist/boards] Feature(publish-to-npm): Ship boards in dist/boards for npm package

- Created dist/boards/ and copied default board(s) from boards/
- getPackageBoardsDir() returns dist/boards; discovery uses it
- All tests passing
```

---

### Step 7.2: package.json "files"

**Location:** `package.json`.

**Action (TDD):**
1. **Write tests first:** (a) Add test or script that runs `npm pack` and asserts tarball contains: bin entry, src (or required runtime files), dist/boards, README.md. (b) Asserts tarball does not contain: test files, docs/development, config/ (repo config). Can use list of paths from tar or npm pack --dry-run.
2. **Run tests** — expect failures (files array missing or wrong).
3. **Implement:** Add `"files": [ "src", "dist/boards", "README.md" ]` (or explicit list) so only runtime code, dist/boards, and README are included. Exclude tests, docs, config, gameplans.
4. **Run tests** — expect pass.
5. **Verify** checklist, then **commit**.

**Verification:**
- [ ] Tests written and passing
- [ ] `npm pack` tarball contains bin, src, dist/boards, README; no test files or internal docs

**Commit message:**
```
[Phase 7: dist/boards and package contents / Step 7.2 – package.json files] Feature(publish-to-npm): package.json files for minimal npm tarball

- Added files array: src, dist/boards, README.md (exclude tests, docs, config)
- npm pack produces minimal tarball per spec
- All tests passing
```

---

**Phase 7 Completion Checklist:**
- [ ] All steps 7.1–7.2 completed; all tests passing
- [ ] dist/boards populated; "files" limits tarball to runtime + dist/boards + README
- [ ] **Update Progress Summary:** mark Phase 7 COMPLETE; **pause for review** before Phase 8

---

## Phase 8: README and publish verification (~30 min)

**Goal:** Package README includes quick start (npx, init, run client/server), how to play, config reference (`.ascii-tag/`), and Node 22 requirement. Document publish steps and verify with `npm pack` and a quick smoke test.

### Step 8.1: README for npm

**Location:** `README.md` (or add "Using the published package" section if repo README is dev-focused).

**Action (TDD):**
1. **Write tests first (optional for docs):** If you use a script or test to validate README content: assert README contains strings for "npx @dcvezzani/ascii-tag", "ascii-tag init", "client", "server", ".ascii-tag", "Node 22" (or "Node.js 22"). Otherwise, treat as manual verification and skip automated test for this step.
2. **Implement:** Update README to include: Quick start (`npx @dcvezzani/ascii-tag`, optional `ascii-tag init`); Run client and server; How to play (short controls/goal); Config (`.ascii-tag/client.json`, `.ascii-tag/server.json` in cwd); Node 22 or higher required.
3. **Run tests** — all existing tests must still pass.
4. **Verify** checklist, then **commit**.

**Verification:**
- [ ] README content matches spec requirements
- [ ] All tests pass

**Commit message:**
```
[Phase 8: README and publish verification / Step 8.1 – README for npm] Feature(publish-to-npm): README content for npm (quick start, play, config, Node 22)

- Quick start: npx, init, run client/server
- How to play; config reference .ascii-tag/; Node 22 required
- All tests passing
```

---

### Step 8.2: Publish verification checklist

**Action (TDD where applicable):**
1. **Run full test suite:** `npm test` — all must pass.
2. **Smoke test:** Run `npm pack`, unpack tarball, run `node package/bin/ascii-tag --version` and `--help`; optionally `ascii-tag init` and `ascii-tag client` from unpacked dir (expect connection error without server). Add an automated test or script that runs pack and asserts bin runs (e.g. child process --version exits 0) if desired.
3. **Document:** Add PUBLISH.md (or section in README/gameplan) with: version bump (semver), run tests, `npm publish` (manual), scope `@dcvezzani/ascii-tag`, first publish may need `npm publish --access public`.
4. **Verify** checklist, then **commit**.

**Verification:**
- [ ] All tests pass
- [ ] Packed tarball runs --version and --help; init/client path work from unpacked dir
- [ ] Publish steps documented

**Commit message:**
```
[Phase 8: README and publish verification / Step 8.2 – Publish verification checklist] Feature(publish-to-npm): Publish verification and checklist for @dcvezzani/ascii-tag

- npm pack smoke test (--version, --help; optional init/client)
- Documented publish steps (semver, npm publish, --access public for scope)
- All tests passing
```

---

**Phase 8 Completion Checklist:**
- [ ] All steps 8.1–8.2 completed; all tests passing
- [ ] README meets spec; npm pack and smoke test pass; publish process documented
- [ ] **Update Progress Summary:** mark Phase 8 COMPLETE

---

## Completion Checklist (Gameplan Complete)

When all phases are done (per `.cursor/STANDARDS_AND_PROCESSES/development.md`):

- [ ] Phase 1 through Phase 8: all steps completed; all tests passing
- [ ] All tests passing (`npm test`) before final commit
- [ ] **Feature card:** Update status to COMPLETE in card content; rename card file with `X_` prefix: `FEATURE_publish_ascii_tag_to_npm.md` → `X_FEATURE_publish_ascii_tag_to_npm.md`
- [ ] **Gameplan directory:** Rename with `X_` prefix: `docs/development/gameplans/publish-to-npm/` → `docs/development/gameplans/X_publish-to-npm/`
- [ ] **Final commit:** Commit card/gameplan updates and directory rename (or do rename in a separate commit)

---

## Notes

- **Run-from-source:** Keep `node src/index.js` and `node src/server/index.js` (or npm scripts) using repo `config/` so developers are unchanged. Only the CLI entry uses cwd config.
- **Bin path:** Use `src/cli.js` or `dist/cli.js`; if using `dist/`, add a build step that copies or transpiles only what’s needed, or point bin at `src/cli.js` for simplicity until a build step is added.
- **First publish:** For scoped package `@dcvezzani/ascii-tag`, first publish may require `npm publish --access public` if the scope is not already configured for restricted access.

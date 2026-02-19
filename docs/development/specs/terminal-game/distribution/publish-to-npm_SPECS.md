# Specification: Publish @dcvezzani/ascii-tag to npm

## Overview

This specification defines the **implementation requirements** for publishing the terminal game as the npm package **`@dcvezzani/ascii-tag`**. It translates the [Build and Distribution](build-distribution_SPECS.md) spec into concrete package layout, CLI behavior, config handling, and publish process. Implementation of **FEATURE_publish_ascii_tag_to_npm** must follow this spec.

**Purpose:** Single source of truth for implementers (package.json fields, entry points, file layout, config defaults, and runtime behavior) so the published CLI matches the distribution contract.

## Problem Statement

- The [Build and Distribution](build-distribution_SPECS.md) spec defines *what* the npm package and CLI must do (contract). It does not spell out *how* to structure the package, which files to ship, or the exact default config values.
- Without an implementation spec, work such as adding `bin`, wiring cwd-based config, bundling boards, and enforcing Node 22 could be done inconsistently or with guesswork.

**Impact:** This spec closes the gap so the feature card can be implemented with clear, testable requirements.

## Solution Summary

1. **Package identity:** `package.json` uses `name: "@dcvezzani/ascii-tag"`, a single `bin` entry (e.g. `ascii-tag` → CLI script), `engines.node": ">=22"`, and a `files` array for a minimal tarball.
2. **CLI entry:** One executable that parses argv for subcommands (`client`, `server`, `init`) and flags (`--version`, `--help`, `--board <path>`). Delegates to client or server entry logic.
3. **Config:** Resolve cwd (e.g. `process.cwd()`), read or create `.ascii-tag/client.json` or `.ascii-tag/server.json` per command. On create: write defaults, print a one-line message, then proceed. Default client `websocket.url` uses the same port as default server config.
4. **init:** Create `.ascii-tag/` and only write `client.json` and/or `server.json` if each is missing; never overwrite existing files.
5. **Boards:** Ship boards in `dist/boards/`. At server start, list boards from `dist/boards/` and from `{cwd}/boards`; present combined list with a randomly chosen default selection.
6. **Node 22:** Check `process.version` at CLI startup; if &lt; 22, print a clear error and exit non-zero. Document in README and set `engines` in package.json.
7. **Publish:** Manual publish; semver; all tests must pass before publish. Tarball contains only runtime code, `dist/boards/`, and one README.md.

---

## Package Layout

### package.json

| Field | Requirement |
|-------|-------------|
| **name** | `"@dcvezzani/ascii-tag"` |
| **version** | Semver; maintained by maintainer. |
| **type** | `"module"` (ES modules). |
| **bin** | One entry: key is the CLI name (e.g. `"ascii-tag"`), value is path to the CLI script (e.g. `"dist/cli.js"` or `"src/cli.js"`). The script must be executable (shebang) or invoked via `node`. |
| **engines** | `"node": ">=22"`. Ensures npm can warn or fail on unsupported Node. |
| **files** | Array listing what to include in the tarball: entry scripts, client and server runtime code, `dist/boards/`, default config templates if any, and `README.md`. Exclude tests, docs (other than README), gameplans, and development-only files. |
| **main / exports** | Optional; if the package is CLI-only, may omit or point to the CLI script. Per build-distribution spec, the primary consumption is the CLI. |

### Directory structure (published)

- **CLI entry:** Single script referenced by `bin` (e.g. `dist/cli.js` or `src/cli.js`) that parses arguments and dispatches to client or server.
- **Client code:** Same behavior as current client (e.g. `src/index.js` or equivalent); config is loaded from cwd as below, not from repo `config/`.
- **Server code:** Same behavior as current server; config from cwd; boards from `dist/boards/` and `{cwd}/boards`.
- **Boards:** `dist/boards/` contains default board file(s) shipped with the package. Naming and format per existing board handling (e.g. `.json` or as already used in repo).

---

## CLI Entry and Argument Parsing

- **Invocation:** User runs `ascii-tag`, `ascii-tag client`, `ascii-tag server`, `ascii-tag init`, or `ascii-tag --version` / `ascii-tag --help`. `ascii-tag server` may be followed by `--board <filename>`.
- **Order of checks:** If `--version` or `--help` is present, handle and exit. Otherwise interpret first positional as subcommand: missing or `client` → run client; `server` → run server; `init` → run init. For `server`, parse `--board <filename>` if present.
- **Output:** `--version` prints package version (from package.json or injected at build time). `--help` prints usage (e.g. commands and short description). All to stdout; exit 0.

---

## Config Loading and Creation

- **Cwd:** Use `process.cwd()` as the directory where the CLI was invoked. All config paths are relative to cwd.
- **Paths:** Client config path = `{cwd}/.ascii-tag/client.json`. Server config path = `{cwd}/.ascii-tag/server.json`.
- **Missing file:** If the required config file for the command does not exist:
  1. Ensure directory `.ascii-tag` exists (create if needed).
  2. Write the config file with default contents (see Default config values).
  3. Print exactly one line to stderr (or stdout): e.g. `Created default config at .ascii-tag/client.json` (or `.../server.json`).
  4. Proceed to run client or server using the newly created file.
- **init command:** For `ascii-tag init`: create `.ascii-tag/` if needed. For each of `client.json` and `server.json`, if the file does **not** exist, write default contents and optionally print the same one-line message. If either file **already** exists, do **not** overwrite it. No need to start client or server after init.

---

## Default Config Values

- **Client default `websocket.url`:** Use `ws://localhost:{port}` where `{port}` is the **same default port as the server config** (e.g. the port field in the default `server.json`). This keeps client and server defaults aligned so a user can run server then client without editing config.
- **Other client keys:** Defaults for `logging`, `rendering`, `prediction`, `statusBar` per existing client config defaults in the codebase.
- **Server defaults:** Same shape as existing server config (e.g. `websocket`, `logging`, `board`, `spawnPoints`). Default port must be the one used in client default `websocket.url`.

---

## Board Discovery and Selection

- **Package boards:** Stored in **`dist/boards/`** inside the package. Resolution of `dist/boards/` must work when the package is installed (e.g. via `import.meta.url` or `__dirname` equivalent to find package root, then `path.join(packageRoot, 'dist', 'boards')`).
- **Cwd boards:** Also list board files from **`{cwd}/boards`** (directory where CLI was invoked). If the directory does not exist or is empty, the list from cwd is empty.
- **Combined list:** Available boards = union of files in `dist/boards/` and `{cwd}/boards`. Presentation order is implementation-defined (e.g. package boards first, then cwd). When showing an interactive list for `ascii-tag server` (no `--board`), present this combined list.
- **Default selection:** When the user is prompted to choose a board (interactive list), the **default selection is randomly chosen** from the combined list. There is no single “recommended” default board.
- **`--board <filename>`:** Resolve path relative to cwd first; if not found, resolve relative to package (e.g. `dist/boards/<filename>`). Use that board and do not show the interactive list.

---

## Node Version Enforcement

- **At startup:** Before running client or server logic, the CLI must check Node version. If `process.version` indicates a version &lt; 22, print a **clear error message** to stderr (e.g. that Node 22 or higher is required and the user’s version was detected), then exit with a non-zero code (e.g. 1).
- **package.json engines:** Include `"engines": { "node": ">=22" }` so npm can warn or fail on install when Node is too old.
- **README:** State in the package README that Node.js 22 or higher is required.

---

## Package Contents (Tarball) and README

- **files (package.json):** Include only: CLI entry, client and server runtime code, `dist/boards/`, and `README.md`. Exclude tests, internal docs, gameplans, and any file not needed to run the CLI.
- **README.md:** Must include:
  - **Quick start:** How to run with `npx @dcvezzani/ascii-tag`, and optionally `ascii-tag init` to scaffold config.
  - **Run client and/or server:** How to start the client and how to start the server (e.g. `ascii-tag server`).
  - **How to play:** Short instructions (controls, goal if any).
  - **Config:** Reference to `.ascii-tag/` in the directory where the user runs the command (client.json, server.json).
  - **Node 22:** Statement that Node.js 22 or higher is required.

---

## Publishing Process

- **Who:** Manual `npm publish` by a maintainer (no CI publish for now).
- **Versioning:** Semver. Major for breaking changes; minor for moderate architectural changes with backward compatibility; patch otherwise.
- **Pre-publish:** All tests must pass before publish.
- **Dependencies:** Publish with normal dependencies (no bundling). No optional or peer dependencies at this time.

---

## References

- **[Build and Distribution](build-distribution_SPECS.md)** – Parent spec; this document implements the npm-related parts.
- **Feature card:** [FEATURE_publish_ascii_tag_to_npm](../../cards/features/FEATURE_publish_ascii_tag_to_npm.md).

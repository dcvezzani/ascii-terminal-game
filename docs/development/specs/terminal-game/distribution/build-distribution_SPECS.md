# Specification: Build and Distribution

## Overview

This specification defines how the **@dcvezzani/ascii-tag** terminal game is built, packaged, and distributed. It establishes package identity, CLI contract, config file location and behavior, minimum Node version, and the four distribution product types with their target audiences and support level. It is the single source of truth for distribution and packaging; gameplans and implementation cards (e.g. publishing to npm) reference this spec.

**Purpose:** Turn build/distribution decisions into actionable requirements so implementation is consistent and follow-up questions have a clear home.

## Problem Statement

**Current state:**
- Build and distribution decisions live in **FEATURE_build_distribution_and_terminal_compatibility** (Open Questions & Answers). There is no formal spec that turns those decisions into implementation requirements.
- Without a written spec, questions such as config file name, CLI entry points, server vs. client packaging, and "missing config" behavior have no single source of truth. Implementation work (e.g. publishing to npm, standalone binary) would be ad hoc.

**Impact:** Inconsistent or ambiguous packaging, unclear "how we build and ship," and no designated place to document open points.

## Solution Summary

1. **Package identity:** Publish under the name **`@dcvezzani/ascii-tag`** (scoped). The package is a runnable CLI; config is read from the **current working directory (cwd)** where the CLI is invoked.
2. **Node and platform:** Minimum supported version is **Node.js 22** for official distribution. Document impact on build/packaging tooling if any.
3. **Four distribution product types:** Document (a) run from source, (b) npm-installable CLI, (c) optional standalone executable, (d) Docker. For each, state "who it's for" and whether we support it.
4. **Server and remote play:** Clarify that the server can run elsewhere (e.g. on the Internet); the client connects via config. Optional: hosting at home with port forwarding or a tunnel for friends. Reference WebSocket and connectivity (no change to existing behavior).
5. **Open points:** Maintain a section for follow-up questions that affect distribution; can reference the parent feature card for discussion.

---

## Package Identity and CLI

### Package name

- **Name:** **`@dcvezzani/ascii-tag`** (scoped on npm under the `@dcvezzani` scope).

### CLI contract

- **Default command:** Running **`npx @dcvezzani/ascii-tag`** (or `ascii-tag` when installed globally) with no arguments runs the **client** only. The client connects to a WebSocket server using configuration from the **current working directory (cwd)**.
- **Config location:** The CLI looks for configuration in the **`.ascii-tag/`** directory in the current working directory (cwd). See config file table below.

### Config file (cwd-based)

Config is stored under **`.ascii-tag/`** in cwd. Separate files for client and server.

| Aspect | Specification |
|--------|----------------|
| **Location** | Current working directory (cwd) of the process that invokes the CLI. |
| **Client config** | **`.ascii-tag/client.json`** — used when running the client (`ascii-tag` with no args). |
| **Server config** | **`.ascii-tag/server.json`** — used when running the server (`ascii-tag server`). |
| **Format** | **JSON only.** Other formats are not supported in this version. |
| **Client config contents** | All current client options: **`websocket.url`**, **`logging`**, **`rendering`**, **`prediction`**, **`statusBar`**. Defaults apply when keys are absent. No additional keys required for the CLI. |
| **Server config contents** | Same shape as existing server config (e.g. `websocket`, `logging`, `board`, `spawnPoints`). Boards are supplied by the package (see Server and boards below). |
| **Missing config in cwd** | If the expected config file (e.g. `.ascii-tag/client.json`) is not present: **create it** with default values, then run. So the first run creates `.ascii-tag/client.json` (or `.ascii-tag/server.json`) with defaults and starts the client (or server). |
| **Config creation message** | When auto-creating a config file, print a one-line message so the user knows where to edit (e.g. "Created default config at .ascii-tag/client.json"). Same for server. |
| **Default client `websocket.url`** | In generated `client.json`, use `ws://localhost:<port>` where `<port>` is the **same default port as the server config** (so client and server defaults align). |
| **Config path override** | **None.** The user edits the generated `.ascii-tag/client.json` or `.ascii-tag/server.json` as needed; no `--config` or env override. |

### CLI entry points and commands

| Command / flag | Behavior |
|----------------|----------|
| **`ascii-tag`** (no args) <br> **`ascii-tag client`** | Run the **client**. Read config from cwd (`.ascii-tag/client.json`; create with defaults if missing, then run). |
| **`ascii-tag server`** | Start the **server**. Read config from cwd (`.ascii-tag/server.json`; create with defaults if missing). Boards are bundled with the npm package; see "Server and boards" below. |
| **`ascii-tag server --board <filename>`** | Start the server and use the given board file; **bypass** the interactive board selection. |
| **`ascii-tag init`** | Scaffold default config: create `.ascii-tag/` and write default `client.json` and `server.json` **only if not already present**; never overwrite existing files. |
| **`--version`** | Print package version and exit. |
| **`--help`** | Print usage and exit. |

---

## Server and boards (when run via CLI)

- **Boards in package:** Boards shipped with the npm module live in **`dist/boards/`** inside the package.
- **Board discovery:** When running `ascii-tag server`, enumerate available boards by listing files in **`dist/boards/`** (package) and in **`{cwd}/boards`** (current working directory). Combined list is presented for selection.
- **On `ascii-tag server`:** Present the combined **list of available boards** and let the user **choose** which one to use. The **default selection is randomly chosen** from the available boards (no single recommended default).
- **Bypass selection:** If **`--board <filename>`** is passed (e.g. `ascii-tag server --board my-board.txt`), use that board and **do not** show the interactive list. The path is resolved **relative to both** the current working directory and the package: **look in cwd first, then in the package** (if not found in cwd).
- **Server config:** Read from `.ascii-tag/server.json` in cwd (create with defaults if missing).

---

## Node and Platform

- **Minimum Node version:** **Node.js 22** for official distribution (npm package, documented run-from-source, and any future standalone binary).
- **Enforcement:** Enforce via **`package.json` engines field** (npm may warn or fail on install on older Node) and at **runtime** when the CLI starts: if Node &lt; 22, exit with a **clear error message** and non-zero exit code. Document the requirement in the package README.
- **Impact on tooling:** Any build or packaging tooling (e.g. bundlers, pkg/nexe) must target Node 22 or compatible runtime. No specific impact is mandated beyond this minimum.

---

## Distribution Product Types

The project supports or considers **four distribution product types**. For each, the spec states "who it's for" and "whether we support it."

### (a) Run from source (clone + Node)

| Item | Description |
|------|-------------|
| **What it is** | User clones the repository, installs dependencies with npm, and runs the client (and optionally the server) with Node (e.g. `node src/client.js`, `node src/server.js`, or npm scripts). |
| **Who it's for** | **Developers** and contributors; players who are comfortable with Git and Node. |
| **Support** | **Supported.** This is the primary development and "clone and run" distribution model. |
| **Notes** | Config today lives in project `config/` (e.g. `config/clientConfig.json`). The npm CLI, when used, uses cwd-based config (`.ascii-tag/`) instead. |

### (b) npm-installable CLI

| Item | Description |
|------|-------------|
| **What it is** | Package **`@dcvezzani/ascii-tag`** published to npm. Users run the client via **`npx @dcvezzani/ascii-tag`** or after installing the package (global or local). Config is in the **directory where the CLI is invoked** (cwd), under `.ascii-tag/`. |
| **Who it's for** | **Players and developers** who want to run the game without cloning the repo. Ease of install and discovery. |
| **Support** | **Supported.** Publish as a runnable CLI; behavior and config contract are defined in this spec. |
| **Notes** | The published package includes **both** client and server code (and bundled boards) so users can run the client and optionally start the server from the same install (e.g. `ascii-tag server`). **Implementation details** (package layout, CLI entry, config defaults, board discovery, Node check) are in [Publish to npm](publish-to-npm_SPECS.md). |

### (c) Optional standalone executable

| Item | Description |
|------|-------------|
| **What it is** | Standalone executables (e.g. produced with pkg, nexe, or similar) that run the client or server without requiring a Node.js installation. |
| **Who it's for** | **Players** who do not want to install Node; "run a binary" experience. |
| **Support** | **Optional / future.** The spec mentions it as an optional delivery format. Behavior, when implemented, should match the npm CLI (same config semantics). |
| **What's involved** | Use a bundler (e.g. **pkg**, **nexe**) to produce **separate binaries** for **client** and **server** (not a single binary with subcommands). Same config semantics: e.g. `.ascii-tag/` in cwd. Each binary bundles Node + the relevant application. |
| **Notes** | If the server runs elsewhere (e.g. on the Internet), the user only needs the client binary. "Host at home" uses the standalone server binary. |

### (d) Docker

| Item | Description |
|------|-------------|
| **What it is** | A Docker image that contains **all resources** (client, server, and boards) so that development and testing can run in a container. Playing via Docker may be possible but is not the primary use. |
| **Who it's for** | **Developers** who prefer containerized runs; main purpose is **development and testing**. We do not assume players will use Docker. |
| **Support** | **Optional / best effort.** High-level only in this spec. |
| **Image name** | **`ascii-tag`**. |
| **Base image** | Suggest a **lite version of Ubuntu** (e.g. `ubuntu:24.04` or similar minimal variant). More details (exact contents, how to run) to be provided in a later card or README. |
| **Notes** | No detailed Dockerfile or image contract in this spec. |

---

## Server and Remote Play

- **Server location:** The game server can run **anywhere** (same machine, LAN, or the Internet). The client connects to the WebSocket URL configured in the client config (e.g. `websocket.url`).
- **Remote play:** It is possible for a host to run the server on their machine and have friends connect over the Internet if (a) the server binds to `0.0.0.0` or the host's IP, and (b) the host exposes the port (router port forwarding or a tunnel such as ngrok). This is **supported**; no change to existing WebSocket behavior.
- **Config:** The client's config (cwd-based when using the CLI: `.ascii-tag/client.json`) must allow setting the server URL (e.g. `websocket.url`) so that "run from source" and "npm CLI" users can point to a remote server.

---

## Publishing to npm (process and package contents)

- **Who publishes:** Manual `npm publish` by a maintainer (no CI publish for now).
- **Versioning:** Semver. **Major** for breaking changes; **minor** for moderate architectural changes with backward compatibility; **patch** otherwise.
- **Pre-publish checks:** All tests must pass before publish.
- **Package contents (tarball):** Ship a **minimal set** via `package.json` "files": runtime code, config defaults, bundled boards in `dist/boards/`, and a single **README.md**. Exclude tests, internal docs, and gameplans. The only documentation in the package is README.md.
- **README.md:** Must include quick start (e.g. `npx @dcvezzani/ascii-tag`, `ascii-tag init`, run client/server), how to play, reference to config (`.ascii-tag/`), and Node 22 requirement.
- **Dependencies:** Publish with **normal dependencies** (no bundling). No optional or peer dependencies at this time.

---

## Open Points

The following may be refined in a later revision or implementation card.

1. **Docker** – Docker details are captured in **ENHANCEMENT_docker_image_and_compose** and will be considered later (exact Dockerfile, image contents, run instructions).

---

## References

- **Parent feature card:** `docs/development/cards/features/FEATURE_build_distribution_and_terminal_compatibility.md` (Open Questions & Answers).
- **Enhancement card:** `docs/development/cards/enhancements/ENHANCEMENT_create_distribution_spec.md` (Open Questions & Answers with resolved decisions).
- **Implementation card:** `docs/development/cards/features/FEATURE_publish_ascii_tag_to_npm.md` (implements this spec).
- **Publish to npm (implementation spec):** [publish-to-npm_SPECS.md](publish-to-npm_SPECS.md) – package layout, CLI behavior, config defaults, and publish process for the npm package.

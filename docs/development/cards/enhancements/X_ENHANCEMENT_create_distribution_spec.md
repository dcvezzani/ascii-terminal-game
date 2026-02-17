# Enhancement Card: Create Distribution Spec

## Status

- **Status**: COMPLETE (spec written; decisions recorded in Open Questions & Answers below)
- **Priority**: LOW (foundational; unblocks packaging and distribution work)
- **Created**: 2026-02-14

## Context

**Current State**:
- Build and distribution decisions are captured in **FEATURE_build_distribution_and_terminal_compatibility** (Open Questions & Answers). There is no formal specification document that turns those decisions into actionable requirements for implementation.
- Decisions include: npm package name `ascii-tag`, runnable CLI with config file in the directory where the CLI is invoked, Node 22 minimum, optional standalone binary and Docker (with "who it's for"), and "clone and run" as the likely near-term distribution model.

**Location**:
- Spec output: `docs/development/specs/build-distribution/` (or equivalent under `docs/development/specs/`).

## Problem

- Without a written spec, follow-up questions (e.g. config file name, CLI entry points, server vs. client packaging) have no single source of truth. Implementation work (e.g. publishing to npm, standalone binary) would be ad hoc.
- A distribution spec gives the project a clear contract for "how we build and ship" and where to document open points.

## Desired Outcome

Create a **Distribution spec** under `docs/development/specs/` that:

1. **Package identity and CLI**
   - Package name: **`ascii-tag`**.
   - Runnable CLI (e.g. `npx ascii-tag`); config file is in the **same directory where the CLI is invoked** (cwd). Document the config file name, format, and what it configures (e.g. server URL, client options).

2. **Node and platform**
   - Minimum Node version: **Node.js 22**.
   - Note impact on build/packaging tooling if any.

3. **Distribution options**
   - Document: (a) run from source (clone + Node), (b) npm-installable CLI, (c) optional standalone executable (pkg, nexe, etc.) and (d) Docker. For each, state "who it's for" (e.g. developers vs. players) and whether we support it.

4. **Server and remote play**
   - Clarify: server can run elsewhere (e.g. on the Internet); client connects via config. Optional: hosting at home with port forwarding or tunnel for friends. Reference WebSocket and connectivity (no change to existing behavior).

5. **Open points**
   - Section or list for follow-up questions that affect distribution behavior; can reference the parent feature card for discussion.

## Open Questions & Answers

Decisions made; reflected in the distribution spec.

### Config file (cwd-based)

1. **Config file name**
   **Answer:** Use **`.ascii-tag/client.json`** and **`.ascii-tag/server.json`** for client and server configuration respectively (directory `.ascii-tag` in cwd with two JSON files).

2. **Config format**
   **Answer:** Limit to **JSON** for now.

3. **Config contents**
   **Answer:** All current config options (client: `websocket.url`, `logging`, `rendering`, `prediction`, `statusBar`) should be supported. No additional keys needed for the CLI.

4. **Missing config in cwd**
   **Answer:** Use **(c)** — **create a default config file** in cwd and then run (e.g. write `.ascii-tag/client.json` or `.ascii-tag/server.json` with defaults, then start).

5. **Config path override**
   **Answer:** No override. User updates the generated configuration file (`.ascii-tag/client.json` or `.ascii-tag/server.json`) as needed.

### CLI entry points and commands

6. **What does `ascii-tag` run?**
   **Answer:** Yes — default command (no args) runs the **client** only.

7. **Starting the server from the same package**
   **Answer:** **`ascii-tag server`**; server reads config from **cwd** (`.ascii-tag/server.json`). Boards are stored with the npm module; on server start, present a list of boards for the user to choose. Selection is **bypassed** if a board filename is passed (e.g. `--board my-board.txt`).

8. **Other subcommands or flags**
   **Answer:** Yes — specify **`--version`**, **`--help`**, and **`ascii-tag init`** (scaffold config) in the spec.

### Package contents and scope

9. **What's in the npm package?**
   **Answer:** The published package includes **both** client and server code.

10. **Scoped vs unscoped package name**
    **Answer:** Use scope **`@dcvezzani`** — publish as **`@dcvezzani/ascii-tag`**.

### Optional distribution options (how much to specify)

11. **Standalone executable**
    **Answer:** Spec mentions it as optional; "behavior same as npm CLI." What's involved: use a bundler (e.g. pkg, nexe) to produce a single executable that bundles Node + application; same config semantics (e.g. `.ascii-tag/` in cwd) and commands. Details in spec.

12. **Docker**
    **Answer:** All resources (client + server + boards) should be available in the Docker image. Main purpose is **development and testing**; playing via Docker may be possible but is not the primary use. High-level only in this spec; details in a later card or README.

### Server and remote play

13. **Server config when run via CLI**
    **Answer:** Boards are **stored with the npm module**. When starting the server: show a current list of boards and let the user choose. **Bypass** the selection if the board filename is passed (e.g. `--board my-board.txt`). Server config read from cwd (`.ascii-tag/server.json`).

## Requirements

- Spec is written in the project's usual spec style (see e.g. `docs/development/specs/center-board-in-terminal/`).
- All content is derived from or consistent with **FEATURE_build_distribution_and_terminal_compatibility** (Open Questions & Answers).
- Spec is the single source of truth for distribution and packaging; future gameplans and implementation cards reference it.

## Dependencies

- **FEATURE_build_distribution_and_terminal_compatibility**: Source of decisions. No implementation dependency.

## Documentation

- **SPECS**: Created at `docs/development/specs/build-distribution/build-distribution_SPECS.md`. All decisions from Open Q&A above are reflected in the spec.
- **GAMEPLAN**: Optional; created after spec if we implement distribution features.

## Related Cards

- **FEATURE_build_distribution_and_terminal_compatibility**: Parent card; "Where to go from here" option 1 (create spec).
- **FEATURE_publish_ascii_tag_to_npm**: Implementation card; will reference this spec once created.

## Tags

- `enhancement`
- `documentation`
- `spec`
- `distribution`
- `build`

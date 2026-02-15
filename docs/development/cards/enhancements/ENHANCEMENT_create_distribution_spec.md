# Enhancement Card: Create Distribution Spec

## Status

- **Status**: NOT STARTED
- **Priority**: LOW (foundational; unblocks packaging and distribution work)
- **Created**: 2026-02-14

## Context

**Current State**:
- Build and distribution decisions are captured in **FEATURE_build_distribution_and_terminal_compatibility** (Open Questions & Answers). There is no formal specification document that turns those decisions into actionable requirements for implementation.
- Decisions include: npm package name `ascii-tag`, runnable CLI with config file in the directory where the CLI is invoked, Node 22 minimum, optional standalone binary and Docker (with “who it’s for”), and “clone and run” as the likely near-term distribution model.

**Location**:
- Spec output: `docs/development/specs/build-distribution/` (or equivalent under `docs/development/specs/`).

## Problem

- Without a written spec, follow-up questions (e.g. config file name, CLI entry points, server vs. client packaging) have no single source of truth. Implementation work (e.g. publishing to npm, standalone binary) would be ad hoc.
- A distribution spec gives the project a clear contract for “how we build and ship” and where to document open points.

## Desired Outcome

Create a **Distribution spec** under `docs/development/specs/` that:

1. **Package identity and CLI**
   - Package name: **`ascii-tag`**.
   - Runnable CLI (e.g. `npx ascii-tag`); config file is in the **same directory where the CLI is invoked** (cwd). Document the config file name, format, and what it configures (e.g. server URL, client options).

2. **Node and platform**
   - Minimum Node version: **Node.js 22**.
   - Note impact on build/packaging tooling if any.

3. **Distribution options**
   - Document: (a) run from source (clone + Node), (b) npm-installable CLI, (c) optional standalone executable (pkg, nexe, etc.) and (d) Docker. For each, state “who it’s for” (e.g. developers vs. players) and whether we support it.

4. **Server and remote play**
   - Clarify: server can run elsewhere (e.g. on the Internet); client connects via config. Optional: hosting at home with port forwarding or tunnel for friends. Reference WebSocket and connectivity (no change to existing behavior).

5. **Open points**
   - Section or list for follow-up questions that affect distribution behavior; can reference the parent feature card for discussion.

## Questions to Resolve Before Writing the Spec

Answering these will make the distribution spec concrete and implementable. Add answers below or in the parent card’s Follow-up questions, then move to “Open Questions & Answers” once decided.

### Config file (cwd-based)

1. **Config file name**  
   What is the exact file name the CLI looks for in the current working directory? (e.g. `.ascii-tag.json`, `ascii-tag.config.json`, `clientConfig.json`, or something else?) Consider discoverability and whether we want a dotfile.

2. **Config format**  
   JSON only (like current `clientConfig.json`), or do we allow other formats (e.g. `.js` for programmatic config, or YAML)? If multiple, what’s the precedence (e.g. look for `.ascii-tag.json` then `.ascii-tag.js`)?

3. **Config contents**  
   Which keys must or may the config contain? Today the client has `websocket.url`, `logging`, `rendering`, `prediction`, `statusBar`. Should the spec list these (and server URL as the critical one) and allow the rest to default? Any new keys for the CLI (e.g. “server” section for when the same package runs the server)?

4. **Missing config in cwd**  
   If the user runs `npx ascii-tag` and there is **no** config file in cwd, what should happen?  
   - (a) Use **defaults** (e.g. `ws://localhost:3000`) and run the client.  
   - (b) **Exit with an error** and print how to create a config (e.g. “Create ascii-tag.config.json in this directory”).  
   - (c) **Create a default config file** in cwd and then run (e.g. write `ascii-tag.config.json` with defaults, then start).  
   Which behavior do we want in the spec?

5. **Config path override**  
   Should the user be able to override the config location (e.g. `ascii-tag --config /path/to/config.json` or env var `ASCII_TAG_CONFIG`)? Or is “config in cwd only” sufficient for the first version?

### CLI entry points and commands

6. **What does `ascii-tag` run?**  
   Does the default command (e.g. `npx ascii-tag` with no args) run the **client** only? (Assumption: yes; confirm.)

7. **Starting the server from the same package**  
   Should the package expose a way to **start the server** from the CLI (e.g. `ascii-tag server` or `npx ascii-tag --server`) so that “host at home” users can run both client and server from one install? If yes, where does the **server** read its config and board path from—same cwd (e.g. `serverConfig.json` + `boards/` in cwd) or a different convention?

8. **Other subcommands or flags**  
   Do we want to specify in the spec: `--version`, `--help`, or any other subcommands (e.g. `ascii-tag init` to scaffold a config file)? Or keep the first spec to “run client (and optionally server)” only?

### Package contents and scope

9. **What’s in the npm package?**  
   Does the published package include **both** client and server code (so users can run client and optionally start server from the same package), or **client only** (server is “run from source” or separate)? This drives CLI surface and docs.

10. **Scoped vs unscoped package name**  
    Publish as **`ascii-tag`** (unscoped) or **`@your-org/ascii-tag`** (scoped)? Unscoped requires the name to be available on npm; scoped is under an org and avoids name squatting.

### Optional distribution options (how much to specify)

11. **Standalone executable**  
    For “consider standalone binary (pkg, nexe)”: should the spec only **mention** it as an optional future delivery format and “who it’s for,” or should it define expected behavior (e.g. “same as CLI; single binary runs client; server might be separate binary or same binary with a flag”)? Suggest: one short subsection “Optional: standalone executable” with audience and “behavior same as npm CLI” unless we decide otherwise.

12. **Docker**  
    Same question: spec only states “Docker image for developers; we don’t assume players use Docker,” or do we want image name, what’s in the image (server only? client+server?), and how to run? Suggest: high-level only in the first spec; details in a later card or README if needed.

### Server and remote play

13. **Server config when run via CLI**  
    If we support `ascii-tag server`, how does the server get its config and board path? Same cwd as the CLI (e.g. `serverConfig.json` and `boards/` relative to cwd), or a flag (e.g. `--config ./serverConfig.json`)? Today the server uses `config/serverConfig.js` and board path from argv/config; we need a clear rule for “run from arbitrary directory.”

---

Once these are answered, the spec can define: package name, CLI command(s), config file name/format/location and “missing config” behavior, what’s in the package, Node 22, and short notes on standalone binary and Docker. Open points that remain can go in the spec’s “Open points” section.

## Requirements

- Spec is written in the project’s usual spec style (see e.g. `docs/development/specs/center-board-in-terminal/`).
- All content is derived from or consistent with **FEATURE_build_distribution_and_terminal_compatibility** (Open Questions & Answers).
- Spec is the single source of truth for distribution and packaging; future gameplans and implementation cards reference it.

## Dependencies

- **FEATURE_build_distribution_and_terminal_compatibility**: Source of decisions. No implementation dependency.

## Documentation

- **SPECS**: To be created as the deliverable of this card: `docs/development/specs/build-distribution/build-distribution_SPECS.md` (or equivalent path).
- **GAMEPLAN**: Optional; created after spec if we implement distribution features.

## Related Cards

- **FEATURE_build_distribution_and_terminal_compatibility**: Parent card; “Where to go from here” option 1 (create spec).
- **FEATURE_publish_ascii_tag_to_npm**: Implementation card; will reference this spec once created.

## Tags

- `enhancement`
- `documentation`
- `spec`
- `distribution`
- `build`

# Feature Card: Publish ascii-tag to npm (CLI + Config in CWD)

## Status

- **Status**: IMPLEMENTATION COMPLETE (ready for manual verification and publish)
- **Priority**: LOW (distribution; post-MVP or when ready to share)
- **Created**: 2026-02-14

## Context

**Current State**:
- The game is run from source (clone repo, install deps, run client and optionally server via Node). There is no npm package or runnable CLI for end users.
- **FEATURE_build_distribution_and_terminal_compatibility** decided: publish to npm as a **runnable CLI** named **`ascii-tag`**, with a **configuration file in the same directory where the CLI is invoked** (cwd). Node 22 minimum.

**Location**:
- Project: `package.json` (name, bin, exports), client entry, config loading.
- Spec (when created): `docs/development/specs/build-distribution/`.

## Problem

- Players must clone the repo and run Node scripts; there is no one-command way to try the game (e.g. `npx ascii-tag`). Publishing as an npm package with a CLI and cwd-based config would make the game discoverable and easier to run for others.

## Desired Feature

1. **Package**
   - Publish package **`@dcvezzani/ascii-tag`** (scoped only) to npm. Package is runnable as a **CLI** (e.g. `npx @dcvezzani/ascii-tag` or `ascii-tag` when installed globally).

2. **Config in cwd**
   - The CLI reads a **configuration file from the current working directory** where the command is run. Spec (build-distribution) will define config file name and format (e.g. server URL, client options). If config is missing, behavior to be defined in spec (e.g. default to localhost, or show usage).

3. **Entry points**
   - Clear entry points for **client** (and optionally server, if we ship server in the same package). Spec will define exact `bin` and exports.

4. **Node 22**
   - Package supports **Node.js 22** as minimum; document in package.json engines and README.

## Requirements

- Implement only after (or in parallel with) **ENHANCEMENT_create_distribution_spec**; implementation must follow the distribution spec.
- Config file location: **cwd** (directory where CLI is invoked). Config format and required/optional keys per spec.
- Package name **`@dcvezzani/ascii-tag`** (scoped); publishable to npm.

## Dependencies

- **ENHANCEMENT_create_distribution_spec**: Spec defines config contract, bin, and entry points. This card implements that spec.
- **FEATURE_build_distribution_and_terminal_compatibility**: Source of decisions.

## Documentation

- **SPECS**: [Build and Distribution](docs/development/specs/build-distribution/build-distribution_SPECS.md) (parent); [Publish to npm](docs/development/specs/build-distribution/publish-to-npm_SPECS.md) (implementation spec for this card).
- **GAMEPLAN**: [publish-to-npm GAMEPLAN](docs/development/gameplans/publish-to-npm/publish-to-npm_GAMEPLAN.md).

## Related Cards

- **FEATURE_build_distribution_and_terminal_compatibility**: Parent card; “Where to go from here” option 3 (spin-off implementation).
- **ENHANCEMENT_create_distribution_spec**: Provides the spec this feature implements.

## Open Questions & Answers (Publish to npm)

Decisions recorded 2026-02-16; reflected in this card and in `docs/development/specs/build-distribution/`.

### Package identity and naming

1. **Package name:** Publish as scoped **`@dcvezzani/ascii-tag`** only (no unscoped `ascii-tag`). Install: `npx @dcvezzani/ascii-tag`.

### Publishing process and ownership

2. **Who publishes?** Manual `npm publish` by a maintainer for now.

3. **Versioning:** Semver. **Major** for breaking changes; **minor** for moderate architectural changes with backward compatibility; **patch** otherwise.

4. **Pre-publish checks:** All tests must pass before publish.

### Package contents and dependencies

5. **What ships in the tarball?** Ship a minimal set: runtime code, config defaults, and bundled boards. No tests, no documentation other than a single **README.md** with instructions on how to run the client and/or server and how to play. Use `package.json` "files" and document in spec.

6. **Dependencies:** Normal dependencies (no bundling). No optional or peer dependencies at this time.

### First-run and config UX

7. **When we auto-create `.ascii-tag/client.json` or `.ascii-tag/server.json`:** Print a one-line message (e.g. "Created default config at .ascii-tag/client.json") so the user knows where to edit. Same for server.

8. **Default `websocket.url` in generated client.json:** Use the same default port as the server config (e.g. `ws://localhost:<server-default-port>`). Document in spec.

9. **`ascii-tag init`:** Create only the missing file(s); never overwrite existing ones.

### Node version and compatibility

10. **Node 22 enforcement:** Enforce via `package.json` **engines** field and at **runtime** when the CLI starts. Document in README and show a clear error message if Node &lt; 22.

### Documentation and discoverability

11. **README for npm:** Include quick start (npx, init, run client/server), how to play, link to config docs, and Node 22 requirement.

12. **Exit codes:** Current exit codes are standard; no need to document in spec or README for now.

### Boards and server

13. **Board discovery:** Boards live in **`dist/boards/`** in the package. When running `ascii-tag server`, enumerate available boards by listing files in **`dist/boards/`** and also in **`{cwd}/boards`** (cwd = directory where CLI is invoked).

14. **Default board:** No single recommended default. When the user runs `ascii-tag server` and picks from the list, the **default selection is randomly chosen** from the available boards.

## Tags

- `feature`
- `distribution`
- `npm`
- `cli`
- `ascii-tag`

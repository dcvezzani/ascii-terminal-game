# Feature Card: Publish ascii-tag to npm (CLI + Config in CWD)

## Status

- **Status**: NOT STARTED
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
   - Publish package **`ascii-tag`** to npm. Package is runnable as a **CLI** (e.g. `npx ascii-tag` or `ascii-tag` when installed globally).

2. **Config in cwd**
   - The CLI reads a **configuration file from the current working directory** where the command is run. Spec (build-distribution) will define config file name and format (e.g. server URL, client options). If config is missing, behavior to be defined in spec (e.g. default to localhost, or show usage).

3. **Entry points**
   - Clear entry points for **client** (and optionally server, if we ship server in the same package). Spec will define exact `bin` and exports.

4. **Node 22**
   - Package supports **Node.js 22** as minimum; document in package.json engines and README.

## Requirements

- Implement only after (or in parallel with) **ENHANCEMENT_create_distribution_spec**; implementation must follow the distribution spec.
- Config file location: **cwd** (directory where CLI is invoked). Config format and required/optional keys per spec.
- Package name **ascii-tag**; publishable to npm (public or scoped per project choice).

## Dependencies

- **ENHANCEMENT_create_distribution_spec**: Spec defines config contract, bin, and entry points. This card implements that spec.
- **FEATURE_build_distribution_and_terminal_compatibility**: Source of decisions.

## Documentation

- **SPECS**: `docs/development/specs/build-distribution/` (created by distribution spec card).
- **GAMEPLAN**: To be created under `docs/development/gameplans/` when implementing.

## Related Cards

- **FEATURE_build_distribution_and_terminal_compatibility**: Parent card; “Where to go from here” option 3 (spin-off implementation).
- **ENHANCEMENT_create_distribution_spec**: Provides the spec this feature implements.

## Tags

- `feature`
- `distribution`
- `npm`
- `cli`
- `ascii-tag`

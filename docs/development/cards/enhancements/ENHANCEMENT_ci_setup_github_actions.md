# Enhancement Card: CI Setup (e.g. GitHub Actions)

## Status

- **Status**: NOT STARTED
- **Priority**: LOW (quality and regression safety; no current CI)
- **Created**: 2026-02-14

## Context

**Current State**:
- The project has **no CI** today. Tests are run manually (e.g. `npm run test:run` per developer agent). **FEATURE_build_distribution_and_terminal_compatibility** called out GitHub Actions as a good option; other options include GitLab CI, CircleCI, Travis CI.
- Goal: run tests (and optionally start the server or client in a minimal/headless terminal) in CI to catch regressions.

**Location**:
- Repo root: `.github/workflows/` (if GitHub Actions), or equivalent for other providers.
- `package.json`: test scripts (e.g. `test:run`).

## Problem

- Without CI, regressions can slip in until someone runs tests locally. A CI pipeline would run tests on push/PR and optionally validate that the server starts or the client runs in the CI environment.

## Desired Outcome

1. **Choose a CI provider**
   - Prefer **GitHub Actions** for public repos (free, YAML workflows, matrix builds for Node/OS). Alternatively GitLab CI, CircleCI, or Travis CI per project preference.

2. **Basic pipeline**
   - On push/PR (or main branch): install deps, run **unit tests** (e.g. `npm run test:run`) with a **minimum Node version** (Node 22 per distribution decisions). Optionally run on multiple Node versions (e.g. 22, 24) and/or OS (Linux, Windows, macOS) in a matrix.

3. **Optional: server or client run**
   - If feasible, add a job or step that **starts the server** (or runs the client in a headless/minimal terminal) to catch startup or runtime regressions. What the CI environment provides (e.g. headless TTY) may limit this; document findings.

4. **Documentation**
   - README or `docs/development/wiki/` section on “CI” or “Testing”: how to run tests locally, that CI runs on push/PR, and which provider/workflow to look at.

## Requirements

- CI runs in non-interactive mode (no prompts). Use existing `npm run test:run` or equivalent.
- Node 22 at minimum; matrix can add newer Node and other OS as needed.
- No requirement to run the full game interactively in CI; “server starts” or “client exits without crash” is sufficient if we add that step.

## Dependencies

- None. Can be done anytime. Project may already have test scripts; CI only invokes them.

## Documentation

- **Deliverable**: Working workflow under `.github/workflows/` (or other provider config) and a short doc or README note on CI.

## Related Cards

- **FEATURE_build_distribution_and_terminal_compatibility**: Parent card; “Where to go from here” option 3 (spin-off). CI was listed as a follow-up; Node 22 minimum is from that card.

## Tags

- `enhancement`
- `ci`
- `github-actions`
- `testing`

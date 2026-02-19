# Feature Card: Build, Distribution, and Terminal Compatibility

## Context

**Current State**:
- The game is a **terminal-based** Node.js application. Players run it via `node` (e.g. `node src/client.js`) or an npm script; there is no packaged binary or installer.
- Rendering relies on **ANSI escape codes** (cursor positioning, colors, clear screen) via `ansi-escapes`, `chalk`, and `cli-cursor`. Input uses Node.js `readline` (raw mode, key events).
- The server is a separate Node process; distribution today is “clone repo, install deps, run server and client” with no formal build or packaging step.
- Terminal behavior is **not** explicitly tested across different terminal emulators or environments. The app assumes a reasonably capable terminal (ANSI support, raw mode, sufficient dimensions).

**Location**:
- Client: `src/render/Renderer.js`, `src/utils/terminal.js`, input handling in client/modes
- Server: `src/server/`, run via Node
- Project: `package.json` scripts, no distribution artifacts

## Problem

- **Distribution**: As a terminal app, “building” and “distributing” may not look like a typical desktop or web app. We need to decide what “shipping” means: npm package, standalone executable, Docker image, or simply “run from source.” Each approach has tradeoffs (discoverability, ease of install, Node version requirements).
- **Terminal diversity**: Not all terminals behave the same. Differences can include:
  - **ANSI support**: Level of escape-sequence support (colors, cursor movement, clear line/screen); some minimal or legacy environments may not support full ANSI.
  - **Dimensions**: Minimum size, resize behavior, and how we detect or enforce board size (e.g. fixed 20×20 vs. dynamic) can vary.
  - **Input**: Raw mode, key encoding (arrow keys, special keys), and buffering may differ (e.g. Windows CMD vs. PowerShell vs. WSL vs. macOS Terminal vs. iTerm2 vs. VS Code integrated terminal).
  - **Color**: True color vs. 256 vs. 16 colors vs. no color; our use of `chalk` may not degrade gracefully everywhere.
- Without a clear compatibility strategy, we risk the game working well in one environment and failing or looking broken in others. We need a shared understanding and, where useful, documentation or code to detect and adapt (or fail clearly).

## Desired Outcome

1. **Clarity on build and distribution**  
   Decide what “build” and “distribute” mean for this terminal game (e.g. no build, npm publish, pkg/nexe-style executable, Docker, etc.) and document the chosen approach and rationale.

2. **Terminal compatibility strategy**  
   Identify which terminal environments we care about (e.g. “Node LTS on macOS/Linux/Windows, in common terminal emulators”) and how we will handle or document compatibility (feature detection, fallbacks, minimum requirements, or a compatibility matrix).

3. **Actionable guidance**  
   Produce enough documentation and/or code (e.g. runtime checks, env docs, or a small compatibility section in the README) so that future work (e.g. packaging, CI, or UX improvements) can align with these decisions.

This card is **exploratory and planning-focused**: the goal is to answer questions and capture decisions rather than to implement a specific packaging or compatibility feature in one go.

## Requirements

### Functional (Discovery & Documentation)

1. **Build and distribution options**  
   Document at least: (a) “run from source” (current), (b) npm-installable package (if applicable), (c) standalone executable (e.g. pkg, nexe), (d) Docker. For each, note pros/cons and whether we will support it for this project.

2. **Terminal compatibility scope**  
   Document which platforms and terminals we target (e.g. macOS Terminal, iTerm2, Windows Terminal, WSL, VS Code terminal, etc.) and what we consider “supported” vs. “best effort” vs. “unsupported.”

3. **Known differences and mitigations**  
   Capture known terminal differences (ANSI level, colors, input, dimensions) and any mitigations: runtime detection, fallbacks (e.g. no color), minimum terminal size checks, or clear error messages when the environment is insufficient.

### Non-Functional

- Decisions and rationale should be written down (e.g. in this card, a spec, or the wiki) so the team can refer to them later.
- Any runtime checks we add should be minimal and avoid breaking existing supported environments.

## Open Questions & Answers

### Build & Distribution

1. **What does “distribution” mean for this project?**  
   **Answer:** It would be interesting to allow others to play without cloning the repo; that may not constitute MVP. We want to know viable options—something akin to running an app inside Electron so it may appear to run natively. Most likely, distribution will mean someone clones the repo, updates their client config, and starts the game client using Node.js.

2. **Should the game be published to npm?**  
   **Answer:** Yes. Publish as a **runnable CLI** named **`ascii-tag`**. The CLI should be runnable via `npx ascii-tag` (or similar) and use a **configuration file in the same directory where the CLI is invoked**.

3. **Standalone executables (pkg, nexe, etc.)?**  
   **Answer:** We would like to consider this as well. If the server is running somewhere else on the Internet, the user wouldn’t need to start the server. It would also be nice to allow players to host a server and have friends connect if possible.  
   **Socket note:** The application uses **WebSockets** (TCP). It *is* possible for someone to run the server on their machine and allow others outside their LAN to connect: the server listens on a port (e.g. via `ws`), and remote clients can connect if (a) the server is bound to `0.0.0.0` or the host’s IP, and (b) the host exposes that port (router port forwarding, or a tunnel such as ngrok). So “host at home, friends connect over the Internet” is viable with port forwarding or a tunnel.

4. **Docker or other containerization?**  
   **Answer:** Docker is valuable, especially for those who want to develop. For users not interested in development, requiring Docker containers would not be ideal; we should not assume players will run Docker.

5. **Node version policy?**  
   **Answer:** **Node.js 22** is the minimum supported version for official distribution.

### Terminal Compatibility

6. **Which terminals must work, and which are best-effort?**  
   **Answer:** Maintain a short **“supported”** list (e.g. macOS Terminal, iTerm2, Windows Terminal, WSL default terminal) and document others as **“may work.”**

7. **How do we handle missing or partial ANSI support?**  
   **Answer:** **Require a minimum** and **show a clear error** if not met (no silent degradation).

8. **Windows: CMD vs. PowerShell vs. Windows Terminal vs. WSL?**  
   **Answer:** Pending testing. Document: what is the likelihood of a Windows terminal supporting this game? We need to test and then document which Windows environments are supported vs. best-effort.

9. **Minimum terminal dimensions?**  
   **Answer:** Dimensions required for the game board are **determined by the board configuration file** (not a fixed 22×22). On **resize mid-game**, perform a **full redraw**, clearing everything first.

10. **Color fallbacks?**  
    **Answer:** For terminals **without color support**, **running in plain mode is fine** (e.g. no chalk, ASCII only).

11. **Input quirks?**  
    **Answer:** This could be an issue but might not be a big risk. **Recommendation:** Document arrow keys and special keys (ESC, etc.) in the README under an “Input / compatibility” note. Test on the supported terminal list. If we see consistent key-code differences (e.g. Windows sending different sequences), add a small key-code normalization layer; otherwise, the README note plus the compatibility matrix is sufficient.

12. **CI and automated testing?**  
    **Answer:** We don’t have CI right now. **Good CI options:** **GitHub Actions** (free for public repos, easy YAML workflows, matrix builds for Node/OS), **GitLab CI**, **CircleCI**, or **Travis CI**. GitHub Actions is a strong default: run unit tests and optionally start the server in a headless/minimal terminal to catch regressions; the runner provides a POSIX environment (Linux) or Windows, so we can test both.

### Scope & Priority

13. **Is “terminal compatibility” a one-time audit or ongoing?**  
    **Answer:** **Maintain a compatibility matrix** in a README (or dedicated doc) in this project, and update it when we learn something new.

14. **What comes first?**  
    **Answer:** **Continue working on both** (distribution strategy and compatibility) **in parallel** while creating specs—tackle both at a high level (docs + decisions) in parallel.

## Follow-up Questions

*(Park follow-up questions here as they come up; answer in discussion and move to Open Questions & Answers or into a spec when decided.)*

- *(none yet)*

## Where to Go from Here

**Process (per project structure):** Card → **Spec(s)** → **Gameplan(s)** → Implementation. This card is planning/discussion; when you’re ready to act, turn decisions into specs, then gameplans.

**Concrete options:**

1. **Create a spec (or two)**  
   - **Distribution spec:** npm package `ascii-tag`, CLI + config-file contract, Node 22 minimum, optional standalone binary and Docker (with “who it’s for”).  
   - **Terminal compatibility spec:** supported vs. “may work” list, minimum ANSI behavior, resize = full redraw, plain mode when no color, compatibility matrix in README.  
   Use `docs/development/specs/` (e.g. `build-distribution/` and/or `terminal-compatibility/`). Follow-up questions that affect behavior go into the spec’s “Open points” or back into this card.

2. **Stub the compatibility matrix now**  
   Add a short “Terminal compatibility” section to the main README (or `docs/development/wiki/terminal-compatibility.md`) with a table: Terminal | Platform | Status (supported / may work / untested). Fill in as you test. Keeps the “maintain a matrix” decision actionable without blocking other work.

3. **Spin off smaller cards when you’re ready to implement**  
   - e.g. “Publish `ascii-tag` to npm (CLI + config in cwd)”  
   - “Windows terminal testing and compatibility matrix update”  
   - “CI setup (e.g. GitHub Actions) for tests and optional server run”  
   Those cards can reference this card and the spec(s).

4. **Keep using this card for follow-up Q&A**  
   Add new questions under **Follow-up questions** above; when you answer them, either add an **Answer** under that section or fold into Open Questions & Answers / into the spec. Prevents loose threads.

**Recommendation:** Stub the compatibility matrix (2) soon so it’s a living doc. In parallel, when you have bandwidth, write the distribution and terminal-compatibility specs (1) so follow-up questions have a clear home and implementation has a single source of truth.

## Follow-up Cards

Cards created from the options above (track work and link back here):

| Option | Card | Purpose |
|--------|------|--------|
| 1 – Create spec(s) | **ENHANCEMENT_create_distribution_spec** | Write distribution spec (ascii-tag, CLI, config in cwd, Node 22, Docker/standalone). |
| 1 – Create spec(s) | **ENHANCEMENT_create_terminal_compatibility_spec** | Write terminal compatibility spec (supported/may work, ANSI, resize, color, matrix). |
| 2 – Stub matrix | **ENHANCEMENT_stub_terminal_compatibility_matrix** | Add “Terminal compatibility” section + table to README or wiki. |
| 3 – Implement | **FEATURE_publish_ascii_tag_to_npm** | Publish `ascii-tag` to npm (CLI + config in cwd); depends on distribution spec. |
| 3 – Implement | **ENHANCEMENT_windows_terminal_testing_and_compatibility_matrix** | Test on Windows terminals; update compatibility matrix. |
| 3 – Implement | **ENHANCEMENT_ci_setup_github_actions** | Set up CI (e.g. GitHub Actions) for tests and optional server run. |

## Related Features

- **Follow-up cards** (see table above): ENHANCEMENT_create_distribution_spec, ENHANCEMENT_create_terminal_compatibility_spec, ENHANCEMENT_stub_terminal_compatibility_matrix, FEATURE_publish_ascii_tag_to_npm, ENHANCEMENT_windows_terminal_testing_and_compatibility_matrix, ENHANCEMENT_ci_setup_github_actions.
- **X_FEATURE_mvp_multiplayer_game**: Client and server architecture; distribution may affect how players obtain and run both.
- **FEATURE_status_bar_two_lines_wrap**: Status bar already adapts to board width; terminal size and dimensions are related.
- **Rendering and input**: Any compatibility work may touch `Renderer.js`, `terminal.js`, and input handling.

## Dependencies

- None for the planning phase. Implementation of any chosen strategy may depend on tooling (e.g. pkg, npm publish config, Dockerfile) and possibly small runtime checks in the client.

## Status

- **Status**: NOT STARTED (planning / discussion)
- **Priority**: LOW (foundational; enables confident distribution and compatibility decisions later)
- **Created**: 2026-02-14

## Documentation

- **SPECS**: To be created under `docs/development/specs/` if we turn decisions into concrete specs (e.g. “Terminal compatibility spec” or “Distribution spec”).
- **README**: Maintain a **compatibility matrix** (supported vs. “may work” terminals, and input/compatibility notes) in this project’s README; update as we learn more.

## Tags

- `feature`
- `distribution`
- `build`
- `terminal`
- `compatibility`
- `planning`

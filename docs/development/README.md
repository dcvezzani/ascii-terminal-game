# Development Documentation Map

**Single source of truth** for the @dcvezzani/ascii-tag terminal game (this repo: first-game).

| Purpose | Single source |
|--------|----------------|
| **Product overview / how to run** | [README.md](../../README.md) (repo root) |
| **Developer context and stack** | [.cursor/agents/developer.md](../../.cursor/agents/developer.md) |
| **Process** (cards, specs, gameplans, TDD, commits) | [.cursor/STANDARDS_AND_PROCESSES/development.md](../../.cursor/STANDARDS_AND_PROCESSES/development.md) |
| **Scripts** | [SCRIPTS.md](../../SCRIPTS.md) and [package.json](../../package.json). Use **`npm test`** in main-repo docs for running tests. |

---

## Key documents

- **developer.md** — Tech stack, controls, project structure, related docs.
- **development.md** — Card-based workflow, specs, gameplans, testing, git commits.
- **SPEC_Overall** — Terminal game spec overview: [docs/development/specs/terminal-game/SPEC_Overall.md](specs/terminal-game/SPEC_Overall.md).
- **DIAGRAMS.md** — [DIAGRAMS.md](DIAGRAMS.md): where Mermaid (`.mmd`) diagram sources live and what each one describes; use `npm run diagrams:generate` to produce SVGs.

## Key specs

- **Terminal game** — [docs/development/specs/terminal-game/](specs/terminal-game/) (overview, canvas, renderer, board, status bar, server, etc.).
- **Client (architecture and patterns)** — [docs/development/specs/terminal-game/client/SPEC_Client.md](specs/terminal-game/client/SPEC_Client.md).
- **Server spec** — [docs/development/specs/terminal-game/server/SPEC_Server.md](specs/terminal-game/server/SPEC_Server.md) (diagram sources in [terminal-game/server/](specs/terminal-game/server/)).
- **Build / distribution** — [docs/development/specs/terminal-game/distribution/](specs/terminal-game/distribution/) (SPEC_Distribution.md, build-distribution_SPECS.md, publish-to-npm_SPECS.md).

Client (including client-side prediction) is in [terminal-game](specs/terminal-game/) (see [SPEC_Overall](specs/terminal-game/SPEC_Overall.md)). Other feature-specific specs live under `docs/development/specs/` (e.g. spawn behavior in Server spec). Board loading (RLE, dimensions) is in terminal-game [board-parsing](specs/terminal-game/board-parsing/SPEC_Board_Parsing.md).

## Cards and gameplans

- **Cards**: [docs/development/cards/](cards/) (features, enhancements, bugs). Completed cards use `X_` prefix on the filename.
- **Gameplans**: [docs/development/gameplans/](gameplans/). Completed gameplans use `X_` prefix on the directory name.

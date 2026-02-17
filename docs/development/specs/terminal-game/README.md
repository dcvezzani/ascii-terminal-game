# Terminal Game — Consolidated Specs

This folder contains **consolidated specifications** for the terminal game, split by concern. Use them together with the [Overall spec](SPEC_Overall.md).

## Specs

| Spec | Path | Purpose |
|------|------|---------|
| **Overall** | [SPEC_Overall.md](SPEC_Overall.md) | Associates all specs; high-level flow |
| **Canvas** | [canvas/SPEC_Canvas.md](canvas/SPEC_Canvas.md) | Terminal viewport, layout, resize, "too small" |
| **Renderer** | [renderer/SPEC_Renderer.md](renderer/SPEC_Renderer.md) | Drawing: clear-then-draw, full/incremental |
| **Game Title** | [game-title/SPEC_Game_Title.md](game-title/SPEC_Game_Title.md) | Title line (60 chars, truncation) |
| **Game Board** | [game-board/SPEC_Game_Board.md](game-board/SPEC_Game_Board.md) | Board display position and cells |
| **Status Bar** | [status-bar/SPEC_Status_Bar.md](status-bar/SPEC_Status_Bar.md) | Score, position, instructions; wrap and clean display |
| **Board Parsing** | [board-parsing/SPEC_Board_Parsing.md](board-parsing/SPEC_Board_Parsing.md) | Load board from JSON (RLE + dimensions) |
| **User Inputs** | [user-inputs/SPEC_User_Inputs.md](user-inputs/SPEC_User_Inputs.md) | TTY/readline, key parsing, quit |

## Diagrams

Mermaid (`.mmd`) sources and generated SVGs are in [diagrams/](diagrams/):

- **spec-relationships.mmd** / **spec-relationships.svg** — How the specs relate.
- **rendering-pipeline.mmd** / **rendering-pipeline.svg** — Flow from layout to screen.

Generate SVGs:

```bash
npm run diagrams:terminal-game
```

Or generate all project diagrams:

```bash
npm run diagrams:generate
```

## Source specs (consolidated from)

- `terminal-rendering/terminal-rendering_SPECS.md`
- `center-board-in-terminal/center-board-in-terminal_SPECS.md`
- `status-bar-two-lines-wrap/status-bar-two-lines-wrap_SPECS.md`
- `load-board-from-json/load-board-from-json_SPECS.md`
- `reduce-screen-flicker/reduce-screen-flicker_SPECS.md`
- Client architecture (input and rendering patterns)

The original spec files under `docs/development/specs/` remain; this folder is the **consolidated** view for Renderer, Canvas, Game Title, Game Board, Status Bar, Board Parsing, User Inputs, and the Overall association.

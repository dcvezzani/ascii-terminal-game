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
| **Client** | [client/SPEC_Client.md](client/SPEC_Client.md) | Client application concepts, workflows, and client-side prediction |
| **Bullets** | [bullets/SPEC_Bullets.md](bullets/SPEC_Bullets.md) | Projectile system, firing, collision, scoring, respawn |

## Diagrams

Full list of diagram sources (`.mmd`) and purposes: **[DIAGRAMS.md](DIAGRAMS.md)** — covers overall ([spec-relationships.mmd](spec-relationships.mmd)), [renderer/](renderer/) (rendering-pipeline), [server/](server/), and [client/](client/).

Generate SVGs from the repo root:

```bash
npm run diagrams:generate
```

## Source specs (consolidated from)

- `terminal-rendering/terminal-rendering_SPECS.md`
- center-board-in-terminal (merged into [Canvas](canvas/SPEC_Canvas.md))
- status-bar-two-lines-wrap (consolidated into [status-bar](status-bar/SPEC_Status_Bar.md))
- load-board-from-json (consolidated into board-parsing)
- reduce-screen-flicker (merged into [Renderer](renderer/SPEC_Renderer.md))
- MVP multiplayer (protocol, CONNECT/MOVE/STATE_UPDATE, server/client roles — see [SPEC_Overall](SPEC_Overall.md), [Server](server/SPEC_Server.md), [Client](client/SPEC_Client.md))
- Client architecture (input and rendering patterns)
- Client-side-prediction (merged into [Client](client/SPEC_Client.md))

The original spec files under `docs/development/specs/` remain; this folder is the **consolidated** view for Renderer, Canvas, Game Title, Game Board, Status Bar, Board Parsing, User Inputs, Client, and the Overall association.

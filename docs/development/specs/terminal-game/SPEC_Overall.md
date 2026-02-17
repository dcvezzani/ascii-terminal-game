# Spec: Terminal Game — Overall

## Purpose

This document **associates all terminal-game specs** into one coherent stack. It does not replace the individual specs; it shows how they fit together and in what order layout, input, and rendering interact.

**Use this** when you need the big picture or when implementing startup, resize, or the main loop.

---

## 1. Spec list and roles

| Spec | Role |
|------|------|
| [Canvas](canvas/SPEC_Canvas.md) | Organizes and prepares title, board, and status bar; viewport, layout, size check, resize debounce, “too small.” Produces the prepared Canvas for the Renderer. |
| [Renderer](renderer/SPEC_Renderer.md) | Renders the Canvas to the terminal (clear-then-draw or incremental). Does not compute layout or compose content—only outputs what the Canvas provides. |
| [Game Title](game-title/SPEC_Game_Title.md) | Title line content, 60-char width, truncation. |
| [Game Board](game-board/SPEC_Game_Board.md) | Board display: position, dimensions, cell characters, layering with players. |
| [Status Bar](status-bar/SPEC_Status_Bar.md) | Status bar content, format (full/simplified), wrap, clean display. |
| [Board Parsing](board-parsing/SPEC_Board_Parsing.md) | Loading board from JSON (RLE + dimensions); server-only; feeds board data. |
| [User Inputs](user-inputs/SPEC_User_Inputs.md) | TTY/readline, key/line parsing, error handling, quit; application-defined bindings. |

---

## 2. How they connect

- **Canvas** determines how title, board, and status bar are **organized and prepared** before rendering. It uses terminal size and content dimensions to compute layout, composes the content (title, board, status bar) into a prepared Canvas, and drives **when** to clear or re-render (startup, resize debounce). It does not draw to the terminal.
- **Renderer** renders the **Canvas** to the terminal—regardless of what is in the Canvas. It performs clear-then-draw or incremental updates using whatever the Canvas provides. It does not compute layout, terminal size, or compose title/board/status bar.
- **Game Title**, **Game Board**, and **Status Bar** define content and dimensions that the **Canvas** uses to organize and prepare the Canvas; the Renderer only outputs the prepared result.
- **Board Parsing** produces the board grid and dimensions used by the server and sent to clients; Game Board (and thus Canvas composition) consumes that data.
- **User Inputs** provide key/line events; the **application** maps them to actions (e.g. move, quit) and triggers state updates and re-renders. Canvas clears timers on quit.

See the diagram: [spec-relationships.mmd](diagrams/spec-relationships.mmd) → [spec-relationships.svg](diagrams/spec-relationships.svg) (generate SVG with `npm run diagrams:terminal-game`).

---

## 3. High-level flow

1. **Start:** Parse CLI (e.g. `--resize-debounce=N`). Resolve resize debounce. Initialize application state (e.g. load level, connect to server, set up game).
2. **Startup clear:** Canvas: get terminal rows; write that many newlines; wait for drain if needed.
3. **Setup:** Attach resize handler (clear screen + debounced render). Attach input (TTY raw + readline). Error handlers on stdin and readline.
4. **First render:** Canvas: size check → “terminal too small” or compose prepared Canvas (title, board, status bar). Renderer: render the Canvas to the terminal (clear-then-draw). Store content region.
5. **Run:** On input → application handles action (update state, re-render if needed). On resize → clear screen, debounced render (Canvas prepares, Renderer draws). On quit → restore TTY, exit.

---

## 4. Diagrams

- **[spec-relationships.mmd](diagrams/spec-relationships.mmd)** — Graph of spec concepts and their relationships.
- **[rendering-pipeline.mmd](diagrams/rendering-pipeline.mmd)** — Flow from Canvas (layout) to Renderer to screen.

Generate SVGs:

```bash
npm run diagrams:terminal-game
```

---

## 5. Related documents

- **Original specs (consolidated from):**
  - `docs/development/specs/terminal-rendering/terminal-rendering_SPECS.md`
  - `docs/development/specs/center-board-in-terminal/center-board-in-terminal_SPECS.md`
  - `docs/development/specs/status-bar-two-lines-wrap/status-bar-two-lines-wrap_SPECS.md`
  - `docs/development/specs/load-board-from-json/load-board-from-json_SPECS.md`
  - `docs/development/specs/reduce-screen-flicker/reduce-screen-flicker_SPECS.md`
- **Developer agent:** `.cursor/agents/developer.md`
- **Client/Server architecture:** `docs/development/specs/client-architecture_SPECS/`, `docs/development/specs/server-architecture_SPECS/`

# Terminal game — diagram locations and purpose

Diagram sources (`.mmd`) and their purposes for the terminal game. Generate SVGs from the **repo root** with:

```bash
npm run diagrams:generate
```

To generate only terminal-game diagrams:

```bash
node scripts/generate-diagrams.js docs/development/specs/terminal-game
```

Output: each `.mmd` produces a matching `.svg` in the same directory (white background).

---

## Overall (terminal-game root)

Spec: [SPEC_Overall.md](SPEC_Overall.md). Diagram sources and generated SVGs are in this directory.

| File | Purpose |
|------|--------|
| `spec-relationships.mmd` | How the consolidated terminal-game specs relate (SPEC_Overall, Canvas, Renderer, Game Title, Game Board, Status Bar, Board Parsing, User Inputs, Client, Server). |

---

## Renderer — `renderer/`

Spec: [SPEC_Renderer.md](renderer/SPEC_Renderer.md). Diagram sources and generated SVGs are in this directory.

| File | Purpose |
|------|--------|
| `rendering-pipeline.mmd` | Flow from terminal size and content to screen output: inputs (terminal size, board dimensions, title/status height), layout (fits check, start row/column), renderer steps (clear, draw title/board/status, store region). |

---

## Server architecture — `server/`

Server spec: [SPEC_Server.md](server/SPEC_Server.md). Diagram sources (`.mmd`) and generated SVGs are in this directory.

| File | Purpose |
|------|--------|
| `server-architecture_components.mmd` | Component structure: entry point, Server, ConnectionManager, GameServer, Game, Board, and related modules and responsibilities. |
| `server-architecture_interactions_1-initialization.mmd` | Server initialization sequence. |
| `server-architecture_interactions_2-connection.mmd` | Client connection flow. |
| `server-architecture_interactions_3-movement.mmd` | Player movement validation and execution. |
| `server-architecture_interactions_4-broadcast.mmd` | Periodic state broadcast flow. |
| `server-architecture_interactions_5-disconnect.mmd` | Client disconnection and cleanup. |
| `server-architecture_data-structures.mmd` | Data structures and internal organization (class/structure diagram). |

---

## Client architecture — `client/`

Client spec: [SPEC_Client.md](client/SPEC_Client.md). Diagram sources (`.mmd`) and generated SVGs are in this directory. See also [client/client-diagrams.md](client/client-diagrams.md) for a colocated index.

| File | Purpose |
|------|--------|
| `client-architecture_components.mmd` | Client component structure: entry point, NetworkedMode, WebSocketClient, MessageHandler, MessageTypes, Renderer, InputHandler, Game, etc. |
| `client-architecture_interactions_1-initialization.mmd` | Client initialization and component setup. |
| `client-architecture_interactions_2-connection.mmd` | WebSocket connection and initial state flow. |
| `client-architecture_interactions_3-movement-prediction.mmd` | Movement input with client-side prediction. |
| `client-architecture_interactions_4-state-update.mmd` | State update and reconciliation flow. |
| `client-architecture_interactions_5-rendering.mmd` | Rendering flow (full vs incremental decision). |
| `client-architecture_data-structures.mmd` | State management and data structures (class/structure diagram). |

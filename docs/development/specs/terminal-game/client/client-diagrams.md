# Client architecture — diagram index

This folder contains the **client architecture diagrams** and the **Client spec**. The canonical long-form architecture document (technologies, patterns, incremental rendering, state sync) is elsewhere.

## Source of truth

- **Spec:** [SPEC_Client.md](SPEC_Client.md) — client concepts, workflows, client-side prediction, and references to Renderer/Canvas/Board/Status Bar.
- **Long-form architecture and patterns** are in [SPEC_Client.md](SPEC_Client.md).

## Diagram sources (.mmd)

Diagrams are aligned with the code and terminal-game specs. **Canvas** composes the display (title, board, status bar, incremental cell updates); **Renderer** only renders the prepared canvas grid to the terminal.

| Diagram | File | Description |
|--------|------|-------------|
| Components | [client-architecture_components.mmd](client-architecture_components.mmd) | Component structure: Canvas, Renderer, Layout, StateComparison, etc. |
| Data structures | [client-architecture_data-structures.mmd](client-architecture_data-structures.mmd) | Classes and data: GameState, Canvas, Renderer, Changes (oldPos/newPos), etc. |
| Initialization | [client-architecture_interactions_1-initialization.mmd](client-architecture_interactions_1-initialization.mmd) | Client startup: config, Logger, WebSocketClient, Canvas, Renderer, InputHandler. |
| Connection | [client-architecture_interactions_2-connection.mmd](client-architecture_interactions_2-connection.mmd) | WebSocket connect and first render: Canvas builds grid → Renderer.render(canvas). |
| Movement prediction | [client-architecture_interactions_3-movement-prediction.mmd](client-architecture_interactions_3-movement-prediction.mmd) | Input → Canvas.restoreCellContent/updateCell → Renderer.render(canvas). |
| State update | [client-architecture_interactions_4-state-update.mmd](client-architecture_interactions_4-state-update.mmd) | STATE_UPDATE → Canvas (full or incremental) → Renderer.render(canvas). |
| Rendering | [client-architecture_interactions_5-rendering.mmd](client-architecture_interactions_5-rendering.mmd) | Full vs incremental: Canvas composes grid; Renderer has renderFull(canvas), renderIncremental(canvas), render(canvas). |

Rendered SVGs (when generated) live in this folder (`terminal-game/client/`).

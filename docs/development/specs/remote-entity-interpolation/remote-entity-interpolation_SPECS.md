# Specification: Remote Entity Interpolation

## Overview

This specification describes the implementation of **remote entity interpolation** for the multiplayer terminal game. The local player already benefits from client-side prediction and reconciliation; other (remote) players, however, were only updated when the server sent a `STATE_UPDATE` (every 250ms), causing them to appear to jump between positions.

This feature smooths the movement of remote players by maintaining a per-entity position buffer and a periodic interpolation tick that interpolates (lerps) between the two most recent server snapshots. When the buffer runs dry (e.g. packet loss), the client holds at the last known position (no extrapolation). Optional display easing limits how far the drawn position can move per tick to reduce visible snaps.

**Purpose**: Provide smooth, visually continuous motion for other players between server true-ups, improving the multiplayer experience without changing the server as the single source of truth.

## Diagrams

- **Lerping**: [Source](remote-entity-interpolation_lerping.mmd) · [SVG](remote-entity-interpolation_lerping.svg) – What lerp is, how `renderTime` sits between two buffer snapshots, and the lerp formula for smooth motion.
- **Why velocity matters**: [Source](remote-entity-interpolation_velocity.mmd) · [SVG](remote-entity-interpolation_velocity.svg) – When velocity is used (extrapolation only); server vs client-derived velocity.
- **When a client lags**: [Source](remote-entity-interpolation_client-lag.mmd) · [SVG](remote-entity-interpolation_client-lag.svg) – Buffer runs dry, extrapolation vs hold, jitter buffer, clamp.

## Problem Statement

**Previous Behavior**:
- Server broadcasts full game state every 250ms.
- Client renders other players at the positions received in the latest `STATE_UPDATE`.
- Remote players only move when a new state update arrives, so they appear to jump every ~250ms.

**Impact**:
- Choppy, discontinuous motion for other players.
- Poor perceived quality compared to the smooth local player movement (client-side prediction).

## Solution

Implement **entity interpolation** for remote players:

1. **Buffer positions**: On each `STATE_UPDATE`, push each remote player's position (with message timestamp) into a per-entity buffer. Cap buffer size (e.g. 20).
2. **Interpolation delay**: Use a fixed delay (e.g. 150ms) so `renderTime = Date.now() - delay`. This ensures we typically have at least two snapshots to interpolate between.
3. **Interpolation tick**: Run a periodic tick (e.g. every 50ms) that computes interpolated positions for each remote entity (lerp between the two snapshots surrounding `renderTime`), then redraws only the remote player cells that changed.
4. **Buffer run dry (fallback)**: When `renderTime` is past the last snapshot (e.g. packet loss), hold at the last known position: return `{ x: latest.x, y: latest.y, playerName: latest.playerName }`. No extrapolation is performed.
5. **Bounds and walls**: The interpolated position (lerp result) is clamped: the rounded (x, y) cell must be within board bounds and not a wall; otherwise return the latest snapshot (e.g. via `clampToBoard`-style logic).
6. **Joins and leaves**: When a remote player leaves, clear their last-drawn cell, remove their buffer and interpolated state.

## Requirements

### Buffer Shape and Cap

- **Buffer entry**: `{ t: number, x: number, y: number, playerName?: string, vx?: number, vy?: number }`. `t` is the message timestamp (ms). `vx`, `vy` are optional (cells per second) when the server includes them.
- **Cap**: Keep the last N entries per entity (e.g. 20). Drop oldest when over cap.

### Interpolation Delay and Tick Interval

- **INTERPOLATION_DELAY_MS**: 150ms (jitter buffer: ~3× server interval). `renderTime = Date.now() - INTERPOLATION_DELAY_MS`.
- **INTERPOLATION_TICK_MS**: e.g. 50ms. The tick runs at this interval when the client has state and localPlayerId.

### Message Timestamp

- Use `message.timestamp` from the parsed `STATE_UPDATE` when pushing to buffers so interpolation is based on server time and is less sensitive to client receive jitter.

### Lerp Formula

- Find the two buffer entries such that `buffer[i].t <= renderTime <= buffer[i+1].t`.
- `alpha = (renderTime - tA) / (tB - tA)`; `x = xA + (xB - xA) * alpha`; same for `y`.
- If buffer has 0 or 1 entry, use the latest known position (no lerp).

### Buffer Run Dry (Hold at Latest)

- When `renderTime > latest.t`: **hold** at the last known position. Return `{ x: latest.x, y: latest.y, playerName: latest.playerName }`. No extrapolation is performed in the current implementation, which avoids "run ahead then snap back" jitter.
- *Phase 2 (optional)*: Velocity-based extrapolation could be reintroduced later (server `vx`/`vy` or client-derived from last two buffer entries), with a clamped duration; for now the client holds.

### Bounds and Wall Clamping

- After computing the interpolated (or latest) position, validate the **rounded** cell (rx, ry) against the board: if `board.width` and `board.height` are present, ensure `0 <= rx < width` and `0 <= ry < height`; and ensure `board.getCell(rx, ry) !== '#'` (not a wall). If the cell is out of bounds or a wall, return the latest snapshot position instead of the computed position so the entity is never drawn outside the board or inside a wall. This is typically implemented in a `clampToBoard(pos, latestSnapshot)` helper.

### Display Easing (Optional)

- **Concept**: The **target** position each tick is the rounded interpolated position (`Math.round(interp.x)`, `Math.round(interp.y)`). When display easing is enabled, the **drawn** position moves at most 1 cell per axis per tick toward that target, so multi-cell jumps are spread over several frames and 2-cell snaps are reduced.
- **State**: `lastDrawnInterpolatedPositions` stores the last **display** position (eased or target). When easing is on: `displayX = last.x + clamp(targetX - last.x, -1, 1)` (and similarly for Y); when easing is off, display equals target.
- **Config**: Client `rendering.remoteDisplayEasing` (boolean). Default `true` (easing on). When `false`, the client draws at the target each tick (pre–easing behavior).

### Join and Leave Handling

- **Join**: First `STATE_UPDATE` that includes a new remote player pushes to their buffer; no special "last drawn" needed for the first tick (tick draws at interpolated/latest position).
- **Leave**: When a remote player is no longer in `currentState.players`, clear their last-drawn cell via `restoreCellContent`, then remove their buffer and entries from `remoteEntityInterpolated` and `lastDrawnInterpolatedPositions`.

## Client Implementation

**Location**: `src/modes/networkedMode.js`

**State variables**:
- `remoteEntityBuffers`: Map from playerId to array of buffer snapshots.
- `remoteEntityInterpolated`: Map from playerId to `{ x, y, playerName }` (current interpolated or latest position).
- `lastDrawnInterpolatedPositions`: Map from playerId to `{ x, y }` (last **display** position drawn; eased or target).
- `interpolationTickTimer`: Timer handle for the periodic tick (cleared on shutdown).

**Constants**: INTERPOLATION_DELAY_MS (150), INTERPOLATION_TICK_MS (50), REMOTE_ENTITY_BUFFER_MAX, EXTRAPOLATION_MAX_MS (retained for possible future use).

**STATE_UPDATE handling**: After setting `currentState`, for each remote player in the payload push a snapshot (with `message.timestamp`, x, y, playerName, and vx/vy if present) to their buffer; remove buffers and clear cells for players no longer in the payload.

**Tick logic**: On each tick, compute `renderTime`, update `remoteEntityInterpolated` for each entity (via `getInterpolatedPosition(buffer, renderTime, board)` so results can be clamped to bounds and walls). For each entity, compute target = rounded interpolated position; if display easing is enabled, compute display position as last + clamp(target - last, -1, 1) per axis; otherwise display = target. For each entity whose display position changed from `lastDrawnInterpolatedPositions`, call `restoreCellContent` at the old position and `updateCell` at the new (display) position; pass the current list of interpolated positions (rounded) to `restoreCellContent`. Update `lastDrawnInterpolatedPositions` with the display position and call `renderer.render(canvas)` if any cell changed.

**Lifecycle**: Start the interpolation tick when the client has state and localPlayerId (e.g. after CONNECT response). Stop the tick and clear state on shutdown.

## Server Velocity (Phase 2)

To improve extrapolation when the buffer runs dry, the server may include velocity in the serialized state.

**Server**:
- **In-memory Player**: Tracks `lastX`, `lastY`, `lastT` (set on spawn and on each move).
- **serializeState()**: For each player, compute `vx = (x - lastX) / dtSec`, `vy = (y - lastY) / dtSec` where `dtSec = (now - lastT) / 1000`. Include `vx`, `vy` (cells per second) in the serialized player object. If there is no previous position or dt is zero, send 0.

**Client**:
- Buffer entries store `vx`, `vy` when present in the payload.
- In the extrapolation branch, prefer server `vx`/`vy` from the latest snapshot; fall back to client-derived velocity when absent.

Interpolation logic is unchanged; velocity would be used only if extrapolation is reintroduced.

## Client Configuration

The following client config property affects remote entity interpolation. See `config/clientConfig.json` and `config/clientConfig.js` (defaults).

| Property | Type | Default | Description | Example |
|----------|------|---------|-------------|---------|
| **rendering.remoteDisplayEasing** | boolean | `true` | When `true`, the drawn position for remote players moves at most 1 cell per axis per tick toward the interpolated target, reducing 2-cell snaps. When `false`, the client draws at the rounded interpolated position each tick (no easing). | `"remoteDisplayEasing": true` |

## References

- [Client Architecture Specification](../client-architecture_SPECS/README.md) – Core concepts, state management, rendering patterns.
- [Server Architecture Specification](../server-architecture_SPECS/README.md) – State serialization, velocity computation.
- [Client-Side Prediction Specification](../client-side-prediction/client-side-prediction_SPECS.md) – Local player prediction (related but independent).
- [docs/tmp/entity-interpolation.txt](../../tmp/entity-interpolation.txt) – Entity interpolation technique.
- [docs/tmp/implementation-tips.md](../../tmp/implementation-tips.md) – Implementation notes (lerp, jitter buffer, extrapolation).

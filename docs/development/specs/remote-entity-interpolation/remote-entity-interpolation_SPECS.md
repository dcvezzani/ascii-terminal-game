# Specification: Remote Entity Interpolation

## Overview

This specification describes the implementation of **remote entity interpolation** for the multiplayer terminal game. The local player already benefits from client-side prediction and reconciliation; other (remote) players, however, were only updated when the server sent a `STATE_UPDATE` (every 250ms), causing them to appear to jump between positions.

This feature smooths the movement of remote players by maintaining a per-entity position buffer and a periodic interpolation tick that interpolates (lerps) between the two most recent server snapshots. When the buffer runs dry (e.g. packet loss), optional extrapolation keeps entities moving using server-provided or client-derived velocity.

**Purpose**: Provide smooth, visually continuous motion for other players between server true-ups, improving the multiplayer experience without changing the server as the single source of truth.

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
2. **Interpolation delay**: Use a fixed delay (e.g. 100ms) so `renderTime = Date.now() - delay`. This ensures we typically have at least two snapshots to interpolate between.
3. **Interpolation tick**: Run a periodic tick (e.g. every 50ms) that computes interpolated positions for each remote entity (lerp between the two snapshots surrounding `renderTime`), then redraws only the remote player cells that changed.
4. **Extrapolation (fallback)**: When `renderTime` is past the last snapshot (e.g. packet loss), hold at the last position or extrapolate using velocity (server-provided `vx`/`vy` if present, otherwise client-derived from the last two buffer entries). Clamp extrapolation duration (e.g. 300ms) so entities do not run away.
5. **Joins and leaves**: When a remote player leaves, clear their last-drawn cell, remove their buffer and interpolated state.

## Requirements

### Buffer Shape and Cap

- **Buffer entry**: `{ t: number, x: number, y: number, playerName?: string, vx?: number, vy?: number }`. `t` is the message timestamp (ms). `vx`, `vy` are optional (cells per second) when the server includes them.
- **Cap**: Keep the last N entries per entity (e.g. 20). Drop oldest when over cap.

### Interpolation Delay and Tick Interval

- **INTERPOLATION_DELAY_MS**: e.g. 100ms (or 150ms as a jitter buffer: ~3× server interval). `renderTime = Date.now() - INTERPOLATION_DELAY_MS`.
- **INTERPOLATION_TICK_MS**: e.g. 50ms. The tick runs at this interval when the client has state and localPlayerId.

### Message Timestamp

- Use `message.timestamp` from the parsed `STATE_UPDATE` when pushing to buffers so interpolation is based on server time and is less sensitive to client receive jitter.

### Lerp Formula

- Find the two buffer entries such that `buffer[i].t <= renderTime <= buffer[i+1].t`.
- `alpha = (renderTime - tA) / (tB - tA)`; `x = xA + (xB - xA) * alpha`; same for `y`.
- If buffer has 0 or 1 entry, use the latest known position (no lerp).

### Extrapolation (Buffer Run Dry)

- When `renderTime > latest.t`: extrapolate or hold.
- If server sent `vx`, `vy` in the latest snapshot: `x = latest.x + vx * (timePastSec)`, `y = latest.y + vy * (timePastSec)` where `timePastSec = (renderTime - latest.t) / 1000`.
- Otherwise derive velocity from the last two buffer entries: `vx = (x1 - x0) / (t1 - t0)` in consistent units (e.g. cells per second), then extrapolate.
- Clamp extrapolation to a maximum duration (e.g. EXTRAPOLATION_MAX_MS = 300ms). Beyond that, hold at latest position.

### Join and Leave Handling

- **Join**: First `STATE_UPDATE` that includes a new remote player pushes to their buffer; no special "last drawn" needed for the first tick (tick draws at interpolated/latest position).
- **Leave**: When a remote player is no longer in `currentState.players`, clear their last-drawn cell via `restoreCellContent`, then remove their buffer and entries from `remoteEntityInterpolated` and `lastDrawnInterpolatedPositions`.

## Client Implementation

**Location**: `src/modes/networkedMode.js`

**State variables**:
- `remoteEntityBuffers`: Map from playerId to array of buffer snapshots.
- `remoteEntityInterpolated`: Map from playerId to `{ x, y, playerName }` (current interpolated or extrapolated position).
- `lastDrawnInterpolatedPositions`: Map from playerId to `{ x, y }` (last rounded position drawn).
- `interpolationTickTimer`: Timer handle for the periodic tick (cleared on shutdown).

**Constants**: INTERPOLATION_DELAY_MS, INTERPOLATION_TICK_MS, REMOTE_ENTITY_BUFFER_MAX, EXTRAPOLATION_MAX_MS.

**STATE_UPDATE handling**: After setting `currentState`, for each remote player in the payload push a snapshot (with `message.timestamp`, x, y, playerName, and vx/vy if present) to their buffer; remove buffers and clear cells for players no longer in the payload.

**Tick logic**: On each tick, compute `renderTime`, update `remoteEntityInterpolated` for each entity (via `getInterpolatedPosition(buffer, renderTime)`). For each entity whose rounded interpolated position changed from `lastDrawnInterpolatedPositions`, call `restoreCellContent` at the old position and `updateCell` at the new position; pass the current list of interpolated positions (rounded) to `restoreCellContent` so another remote player at that cell is not erased. Update `lastDrawnInterpolatedPositions` and call `renderer.render(canvas)` if any cell changed.

**Lifecycle**: Start the interpolation tick when the client has state and localPlayerId (e.g. after CONNECT response). Stop the tick and clear state on shutdown.

## Server Velocity (Phase 2)

To improve extrapolation when the buffer runs dry, the server may include velocity in the serialized state.

**Server**:
- **In-memory Player**: Tracks `lastX`, `lastY`, `lastT` (set on spawn and on each move).
- **serializeState()**: For each player, compute `vx = (x - lastX) / dtSec`, `vy = (y - lastY) / dtSec` where `dtSec = (now - lastT) / 1000`. Include `vx`, `vy` (cells per second) in the serialized player object. If there is no previous position or dt is zero, send 0.

**Client**:
- Buffer entries store `vx`, `vy` when present in the payload.
- In the extrapolation branch, prefer server `vx`/`vy` from the latest snapshot; fall back to client-derived velocity when absent.

Interpolation logic is unchanged; velocity is used only when extrapolating.

## References

- [Client Architecture Specification](../client-architecture_SPECS/README.md) – Core concepts, state management, rendering patterns.
- [Server Architecture Specification](../server-architecture_SPECS/README.md) – State serialization, velocity computation.
- [Client-Side Prediction Specification](../client-side-prediction/client-side-prediction_SPECS.md) – Local player prediction (related but independent).
- [docs/tmp/entity-interpolation.txt](../../tmp/entity-interpolation.txt) – Entity interpolation technique.
- [docs/tmp/implementation-tips.md](../../tmp/implementation-tips.md) – Implementation notes (lerp, jitter buffer, extrapolation).

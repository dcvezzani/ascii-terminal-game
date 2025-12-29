# Feature: Client-Side Prediction for Local Player

## Context

Currently, the game uses server-authoritative movement where all player movements are validated and synchronized by the server. While this ensures consistency and prevents cheating, it introduces latency between when a player presses a movement key and when they see their character move on screen. This latency can make the game feel unresponsive, especially in networked environments.

## Problem

When a player presses a movement key:
1. The client sends a MOVE message to the server
2. The server validates and processes the move
3. The server broadcasts a STATE_UPDATE to all clients
4. The client receives the update and renders the new position

This round-trip latency (typically 50-200ms or more depending on network conditions) makes the game feel sluggish and unresponsive, particularly for the local player who expects immediate feedback.

## Desired Feature

Implement client-side prediction for the local player to provide immediate visual feedback while maintaining server authority. The system should:

1. **Immediate Local Rendering**: When the local player presses a movement key, render their character immediately at the predicted position without waiting for server confirmation
2. **Server Authority**: Continue to use server state updates for all other players and entities
3. **Periodic Reconciliation**: Every N seconds (configurable, default 5 seconds), synchronize the local player's position with the server's authoritative position to correct any drift or desynchronization
4. **Smooth Correction**: When reconciliation occurs, smoothly correct the local player's position if there's a discrepancy

## Requirements

### Functional Requirements

1. Local player movements should render immediately upon keypress
2. Other players and entities should continue to render based on server state updates
3. Local player position should be reconciled with server position at configurable intervals (default: 5 seconds)
4. Reconciliation should handle position discrepancies gracefully
5. The system should work seamlessly with existing incremental rendering

### Technical Requirements

1. Add client-side prediction state tracking for local player
2. Modify input handler to update local player position immediately
3. Add reconciliation timer/interval mechanism
4. Add configuration option for reconciliation interval in `clientConfig.js`
5. Ensure reconciliation doesn't cause visual jumps or flickering
6. Maintain compatibility with existing incremental rendering system

### Non-Functional Requirements

1. Performance: Client-side prediction should not significantly impact rendering performance
2. Reliability: System should gracefully handle network issues and server disconnections
3. Configurability: Reconciliation interval should be easily configurable
4. Maintainability: Code should be well-documented and follow existing patterns

## Implementation Approach

### Phase 1: Configuration and State Tracking
- Add `reconciliationInterval` to `clientConfig.js` (default: 5000ms)
- Add local player prediction state tracking in `src/index.js`
- Track predicted position separately from server position

### Phase 2: Immediate Local Rendering
- Modify input handler to update local player position immediately
- Render local player at predicted position
- Continue sending MOVE messages to server

### Phase 3: Server Reconciliation
- Implement reconciliation timer that triggers every N seconds
- Compare predicted position with server position
- If discrepancy exists, smoothly correct local player position
- Log reconciliation events for debugging

### Phase 4: Integration and Testing
- Integrate with existing incremental rendering
- Ensure other players/entities continue using server state
- Add unit tests for prediction and reconciliation logic
- Add integration tests for full flow

## Technical Details

### State Management

```javascript
// In runNetworkedMode()
let localPlayerPredictedPosition = { x: null, y: null };
let lastReconciliationTime = Date.now();
```

### Input Handler Modification

```javascript
// When local player moves
onMoveUp: () => {
  // Update predicted position immediately
  if (localPlayerPredictedPosition.x !== null) {
    localPlayerPredictedPosition.y -= 1;
    // Render immediately at predicted position
    renderer.updateCell(
      localPlayerPredictedPosition.x,
      localPlayerPredictedPosition.y,
      PLAYER_CHAR.char,
      playerColorFn
    );
  }
  // Still send to server
  wsClient.sendMove(0, -1);
}
```

### Reconciliation Logic

```javascript
function reconcileWithServer(gameState) {
  const serverPlayer = gameState.players.find(p => p.playerId === localPlayerId);
  if (!serverPlayer) return;
  
  const predicted = localPlayerPredictedPosition;
  const server = { x: serverPlayer.x, y: serverPlayer.y };
  
  if (predicted.x !== server.x || predicted.y !== server.y) {
    // Discrepancy detected - correct to server position
    // Could implement smooth interpolation here
    localPlayerPredictedPosition = { x: server.x, y: server.y };
    // Re-render at corrected position
  }
}
```

### Configuration

```javascript
// clientConfig.js
export const clientConfig = {
  // ... existing config
  prediction: {
    enabled: true,
    reconciliationInterval: 5000, // milliseconds
  },
};
```

## Testing Strategy

### Unit Tests
- Test prediction state tracking
- Test reconciliation logic
- Test position discrepancy detection
- Test configuration loading

### Integration Tests
- Test immediate rendering on input
- Test reconciliation at configured intervals
- Test handling of server position updates
- Test interaction with incremental rendering

### Manual Testing
- Verify smooth local player movement
- Verify other players still use server state
- Verify reconciliation corrects drift
- Test with various network conditions

## Future Enhancements

1. **Smooth Interpolation**: Instead of snapping to server position, smoothly interpolate over a short duration
2. **Rollback and Replay**: Implement rollback mechanism for handling server corrections
3. **Lag Compensation**: Account for network latency in prediction
4. **Prediction Confidence**: Track prediction accuracy and adjust behavior accordingly
5. **Visual Indicators**: Optionally show when reconciliation occurs (for debugging)

## Success Criteria

1. ✅ Local player movements render immediately upon keypress
2. ✅ Other players and entities continue using server state
3. ✅ Reconciliation occurs at configured intervals
4. ✅ Position discrepancies are corrected smoothly
5. ✅ No visual glitches or flickering during reconciliation
6. ✅ System integrates seamlessly with incremental rendering
7. ✅ Configuration is easily adjustable
8. ✅ All tests pass

## Related Features

- **Incremental Rendering**: This feature builds on the incremental rendering system
- **WebSocket Integration**: Uses existing WebSocket communication
- **Input Handling**: Modifies input handler behavior

## Notes

- Client-side prediction is a common pattern in networked games (e.g., Quake, Counter-Strike)
- The reconciliation interval should balance between responsiveness and accuracy
- Too frequent reconciliation may cause jitter, too infrequent may allow drift
- Default 5 seconds is a reasonable starting point but may need tuning based on gameplay


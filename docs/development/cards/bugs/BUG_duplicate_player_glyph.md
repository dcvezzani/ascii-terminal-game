# Bug Report: Duplicate Player Glyph

## Status
**NOT STARTED**

## Bug Summary

When moving the client, sometimes a glitch occurs where two glyphs appear for a single player. Both glyphs move in "sync" until server reconciliation takes place and the extra glyph is removed.

## Context

**Feature**: Client-Side Prediction and Rendering  
**Location**: `src/modes/networkedMode.js`, `src/render/Renderer.js`  
**Related Features**: 
- Client-Side Prediction (X_ENHANCEMENT_client_side_prediction.md)
- Incremental Rendering (X_ENHANCEMENT_reduce_screen_flicker.md)

The game uses client-side prediction where the local player is rendered separately using the predicted position, while other players are rendered from the server state. The local player is excluded from the `otherPlayers` array before passing to `renderBoard` and `renderIncremental`.

## The Bug

**Detailed Description**:

During movement, two glyphs can appear for the same player (typically the local player). Both glyphs:
- Move in sync with player input
- Appear at the same or very close positions
- Persist until server reconciliation occurs (every 5 seconds by default)
- Are removed when reconciliation corrects the position

**Root Cause Hypothesis**:

The issue likely occurs because:
1. The local player entity exists in `currentState.players` with the server position
2. The local player is also rendered separately using `localPlayerPredictedPosition`
3. If the state comparison (`compareStates`) detects the local player as "moved" or "joined", it may render the player again through `renderIncremental`
4. This results in two glyphs: one from the server state and one from the predicted position

**Potential Scenarios**:
- Local player appears in `changes.players.moved` even though it should be excluded
- Local player appears in `changes.players.joined` on state updates
- Race condition between prediction update and state update
- The local player is not properly filtered out in all rendering paths

## How to Reproduce

1. Start the server
2. Start a client and connect
3. Move the player using arrow keys/WASD
4. Observe the board - sometimes two glyphs appear for the same player
5. Continue moving - both glyphs move in sync
6. Wait for reconciliation (5 seconds) - the extra glyph disappears

**Frequency**: Intermittent - happens "sometimes" during movement

**Conditions**:
- Client-side prediction enabled
- Player is moving
- State updates arriving from server

## Expected Behavior

- Only one glyph should represent each player at any given time
- The local player should have exactly one glyph (using predicted position)
- Other players should have exactly one glyph each (using server position)
- No duplicate glyphs should appear, even during rapid movement or state updates

## Current Behavior

- Two glyphs can appear for a single player (typically the local player)
- Both glyphs move in sync with input
- Both glyphs persist until server reconciliation
- The extra glyph is removed when reconciliation corrects the position

## Impact

**Severity**: Medium

**User Experience**:
- Confusing visual glitch
- Makes it difficult to determine actual player position
- Breaks immersion
- May cause players to think there are more players than there actually are

**Technical Impact**:
- Indicates potential state management issue
- May indicate race condition in rendering logic
- Could lead to other rendering bugs

## How to Fix

**Approach**:

1. **Investigation**:
   - Add logging to track when players are rendered
   - Log `currentState.players` to check for duplicate player entities
   - Log `changes.players.moved` and `changes.players.joined` to see if local player appears
   - Verify that local player is properly excluded in all rendering paths

2. **Safeguards**:
   - Ensure local player is always excluded from `otherPlayers` array before rendering
   - Add deduplication logic to prevent rendering the same player twice
   - Verify `compareStates` doesn't include local player in change detection
   - Add validation to ensure each player ID appears only once in the players array

3. **Potential Fixes**:
   - **Option A**: Ensure local player is filtered out before passing to `renderIncremental`
   - **Option B**: Add deduplication in `renderIncremental` to skip rendering if player already rendered
   - **Option C**: Fix `compareStates` to exclude local player from change detection
   - **Option D**: Add validation in `handleStateUpdate` to deduplicate players array

4. **Testing**:
   - Test rapid movement scenarios
   - Test with multiple state updates
   - Test reconciliation scenarios
   - Verify no duplicate glyphs appear in any scenario

**Files to Modify**:
- `src/modes/networkedMode.js` - Ensure local player exclusion in all rendering paths
- `src/utils/stateComparison.js` - Verify local player exclusion in change detection
- `src/render/Renderer.js` - Add safeguards against duplicate rendering

## Related Code

**Key Functions**:
- `render()` in `networkedMode.js` - Main rendering function
- `renderIncremental()` in `Renderer.js` - Incremental rendering
- `compareStates()` in `stateComparison.js` - State change detection
- `handleStateUpdate()` in `networkedMode.js` - State update handling

**Relevant Sections**:
- Line 471-473: `otherPlayers` filtering (excludes local player)
- Line 517-526: `renderIncremental` call with changes
- Line 528-544: Local player movement handling

## Open Questions

1. Does the duplicate appear for the local player only, or can it happen for other players too?
2. Is the duplicate always at the same position, or can they be at different positions?
3. Does this happen more frequently with rapid movement or slow movement?
4. Is there a pattern to when it occurs (e.g., after specific actions)?

## Acceptance Criteria

- [ ] Investigation completed - root cause identified
- [ ] Safeguards implemented to prevent duplicate player entities
- [ ] No duplicate glyphs appear during movement
- [ ] No duplicate glyphs appear during state updates
- [ ] No duplicate glyphs appear during reconciliation
- [ ] All rendering paths properly exclude local player
- [ ] Tests added to prevent regression
- [ ] Manual testing confirms fix

## Tags

- `bug`
- `rendering`
- `client-side-prediction`
- `state-management`
- `visual-glitch`

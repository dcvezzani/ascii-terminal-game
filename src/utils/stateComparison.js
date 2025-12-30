/**
 * State comparison utilities for incremental rendering
 * Compares previous and current game states to detect changes
 */

/**
 * Compare player arrays to detect changes
 * @param {Array|null|undefined} previousPlayers - Previous player array
 * @param {Array|null|undefined} currentPlayers - Current player array
 * @returns {Object} Change detection result with moved, joined, and left players
 */
export function comparePlayers(previousPlayers, currentPlayers) {
  // Handle null/undefined/empty arrays
  const prev = previousPlayers || [];
  const curr = currentPlayers || [];

  // Create Maps for O(1) lookups (per Q7: Option B)
  const prevMap = new Map(prev.map(p => [p.playerId, { x: p.x, y: p.y }]));
  const currMap = new Map(curr.map(p => [p.playerId, { x: p.x, y: p.y }]));

  const moved = [];
  const joined = [];
  const left = [];

  // Check for moved and joined players
  for (const currentPlayer of curr) {
    const prevPlayer = prevMap.get(currentPlayer.playerId);
    if (prevPlayer) {
      // Player exists in both - check if moved
      if (prevPlayer.x !== currentPlayer.x || prevPlayer.y !== currentPlayer.y) {
        moved.push({
          playerId: currentPlayer.playerId,
          oldX: prevPlayer.x,
          oldY: prevPlayer.y,
          newX: currentPlayer.x,
          newY: currentPlayer.y,
        });
      }
    } else {
      // Player not in previous - joined
      joined.push({
        playerId: currentPlayer.playerId,
        x: currentPlayer.x,
        y: currentPlayer.y,
        playerName: currentPlayer.playerName,
      });
    }
  }

  // Check for left players
  for (const previousPlayer of prev) {
    if (!currMap.has(previousPlayer.playerId)) {
      // Player in previous but not current - left
      left.push({
        playerId: previousPlayer.playerId,
        x: previousPlayer.x,
        y: previousPlayer.y,
      });
    }
  }

  return { moved, joined, left };
}

/**
 * Compare entity arrays to detect changes
 * @param {Array|null|undefined} previousEntities - Previous entity array
 * @param {Array|null|undefined} currentEntities - Current entity array
 * @returns {Object} Change detection result with moved, spawned, despawned, and animated entities
 */
export function compareEntities(previousEntities, currentEntities) {
  // Handle null/undefined/empty arrays
  const prev = previousEntities || [];
  const curr = currentEntities || [];

  // Create Maps for O(1) lookups (per Q7: Option B)
  const prevMap = new Map(
    prev.map(e => [
      e.entityId,
      {
        x: e.x,
        y: e.y,
        glyph: e.glyph,
        animationFrame: e.animationFrame,
        entityType: e.entityType,
      },
    ])
  );
  const currMap = new Map(
    curr.map(e => [
      e.entityId,
      {
        x: e.x,
        y: e.y,
        glyph: e.glyph,
        animationFrame: e.animationFrame,
        entityType: e.entityType,
      },
    ])
  );

  const moved = [];
  const spawned = [];
  const despawned = [];
  const animated = [];

  // Check for moved, spawned, and animated entities
  for (const currentEntity of curr) {
    const prevEntity = prevMap.get(currentEntity.entityId);
    if (prevEntity) {
      // Entity exists in both
      const positionChanged = prevEntity.x !== currentEntity.x || prevEntity.y !== currentEntity.y;
      const visualChanged =
        prevEntity.glyph !== currentEntity.glyph ||
        prevEntity.animationFrame !== currentEntity.animationFrame;

      if (positionChanged) {
        // Position changed - moved
        moved.push({
          entityId: currentEntity.entityId,
          oldX: prevEntity.x,
          oldY: prevEntity.y,
          newX: currentEntity.x,
          newY: currentEntity.y,
          entityType: currentEntity.entityType,
        });
      } else if (visualChanged) {
        // Position same but visual changed - animated
        animated.push({
          entityId: currentEntity.entityId,
          x: currentEntity.x,
          y: currentEntity.y,
          oldGlyph: prevEntity.glyph,
          newGlyph: currentEntity.glyph,
          animationFrame: currentEntity.animationFrame,
        });
      }
    } else {
      // Entity not in previous - spawned
      spawned.push({
        entityId: currentEntity.entityId,
        x: currentEntity.x,
        y: currentEntity.y,
        entityType: currentEntity.entityType,
        glyph: currentEntity.glyph,
        animationFrame: currentEntity.animationFrame,
      });
    }
  }

  // Check for despawned entities
  for (const previousEntity of prev) {
    if (!currMap.has(previousEntity.entityId)) {
      // Entity in previous but not current - despawned
      despawned.push({
        entityId: previousEntity.entityId,
        x: previousEntity.x,
        y: previousEntity.y,
      });
    }
  }

  return { moved, spawned, despawned, animated };
}

/**
 * Compare score values to detect changes
 * @param {number|null|undefined} previousScore - Previous score
 * @param {number|null|undefined} currentScore - Current score
 * @returns {Object} Change detection result with changed flag and scores
 */
export function compareScore(previousScore, currentScore) {
  const changed = previousScore !== currentScore;
  return {
    changed,
    oldScore: previousScore,
    newScore: currentScore,
  };
}

/**
 * Compare complete game states to detect all changes
 * @param {Object|null|undefined} previousState - Previous game state
 * @param {Object|null|undefined} currentState - Current game state
 * @returns {Object} Complete change detection result
 */
export function compareStates(previousState, currentState) {
  // Handle null/undefined states
  if (!previousState || !currentState) {
    // If previous is null, treat all current as new
    // If current is null, treat all previous as removed
    const prev = previousState || {};
    const curr = currentState || {};

    return {
      players: comparePlayers(prev.players, curr.players),
      entities: compareEntities(prev.entities, curr.entities),
      board: {
        changed: [],
      },
      score: compareScore(prev.score, curr.score),
    };
  }

  // Compare all aspects of state
  const players = comparePlayers(previousState.players, currentState.players);
  const entities = compareEntities(previousState.entities, currentState.entities);
  const score = compareScore(previousState.score, currentState.score);

  // Board comparison deferred (per Q2: Option B)
  // Will be implemented when board becomes mutable
  const board = {
    changed: [],
  };

  return {
    players,
    entities,
    board,
    score,
  };
}

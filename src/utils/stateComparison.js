import logger from './logger.js';

/**
 * Compares two game states and returns a structured object describing what changed.
 * 
 * @param {object|null} previousState - Previous game state (null for first render)
 * @param {object|null} currentState - Current game state
 * @returns {object} Change detection object with the following structure:
 *   {
 *     players: {
 *       moved: Array<{ playerId: string, oldPos: {x, y}, newPos: {x, y} }>,
 *       joined: Array<{ playerId: string, pos: {x, y}, playerName: string }>,
 *       left: Array<{ playerId: string, pos: {x, y} }>
 *     },
 *     scoreChanged: boolean
 *   }
 * 
 * @example
 * const changes = compareStates(null, currentState);
 * // Returns all current players as 'joined'
 * 
 * @example
 * const changes = compareStates(prevState, currState);
 * // Returns moved, joined, and left players
 */
export function compareStates(previousState, currentState) {
  const changes = {
    players: {
      moved: [],
      joined: [],
      left: []
    },
    bullets: {
      moved: [],
      created: [],
      destroyed: []
    },
    scoreChanged: false
  };

  // Handle null/undefined states
  if (!previousState) {
    // First render: all current players are "joined"
    if (currentState && currentState.players && Array.isArray(currentState.players)) {
      changes.players.joined = currentState.players.map(p => ({
        playerId: p.playerId,
        pos: { x: p.x, y: p.y },
        playerName: p.playerName
      }));
    }
    changes.scoreChanged = false;
    return changes;
  }

  if (!currentState) {
    // Current state is null: all previous players have "left"
    if (previousState.players && Array.isArray(previousState.players)) {
      changes.players.left = previousState.players.map(p => ({
        playerId: p.playerId,
        pos: { x: p.x, y: p.y }
      }));
    }
    return changes;
  }

  // Create map of previous players for O(1) lookups
  const prevPlayerMap = new Map();
  if (previousState.players && Array.isArray(previousState.players)) {
    previousState.players.forEach(p => {
      if (p.playerId && typeof p.x === 'number' && typeof p.y === 'number') {
        prevPlayerMap.set(p.playerId, { x: p.x, y: p.y });
      }
    });
  }

  // Compare current players
  if (currentState.players && Array.isArray(currentState.players)) {
    currentState.players.forEach(p => {
      if (!p.playerId) {
        logger.warn('Player missing playerId in state comparison');
        return;
      }

      const prevPos = prevPlayerMap.get(p.playerId);
      
      if (!prevPos) {
        // Player joined (not in previous state)
        if (typeof p.x === 'number' && typeof p.y === 'number') {
          changes.players.joined.push({
            playerId: p.playerId,
            pos: { x: p.x, y: p.y },
            playerName: p.playerName
          });
        }
      } else {
        // Player exists in both states - check if moved
        if (typeof p.x === 'number' && typeof p.y === 'number') {
          if (prevPos.x !== p.x || prevPos.y !== p.y) {
            changes.players.moved.push({
              playerId: p.playerId,
              oldPos: prevPos,
              newPos: { x: p.x, y: p.y }
            });
          }
        }
      }
      
      // Remove from map (remaining entries are "left")
      prevPlayerMap.delete(p.playerId);
    });
  }

  // Remaining players in map have left
  prevPlayerMap.forEach((pos, playerId) => {
    changes.players.left.push({
      playerId,
      pos
    });
  });

  // Compare bullets
  const prevBulletMap = new Map();
  if (previousState.bullets && Array.isArray(previousState.bullets)) {
    previousState.bullets.forEach(b => {
      if (b.bulletId && typeof b.x === 'number' && typeof b.y === 'number') {
        prevBulletMap.set(b.bulletId, { x: b.x, y: b.y, dx: b.dx, dy: b.dy });
      }
    });
  }

  if (currentState.bullets && Array.isArray(currentState.bullets)) {
    currentState.bullets.forEach(b => {
      if (!b.bulletId) {
        return;
      }

      const prevBullet = prevBulletMap.get(b.bulletId);

      if (!prevBullet) {
        // Bullet created (not in previous state)
        if (typeof b.x === 'number' && typeof b.y === 'number') {
          changes.bullets.created.push({
            bulletId: b.bulletId,
            playerId: b.playerId,
            pos: { x: b.x, y: b.y },
            dx: b.dx,
            dy: b.dy
          });
        }
      } else {
        // Bullet exists in both states - check if moved
        if (typeof b.x === 'number' && typeof b.y === 'number') {
          if (prevBullet.x !== b.x || prevBullet.y !== b.y) {
            changes.bullets.moved.push({
              bulletId: b.bulletId,
              playerId: b.playerId,
              oldPos: { x: prevBullet.x, y: prevBullet.y },
              newPos: { x: b.x, y: b.y }
            });
          }
        }
      }

      prevBulletMap.delete(b.bulletId);
    });
  }

  // Remaining bullets in map have been destroyed
  prevBulletMap.forEach((pos, bulletId) => {
    changes.bullets.destroyed.push({
      bulletId,
      pos
    });
  });

  // Compare scores (handle missing scores as 0)
  const prevScore = previousState.score ?? 0;
  const currScore = currentState.score ?? 0;
  changes.scoreChanged = prevScore !== currScore;

  return changes;
}

// Default export
export default compareStates;

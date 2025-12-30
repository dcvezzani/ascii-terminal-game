/**
 * Collision Event Listener
 * Handles collision events (player collisions, wall collisions)
 */

import { EventTypes } from '../EventTypes.js';
import { logger } from '../../utils/logger.js';

/**
 * Set up collision event listener
 * @param {GameServer} gameServer - GameServer instance to attach listener to
 */
export function setupCollisionListener(gameServer) {
  // Listen for all collision events
  gameServer.on(EventTypes.BUMP, eventData => {
    try {
      // Log collision event
      logger.debug(
        `Collision event: ${eventData.type} for player ${eventData.playerId} at (${eventData.attemptedPosition.x}, ${eventData.attemptedPosition.y})`
      );

      // Future: Include collision info in state updates
      // Future: Trigger special rendering logic
      // Future: Play collision sound effects
    } catch (error) {
      logger.error('Error handling collision event:', error);
    }
  });
}

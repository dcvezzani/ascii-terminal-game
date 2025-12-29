/**
 * Event Type Constants
 * Centralized definitions for all event types used in the game server
 */

export const EventTypes = {
  // Collision Events
  BUMP: 'bump',
  PLAYER_COLLISION: 'playerCollision',
  WALL_COLLISION: 'wallCollision',
  ENTITY_COLLISION: 'entityCollision',

  // Combat Events (for future use)
  SHOT: 'shot',
  DAMAGE: 'damage',
  HEAL: 'heal',
  DEATH: 'death',
  ATTACK: 'attack',
  DEFEND: 'defend',

  // Alignment Events (for future use)
  ALIGNED_VERTICALLY: 'alignedVertically',
  ALIGNED_HORIZONTALLY: 'alignedHorizontally',
  FORMATION: 'formation',
  LINE_OF_SIGHT: 'lineOfSight',

  // Entity Events (for future use)
  SPAWN: 'spawn',
  DESPAWN: 'despawn',
  MOVE: 'move',
  ANIMATE: 'animate',
  STATE_CHANGE: 'stateChange',

  // State Events (for future use)
  PLAYER_JOINED: 'playerJoined',
  PLAYER_LEFT: 'playerLeft',
  GAME_STATE_CHANGE: 'gameStateChange',
  SCORE_CHANGE: 'scoreChange',
};


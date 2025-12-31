/**
 * Message type constants for WebSocket communication
 * Defines all message types used in client-server communication
 */

export const MessageTypes = {
  // Test messages re: development
  TEST: 'TEST',

  // Connection management
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',

  // Player actions
  MOVE: 'MOVE',
  SET_PLAYER_NAME: 'SET_PLAYER_NAME',
  RESTART: 'RESTART',

  // Server updates
  STATE_UPDATE: 'STATE_UPDATE',
  PLAYER_JOINED: 'PLAYER_JOINED',
  PLAYER_LEFT: 'PLAYER_LEFT',

  // Error handling
  ERROR: 'ERROR',

  // Keep-alive
  PING: 'PING',
  PONG: 'PONG',
};

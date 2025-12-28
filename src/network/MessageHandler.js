/**
 * Message handler for WebSocket communication
 * Handles parsing, validation, and creation of WebSocket messages
 */

import { MessageTypes } from './MessageTypes.js';

/**
 * Parse a JSON message string into a message object
 * @param {string} messageString - JSON string to parse
 * @returns {{ message: object | null, error: object | null }} - Parsed message or error
 */
export function parseMessage(messageString) {
  if (!messageString || typeof messageString !== 'string') {
    return {
      message: null,
      error: {
        code: 'INVALID_INPUT',
        message: 'Message must be a non-empty string',
      },
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(messageString);
  } catch (error) {
    return {
      message: null,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Failed to parse JSON message',
        details: error.message,
      },
    };
  }

  return validateMessage(parsed);
}

/**
 * Validate a message object structure
 * @param {object} message - Message object to validate
 * @returns {{ message: object | null, error: object | null }} - Validated message or error
 */
export function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    return {
      message: null,
      error: {
        code: 'INVALID_MESSAGE',
        message: 'Message must be an object',
      },
    };
  }

  // Check required fields
  if (!message.type || typeof message.type !== 'string') {
    return {
      message: null,
      error: {
        code: 'MISSING_TYPE',
        message: 'Message must have a type field',
      },
    };
  }

  // Validate message type
  const validTypes = Object.values(MessageTypes);
  if (!validTypes.includes(message.type)) {
    return {
      message: null,
      error: {
        code: 'INVALID_TYPE',
        message: `Invalid message type: ${message.type}`,
        validTypes,
      },
    };
  }

  // Payload is optional but if present should be an object
  if (message.payload !== undefined && typeof message.payload !== 'object') {
    return {
      message: null,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Payload must be an object if provided',
      },
    };
  }

  // Ensure payload exists (default to empty object)
  const validatedMessage = {
    type: message.type,
    payload: message.payload || {},
    timestamp: message.timestamp || Date.now(),
    clientId: message.clientId || null,
  };

  return {
    message: validatedMessage,
    error: null,
  };
}

/**
 * Create a message object with standard structure
 * @param {string} type - Message type (from MessageTypes)
 * @param {object} payload - Message payload
 * @param {string} [clientId] - Optional client ID
 * @returns {object} - Message object
 */
export function createMessage(type, payload = {}, clientId = null) {
  return {
    type,
    payload,
    timestamp: Date.now(),
    clientId,
  };
}

/**
 * Create an error message with structured error payload
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {object} [context] - Optional error context
 * @param {string} [clientId] - Optional client ID
 * @returns {object} - Error message object
 */
export function createErrorMessage(code, message, context = {}, clientId = null) {
  return createMessage(
    MessageTypes.ERROR,
    {
      code,
      message,
      context: {
        action: context.action || null,
        playerId: context.playerId || null,
        reason: context.reason || null,
        ...context,
      },
    },
    clientId
  );
}

/**
 * Create a state update message
 * @param {object} gameState - Current game state
 * @param {string} [clientId] - Optional client ID
 * @returns {object} - State update message object
 */
export function createStateUpdateMessage(gameState, clientId = null) {
  return createMessage(MessageTypes.STATE_UPDATE, { gameState }, clientId);
}

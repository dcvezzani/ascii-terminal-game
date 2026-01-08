/**
 * Message handler for parsing and creating WebSocket messages
 */

/**
 * Parse a raw JSON message string into a message object
 * @param {string} rawData - Raw JSON string
 * @returns {object} Parsed message object
 * @throws {Error} If JSON is invalid or required fields are missing
 */
export function parseMessage(rawData) {
  let parsed;
  
  try {
    parsed = JSON.parse(rawData);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }

  // Validate required fields
  if (!parsed.type) {
    throw new Error('Missing required field: type');
  }
  
  if (parsed.payload === undefined) {
    throw new Error('Missing required field: payload');
  }
  
  if (parsed.timestamp === undefined) {
    throw new Error('Missing required field: timestamp');
  }

  return parsed;
}

/**
 * Create a message object with the given type and payload
 * @param {string} type - Message type (from MessageTypes)
 * @param {object} payload - Message payload
 * @param {string} [clientId] - Optional client ID
 * @returns {object} Message object
 */
export function createMessage(type, payload, clientId) {
  const message = {
    type,
    payload,
    timestamp: Date.now()
  };

  if (clientId !== undefined) {
    message.clientId = clientId;
  }

  return message;
}

// Default export with both functions
export default {
  parseMessage,
  createMessage
};

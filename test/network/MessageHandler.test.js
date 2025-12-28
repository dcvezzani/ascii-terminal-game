import { describe, test, expect } from 'vitest';
import {
  parseMessage,
  validateMessage,
  createMessage,
  createErrorMessage,
  createStateUpdateMessage,
} from '../../src/network/MessageHandler.js';
import { MessageTypes } from '../../src/network/MessageTypes.js';

describe('MessageHandler', () => {
  describe('parseMessage', () => {
    test('should parse valid JSON message', () => {
      const messageString = JSON.stringify({
        type: MessageTypes.MOVE,
        payload: { x: 1, y: 2 },
      });

      const result = parseMessage(messageString);

      expect(result.error).toBeNull();
      expect(result.message).toBeDefined();
      expect(result.message.type).toBe(MessageTypes.MOVE);
      expect(result.message.payload).toEqual({ x: 1, y: 2 });
    });

    test('should handle malformed JSON', () => {
      const messageString = '{ invalid json }';

      const result = parseMessage(messageString);

      expect(result.message).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MALFORMED_JSON');
      expect(result.error.message).toContain('Failed to parse JSON');
    });

    test('should handle non-string input', () => {
      const result = parseMessage(null);

      expect(result.message).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_INPUT');
    });

    test('should handle empty string', () => {
      const result = parseMessage('');

      expect(result.message).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('validateMessage', () => {
    test('should validate correct message structure', () => {
      const message = {
        type: MessageTypes.MOVE,
        payload: { x: 1, y: 2 },
      };

      const result = validateMessage(message);

      expect(result.error).toBeNull();
      expect(result.message).toBeDefined();
      expect(result.message.type).toBe(MessageTypes.MOVE);
      expect(result.message.payload).toEqual({ x: 1, y: 2 });
      expect(result.message.timestamp).toBeDefined();
    });

    test('should add default timestamp if missing', () => {
      const message = {
        type: MessageTypes.MOVE,
        payload: {},
      };

      const result = validateMessage(message);

      expect(result.error).toBeNull();
      expect(result.message.timestamp).toBeDefined();
      expect(typeof result.message.timestamp).toBe('number');
    });

    test('should add default payload if missing', () => {
      const message = {
        type: MessageTypes.MOVE,
      };

      const result = validateMessage(message);

      expect(result.error).toBeNull();
      expect(result.message.payload).toEqual({});
    });

    test('should reject message without type', () => {
      const message = {
        payload: { x: 1 },
      };

      const result = validateMessage(message);

      expect(result.message).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_TYPE');
    });

    test('should reject message with invalid type', () => {
      const message = {
        type: 'INVALID_TYPE',
        payload: {},
      };

      const result = validateMessage(message);

      expect(result.message).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_TYPE');
      expect(result.error.validTypes).toBeDefined();
    });

    test('should reject non-object payload', () => {
      const message = {
        type: MessageTypes.MOVE,
        payload: 'not an object',
      };

      const result = validateMessage(message);

      expect(result.message).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_PAYLOAD');
    });

    test('should reject non-object message', () => {
      const result = validateMessage('not an object');

      expect(result.message).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_MESSAGE');
    });
  });

  describe('createMessage', () => {
    test('should create message with required fields', () => {
      const message = createMessage(MessageTypes.MOVE, { x: 1, y: 2 });

      expect(message.type).toBe(MessageTypes.MOVE);
      expect(message.payload).toEqual({ x: 1, y: 2 });
      expect(message.timestamp).toBeDefined();
      expect(typeof message.timestamp).toBe('number');
    });

    test('should include clientId if provided', () => {
      const clientId = 'test-client-123';
      const message = createMessage(MessageTypes.MOVE, {}, clientId);

      expect(message.clientId).toBe(clientId);
    });

    test('should default payload to empty object', () => {
      const message = createMessage(MessageTypes.MOVE);

      expect(message.payload).toEqual({});
    });

    test('should default clientId to null', () => {
      const message = createMessage(MessageTypes.MOVE);

      expect(message.clientId).toBeNull();
    });
  });

  describe('createErrorMessage', () => {
    test('should create error message with correct structure', () => {
      const error = createErrorMessage('INVALID_MOVE', 'Cannot move there', {
        action: 'MOVE',
        playerId: 'player-1',
      });

      expect(error.type).toBe(MessageTypes.ERROR);
      expect(error.payload.code).toBe('INVALID_MOVE');
      expect(error.payload.message).toBe('Cannot move there');
      expect(error.payload.context).toBeDefined();
      expect(error.payload.context.action).toBe('MOVE');
      expect(error.payload.context.playerId).toBe('player-1');
    });

    test('should include default context fields', () => {
      const error = createErrorMessage('ERROR_CODE', 'Error message');

      expect(error.payload.context.action).toBeNull();
      expect(error.payload.context.playerId).toBeNull();
      expect(error.payload.context.reason).toBeNull();
    });

    test('should include clientId if provided', () => {
      const clientId = 'test-client-123';
      const error = createErrorMessage('ERROR', 'Message', {}, clientId);

      expect(error.clientId).toBe(clientId);
    });
  });

  describe('createStateUpdateMessage', () => {
    test('should create state update message', () => {
      const gameState = {
        board: [],
        players: [],
        score: 0,
      };

      const message = createStateUpdateMessage(gameState);

      expect(message.type).toBe(MessageTypes.STATE_UPDATE);
      expect(message.payload.gameState).toEqual(gameState);
      expect(message.timestamp).toBeDefined();
    });

    test('should include clientId if provided', () => {
      const clientId = 'test-client-123';
      const message = createStateUpdateMessage({}, clientId);

      expect(message.clientId).toBe(clientId);
    });
  });
});

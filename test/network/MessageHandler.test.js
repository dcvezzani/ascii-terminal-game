import { describe, it, expect } from 'vitest';
import MessageHandler from '../../src/network/MessageHandler.js';
import MessageTypes from '../../src/network/MessageTypes.js';

describe('MessageHandler', () => {
  describe('parseMessage', () => {
    it('should parse valid JSON message', () => {
      const rawData = JSON.stringify({
        type: MessageTypes.CONNECT,
        payload: {},
        timestamp: 1234567890
      });

      const message = MessageHandler.parseMessage(rawData);

      expect(message).toBeDefined();
      expect(message.type).toBe(MessageTypes.CONNECT);
      expect(message.payload).toEqual({});
      expect(message.timestamp).toBe(1234567890);
    });

    it('should parse message with clientId', () => {
      const rawData = JSON.stringify({
        type: MessageTypes.MOVE,
        payload: { dx: 1, dy: 0 },
        timestamp: 1234567890,
        clientId: 'test-client-id'
      });

      const message = MessageHandler.parseMessage(rawData);

      expect(message.clientId).toBe('test-client-id');
    });

    it('should throw error for invalid JSON', () => {
      const rawData = 'invalid json';

      expect(() => {
        MessageHandler.parseMessage(rawData);
      }).toThrow();
    });

    it('should throw error for missing type field', () => {
      const rawData = JSON.stringify({
        payload: {},
        timestamp: 1234567890
      });

      expect(() => {
        MessageHandler.parseMessage(rawData);
      }).toThrow();
    });

    it('should throw error for missing payload field', () => {
      const rawData = JSON.stringify({
        type: MessageTypes.CONNECT,
        timestamp: 1234567890
      });

      expect(() => {
        MessageHandler.parseMessage(rawData);
      }).toThrow();
    });

    it('should throw error for missing timestamp field', () => {
      const rawData = JSON.stringify({
        type: MessageTypes.CONNECT,
        payload: {}
      });

      expect(() => {
        MessageHandler.parseMessage(rawData);
      }).toThrow();
    });
  });

  describe('createMessage', () => {
    it('should create message with correct structure', () => {
      const payload = { dx: 1, dy: 0 };
      const message = MessageHandler.createMessage(MessageTypes.MOVE, payload);

      expect(message).toBeDefined();
      expect(message.type).toBe(MessageTypes.MOVE);
      expect(message.payload).toEqual(payload);
      expect(message.timestamp).toBeDefined();
      expect(typeof message.timestamp).toBe('number');
    });

    it('should include timestamp in message', () => {
      const before = Date.now();
      const message = MessageHandler.createMessage(MessageTypes.CONNECT, {});
      const after = Date.now();

      expect(message.timestamp).toBeGreaterThanOrEqual(before);
      expect(message.timestamp).toBeLessThanOrEqual(after);
    });

    it('should include clientId when provided', () => {
      const payload = {};
      const clientId = 'test-client-id';
      const message = MessageHandler.createMessage(MessageTypes.CONNECT, payload, clientId);

      expect(message.clientId).toBe(clientId);
    });

    it('should not include clientId when not provided', () => {
      const payload = {};
      const message = MessageHandler.createMessage(MessageTypes.CONNECT, payload);

      expect(message.clientId).toBeUndefined();
    });
  });
});

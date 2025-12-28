import { describe, test, expect } from 'vitest';
import { MessageTypes } from '../../src/network/MessageTypes.js';

describe('MessageTypes', () => {
  test('should export all required message types', () => {
    expect(MessageTypes).toHaveProperty('CONNECT');
    expect(MessageTypes).toHaveProperty('DISCONNECT');
    expect(MessageTypes).toHaveProperty('MOVE');
    expect(MessageTypes).toHaveProperty('SET_PLAYER_NAME');
    expect(MessageTypes).toHaveProperty('STATE_UPDATE');
    expect(MessageTypes).toHaveProperty('PLAYER_JOINED');
    expect(MessageTypes).toHaveProperty('PLAYER_LEFT');
    expect(MessageTypes).toHaveProperty('ERROR');
    expect(MessageTypes).toHaveProperty('PING');
    expect(MessageTypes).toHaveProperty('PONG');
  });

  test('all message types should be strings', () => {
    Object.values(MessageTypes).forEach(type => {
      expect(typeof type).toBe('string');
    });
  });

  test('message types should match their key names', () => {
    expect(MessageTypes.CONNECT).toBe('CONNECT');
    expect(MessageTypes.DISCONNECT).toBe('DISCONNECT');
    expect(MessageTypes.MOVE).toBe('MOVE');
    expect(MessageTypes.SET_PLAYER_NAME).toBe('SET_PLAYER_NAME');
    expect(MessageTypes.STATE_UPDATE).toBe('STATE_UPDATE');
    expect(MessageTypes.PLAYER_JOINED).toBe('PLAYER_JOINED');
    expect(MessageTypes.PLAYER_LEFT).toBe('PLAYER_LEFT');
    expect(MessageTypes.ERROR).toBe('ERROR');
    expect(MessageTypes.PING).toBe('PING');
    expect(MessageTypes.PONG).toBe('PONG');
  });
});

import { describe, it, expect } from 'vitest';
import MessageTypes from '../../src/network/MessageTypes.js';

describe('MessageTypes', () => {
  it('should have CONNECT constant', () => {
    expect(MessageTypes.CONNECT).toBeDefined();
    expect(typeof MessageTypes.CONNECT).toBe('string');
  });

  it('should have MOVE constant', () => {
    expect(MessageTypes.MOVE).toBeDefined();
    expect(typeof MessageTypes.MOVE).toBe('string');
  });

  it('should have STATE_UPDATE constant', () => {
    expect(MessageTypes.STATE_UPDATE).toBeDefined();
    expect(typeof MessageTypes.STATE_UPDATE).toBe('string');
  });

  it('should have unique values for each message type', () => {
    const values = Object.values(MessageTypes);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

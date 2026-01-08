import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocketClient from '../../src/network/WebSocketClient.js';

describe('WebSocketClient', () => {
  let client;

  beforeEach(() => {
    client = new WebSocketClient('ws://localhost:3000');
  });

  afterEach(() => {
    if (client) {
      client.disconnect();
    }
  });

  describe('constructor', () => {
    it('should create client with URL', () => {
      expect(client.url).toBe('ws://localhost:3000');
    });

    it('should initialize with disconnected state', () => {
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('on', () => {
    it('should register event handler', () => {
      const callback = vi.fn();
      client.on('message', callback);
      
      // Manually trigger event to test handler registration
      client.emit('message', { type: 'TEST' });
      
      expect(callback).toHaveBeenCalledWith({ type: 'TEST' });
    });
  });

  describe('send', () => {
    it('should not send message when not connected', () => {
      const message = { type: 'TEST', payload: {} };
      // Should not throw, just log warning
      expect(() => client.send(message)).not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should handle disconnect when not connected', () => {
      expect(() => client.disconnect()).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('emit', () => {
    it('should call registered handlers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      client.on('test', callback1);
      client.on('test', callback2);
      
      client.emit('test', 'data');
      
      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });

    it('should handle errors in handlers gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodCallback = vi.fn();
      
      client.on('test', errorCallback);
      client.on('test', goodCallback);
      
      expect(() => client.emit('test', 'data')).not.toThrow();
      expect(goodCallback).toHaveBeenCalled();
    });
  });
});

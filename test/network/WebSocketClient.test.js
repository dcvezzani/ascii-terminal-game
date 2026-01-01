/**
 * WebSocketClient Unit Tests
 * Tests for WebSocketClient configuration and behavior
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient } from '../../src/network/WebSocketClient.js';

// Mock WebSocket - class must be defined inside factory
vi.mock('ws', () => {
  class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 0; // CONNECTING
      this.on = vi.fn();
      this.send = vi.fn();
      this.close = vi.fn();
      
      // Simulate connection after a short delay
      setTimeout(() => {
        this.readyState = 1; // OPEN
        const openHandler = this.on.mock.calls.find(call => call[0] === 'open')?.[1];
        if (openHandler) {
          openHandler();
        }
      }, 10);
    }
  }
  
  return {
    default: MockWebSocket,
  };
});

describe('WebSocketClient Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear environment variables
    delete process.env.WEBSOCKET_URL;
    delete process.env.WEBSOCKET_RECONNECTION_ENABLED;
    delete process.env.WEBSOCKET_RECONNECTION_MAX_ATTEMPTS;
    delete process.env.WEBSOCKET_RECONNECTION_RETRY_DELAY;
    delete process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF;
    delete process.env.WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('URL Configuration', () => {
    test('should use default URL from clientConfig when no URL provided', () => {
      const client = new WebSocketClient();
      expect(client.url).toBe('ws://localhost:3000');
    });

    test('should use constructor parameter URL when provided', () => {
      const customUrl = 'ws://example.com:8080';
      const client = new WebSocketClient(customUrl);
      expect(client.url).toBe(customUrl);
    });

    test('should use environment variable URL when provided and no constructor param', () => {
      process.env.WEBSOCKET_URL = 'ws://env.example.com:9090';
      const client = new WebSocketClient();
      // Constructor should check process.env.WEBSOCKET_URL directly
      expect(client.url).toBe('ws://env.example.com:9090');
    });

    test('should prioritize constructor parameter over environment variable', () => {
      process.env.WEBSOCKET_URL = 'ws://env.example.com:9090';
      const constructorUrl = 'ws://constructor.example.com:8080';
      const client = new WebSocketClient(constructorUrl);
      expect(client.url).toBe(constructorUrl);
    });

    test('should prioritize constructor parameter over config file', () => {
      const constructorUrl = 'ws://override.example.com:7070';
      const client = new WebSocketClient(constructorUrl);
      expect(client.url).toBe(constructorUrl);
    });
  });

  describe('Reconnection Configuration', () => {
    test('should initialize with reconnection state', () => {
      const client = new WebSocketClient();
      expect(client.reconnecting).toBe(false);
      expect(client.reconnectAttempts).toBe(0);
      expect(client.reconnectTimer).toBeNull();
      expect(client.manualDisconnect).toBe(false);
    });
  });

  describe('Environment Variable Overrides', () => {
    test('should use WEBSOCKET_URL from environment', () => {
      process.env.WEBSOCKET_URL = 'ws://env-override.example.com:1234';
      const client = new WebSocketClient();
      expect(client.url).toBe('ws://env-override.example.com:1234');
    });

    test('should handle missing environment variables gracefully', () => {
      // No env vars set, should use defaults from clientConfig
      const client = new WebSocketClient();
      expect(client.url).toBe('ws://localhost:3000');
    });
  });
});


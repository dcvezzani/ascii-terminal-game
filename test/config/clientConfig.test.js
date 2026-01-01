/**
 * Unit tests for client configuration
 * Tests Phase 1.1: Prediction configuration
 * Tests Phase 2: WebSocket and reconnection configuration
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { clientConfig } from '../../src/config/clientConfig.js';

describe('Client Configuration - Phase 1.1', () => {
  describe('prediction configuration', () => {
    test('should have a prediction object', () => {
      expect(clientConfig).toHaveProperty('prediction');
      expect(typeof clientConfig.prediction).toBe('object');
    });

    test('prediction should have enabled property', () => {
      expect(clientConfig.prediction).toHaveProperty('enabled');
      expect(typeof clientConfig.prediction.enabled).toBe('boolean');
      expect(clientConfig.prediction.enabled).toBe(true);
    });

    test('prediction should have reconciliationInterval property', () => {
      expect(clientConfig.prediction).toHaveProperty('reconciliationInterval');
      expect(typeof clientConfig.prediction.reconciliationInterval).toBe('number');
      expect(clientConfig.prediction.reconciliationInterval).toBe(5000);
    });
  });
});

describe('Client Configuration - Phase 2', () => {
  describe('websocket configuration', () => {
    test('should have a websocket object', () => {
      expect(clientConfig).toHaveProperty('websocket');
      expect(typeof clientConfig.websocket).toBe('object');
    });

    test('websocket should have url property', () => {
      expect(clientConfig.websocket).toHaveProperty('url');
      expect(typeof clientConfig.websocket.url).toBe('string');
    });

    test('websocket url should have default value ws://localhost:3000', () => {
      expect(clientConfig.websocket.url).toBe('ws://localhost:3000');
    });
  });

  describe('reconnection configuration', () => {
    test('should have a reconnection object', () => {
      expect(clientConfig).toHaveProperty('reconnection');
      expect(typeof clientConfig.reconnection).toBe('object');
    });

    test('reconnection should have enabled property', () => {
      expect(clientConfig.reconnection).toHaveProperty('enabled');
      expect(typeof clientConfig.reconnection.enabled).toBe('boolean');
      expect(clientConfig.reconnection.enabled).toBe(true);
    });

    test('reconnection should have maxAttempts property', () => {
      expect(clientConfig.reconnection).toHaveProperty('maxAttempts');
      expect(typeof clientConfig.reconnection.maxAttempts).toBe('number');
      expect(clientConfig.reconnection.maxAttempts).toBe(5);
    });

    test('reconnection should have retryDelay property', () => {
      expect(clientConfig.reconnection).toHaveProperty('retryDelay');
      expect(typeof clientConfig.reconnection.retryDelay).toBe('number');
      expect(clientConfig.reconnection.retryDelay).toBe(1000);
    });

    test('reconnection should have exponentialBackoff property', () => {
      expect(clientConfig.reconnection).toHaveProperty('exponentialBackoff');
      expect(typeof clientConfig.reconnection.exponentialBackoff).toBe('boolean');
      expect(clientConfig.reconnection.exponentialBackoff).toBe(true);
    });

    test('reconnection should have maxRetryDelay property', () => {
      expect(clientConfig.reconnection).toHaveProperty('maxRetryDelay');
      expect(typeof clientConfig.reconnection.maxRetryDelay).toBe('number');
      expect(clientConfig.reconnection.maxRetryDelay).toBe(30000);
    });
  });

  describe('environment variable overrides', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
      // Reload config to reset to defaults
      vi.resetModules();
    });

    test('WEBSOCKET_URL should override websocket.url', async () => {
      process.env.WEBSOCKET_URL = 'ws://test.example.com:8080';
      
      // Reload config to pick up environment variable
      vi.resetModules();
      const { clientConfig: reloadedConfig } = await import('../../src/config/clientConfig.js');
      
      expect(reloadedConfig.websocket.url).toBe('ws://test.example.com:8080');
    });

    test('WEBSOCKET_RECONNECTION_ENABLED=true should override reconnection.enabled', async () => {
      process.env.WEBSOCKET_RECONNECTION_ENABLED = 'true';
      
      vi.resetModules();
      const { clientConfig: reloadedConfig } = await import('../../src/config/clientConfig.js');
      
      expect(reloadedConfig.reconnection.enabled).toBe(true);
    });

    test('WEBSOCKET_RECONNECTION_ENABLED=false should override reconnection.enabled', async () => {
      process.env.WEBSOCKET_RECONNECTION_ENABLED = 'false';
      
      vi.resetModules();
      const { clientConfig: reloadedConfig } = await import('../../src/config/clientConfig.js');
      
      expect(reloadedConfig.reconnection.enabled).toBe(false);
    });

    test('WEBSOCKET_RECONNECTION_MAX_ATTEMPTS should override reconnection.maxAttempts', async () => {
      process.env.WEBSOCKET_RECONNECTION_MAX_ATTEMPTS = '10';
      
      vi.resetModules();
      const { clientConfig: reloadedConfig } = await import('../../src/config/clientConfig.js');
      
      expect(reloadedConfig.reconnection.maxAttempts).toBe(10);
    });

    test('WEBSOCKET_RECONNECTION_RETRY_DELAY should override reconnection.retryDelay', async () => {
      process.env.WEBSOCKET_RECONNECTION_RETRY_DELAY = '2000';
      
      vi.resetModules();
      const { clientConfig: reloadedConfig } = await import('../../src/config/clientConfig.js');
      
      expect(reloadedConfig.reconnection.retryDelay).toBe(2000);
    });

    test('WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF=true should override reconnection.exponentialBackoff', async () => {
      process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF = 'true';
      
      vi.resetModules();
      const { clientConfig: reloadedConfig } = await import('../../src/config/clientConfig.js');
      
      expect(reloadedConfig.reconnection.exponentialBackoff).toBe(true);
    });

    test('WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF=false should override reconnection.exponentialBackoff', async () => {
      process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF = 'false';
      
      vi.resetModules();
      const { clientConfig: reloadedConfig } = await import('../../src/config/clientConfig.js');
      
      expect(reloadedConfig.reconnection.exponentialBackoff).toBe(false);
    });

    test('WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY should override reconnection.maxRetryDelay', async () => {
      process.env.WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY = '60000';
      
      vi.resetModules();
      const { clientConfig: reloadedConfig } = await import('../../src/config/clientConfig.js');
      
      expect(reloadedConfig.reconnection.maxRetryDelay).toBe(60000);
    });
  });
});


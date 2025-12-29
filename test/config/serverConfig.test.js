import { describe, test, expect } from 'vitest';
import { serverConfig } from '../../src/config/serverConfig.js';

describe('Server Configuration', () => {
  describe('serverConfig structure', () => {
    test('Exports serverConfig object', () => {
      expect(serverConfig).toBeDefined();
      expect(typeof serverConfig).toBe('object');
    });

    test('Has websocket configuration section', () => {
      expect(serverConfig).toHaveProperty('websocket');
      expect(typeof serverConfig.websocket).toBe('object');
    });

    test('Has logging configuration section', () => {
      expect(serverConfig).toHaveProperty('logging');
      expect(typeof serverConfig.logging).toBe('object');
    });

    test('Has reconnection configuration section', () => {
      expect(serverConfig).toHaveProperty('reconnection');
      expect(typeof serverConfig.reconnection).toBe('object');
    });
  });

  describe('websocket configuration', () => {
    test('Has enabled property (default: true)', () => {
      expect(serverConfig.websocket).toHaveProperty('enabled');
      expect(serverConfig.websocket.enabled).toBe(true);
      expect(typeof serverConfig.websocket.enabled).toBe('boolean');
    });

    test('Has port property (default: 3000)', () => {
      expect(serverConfig.websocket).toHaveProperty('port');
      expect(serverConfig.websocket.port).toBe(3000);
      expect(typeof serverConfig.websocket.port).toBe('number');
      expect(serverConfig.websocket.port).toBeGreaterThan(0);
      expect(serverConfig.websocket.port).toBeLessThanOrEqual(65535);
    });

    test('Has host property (default: "0.0.0.0")', () => {
      expect(serverConfig.websocket).toHaveProperty('host');
      expect(serverConfig.websocket.host).toBe('0.0.0.0');
      expect(typeof serverConfig.websocket.host).toBe('string');
    });

    test('Has updateInterval property (default: 100ms)', () => {
      expect(serverConfig.websocket).toHaveProperty('updateInterval');
      expect(serverConfig.websocket.updateInterval).toBe(100);
      expect(typeof serverConfig.websocket.updateInterval).toBe('number');
      expect(serverConfig.websocket.updateInterval).toBeGreaterThan(0);
    });

    test('updateInterval represents 10 updates per second', () => {
      const updatesPerSecond = 1000 / serverConfig.websocket.updateInterval;
      expect(updatesPerSecond).toBe(10);
    });
  });

  describe('logging configuration', () => {
    test('Has level property (default: "info")', () => {
      expect(serverConfig.logging).toHaveProperty('level');
      expect(serverConfig.logging.level).toBe('info');
      expect(typeof serverConfig.logging.level).toBe('string');
    });

    test('Logging level is one of valid values', () => {
      const validLevels = ['debug', 'info', 'warn', 'error'];
      expect(validLevels).toContain(serverConfig.logging.level);
    });
  });

  describe('reconnection configuration', () => {
    test('Has enabled property (default: true)', () => {
      expect(serverConfig.reconnection).toHaveProperty('enabled');
      expect(serverConfig.reconnection.enabled).toBe(true);
      expect(typeof serverConfig.reconnection.enabled).toBe('boolean');
    });

    test('Has maxAttempts property (default: 5)', () => {
      expect(serverConfig.reconnection).toHaveProperty('maxAttempts');
      expect(serverConfig.reconnection.maxAttempts).toBe(5);
      expect(typeof serverConfig.reconnection.maxAttempts).toBe('number');
      expect(serverConfig.reconnection.maxAttempts).toBeGreaterThan(0);
    });

    test('Has retryDelay property (default: 1000ms)', () => {
      expect(serverConfig.reconnection).toHaveProperty('retryDelay');
      expect(serverConfig.reconnection.retryDelay).toBe(1000);
      expect(typeof serverConfig.reconnection.retryDelay).toBe('number');
      expect(serverConfig.reconnection.retryDelay).toBeGreaterThan(0);
    });
  });

  describe('Configuration matches specification', () => {
    test('Port matches specification answer (3000)', () => {
      expect(serverConfig.websocket.port).toBe(3000);
    });

    test('Host matches specification answer ("0.0.0.0")', () => {
      expect(serverConfig.websocket.host).toBe('0.0.0.0');
    });

    test('Update interval matches current configuration (100ms = 10/sec)', () => {
      expect(serverConfig.websocket.updateInterval).toBe(100);
    });

    test('Logging level matches specification answer ("info")', () => {
      expect(serverConfig.logging.level).toBe('info');
    });

    test('Reconnection enabled matches specification answer (true)', () => {
      expect(serverConfig.reconnection.enabled).toBe(true);
    });
  });
});

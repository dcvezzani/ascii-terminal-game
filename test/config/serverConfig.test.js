import { describe, it, expect } from 'vitest';
import serverConfig from '../../config/serverConfig.js';

describe('serverConfig', () => {
  it('should have websocket configuration', () => {
    expect(serverConfig.websocket).toBeDefined();
    expect(serverConfig.websocket.enabled).toBe(true);
    expect(serverConfig.websocket.port).toBe(3000);
    expect(serverConfig.websocket.host).toBe('0.0.0.0');
  });

  it('should have logging configuration', () => {
    expect(serverConfig.logging).toBeDefined();
    expect(serverConfig.logging.level).toBe('info');
  });

  it('should have spawnPoints configuration with maxCount, clearRadius, waitMessage', () => {
    expect(serverConfig.spawnPoints).toBeDefined();
    expect(serverConfig.spawnPoints.maxCount).toBe(25);
    expect(serverConfig.spawnPoints.clearRadius).toBe(3);
    expect(serverConfig.spawnPoints.waitMessage).toContain('spawn point');
  });

  it('should have input.keyRepeatIntervalMs defined (number, ms between repeated key moves)', () => {
    expect(serverConfig.input).toBeDefined();
    expect(serverConfig.input.keyRepeatIntervalMs).toBeDefined();
    expect(typeof serverConfig.input.keyRepeatIntervalMs).toBe('number');
    expect(serverConfig.input.keyRepeatIntervalMs).toBeGreaterThanOrEqual(0);
  });
});

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
});

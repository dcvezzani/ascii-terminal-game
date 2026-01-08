import { describe, it, expect } from 'vitest';
import clientConfig from '../../config/clientConfig.js';

describe('clientConfig', () => {
  it('should have websocket configuration', () => {
    expect(clientConfig.websocket).toBeDefined();
    expect(clientConfig.websocket.url).toBe('ws://localhost:3000');
  });

  it('should have logging configuration', () => {
    expect(clientConfig.logging).toBeDefined();
    expect(clientConfig.logging.level).toBe('info');
  });
});

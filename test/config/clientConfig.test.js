import { describe, it, expect } from 'vitest';
import clientConfig from '../../config/clientConfig.js';

describe('clientConfig', () => {
  it('should have websocket configuration', () => {
    expect(clientConfig.websocket).toBeDefined();
    expect(clientConfig.websocket.url).toBe('ws://localhost:3000');
  });

  it('should have logging configuration', () => {
    expect(clientConfig.logging).toBeDefined();
  });

  it('should have statusBar configuration with widthThreshold default', () => {
    expect(clientConfig.statusBar).toBeDefined();
    expect(clientConfig.statusBar.widthThreshold).toBeDefined();
    expect(typeof clientConfig.statusBar.widthThreshold).toBe('number');
    expect(clientConfig.statusBar.widthThreshold).toBe(25);
  });

  it('should have rendering.centerBoard defined (default true)', () => {
    expect(clientConfig.rendering).toBeDefined();
    expect(clientConfig.rendering.centerBoard).toBeDefined();
    expect(typeof clientConfig.rendering.centerBoard).toBe('boolean');
    expect(clientConfig.rendering.centerBoard).toBe(true);
  });

  it('should have rendering.resizeDebounceMs defined (default 200)', () => {
    expect(clientConfig.rendering.resizeDebounceMs).toBeDefined();
    expect(typeof clientConfig.rendering.resizeDebounceMs).toBe('number');
    expect(clientConfig.rendering.resizeDebounceMs).toBe(200);
  });

  it('should have rendering.remoteDisplayEasing defined (default true)', () => {
    expect(clientConfig.rendering.remoteDisplayEasing).toBeDefined();
    expect(typeof clientConfig.rendering.remoteDisplayEasing).toBe('boolean');
    expect(clientConfig.rendering.remoteDisplayEasing).toBe(true);
  });
});

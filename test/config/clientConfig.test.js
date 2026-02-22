import { describe, it, expect } from 'vitest';
import clientConfig from '../../config/clientConfig.js';

describe('clientConfig', () => {
  it('should have websocket configuration with url', () => {
    expect(clientConfig.websocket).toBeDefined();
    expect(clientConfig.websocket.url).toBeDefined();
    expect(typeof clientConfig.websocket.url).toBe('string');
    expect(clientConfig.websocket.url.length).toBeGreaterThan(0);
  });

  it('should have logging configuration', () => {
    expect(clientConfig.logging).toBeDefined();
  });

  it('should have statusBar configuration with widthThreshold (number)', () => {
    expect(clientConfig.statusBar).toBeDefined();
    expect(clientConfig.statusBar.widthThreshold).toBeDefined();
    expect(typeof clientConfig.statusBar.widthThreshold).toBe('number');
    expect(clientConfig.statusBar.widthThreshold).toBeGreaterThanOrEqual(0);
  });

  it('should have rendering.centerBoard defined (boolean)', () => {
    expect(clientConfig.rendering).toBeDefined();
    expect(clientConfig.rendering.centerBoard).toBeDefined();
    expect(typeof clientConfig.rendering.centerBoard).toBe('boolean');
  });

  it('should have rendering.resizeDebounceMs defined (number)', () => {
    expect(clientConfig.rendering).toBeDefined();
    expect(clientConfig.rendering.resizeDebounceMs).toBeDefined();
    expect(typeof clientConfig.rendering.resizeDebounceMs).toBe('number');
    expect(clientConfig.rendering.resizeDebounceMs).toBeGreaterThanOrEqual(0);
  });

  it('should have rendering.remoteDisplayEasing defined (boolean)', () => {
    expect(clientConfig.rendering).toBeDefined();
    expect(clientConfig.rendering.remoteDisplayEasing).toBeDefined();
    expect(typeof clientConfig.rendering.remoteDisplayEasing).toBe('boolean');
  });
});

import { describe, it, expect } from 'vitest';
import {
  getDefaultServerConfig,
  getDefaultClientConfig
} from '../../src/config/defaults.js';

describe('Default config (Phase 3.1)', () => {
  it('getDefaultServerConfig returns object with websocket.port, logging, board, spawnPoints', () => {
    const c = getDefaultServerConfig();
    expect(c.websocket).toBeDefined();
    expect(c.websocket.port).toBeDefined();
    expect(typeof c.websocket.port).toBe('number');
    expect(c.logging).toBeDefined();
    expect(c.board).toBeDefined();
    expect(c.spawnPoints).toBeDefined();
  });

  it('getDefaultClientConfig returns object with websocket.url of form ws://localhost:<port>', () => {
    const c = getDefaultClientConfig();
    expect(c.websocket).toBeDefined();
    expect(c.websocket.url).toMatch(/^ws:\/\/localhost:\d+$/);
  });

  it('client default websocket.url port equals server default websocket.port', () => {
    const server = getDefaultServerConfig();
    const client = getDefaultClientConfig();
    const portFromUrl = parseInt(client.websocket.url.replace(/^ws:\/\/localhost:(\d+)$/, '$1'), 10);
    expect(portFromUrl).toBe(server.websocket.port);
  });
});

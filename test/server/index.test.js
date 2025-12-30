import { describe, test, expect } from 'vitest';
import { serverConfig } from '../../src/config/serverConfig.js';
import WebSocket from 'ws';

describe('Server Entry Point', () => {
  test('should have server running and accepting connections', async () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3000');

      ws.on('open', () => {
        ws.close();
        resolve();
      });

      ws.on('error', error => {
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('Connection timeout - server not running'));
      }, 5000);
    });
  });

  test('should have server listening on configured port', () => {
    expect(serverConfig.websocket.port).toBe(3000);
    expect(serverConfig.websocket.host).toBe('0.0.0.0');
  });
});

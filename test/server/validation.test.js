import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { startServer, stopServer } from '../../src/server/index.js';
import WebSocket from 'ws';

describe('Action Validation', () => {
  beforeEach(async () => {
    try {
      await stopServer();
    } catch (error) {
      // Ignore errors
    }
  });

  afterEach(async () => {
    try {
      await stopServer();
    } catch (error) {
      // Ignore errors
    }
  });

  test('should reject MOVE with invalid dx/dy values (out of range)', async () => {
    await startServer();

    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3000');
      let connected = false;
      let errorReceived = false;

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'CONNECT') {
          connected = true;
          // Send CONNECT to join as player
          ws.send(
            JSON.stringify({
              type: 'CONNECT',
              payload: { playerName: 'TestPlayer' },
            })
          );
        } else if (message.type === 'STATE_UPDATE') {
          // Player joined, now send invalid move
          ws.send(
            JSON.stringify({
              type: 'MOVE',
              payload: { dx: 2, dy: 0 },
            })
          );
        } else if (message.type === 'ERROR' && message.payload.code === 'INVALID_MOVE') {
          errorReceived = true;
          expect(message.payload.message).toContain('dx and dy must be -1, 0, or 1');
          ws.close();
          resolve();
        }
      });

      ws.on('error', error => {
        reject(error);
      });

      setTimeout(() => {
        if (!connected) {
          reject(new Error('Connection not established'));
        } else if (!errorReceived) {
          reject(new Error('Error not received'));
        }
      }, 5000);
    });
  });

  test('should reject MOVE with non-numeric dx/dy', async () => {
    await startServer();

    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3000');
      let connected = false;
      let errorReceived = false;

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'CONNECT') {
          connected = true;
          // Send CONNECT to join as player
          ws.send(
            JSON.stringify({
              type: 'CONNECT',
              payload: { playerName: 'TestPlayer' },
            })
          );
        } else if (message.type === 'STATE_UPDATE') {
          // Player joined, now send invalid move
          ws.send(
            JSON.stringify({
              type: 'MOVE',
              payload: { dx: '1', dy: 0 },
            })
          );
        } else if (message.type === 'ERROR' && message.payload.code === 'INVALID_MOVE') {
          errorReceived = true;
          expect(message.payload.message).toContain('dx and dy must be numbers');
          ws.close();
          resolve();
        }
      });

      ws.on('error', error => {
        reject(error);
      });

      setTimeout(() => {
        if (!connected) {
          reject(new Error('Connection not established'));
        } else if (!errorReceived) {
          reject(new Error('Error not received'));
        }
      }, 5000);
    });
  });

  test('should reject MOVE when player not connected', async () => {
    await startServer();

    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3000');
      let connected = false;
      let errorReceived = false;

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'CONNECT') {
          connected = true;
          // Send MOVE without joining as player first
          ws.send(
            JSON.stringify({
              type: 'MOVE',
              payload: { dx: 1, dy: 0 },
            })
          );
        } else if (message.type === 'ERROR' && message.payload.code === 'NOT_CONNECTED') {
          errorReceived = true;
          expect(message.payload.message).toContain('Player not connected');
          ws.close();
          resolve();
        }
      });

      ws.on('error', error => {
        reject(error);
      });

      setTimeout(() => {
        if (!connected) {
          reject(new Error('Connection not established'));
        } else if (!errorReceived) {
          reject(new Error('Error not received'));
        }
      }, 5000);
    });
  });
});

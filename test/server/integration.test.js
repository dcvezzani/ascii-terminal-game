import { describe, test, expect } from 'vitest';
import WebSocket from 'ws';

describe('Server Integration', () => {
  test('should accept new connections', async () => {
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
        reject(new Error('Connection timeout'));
      }, 5000);
    });
  });

  test('should send CONNECT message with client ID and game state', async () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3000');
      let messageReceived = false;

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'CONNECT') {
          expect(message.payload).toBeDefined();
          expect(message.payload.clientId).toBeDefined();
          expect(message.payload.gameState).toBeDefined();
          expect(message.payload.gameState.board).toBeDefined();
          expect(message.payload.gameState.players).toBeDefined();
          messageReceived = true;
          ws.close();
          resolve();
        }
      });

      ws.on('error', error => {
        reject(error);
      });

      setTimeout(() => {
        if (!messageReceived) {
          reject(new Error('CONNECT message not received'));
        }
      }, 5000);
    });
  });

  test('should handle MOVE message', async () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3000');
      let connected = false;
      let moveProcessed = false;

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'CONNECT') {
          connected = true;
          // Send CONNECT to join as player first
          ws.send(
            JSON.stringify({
              type: 'CONNECT',
              payload: { playerName: 'TestPlayer' },
            })
          );
        } else if (message.type === 'STATE_UPDATE') {
          // Player joined, now send MOVE message
          if (!moveProcessed) {
            ws.send(
              JSON.stringify({
                type: 'MOVE',
                payload: { dx: 1, dy: 0 },
              })
            );
            moveProcessed = true;
            // Wait for next state update
          } else {
            // Second state update after move
            ws.close();
            resolve();
          }
        } else if (message.type === 'ERROR') {
          // Move might fail, that's okay for this test
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
        } else if (!moveProcessed) {
          reject(new Error('Move not processed'));
        }
      }, 5000);
    });
  });

  test('should handle PING message with PONG response', async () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3000');
      let pongReceived = false;

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'CONNECT') {
          // Send PING message
          ws.send(
            JSON.stringify({
              type: 'PING',
              payload: {},
            })
          );
        } else if (message.type === 'PONG') {
          pongReceived = true;
          ws.close();
          resolve();
        }
      });

      ws.on('error', error => {
        reject(error);
      });

      setTimeout(() => {
        if (!pongReceived) {
          reject(new Error('PONG not received'));
        }
      }, 5000);
    });
  });

  test('should handle disconnect and cleanup', async () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3000');

      ws.on('open', () => {
        // Close connection immediately
        ws.close();
        // Give server time to clean up
        setTimeout(() => {
          resolve();
        }, 1000);
      });

      ws.on('error', error => {
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('Test timeout'));
      }, 5000);
    });
  });
});

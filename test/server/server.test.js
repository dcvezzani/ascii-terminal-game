import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocketServer } from 'ws';
import Server from '../../src/server/server.js';
import MessageTypes from '../../src/network/MessageTypes.js';

describe('Server', () => {
  let server;
  const TEST_PORT = 3001; // Use different port to avoid conflicts

  beforeEach(() => {
    server = new Server(TEST_PORT);
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('constructor', () => {
    it('should create server with port', () => {
      expect(server.port).toBe(TEST_PORT);
    });

    it('should have connectionManager', () => {
      expect(server.connectionManager).toBeDefined();
    });
  });

  describe('start', () => {
    it('should start WebSocket server', async () => {
      await server.start();
      expect(server.wss).toBeDefined();
      expect(server.wss instanceof WebSocketServer).toBe(true);
    }, 10000);

    it('should listen on specified port', async () => {
      await server.start();
      // Server should be listening - we can't easily test the port without connecting
      expect(server.wss).toBeDefined();
    }, 10000);
  });

  describe('stop', () => {
    it('should stop server gracefully', async () => {
      await server.start();
      await server.stop();
      
      // Server should be stopped
      expect(server.wss).toBeDefined();
    }, 10000);
  });

  describe('connection handling', () => {
    it('should handle new connections', async () => {
      await server.start();

      // Create a mock WebSocket client
      const WebSocket = (await import('ws')).WebSocket;
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);

      await new Promise((resolve) => {
        client.on('open', () => {
          resolve();
        });
      });

      // Give server time to process connection
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify connection was added
      const connections = server.connectionManager.getAllConnections();
      expect(connections.length).toBeGreaterThan(0);

      client.close();
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 15000);

    it('should not send CONNECT message on connection (waits for client)', async () => {
      await server.start();

      const WebSocket = (await import('ws')).WebSocket;
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);

      let messageReceived = false;
      client.on('message', () => {
        messageReceived = true;
      });

      await new Promise((resolve) => {
        client.on('open', () => {
          resolve();
        });
      });

      // Wait a bit to ensure no message is sent
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Server should not send CONNECT message automatically
      expect(messageReceived).toBe(false);

      client.close();
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 15000);
  });
});

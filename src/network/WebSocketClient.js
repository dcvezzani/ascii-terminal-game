import { WebSocket } from 'ws';
import logger from '../utils/logger.js';

/**
 * WebSocket Client class for connecting to the game server
 */
export class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.eventHandlers = new Map();
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    if (this.ws && this.connected) {
      logger.warn('Already connected');
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      this.connected = true;
      logger.info('Connected to server');
      this.emit('connect');
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.emit('message', message);
      } catch (error) {
        logger.error('Error parsing message:', error);
        this.emit('error', error);
      }
    });

    this.ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.emit('error', error);
    });

    this.ws.on('close', () => {
      this.connected = false;
      logger.info('Disconnected from server');
      this.emit('close');
    });
  }

  /**
   * Send a message to the server
   * @param {object} message - Message object to send
   */
  send(message) {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot send message: not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Register an event handler
   * @param {string} event - Event name (connect, message, error, close)
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }

  /**
   * Emit an event to registered handlers
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * Check if connected to server
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Default export
export default WebSocketClient;

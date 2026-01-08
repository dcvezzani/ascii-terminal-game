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
    this.messageQueue = []; // Queue for messages when socket is not ready
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
      // Flush queued messages when connection opens
      this.flushMessageQueue();
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
    // WebSocket states: CONNECTING (0), OPEN (1), CLOSING (2), CLOSED (3)
    // The ws library can queue messages when in CONNECTING state
    // Only queue if socket is CLOSING, CLOSED, or not initialized
    
    if (!this.ws) {
      // Socket not initialized - queue message
      this.messageQueue.push(message);
      logger.debug('Queued message (socket not initialized)');
      return;
    }

    const readyState = this.ws.readyState;
    
    if (readyState === WebSocket.OPEN) {
      // Socket is open - send immediately
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Error sending message, queueing for retry:', error);
        // If send fails, queue for retry
        this.messageQueue.push(message);
      }
    } else if (readyState === WebSocket.CONNECTING) {
      // Socket is connecting - ws library will queue automatically, but we'll also queue as backup
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        // If send fails during connecting, queue it
        this.messageQueue.push(message);
        logger.debug('Queued message (socket connecting, send failed)');
      }
    } else {
      // Socket is CLOSING or CLOSED - queue message
      this.messageQueue.push(message);
      logger.debug(`Queued message (socket state: ${readyState}, CLOSING/CLOSED)`);
    }
  }

  /**
   * Flush queued messages when socket becomes ready
   */
  flushMessageQueue() {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const queueLength = this.messageQueue.length;
    if (queueLength > 0) {
      logger.debug(`Flushing ${queueLength} queued message(s)`);
      
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          logger.error('Error sending queued message:', error);
          // Re-queue if send fails
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
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

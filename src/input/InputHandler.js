import process from 'process';
import logger from '../utils/logger.js';

/**
 * InputHandler class for capturing keyboard input
 */
export class InputHandler {
  constructor() {
    this.moveCallback = null;
    this.quitCallback = null;
    this.renderCallback = null;
    this.fireCallback = null;
    this.dataHandler = null;
    this.running = false;
  }

  /**
   * Start capturing input
   */
  start() {
    if (this.running) {
      return;
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    this.dataHandler = (data) => {
      this.handleInput(data);
    };

    process.stdin.on('data', this.dataHandler);
    this.running = true;
  }

  /**
   * Stop capturing input
   */
  stop() {
    if (!this.running) {
      return;
    }

    if (this.dataHandler) {
      process.stdin.removeListener('data', this.dataHandler);
    }

    process.stdin.setRawMode(false);
    process.stdin.pause();
    this.running = false;
  }

  /**
   * Register movement callback
   * @param {Function} callback - Callback function (dx, dy)
   */
  onMove(callback) {
    this.moveCallback = callback;
  }

  /**
   * Register quit callback
   * @param {Function} callback - Callback function
   */
  onQuit(callback) {
    this.quitCallback = callback;
  }

  /**
   * Register render callback
   * @param {Function} callback - Callback function
   */
  onRender(callback) {
    this.renderCallback = callback;
  }

  onFire(callback) {
    this.fireCallback = callback;
  }

  /**
   * Handle raw input data
   * @param {Buffer|string} data - Raw input data
   */
  handleInput(data) {
    const str = data.toString();

    // Arrow keys
    if (str === '\x1b[A') { // Up
      this.triggerMove(0, -1);
    } else if (str === '\x1b[B') { // Down
      this.triggerMove(0, 1);
    } else if (str === '\x1b[D') { // Left
      this.triggerMove(-1, 0);
    } else if (str === '\x1b[C') { // Right
      this.triggerMove(1, 0);
    }
    // WASD keys
    else if (str === 'w' || str === 'W') {
      this.triggerMove(0, -1);
    } else if (str === 's' || str === 'S') {
      this.triggerMove(0, 1);
    } else if (str === 'a' || str === 'A') {
      this.triggerMove(-1, 0);
    } else if (str === 'd' || str === 'D') {
      this.triggerMove(1, 0);
    }
    // Quit keys
    else if (str === 'q' || str === 'Q' || str === '\x1b') { // Q or ESC
      this.triggerQuit();
    }
    else if (str === 'r' || str === 'R') { // R
      this.triggerRender();
    }
    else if (str === 'k' || str === 'K') { // Fire up
      this.triggerFire(0, -1);
    }
    else if (str === 'j' || str === 'J') { // Fire down
      this.triggerFire(0, 1);
    }
    else if (str === 'h' || str === 'H') { // Fire left
      this.triggerFire(-1, 0);
    }
    else if (str === 'l' || str === 'L') { // Fire right
      this.triggerFire(1, 0);
    }
  }

  /**
   * Trigger movement callback
   * @param {number} dx - Delta X
   * @param {number} dy - Delta Y
   */
  triggerMove(dx, dy) {
    if (this.moveCallback) {
      try {
        this.moveCallback(dx, dy);
      } catch (error) {
        logger.error('Error in move callback:', error);
      }
    }
  }

  /**
   * Trigger quit callback
   */
  triggerQuit() {
    if (this.quitCallback) {
      try {
        this.quitCallback();
      } catch (error) {
        logger.error('Error in quit callback:', error);
      }
    }
  }

  /**
   * Trigger render callback
   */
  triggerRender() {
    if (this.renderCallback) {
      try {
        this.renderCallback();
      } catch (error) {
        logger.error('Error in render callback:', error);
      }
    }
  }

  triggerFire(dx, dy) {
    if (this.fireCallback) {
      try {
        this.fireCallback(dx, dy);
      } catch (error) {
        logger.error('Error in fire callback:', error);
      }
    }
  }
}

// Default export
export default InputHandler;

import readline from 'readline';

/**
 * InputHandler class manages keyboard input for the game
 */
export class InputHandler {
  /**
   * @param {Object} callbacks - Object containing callback functions
   * @param {Function} callbacks.onMoveUp - Called when up arrow/W pressed
   * @param {Function} callbacks.onMoveDown - Called when down arrow/S pressed
   * @param {Function} callbacks.onMoveLeft - Called when left arrow/A pressed
   * @param {Function} callbacks.onMoveRight - Called when right arrow/D pressed
   * @param {Function} callbacks.onQuit - Called when Q or ESC pressed
   * @param {Function} callbacks.onRestart - Called when R pressed
   * @param {Function} callbacks.onHelp - Called when H or ? pressed
   */
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.rl = null;
    this.listening = false;
    this.buffer = '';
  }

  /**
   * Start listening for keyboard input
   */
  start() {
    if (this.listening) {
      return;
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Enable raw mode to capture individual keypresses
    readline.emitKeypressEvents(process.stdin);
    
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    // Handle keypress events
    process.stdin.on('keypress', (str, key) => {
      this.handleKeypress(str, key);
    });

    this.listening = true;
  }

  /**
   * Stop listening for input and cleanup
   */
  stop() {
    if (!this.listening) {
      return;
    }

    // Remove listeners first to prevent any further keypress processing
    process.stdin.removeAllListeners('keypress');

    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }

    process.stdin.pause();

    this.listening = false;
  }

  /**
   * Handle a keypress event
   * @param {string} str - Character string
   * @param {Object} key - Key object with name, ctrl, etc.
   */
  handleKeypress(str, key) {
    // Handle Ctrl+C
    if (key && key.ctrl && key.name === 'c') {
      if (this.callbacks.onQuit) {
        this.callbacks.onQuit();
      }
      return;
    }

    // Handle escape sequence (arrow keys)
    if (key && key.name) {
      switch (key.name) {
        case 'up':
          if (this.callbacks.onMoveUp) {
            this.callbacks.onMoveUp();
          }
          return;
        case 'down':
          if (this.callbacks.onMoveDown) {
            this.callbacks.onMoveDown();
          }
          return;
        case 'left':
          if (this.callbacks.onMoveLeft) {
            this.callbacks.onMoveLeft();
          }
          return;
        case 'right':
          if (this.callbacks.onMoveRight) {
            this.callbacks.onMoveRight();
          }
          return;
        case 'escape':
          if (this.callbacks.onQuit) {
            this.callbacks.onQuit();
          }
          return;
      }
    }

    // Handle character keys
    if (str && typeof str === 'string') {
      const lowerStr = str.toLowerCase();
      
      switch (lowerStr) {
        case 'w':
          if (this.callbacks.onMoveUp) {
            this.callbacks.onMoveUp();
          }
          break;
        case 's':
          if (this.callbacks.onMoveDown) {
            this.callbacks.onMoveDown();
          }
          break;
        case 'a':
          if (this.callbacks.onMoveLeft) {
            this.callbacks.onMoveLeft();
          }
          break;
        case 'd':
          if (this.callbacks.onMoveRight) {
            this.callbacks.onMoveRight();
          }
          break;
        case 'q':
          if (this.callbacks.onQuit) {
            this.callbacks.onQuit();
          }
          return; // Return immediately to prevent any further processing
        case 'r':
          if (this.callbacks.onRestart) {
            this.callbacks.onRestart();
          }
          break;
        case 'h':
        case '?':
          if (this.callbacks.onHelp) {
            this.callbacks.onHelp();
          }
          break;
        default:
          if (this.callbacks.onUnsupportedKey) {
            this.callbacks.onUnsupportedKey();
          }
          break;
      }
    }
  }
}


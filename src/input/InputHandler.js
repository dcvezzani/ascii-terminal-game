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

    // Get readable string from key input or character string
    const keyNameOrSequence = (key && (key.name || key.sequence)) || str;

    if (keyNameOrSequence) {
      const keyString = String(keyNameOrSequence).toLowerCase();
      switch (keyString) {
        case 'w':
        case 'up':
          if (this.callbacks.onMoveUp) {
            this.callbacks.onMoveUp();
          }
          return;
        case 's':
        case 'down':
          if (this.callbacks.onMoveDown) {
            this.callbacks.onMoveDown();
          }
          return;
        case 'd':
        case 'right':
          if (this.callbacks.onMoveRight) {
            this.callbacks.onMoveRight();
          }
          return;
        case 'a':
        case 'left':
          if (this.callbacks.onMoveLeft) {
            this.callbacks.onMoveLeft();
          }
          return;
        case 'q':
        case 'escape':
          if (this.callbacks.onQuit) {
            this.callbacks.onQuit();
          }
          return;
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

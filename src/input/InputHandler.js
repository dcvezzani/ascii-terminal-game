import readline from 'readline';
import { ModalInputHandler } from '../ui/ModalInputHandler.js';

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
   * @param {ModalManager} [modalManager] - Optional ModalManager instance
   * @param {Function} [onModalStateChange] - Optional callback when modal state changes (for re-rendering)
   */
  constructor(callbacks = {}, modalManager = null, onModalStateChange = null) {
    this.callbacks = callbacks;
    this.modalManager = modalManager;
    this.modalInputHandler = modalManager ? new ModalInputHandler(modalManager) : null;
    this.onModalStateChange = onModalStateChange; // Callback to trigger re-render
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

    // Enable raw mode to capture individual keypresses
    // We don't need readline.createInterface - it causes buffering
    // Just use emitKeypressEvents to parse keypresses
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    // Handle keypress events directly - no readline interface needed
    process.stdin.on('keypress', (str, key) => {
      this.handleKeypress(str, key);
    });

    // Also handle 'data' events to drain any buffered data immediately
    process.stdin.on('data', (chunk) => {
      // Data is already handled by keypress events
      // This listener just ensures we don't accumulate buffered data
      // The keypress handler will process it
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
    process.stdin.removeAllListeners('data');

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
   * Clear any buffered input from stdin
   * This prevents characters from accumulating in the input buffer
   */
  clearInputBuffer() {
    if (!process.stdin.isTTY || !process.stdin.readable) {
      return;
    }
    
    // Drain any buffered data from stdin synchronously
    // This immediately clears any pending input
    try {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        // Discard the chunk - this drains the buffer
      }
    } catch (error) {
      // Ignore errors when reading (might not be readable at this moment)
    }
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

    // If a modal is open, delegate input to the modal's input handler
    // When a modal is open, NO game inputs should be processed
    if (this.modalManager && this.modalManager.hasOpenModal()) {
      const modal = this.modalManager.getCurrentModal();
      const wasOpen = this.modalManager.hasOpenModal();
      
      // The modal input handler will return true if it handled the key
      // Even if it returns false, we still don't process game input when modal is open
      this.modalInputHandler.handleKeypress(str, key, modal);
      
      // Check if modal state changed (opened, closed, or selection changed)
      const isNowOpen = this.modalManager.hasOpenModal();
      if (this.onModalStateChange) {
        // Always trigger callback if modal state changed (opened/closed) or if still open (selection might have changed)
        if (wasOpen !== isNowOpen || isNowOpen) {
          this.onModalStateChange();
        }
      }
      
      return; // Always return - modal is open, so no game input processing
    }

    // Clear input buffer after every keypress to prevent accumulation
    // Do this early to drain any buffered data
    this.clearInputBuffer();

    // Get readable string from key input or character string
    const keyNameOrSequence = (key && (key.name || key.sequence)) || str;

    if (keyNameOrSequence) {
      const keyString = String(keyNameOrSequence).toLowerCase();
      switch (keyString) {
        case 't':
          if (this.callbacks.onRenderOtherPlayer) {
            this.callbacks.onRenderOtherPlayer();
          }
          return;
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

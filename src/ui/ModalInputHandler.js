/**
 * ModalInputHandler helper class for handling modal input
 * Used by InputHandler to process modal-specific keyboard input
 */
export class ModalInputHandler {
  /**
   * Create a new ModalInputHandler instance
   * @param {ModalManager} modalManager - ModalManager instance
   */
  constructor(modalManager) {
    this.modalManager = modalManager;
  }

  /**
   * Handle a keypress event for a modal
   * @param {string} str - Character string
   * @param {Object} key - Key object with name, ctrl, etc.
   * @param {Modal} modal - Current modal instance
   * @returns {boolean} True if key was handled, false otherwise
   */
  handleKeypress(str, key, modal) {
    if (!modal) {
      return false;
    }

    // Get readable string from key input or character string
    const keyNameOrSequence = (key && (key.name || key.sequence)) || str;
    if (!keyNameOrSequence) {
      return false;
    }

    const keyString = String(keyNameOrSequence).toLowerCase();

    // Handle up/down navigation
    if (keyString === 'up' || keyString === 'w') {
      this.navigateUp(modal);
      return true;
    }

    if (keyString === 'down' || keyString === 's') {
      this.navigateDown(modal);
      return true;
    }

    // Handle Enter key for option selection
    if (keyString === 'return' || keyString === 'enter') {
      // Execute action from selected option
      this.modalManager.executeSelectedAction();
      return true;
    }

    // Handle ESC and 'q' keys for closing modal
    if (keyString === 'escape' || keyString === 'q') {
      this.modalManager.closeModal();
      return true;
    }

    // Key not handled by modal
    return false;
  }

  /**
   * Navigate to previous option (skip message blocks)
   * @param {Modal} modal - Modal instance
   */
  navigateUp(modal) {
    const currentIndex = modal.getSelectedIndex();
    if (currentIndex > 0) {
      modal.setSelectedIndex(currentIndex - 1);
    }
  }

  /**
   * Navigate to next option (skip message blocks)
   * @param {Modal} modal - Modal instance
   */
  navigateDown(modal) {
    const content = modal.getContent();
    const options = content.filter(block => block.type === 'option');
    const currentIndex = modal.getSelectedIndex();

    if (currentIndex < options.length - 1) {
      modal.setSelectedIndex(currentIndex + 1);
    }
  }
}


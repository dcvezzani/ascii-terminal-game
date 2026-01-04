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

    // Scrolling (movement keys)
    if (keyString === 'up' || keyString === 'w') {
      const changed = modal.scrollUp();
      if (changed) {
        this.modalManager.triggerStateChange(); // Only re-render if changed
      }
      return true;
    }

    if (keyString === 'down' || keyString === 's') {
      const maxScroll = this.calculateMaxScroll(modal);
      const changed = modal.scrollDown(maxScroll);
      if (changed) {
        this.modalManager.triggerStateChange(); // Only re-render if changed
      }
      return true;
    }

    // Handle Enter key for option selection and close modal
    if (keyString === 'return' || keyString === 'enter') {
      this.selectOptionAndClose(modal);
      return true;
    }

    // Handle Space key for option selection and keep modal open
    if (keyString === 'space') {
      this.selectOptionAndKeepOpen(modal);
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
   * Calculate maximum scroll position for a modal
   * @param {Modal} modal - Modal instance
   * @returns {number} Maximum scroll position
   */
  calculateMaxScroll(modal) {
    // Simple estimation based on content
    // For accurate calculation, we'd need ModalRenderer with viewport info
    // This is a placeholder that estimates based on content length
    const content = modal.getContent();
    let totalLines = 0;
    
    // Estimate total lines (rough calculation)
    // Use conservative line width (40 chars) to account for word-wrapping
    // which may produce more lines than simple character division
    const estimatedLineWidth = 40;
    content.forEach(block => {
      if (block.type === 'message') {
        // Conservative estimate: use smaller line width to account for word-wrapping
        const estimatedLines = Math.ceil(block.text.length / estimatedLineWidth) || 1;
        totalLines += estimatedLines;
      } else if (block.type === 'option') {
        // Options are typically 1 line
        totalLines += 1;
      }
    });

    // Estimate viewport height (rough: assume ~10-15 lines visible)
    // Reduced by 1 to account for bottom border space (viewport reduced by 1 line)
    const estimatedViewportHeight = 11;
    
    // Max scroll is total lines minus viewport height
    // Add a small buffer (+2) to ensure we can always scroll to the last line
    // This accounts for differences between estimation and actual wrapping
    const maxScroll = Math.max(0, totalLines - estimatedViewportHeight + 2);
    
    return maxScroll;
  }

  /**
   * Select option and close modal (Enter key)
   * @param {Modal} modal - Modal instance
   */
  selectOptionAndClose(modal) {
    if (this.isSelectedOptionVisible(modal)) {
      this.executeOptionAction(modal, true); // close = true
    }
  }

  /**
   * Select option and keep modal open (Space key)
   * @param {Modal} modal - Modal instance
   */
  selectOptionAndKeepOpen(modal) {
    if (this.isSelectedOptionVisible(modal)) {
      this.executeOptionAction(modal, false); // close = false
    }
  }

  /**
   * Execute option action with optional modal close
   * @param {Modal} modal - Modal instance
   * @param {boolean} shouldClose - Whether to close modal after action (if autoClose allows)
   */
  executeOptionAction(modal, shouldClose) {
    const content = modal.getContent();
    const options = content.filter(block => block.type === 'option');
    const selectedOption = options[modal.getSelectedIndex()];

    if (selectedOption && selectedOption.action) {
      const optionsParam = { modal }; // Pass modal reference
      selectedOption.action(optionsParam);

      // Check autoClose flag (defaults to true if not specified)
      const autoClose = selectedOption.autoClose !== false;
      if (shouldClose && autoClose && this.modalManager) {
        this.modalManager.closeModal();
      }
    }
  }

  /**
   * Check if selected option is visible in viewport
   * @param {Modal} modal - Modal instance
   * @returns {boolean} True if selected option is visible, false otherwise
   */
  isSelectedOptionVisible(modal) {
    // Simple check: if scroll position is reasonable, assume option is visible
    // For accurate check, we'd need to know exact option positions and viewport
    // This is a placeholder that does a basic check
    const content = modal.getContent();
    const options = content.filter(block => block.type === 'option');
    const selectedIndex = modal.getSelectedIndex();

    if (selectedIndex < 0 || selectedIndex >= options.length) {
      return false; // Invalid selection
    }

    // Count lines before selected option
    let linesBeforeOption = 0;
    let optionCount = 0;
    
    for (const block of content) {
      if (block.type === 'message') {
        const estimatedLines = Math.ceil(block.text.length / 50) || 1;
        linesBeforeOption += estimatedLines;
      } else if (block.type === 'option') {
        if (optionCount === selectedIndex) {
          // Found selected option
          break;
        }
        linesBeforeOption += 1;
        optionCount++;
      }
    }

    // Check if option is within visible viewport (rough estimate)
    const scrollPosition = modal.getScrollPosition();
    const estimatedViewportHeight = 12;
    const visibleStart = scrollPosition;
    const visibleEnd = scrollPosition + estimatedViewportHeight;

    // Option is visible if its start line is within viewport
    return linesBeforeOption >= visibleStart && linesBeforeOption < visibleEnd;
  }
}


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
      // Use actual maxScroll from modal (calculated by ModalRenderer) if available
      // Fall back to estimate only if not yet calculated (shouldn't happen in normal flow)
      let maxScroll = modal.getMaxScroll();
      if (maxScroll === null) {
        // Fallback to estimate if maxScroll not yet calculated (shouldn't happen after first render)
        maxScroll = this.calculateMaxScroll(modal);
      }
      
      const currentPosition = modal.getScrollPosition();
      
      // Check if position would actually change before calling scrollDown
      // This prevents flickering when at the boundary
      const nextPosition = Math.min(currentPosition + 1, maxScroll);
      if (typeof globalThis.clientLogger !== 'undefined' && typeof globalThis.clientLogger.debug === 'function') {
        globalThis.clientLogger.debug('ModalInputHandler: nextPosition', { 
          nextPosition, 
          currentPosition, 
          maxScroll,
          usingEstimate: modal.getMaxScroll() === null
        });
      }
      if (nextPosition === currentPosition) {
        // Position wouldn't change (already at or beyond maxScroll), don't attempt to scroll
        return true; // Key was handled, just no action needed
      }
      
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
   * Calculate maximum scroll position for a modal (fallback estimation)
   * @param {Modal} modal - Modal instance
   * @returns {number} Maximum scroll position (estimated)
   * @deprecated This is only used as a fallback if modal.getMaxScroll() returns null
   * The actual maxScroll should be calculated by ModalRenderer and stored in the modal
   */
  calculateMaxScroll(modal) {
    // Simple estimation based on content
    // This should only be used as a fallback if modal.getMaxScroll() is null
    // (which shouldn't happen after the first render)
    const content = modal.getContent();
    let totalLines = 0;
    
    // Estimate total lines (rough calculation)
    // Use larger line width (50 chars) to produce FEWER estimated lines
    // This makes the estimate more conservative (underestimates total lines)
    const estimatedLineWidth = 50;
    content.forEach(block => {
      if (block.type === 'message') {
        // Use larger line width to underestimate (fewer lines = more conservative)
        const estimatedLines = Math.ceil(block.text.length / estimatedLineWidth) || 1;
        totalLines += estimatedLines;
      } else if (block.type === 'option') {
        // Options are typically 1 line
        totalLines += 1;
      }
    });

    // Estimate viewport height (rough: assume ~10-15 lines visible)
    // Use LARGER viewport height to reduce maxScroll (more conservative)
    // Reduced by 1 to account for bottom border space (viewport reduced by 1 line)
    const estimatedViewportHeight = 12;
    
    // Max scroll is total lines minus viewport height
    // Add safety margin of 2 to ensure we never overestimate
    // This prevents flickering when estimated maxScroll > actual maxScroll
    const estimatedMaxScroll = Math.max(0, totalLines - estimatedViewportHeight);
    const maxScroll = Math.max(0, estimatedMaxScroll - 2); // Safety margin: subtract 2
    
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


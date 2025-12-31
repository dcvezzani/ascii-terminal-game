/**
 * Modal class for displaying modal dialogs with content and selectable options
 */
export class Modal {
  /**
   * Create a new Modal instance
   * @param {Object} config - Modal configuration
   * @param {string} config.title - Modal title
   * @param {Array<Object>} config.content - Array of content blocks (messages and options)
   * @param {number} [config.selectedIndex=0] - Initial selected option index (default: 0)
   */
  constructor(config) {
    this.title = config.title;
    this.content = config.content || [];
    this.selectedIndex = config.selectedIndex ?? 0;
  }

  /**
   * Get the modal title
   * @returns {string} Modal title
   */
  getTitle() {
    return this.title;
  }

  /**
   * Get the modal content array
   * @returns {Array<Object>} Content blocks (messages and options)
   */
  getContent() {
    return this.content;
  }

  /**
   * Get the currently selected option index
   * Note: This index refers to option blocks only, not message blocks
   * @returns {number} Selected option index (0-based, relative to options only)
   */
  getSelectedIndex() {
    return this.selectedIndex;
  }

  /**
   * Set the selected option index
   * Note: This index refers to option blocks only, not message blocks
   * @param {number} index - Option index to select (0-based, relative to options only)
   */
  setSelectedIndex(index) {
    this.selectedIndex = index;
  }
}


/**
 * ModalManager class for managing modal state
 * Tracks the current open modal (single modal, no stacking in MVP)
 */
export class ModalManager {
  /**
   * Create a new ModalManager instance
   */
  constructor() {
    this.currentModal = null;
    this.stateChangeCallback = null; // Callback to trigger re-rendering
  }

  /**
   * Open a modal
   * @param {Modal} modal - Modal instance to open
   */
  openModal(modal) {
    this.currentModal = modal;
  }

  /**
   * Close the current modal
   */
  closeModal() {
    this.currentModal = null;
  }

  /**
   * Get the current open modal
   * @returns {Modal|null} Current modal or null if no modal is open
   */
  getCurrentModal() {
    return this.currentModal;
  }

  /**
   * Check if a modal is currently open
   * @returns {boolean} True if a modal is open, false otherwise
   */
  hasOpenModal() {
    return this.currentModal !== null;
  }

  /**
   * Reset the modal manager (close all modals)
   * Useful for game restart or state reset
   */
  reset() {
    this.currentModal = null;
  }

  /**
   * Execute the action from the currently selected option in the open modal
   */
  executeSelectedAction() {
    if (!this.currentModal) {
      return; // No modal open, do nothing
    }

    this.currentModal.executeSelectedAction(this);
  }

  /**
   * Set the callback function to trigger when modal state changes (for re-rendering)
   * @param {Function} callback - Callback function to call when state changes
   */
  setStateChangeCallback(callback) {
    this.stateChangeCallback = callback;
  }

  /**
   * Trigger state change callback (for re-rendering after scroll/selection changes)
   */
  triggerStateChange() {
    if (this.stateChangeCallback) {
      this.stateChangeCallback();
    }
  }
}


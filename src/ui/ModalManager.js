/**
 * ModalManager class for managing modal state
 * Supports modal stacking and scroll position persistence
 */
export class ModalManager {
  /**
   * Create a new ModalManager instance
   */
  constructor() {
    this.currentModal = null;
    this.modalStack = []; // Stack for modal stacking (preserves scroll positions)
    this.stateChangeCallback = null; // Callback to trigger re-rendering
  }

  /**
   * Open a modal
   * If there's already a modal open, it will be preserved in the stack
   * (scroll position is automatically preserved in the modal instance)
   * @param {Modal} modal - Modal instance to open
   */
  openModal(modal) {
    // If there's already a modal open, preserve it in stack
    if (this.currentModal) {
      this.modalStack.push(this.currentModal);
    }
    this.currentModal = modal;
    // New modal starts with scrollPosition = 0 (handled in Modal constructor)
  }

  /**
   * Close the current modal
   * If there's a modal in the stack, it will be restored
   * (scroll position is automatically restored from the modal instance)
   */
  closeModal() {
    this.currentModal = null;
    // If there's a modal in stack, restore it
    if (this.modalStack.length > 0) {
      this.currentModal = this.modalStack.pop();
      // Scroll position automatically restored (it's stored in modal instance)
    }
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
   * Reset the modal manager (close all modals and clear stack)
   * Useful for game restart or state reset
   */
  reset() {
    this.currentModal = null;
    this.modalStack = [];
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


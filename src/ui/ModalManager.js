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
}


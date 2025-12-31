import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import { getHorizontalCenter, getVerticalCenter, getTerminalSize } from '../utils/terminal.js';

/**
 * ModalRenderer helper class for rendering modals
 * Used by Renderer to display modal dialogs
 */
export class ModalRenderer {
  constructor() {
    // Fixed modal dimensions (not percentage-based yet)
    this.minWidth = 40;
    this.minHeight = 5;
    this.padding = 2; // Padding inside modal border
  }

  /**
   * Render a modal on the screen
   * @param {Modal} modal - Modal instance to render
   */
  renderModal(modal) {
    const terminalSize = getTerminalSize();
    const content = modal.getContent();
    const title = modal.getTitle();

    // Calculate modal dimensions based on content
    const modalWidth = this.calculateModalWidth(title, content, terminalSize.columns);
    const modalHeight = this.calculateModalHeight(content);

    // Center modal on screen
    const startX = getHorizontalCenter(modalWidth, terminalSize.columns);
    const startY = getVerticalCenter(modalHeight, terminalSize.rows);

    // Render modal border and content
    this.renderBorder(startX, startY, modalWidth, modalHeight);
    this.renderTitle(startX, startY, modalWidth, title);
    this.renderContent(startX, startY, modalWidth, content, modal.getSelectedIndex());
  }

  /**
   * Calculate modal width based on title and content
   * @param {string} title - Modal title
   * @param {Array} content - Content blocks
   * @param {number} terminalWidth - Terminal width
   * @returns {number} Modal width
   */
  calculateModalWidth(title, content, terminalWidth) {
    let maxWidth = Math.max(this.minWidth, title.length + this.padding * 2);

    // Check content width
    content.forEach(block => {
      if (block.type === 'message') {
        const lines = block.text.split('\n');
        lines.forEach(line => {
          maxWidth = Math.max(maxWidth, line.length + this.padding * 2);
        });
      } else if (block.type === 'option') {
        maxWidth = Math.max(maxWidth, block.label.length + this.padding * 2);
      }
    });

    // Don't exceed terminal width (leave some margin)
    return Math.min(maxWidth, terminalWidth - 4);
  }

  /**
   * Calculate modal height based on content
   * @param {Array} content - Content blocks
   * @returns {number} Modal height
   */
  calculateModalHeight(content) {
    let height = this.minHeight; // Minimum: border + title + padding

    content.forEach(block => {
      if (block.type === 'message') {
        const lines = block.text.split('\n');
        height += lines.length; // Each line adds height
      } else if (block.type === 'option') {
        height += 1; // Each option adds one line
      }
    });

    return height;
  }

  /**
   * Render modal border using ASCII box-drawing characters
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} width - Modal width
   * @param {number} height - Modal height
   */
  renderBorder(startX, startY, width, height) {
    // Top border: ┌───┐
    process.stdout.write(ansiEscapes.cursorTo(startX, startY));
    process.stdout.write('┌');
    for (let i = 0; i < width - 2; i++) {
      process.stdout.write('─');
    }
    process.stdout.write('┐');

    // Side borders: │
    for (let y = 1; y < height - 1; y++) {
      process.stdout.write(ansiEscapes.cursorTo(startX, startY + y));
      process.stdout.write('│');
      process.stdout.write(ansiEscapes.cursorTo(startX + width - 1, startY + y));
      process.stdout.write('│');
    }

    // Bottom border: └───┘
    process.stdout.write(ansiEscapes.cursorTo(startX, startY + height - 1));
    process.stdout.write('└');
    for (let i = 0; i < width - 2; i++) {
      process.stdout.write('─');
    }
    process.stdout.write('┘');
  }

  /**
   * Render modal title
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} width - Modal width
   * @param {string} title - Title text
   */
  renderTitle(startX, startY, width, title) {
    const titleX = startX + this.padding;
    const titleY = startY + 1; // One line below top border

    process.stdout.write(ansiEscapes.cursorTo(titleX, titleY));
    process.stdout.write(chalk.bold(title));
  }

  /**
   * Render modal content (messages and options)
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} width - Modal width
   * @param {Array} content - Content blocks
   * @param {number} selectedIndex - Currently selected option index
   */
  renderContent(startX, startY, width, content, selectedIndex) {
    let currentY = startY + 2; // Start after title line
    let optionIndex = 0; // Track option index (separate from content index)

    content.forEach(block => {
      if (block.type === 'message') {
        // Render message text (handle multi-line)
        const lines = block.text.split('\n');
        lines.forEach(line => {
          process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, currentY));
          process.stdout.write(line);
          currentY++;
        });
      } else if (block.type === 'option') {
        // Render option label
        process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, currentY));
        const label = block.label;
        process.stdout.write(label);
        currentY++;
        optionIndex++;
      }
    });
  }
}


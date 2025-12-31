import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import cliCursor from 'cli-cursor';
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
    // Track last rendered state for incremental updates
    this.lastRenderedState = {
      startX: null,
      startY: null,
      width: null,
      selectedIndex: null,
      optionLines: null, // Map of optionIndex -> y position
    };
  }

  /**
   * Render a modal on the screen
   * @param {Modal} modal - Modal instance to render
   */
  renderModal(modal) {
    const terminalSize = getTerminalSize();
    const content = modal.getContent();
    const title = modal.getTitle();

    // Hide cursor to prevent visual artifacts
    cliCursor.hide();

    // Calculate modal dimensions based on content
    const modalWidth = this.calculateModalWidth(title, content, terminalSize.columns);
    const modalHeight = this.calculateModalHeight(content);

    // Center modal on screen
    const startX = getHorizontalCenter(modalWidth, terminalSize.columns);
    const startY = getVerticalCenter(modalHeight, terminalSize.rows);

    // Render modal border and content
    this.renderBorder(startX, startY, modalWidth, modalHeight);
    this.renderBackground(startX, startY, modalWidth, modalHeight);
    this.renderTitle(startX, startY, modalWidth, title);
    
    // Build option lines map for incremental updates
    const optionLines = this.buildOptionLinesMap(startX, startY, content);
    this.renderContent(startX, startY, modalWidth, content, modal.getSelectedIndex());
    
    // Store rendered state for incremental updates
    this.lastRenderedState = {
      startX,
      startY,
      width: modalWidth,
      selectedIndex: modal.getSelectedIndex(),
      optionLines,
    };
    
    // Reset all color/background state to prevent cursor artifacts
    // Move cursor to a location in the dimmed area (not creating new visual elements)
    // Use a position that's already part of the dimmed background
    const dimmedX = 0;
    const dimmedY = terminalSize.rows - 1;
    process.stdout.write(ansiEscapes.cursorTo(dimmedX, dimmedY));
    // Reset all formatting to clear any background color state
    process.stdout.write(chalk.reset());
  }

  /**
   * Build a map of option indices to their Y positions
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {Array} content - Content blocks
   * @returns {Map<number, number>} Map of optionIndex -> y position
   */
  buildOptionLinesMap(startX, startY, content) {
    const optionLines = new Map();
    let currentY = startY + 2; // Start after title line
    let optionIndex = 0;

    content.forEach(block => {
      if (block.type === 'message') {
        const lines = block.text.split('\n');
        currentY += lines.length;
      } else if (block.type === 'option') {
        optionLines.set(optionIndex, currentY);
        currentY++;
        optionIndex++;
      }
    });

    return optionLines;
  }

  /**
   * Update only the option lines that changed (for selection updates)
   * Much faster than re-rendering the entire modal
   * @param {Modal} modal - Modal instance to render
   */
  updateSelectionOnly(modal) {
    // If we don't have a previous render state, do a full render
    if (!this.lastRenderedState.startX || !this.lastRenderedState.optionLines) {
      // Need full render - but this should be called from renderModal, not directly
      return false;
    }

    const { startX, startY, width, selectedIndex: lastSelectedIndex, optionLines } = this.lastRenderedState;
    const currentSelectedIndex = modal.getSelectedIndex();
    const content = modal.getContent();
    const options = content.filter(block => block.type === 'option');

    // Only update if selection actually changed
    if (currentSelectedIndex === lastSelectedIndex) {
      return true; // Nothing changed, skip update
    }

    // Hide cursor to prevent visual artifacts
    cliCursor.hide();

    // Update both the previously selected and currently selected options
    const indicesToUpdate = new Set();
    if (lastSelectedIndex !== null && lastSelectedIndex >= 0 && lastSelectedIndex < options.length) {
      indicesToUpdate.add(lastSelectedIndex);
    }
    if (currentSelectedIndex >= 0 && currentSelectedIndex < options.length) {
      indicesToUpdate.add(currentSelectedIndex);
    }

    // Re-render only the option lines that changed
    indicesToUpdate.forEach(optionIndex => {
      const y = optionLines.get(optionIndex);
      if (y === undefined) {
        return; // Invalid option index
      }

      const option = options[optionIndex];
      if (!option) {
        return;
      }

      const isSelected = optionIndex === currentSelectedIndex;
      const prefix = '> ';
      const label = option.label;
      const lineWidth = width - (this.padding * 2);
      const optionText = prefix + label;

      // Clear the entire line first with black background
      process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, y));
      process.stdout.write(chalk.bgBlack(' '.repeat(lineWidth)));

      // Render option with selection indicator
      process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, y));
      if (isSelected) {
        // Selected option: prefix + label with background highlight
        process.stdout.write(chalk.bgWhite.black(optionText));
        // Fill rest of line with black background
        const remainingWidth = lineWidth - optionText.length;
        if (remainingWidth > 0) {
          process.stdout.write(chalk.bgBlack(' '.repeat(remainingWidth)));
        }
      } else {
        // Unselected option: prefix + label with normal text on black background
        process.stdout.write(chalk.bgBlack(optionText));
        // Fill rest of line
        const remainingWidth = lineWidth - optionText.length;
        if (remainingWidth > 0) {
          process.stdout.write(chalk.bgBlack(' '.repeat(remainingWidth)));
        }
      }

      // Reset color state after rendering this line
      process.stdout.write(chalk.reset());
    });

    // Update stored state
    this.lastRenderedState.selectedIndex = currentSelectedIndex;

    // Reset cursor position
    const terminalSize = getTerminalSize();
    const dimmedX = 0;
    const dimmedY = terminalSize.rows - 1;
    process.stdout.write(ansiEscapes.cursorTo(dimmedX, dimmedY));
    process.stdout.write(chalk.reset());

    return true; // Successfully updated
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
   * Render solid background inside modal (fills interior with solid color)
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} width - Modal width
   * @param {number} height - Modal height
   */
  renderBackground(startX, startY, width, height) {
    // Fill interior with solid black background to cover dimmed area
    const interiorWidth = width - 2; // Exclude left and right borders
    const interiorHeight = height - 2; // Exclude top and bottom borders
    
    for (let y = 1; y < height - 1; y++) {
      process.stdout.write(ansiEscapes.cursorTo(startX + 1, startY + y));
      // Use black background to create solid fill
      process.stdout.write(chalk.bgBlack(' '.repeat(interiorWidth)));
    }
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

    // Clear the title line with solid black background
    const titleWidth = width - (this.padding * 2);
    process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, titleY));
    process.stdout.write(chalk.bgBlack(' '.repeat(titleWidth)));
    
    // Render title
    process.stdout.write(ansiEscapes.cursorTo(titleX, titleY));
    process.stdout.write(chalk.bgBlack.bold(title));
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
          // Clear the line first with solid black background
          const lineWidth = width - (this.padding * 2);
          process.stdout.write(chalk.bgBlack(' '.repeat(lineWidth)));
          // Render message
          process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, currentY));
          process.stdout.write(chalk.bgBlack(line));
          currentY++;
        });
      } else if (block.type === 'option') {
        // Render option label with selection indicator
        const isSelected = optionIndex === selectedIndex;
        const prefix = '> '; // Always show prefix for options
        const label = block.label;
        const lineWidth = width - (this.padding * 2);
        const optionText = prefix + label;
        
        // Clear the entire line first with black background
        process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, currentY));
        process.stdout.write(chalk.bgBlack(' '.repeat(lineWidth)));
        
        // Render option with selection indicator
        process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, currentY));
        if (isSelected) {
          // Selected option: prefix + label with background highlight
          process.stdout.write(chalk.bgWhite.black(optionText));
          // Fill rest of line with black background to ensure clean rendering
          const remainingWidth = lineWidth - optionText.length;
          if (remainingWidth > 0) {
            process.stdout.write(chalk.bgBlack(' '.repeat(remainingWidth)));
          }
        } else {
          // Unselected option: prefix + label with normal text on black background
          process.stdout.write(chalk.bgBlack(optionText));
          // Fill rest of line to ensure clean rendering
          const remainingWidth = lineWidth - optionText.length;
          if (remainingWidth > 0) {
            process.stdout.write(chalk.bgBlack(' '.repeat(remainingWidth)));
          }
        }
        
        // Reset color state after rendering this line to prevent cursor artifacts
        process.stdout.write(chalk.reset());
        
        currentY++;
        optionIndex++;
      }
    });
  }

}


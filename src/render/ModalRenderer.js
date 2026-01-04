import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import cliCursor from 'cli-cursor';
import { getHorizontalCenter, getVerticalCenter, getTerminalSize } from '../utils/terminal.js';
import { gameConfig } from '../config/gameConfig.js';

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
    // Cache for wrapped text (lazy wrapping with memoization)
    this.wrappedTextCache = new Map(); // Key: `${text}_${maxWidth}`, Value: array of lines
    this.lastCachedWidth = null; // Track last modal width for cache invalidation
  }

  /**
   * Get the chalk color function for selected option text based on config
   * @returns {Function} Chalk color function for selected option text
   */
  getSelectionTextColor() {
    const config = gameConfig.modal.selection;
    let colorFn = chalk;

    // Apply background color
    if (config.backgroundColor) {
      const bgColor = config.backgroundColor.toLowerCase();
      // Handle camelCase to lowercase conversion (e.g., 'white' -> 'bgWhite')
      const bgMethod = `bg${bgColor.charAt(0).toUpperCase()}${bgColor.slice(1)}`;
      if (chalk[bgMethod] && typeof chalk[bgMethod] === 'function') {
        colorFn = chalk[bgMethod];
      }
    }

    // Apply text color
    if (config.textColor) {
      // Chalk methods are camelCase (e.g., 'cyanBright', 'red', 'blueBright')
      // Use the textColor as-is since it should already be in camelCase
      const textMethod = config.textColor;
      // Check if the method exists on the current colorFn (which is a chalk function)
      if (colorFn && typeof colorFn === 'function' && colorFn[textMethod] && typeof colorFn[textMethod] === 'function') {
        colorFn = colorFn[textMethod];
      }
    }

    // Apply bold if configured
    if (config.bold && colorFn && typeof colorFn === 'function' && colorFn.bold && typeof colorFn.bold === 'function') {
      colorFn = colorFn.bold;
    }

    return colorFn;
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

    // Calculate modal dimensions based on content and config
    const modalWidth = this.calculateModalWidth(title, content, terminalSize.columns);
    const modalHeight = this.calculateModalHeight(content, terminalSize.rows);

    // Invalidate cache if modal width changed
    this.invalidateCacheIfNeeded(modalWidth);

    // Center modal on screen
    const startX = getHorizontalCenter(modalWidth, terminalSize.columns);
    const startY = getVerticalCenter(modalHeight, terminalSize.rows);

    // Render modal shadow first (behind modal) if enabled
    if (gameConfig.modal.shadow.enabled) {
      this.renderShadow(startX, startY, modalWidth, modalHeight, terminalSize);
    }
    
    // Render modal border and content
    this.renderBorder(startX, startY, modalWidth, modalHeight);
    this.renderBackground(startX, startY, modalWidth, modalHeight);
    this.renderTitle(startX, startY, modalWidth, title);
    
    // Build option lines map for incremental updates
    const optionLines = this.buildOptionLinesMap(startX, startY, content, modalWidth);
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
  buildOptionLinesMap(startX, startY, content, width) {
    const optionLines = new Map(); // Maps optionIndex -> [y1, y2, ...] (array of Y positions for wrapped lines)
    let currentY = startY + 2; // Start after title line
    let optionIndex = 0;
    const lineWidth = width - (this.padding * 2);
    const prefix = '> '; // Prefix for options
    const availableWidth = lineWidth - prefix.length;

    content.forEach(block => {
      if (block.type === 'message') {
        // Use wrapping to get accurate line count
        const wrappedLines = this.wrapTextWithNewlines(block.text, lineWidth);
        currentY += wrappedLines.length;
      } else if (block.type === 'option') {
        // Use wrapping to get all wrapped lines for this option
        const wrappedLabelLines = this.wrapTextWithNewlines(block.label, availableWidth);
        const optionYPositions = [];
        wrappedLabelLines.forEach((labelLine, lineIndex) => {
          optionYPositions.push(currentY);
        currentY++;
        });
        optionLines.set(optionIndex, optionYPositions);
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
    // Need to get lineWidth for wrapping calculations
    const lineWidth = width - (this.padding * 2);
    const prefix = '> ';
    const availableWidth = lineWidth - prefix.length;

    indicesToUpdate.forEach(optionIndex => {
      const yPositions = optionLines.get(optionIndex);
      if (!yPositions || yPositions.length === 0) {
        return; // Invalid option index
      }

      const option = options[optionIndex];
      if (!option) {
        return;
      }

      const isSelected = optionIndex === currentSelectedIndex;
      // Wrap the label to get all lines (same as in renderContent)
      const wrappedLabelLines = this.wrapTextWithNewlines(option.label, availableWidth);

      // Render each wrapped line of the option
      wrappedLabelLines.forEach((labelLine, lineIndex) => {
        const y = yPositions[lineIndex];
        if (y === undefined) {
          return; // Invalid line index
        }

        const optionText = lineIndex === 0 ? prefix + labelLine : labelLine; // Only prefix first line

      // Clear the entire line first with black background
      process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, y));
      process.stdout.write(chalk.bgBlack(' '.repeat(lineWidth)));

        // Render option with selection indicator (only highlight first line)
      process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, y));
        if (isSelected && lineIndex === 0) {
        // Selected option: prefix + label with background highlight and text color from config
        const selectionColor = this.getSelectionTextColor();
        process.stdout.write(selectionColor(optionText));
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

      // Reset color state after rendering this line
      process.stdout.write(chalk.reset());
      });
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
    // Check if percentage-based sizing is enabled
    const dimensionsConfig = gameConfig.modal.dimensions;
    if (dimensionsConfig && dimensionsConfig.enabled && dimensionsConfig.width !== undefined) {
      // Use percentage-based sizing
      const widthPercent = dimensionsConfig.width;
      const calculatedWidth = Math.floor((terminalWidth * widthPercent) / 100);
      // Ensure minimum width for usability
      return Math.max(calculatedWidth, this.minWidth);
    }

    // Fall back to fixed sizing (content-based)
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
   * @param {number} terminalHeight - Terminal height
   * @returns {number} Modal height
   */
  calculateModalHeight(content, terminalHeight) {
    // Check if percentage-based sizing is enabled
    const dimensionsConfig = gameConfig.modal.dimensions;
    if (dimensionsConfig && dimensionsConfig.enabled) {
      // Determine height percentage
      let heightPercent;
      if (dimensionsConfig.height !== undefined) {
        heightPercent = dimensionsConfig.height;
      } else if (dimensionsConfig.width !== undefined) {
        // If height is missing but width is present, height uses width value
        heightPercent = dimensionsConfig.width;
      } else {
        // Both missing, fall back to fixed sizing
        return this.calculateFixedHeight(content);
      }

      // Use percentage-based sizing
      const calculatedHeight = Math.floor((terminalHeight * heightPercent) / 100);
      // Ensure minimum height for usability
      return Math.max(calculatedHeight, this.minHeight);
    }

    // Fall back to fixed sizing (content-based)
    return this.calculateFixedHeight(content);
  }

  /**
   * Calculate modal height based on content (fixed sizing)
   * @param {Array} content - Content blocks
   * @returns {number} Modal height
   */
  calculateFixedHeight(content) {
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
   * Wrap text with newline handling (split-then-wrap approach)
   * Honors existing newlines by splitting first, then wrapping each segment
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum width for wrapping (accounting for padding)
   * @returns {Array<string>} Array of wrapped lines
   */
  wrapTextWithNewlines(text, maxWidth) {
    // Check cache first
    const cacheKey = `${text}_${maxWidth}`;
    if (this.wrappedTextCache.has(cacheKey)) {
      return this.wrappedTextCache.get(cacheKey);
    }

    // Split by existing newlines first (preserves intentional line breaks)
    const segments = text.split('\n');

    // Wrap each segment independently
    const wrappedLines = segments.flatMap(segment => {
      return this.wrapTextSegment(segment, maxWidth);
    });

    // Cache the result
    this.wrappedTextCache.set(cacheKey, wrappedLines);

    return wrappedLines;
  }

  /**
   * Wrap a single text segment (no newlines) to fit within maxWidth
   * Breaks at word boundaries when possible
   * @param {string} segment - Text segment to wrap (no newlines)
   * @param {number} maxWidth - Maximum width for wrapping
   * @returns {Array<string>} Array of wrapped lines
   */
  wrapTextSegment(segment, maxWidth) {
    if (segment.length <= maxWidth) {
      return [segment]; // Fits on one line
    }

    const lines = [];
    let remaining = segment;

    while (remaining.length > maxWidth) {
      // Try to break at a word boundary
      let breakPoint = maxWidth;
      const spaceIndex = remaining.lastIndexOf(' ', maxWidth);

      if (spaceIndex > 0 && spaceIndex < maxWidth) {
        // Found a space within the line, break there
        breakPoint = spaceIndex;
      }

      // Extract line and remaining text
      const line = remaining.substring(0, breakPoint).trim();
      remaining = remaining.substring(breakPoint).trim();

      if (line.length > 0) {
        lines.push(line);
      }
    }

    // Add remaining text if any
    if (remaining.length > 0) {
      lines.push(remaining);
    }

    return lines.length > 0 ? lines : [segment]; // Fallback to original if wrapping fails
  }

  /**
   * Invalidate wrapped text cache
   * Should be called when modal dimensions change
   * @param {number} currentWidth - Current modal width (for comparison)
   */
  invalidateCacheIfNeeded(currentWidth) {
    if (this.lastCachedWidth !== null && this.lastCachedWidth !== currentWidth) {
      // Modal width changed, invalidate cache
      this.wrappedTextCache.clear();
    }
    this.lastCachedWidth = currentWidth;
  }

  /**
   * Calculate viewport boundaries for modal content area
   * @param {number} startY - Starting Y position of modal
   * @param {number} modalHeight - Total modal height
   * @returns {Object} Viewport boundaries with viewportStartY, viewportEndY, and viewportHeight
   */
  calculateViewport(startY, modalHeight) {
    const viewportStartY = startY + 2; // After title line
    const viewportEndY = startY + modalHeight - 1; // Before bottom border
    const viewportHeight = viewportEndY - viewportStartY + 1;
    return { viewportStartY, viewportEndY, viewportHeight };
  }

  /**
   * Calculate total content height including wrapped text lines
   * @param {Array} content - Content blocks (messages and options)
   * @param {number} width - Modal width
   * @returns {number} Total number of lines (including wrapped lines)
   */
  calculateTotalContentHeight(content, width) {
    let totalLines = 0;
    const lineWidth = width - (this.padding * 2);

    content.forEach(block => {
      if (block.type === 'message') {
        const wrapped = this.wrapTextWithNewlines(block.text, lineWidth);
        totalLines += wrapped.length;
      } else if (block.type === 'option') {
        const wrapped = this.wrapTextWithNewlines(block.label, lineWidth - 2);
        totalLines += wrapped.length;
      }
    });

    return totalLines;
  }

  /**
   * Calculate maximum scroll position
   * @param {number} totalHeight - Total content height (all lines)
   * @param {number} viewportHeight - Viewport height (visible lines)
   * @returns {number} Maximum scroll position (0 if content fits in viewport)
   */
  calculateMaxScroll(totalHeight, viewportHeight) {
    return Math.max(0, totalHeight - viewportHeight);
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
    const lineWidth = width - (this.padding * 2); // Available width for content (accounting for padding)

    content.forEach(block => {
      if (block.type === 'message') {
        // Wrap message text if needed (honors existing newlines, wraps long lines)
        const wrappedTextLines = this.wrapTextWithNewlines(block.text, lineWidth);
        
        // Render each wrapped line
        wrappedTextLines.forEach(line => {
          process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, currentY));
          // Clear the line first with solid black background
          process.stdout.write(chalk.bgBlack(' '.repeat(lineWidth)));
          // Render message
          process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, currentY));
          process.stdout.write(chalk.bgBlack(line));
          currentY++;
        });
      } else if (block.type === 'option') {
        // Wrap option label if needed (honors existing newlines, wraps long lines)
        // Account for prefix length when calculating available width
        const prefix = '> '; // Always show prefix for options
        const availableWidth = lineWidth - prefix.length;
        const wrappedLabelLines = this.wrapTextWithNewlines(block.label, availableWidth);
        
        // Render each wrapped line of the label
        wrappedLabelLines.forEach((labelLine, lineIndex) => {
          const isSelected = optionIndex === selectedIndex && lineIndex === 0; // Only first line is selectable
          const optionText = lineIndex === 0 ? prefix + labelLine : labelLine; // Only prefix first line
          
          // Clear the entire line first with black background
          process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, currentY));
          process.stdout.write(chalk.bgBlack(' '.repeat(lineWidth)));
          
          // Render option with selection indicator (only highlight first line)
          process.stdout.write(ansiEscapes.cursorTo(startX + this.padding, currentY));
          if (isSelected) {
            // Selected option: prefix + label with background highlight and text color from config
            const selectionColor = this.getSelectionTextColor();
            process.stdout.write(selectionColor(optionText));
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
        });
        
        optionIndex++;
      }
    });
  }

  /**
   * Render shadow effect around modal
   * @param {number} startX - Starting X position of modal
   * @param {number} startY - Starting Y position of modal
   * @param {number} width - Modal width
   * @param {number} height - Modal height
   * @param {Object} terminalSize - Terminal size object with rows and columns
   */
  renderShadow(startX, startY, width, height, terminalSize) {
    const config = gameConfig.modal.shadow;
    
    // Skip rendering if shadow is disabled
    if (!config.enabled) {
      return;
    }
    
    // Shadow offset from config
    const shadowOffsetX = config.offsetX || 1;
    const shadowOffsetY = config.offsetY || 1;
    const shadowX = startX + shadowOffsetX;
    const shadowY = startY + shadowOffsetY;
    
    // Shadow character from config
    const shadowChar = config.character || '▓';
    
    // Render shadow for right edge
    for (let y = 0; y < height; y++) {
      const shadowPosY = shadowY + y;
      if (shadowPosY < terminalSize.rows) {
        const shadowPosX = shadowX + width - 1;
        if (shadowPosX < terminalSize.columns) {
          process.stdout.write(ansiEscapes.cursorTo(shadowPosX, shadowPosY));
          process.stdout.write(chalk.dim(shadowChar));
        }
      }
    }
    
    // Render shadow for bottom edge
    const shadowBottomY = shadowY + height - 1;
    if (shadowBottomY < terminalSize.rows) {
      for (let x = shadowOffsetX; x < width; x++) {
        const shadowPosX = shadowX + x;
        if (shadowPosX < terminalSize.columns) {
          process.stdout.write(ansiEscapes.cursorTo(shadowPosX, shadowBottomY));
          process.stdout.write(chalk.dim(shadowChar));
        }
      }
    }
  }
}


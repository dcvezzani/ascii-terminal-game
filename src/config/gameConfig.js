/**
 * Game configuration constants
 * Centralized configuration for easy modification
 */

export const gameConfig = {
  // Board dimensions
  board: {
    width: 40,
    height: 20,
  },

  // Initial player position (calculated as center of board)
  get player() {
    return {
      initialX: Math.floor(this.board.width / 2),
      initialY: Math.floor(this.board.height / 2),
    };
  },

  // Renderer offsets
  renderer: {
    titleOffset: 2, // Rows from top for title
    boardOffset: 5, // Rows from top for board
    // statusBarOffset is calculated dynamically: boardOffset + boardHeight + 1
  },

  // Terminal size requirements
  terminal: {
    minRows: 25,
    minColumns: 30,
  },

  // Initial game state
  game: {
    initialScore: 0,
  },

  // Modal configuration
  modal: {
    // Selection highlight colors
    selection: {
      backgroundColor: 'white', // Background color for selected option
      textColor: 'black', // Text color for selected option
      bold: true, // Whether to use bold text for selected option
    },
    // Shadow configuration
    shadow: {
      enabled: true, // Enable shadow effect
      character: '▓', // Shadow character
      offsetX: 1, // Horizontal shadow offset
      offsetY: 1, // Vertical shadow offset
    },
    // Background dimming
    backgroundDimming: {
      enabled: true, // Enable background dimming
      character: '░', // Dimming character
    },
  },
};

// Calculate derived values
gameConfig.renderer.statusBarOffset = gameConfig.renderer.boardOffset + gameConfig.board.height + 1;

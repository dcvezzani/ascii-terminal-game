import Board from './Board.js';

/**
 * Game class representing the game state
 */
export class Game {
  constructor(boardWidth, boardHeight, board) {

    // if the board is provided, use it
    if (board != null && typeof board === 'object' && typeof board.getCell === 'function') {
      this.board = board;
    } else {
      this.board = new Board(boardWidth, boardHeight);
      this.board.initialize();
    }
    this.score = 0;
    this.running = true;
  }
}

// Default export
export default Game;

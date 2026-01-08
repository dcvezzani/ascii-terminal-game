import Board from './Board.js';

/**
 * Game class representing the game state
 */
export class Game {
  constructor(boardWidth, boardHeight) {
    this.board = new Board(boardWidth, boardHeight);
    this.board.initialize();
    this.score = 0;
    this.running = true;
  }
}

// Default export
export default Game;

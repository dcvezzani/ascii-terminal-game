import Board from './Board.js';
import { loadBoardFromFiles, DEFAULT_BOARD_PATH } from '../board/boardLoader.js';

/**
 * Game class representing the game state.
 * Accepts only a game board. If none is provided (null/undefined), the default board is loaded from JSON.
 */
export class Game {
  constructor(board) {
    if (board != null && typeof board === 'object' && typeof board.getCell === 'function') {
      this.board = board;
    } else {
      const boardData = loadBoardFromFiles(DEFAULT_BOARD_PATH);
      this.board = new Board(boardData);
    }
    this.score = 0;
    this.running = true;
  }
}

// Default export
export default Game;

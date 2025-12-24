import { Board } from './Board.js';

/**
 * Game class manages game state and logic
 */
export class Game {
  constructor() {
    this.board = new Board();
    this.playerX = 10; // Center position
    this.playerY = 10; // Center position
    this.score = 0;
    this.running = false;
  }

  /**
   * Get the current player position
   * @returns {{x: number, y: number}} Player position
   */
  getPlayerPosition() {
    return { x: this.playerX, y: this.playerY };
  }

  /**
   * Get the current score
   * @returns {number} Current score
   */
  getScore() {
    return this.score;
  }

  /**
   * Move the player by the given delta
   * @param {number} dx - Change in X direction (-1, 0, or 1)
   * @param {number} dy - Change in Y direction (-1, 0, or 1)
   * @returns {boolean} True if movement was successful, false if blocked
   */
  movePlayer(dx, dy) {
    const newX = this.playerX + dx;
    const newY = this.playerY + dy;

    // Check if new position is valid and not a wall
    if (!this.board.isValidPosition(newX, newY)) {
      return false;
    }

    if (this.board.isWall(newX, newY)) {
      return false;
    }

    // Move player
    this.playerX = newX;
    this.playerY = newY;
    return true;
  }

  /**
   * Reset the game to initial state
   */
  reset() {
    this.board = new Board();
    this.playerX = 10;
    this.playerY = 10;
    this.score = 0;
    this.running = true;
  }

  /**
   * Check if the game is currently running
   * @returns {boolean} True if game is running
   */
  isRunning() {
    return this.running;
  }

  /**
   * Start the game
   */
  start() {
    this.running = true;
  }

  /**
   * Stop the game
   */
  stop() {
    this.running = false;
  }
}


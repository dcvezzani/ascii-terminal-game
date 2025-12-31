import { Board } from './Board.js';
import { gameConfig } from '../config/gameConfig.js';
import { PLAYER_CHAR } from '../constants/gameConstants.js';

/**
 * Game class manages game state and logic
 */
export class Game {
  constructor(options = {}) {
    this.board = new Board();
    this.playerX = gameConfig.player.initialX;
    this.playerY = gameConfig.player.initialY;
    this.score = gameConfig.game.initialScore;
    this.running = false;
    this.playerId = 'local-player'; // Unique ID for local player

    // Only add local player if not explicitly disabled
    // Default behavior (no options) adds player for local mode compatibility
    // GameServer passes { addLocalPlayer: false } to avoid adding unused entity
    if (options.addLocalPlayer !== false) {
    try {
      this.board.addEntity(this.playerX, this.playerY, {
        char: PLAYER_CHAR.char,
        color: PLAYER_CHAR.color,
        id: this.playerId,
        solid: true, // Players are solid entities
      });
    } catch (error) {
      // If initial position is invalid, board will throw - this shouldn't happen
      console.error(`Failed to add player to board: ${error.message}`);
      }
    }
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

    // Check for solid entity at new position (blocks movement)
    if (this.board.hasSolidEntity(newX, newY)) {
      return false;
    }

    // Remove player from old position on board
    this.board.removeEntity(this.playerX, this.playerY, this.playerId);

    // Move player
    this.playerX = newX;
    this.playerY = newY;

    // Add player to new position on board
    try {
      this.board.addEntity(newX, newY, {
        char: PLAYER_CHAR.char,
        color: PLAYER_CHAR.color,
        id: this.playerId,
        solid: false,
      });
    } catch (error) {
      // Rollback position if board add fails
      this.playerX = this.playerX - dx;
      this.playerY = this.playerY - dy;
      // Try to restore to old position
      try {
        this.board.addEntity(this.playerX, this.playerY, {
          char: PLAYER_CHAR.char,
          color: PLAYER_CHAR.color,
          id: this.playerId,
          solid: false,
        });
      } catch (restoreError) {
        console.error(`Failed to restore player to old position: ${restoreError.message}`);
      }
      return false;
    }

    return true;
  }

  /**
   * Reset the game to initial state
   * Note: This always adds the local player entity, as reset is only used in local mode
   */
  reset() {
    this.board = new Board();
    this.playerX = gameConfig.player.initialX;
    this.playerY = gameConfig.player.initialY;
    this.score = gameConfig.game.initialScore;
    this.running = true;

    // Add player to board at initial position
    // Reset is only used in local mode, so we always add the player
    try {
      this.board.addEntity(this.playerX, this.playerY, {
        char: PLAYER_CHAR.char,
        color: PLAYER_CHAR.color,
        id: this.playerId,
        solid: false,
      });
    } catch (error) {
      console.error(`Failed to add player to board on reset: ${error.message}`);
    }
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

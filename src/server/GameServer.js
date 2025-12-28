/**
 * Game Server
 * Manages server-side game state for multiplayer support
 */

import { Game } from '../game/Game.js';
import { gameConfig } from '../config/gameConfig.js';
import { randomUUID } from 'crypto';

/**
 * Game Server class
 * Maintains authoritative game state and manages multiple players
 */
export class GameServer {
  constructor() {
    this.game = new Game();
    // Map of playerId -> player info
    this.players = new Map();
    this.updateInterval = null;
  }

  /**
   * Get the current game state
   * @returns {object} Game state object
   */
  getGameState() {
    return {
      board: {
        width: this.game.board.width,
        height: this.game.board.height,
        grid: this.game.board.grid,
      },
      players: Array.from(this.players.values()),
      score: this.game.getScore(),
      running: this.game.isRunning(),
    };
  }

  /**
   * Add a player to the game
   * @param {string} playerId - Unique player ID
   * @param {string} playerName - Player name
   * @param {string} clientId - Client connection ID
   * @param {number} [x] - Optional X position (defaults to center)
   * @param {number} [y] - Optional Y position (defaults to center)
   * @returns {boolean} True if player was added, false if playerId already exists
   */
  addPlayer(playerId, playerName, clientId, x = null, y = null) {
    if (this.players.has(playerId)) {
      return false;
    }

    // Use provided position or default to center
    const startX = x !== null ? x : gameConfig.player.initialX;
    const startY = y !== null ? y : gameConfig.player.initialY;

    // Validate position
    if (
      !this.game.board.isValidPosition(startX, startY) ||
      this.game.board.isWall(startX, startY)
    ) {
      // If invalid, try center position
      const centerX = gameConfig.player.initialX;
      const centerY = gameConfig.player.initialY;
      if (
        !this.game.board.isValidPosition(centerX, centerY) ||
        this.game.board.isWall(centerX, centerY)
      ) {
        return false;
      }
    }

    const player = {
      playerId,
      playerName,
      clientId,
      x: startX,
      y: startY,
    };

    this.players.set(playerId, player);
    return true;
  }

  /**
   * Remove a player from the game
   * @param {string} playerId - Player ID to remove
   * @returns {boolean} True if player was removed, false if not found
   */
  removePlayer(playerId) {
    return this.players.delete(playerId);
  }

  /**
   * Move a player by delta
   * @param {string} playerId - Player ID
   * @param {number} dx - Change in X direction (-1, 0, or 1)
   * @param {number} dy - Change in Y direction (-1, 0, or 1)
   * @returns {boolean} True if movement was successful, false if blocked or invalid
   */
  movePlayer(playerId, dx, dy) {
    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }

    const newX = player.x + dx;
    const newY = player.y + dy;

    // Validate new position
    if (!this.game.board.isValidPosition(newX, newY)) {
      return false;
    }

    if (this.game.board.isWall(newX, newY)) {
      return false;
    }

    // Check for collision with other players
    const hasCollision = Array.from(this.players.values()).some(
      otherPlayer =>
        otherPlayer.playerId !== playerId && otherPlayer.x === newX && otherPlayer.y === newY
    );

    if (hasCollision) {
      return false;
    }

    // Move player
    player.x = newX;
    player.y = newY;
    return true;
  }

  /**
   * Get player information
   * @param {string} playerId - Player ID
   * @returns {object | null} Player info or null if not found
   */
  getPlayer(playerId) {
    return this.players.get(playerId) || null;
  }

  /**
   * Get all players
   * @returns {Array<object>} Array of player objects
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Reset the game to initial state
   */
  resetGame() {
    this.game.reset();
    this.players.clear();
  }

  /**
   * Start the game
   */
  startGame() {
    this.game.start();
  }

  /**
   * Stop the game
   */
  stopGame() {
    this.game.stop();
  }

  /**
   * Get the number of players
   * @returns {number} Number of players
   */
  getPlayerCount() {
    return this.players.size;
  }

  /**
   * Check if a player exists
   * @param {string} playerId - Player ID
   * @returns {boolean} True if player exists
   */
  hasPlayer(playerId) {
    return this.players.has(playerId);
  }
}

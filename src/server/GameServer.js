import Game from '../game/Game.js';
import logger from '../utils/logger.js';

/**
 * GameServer class for managing game state and players
 */
export class GameServer {
  constructor(boardWidth, boardHeight) {
    this.game = new Game(boardWidth, boardHeight);
    this.players = new Map(); // playerId -> player object
  }

  /**
   * Add a player to the game
   * @param {string} clientId - Client identifier
   * @param {string} playerId - Player identifier
   * @param {string} playerName - Player name
   */
  addPlayer(clientId, playerId, playerName) {
    const player = {
      playerId,
      clientId,
      playerName,
      x: null,
      y: null
    };
    this.players.set(playerId, player);
    logger.debug(`Player added: ${playerId} (${playerName})`);
  }

  /**
   * Remove a player from the game
   * @param {string} playerId - Player identifier
   */
  removePlayer(playerId) {
    this.players.delete(playerId);
    logger.debug(`Player removed: ${playerId}`);
  }

  /**
   * Get player by playerId
   * @param {string} playerId - Player identifier
   * @returns {object|undefined} Player object or undefined
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * Get all players
   * @returns {Array} Array of player objects
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Spawn player at initial position
   * @param {string} playerId - Player identifier
   * @param {string} playerName - Player name
   */
  spawnPlayer(playerId, playerName) {
    const player = this.players.get(playerId);
    if (!player) {
      logger.warn(`Cannot spawn player ${playerId}: player not found`);
      return;
    }

    // Initial position: center of board (10, 10)
    player.x = 10;
    player.y = 10;
    player.playerName = playerName;

    logger.debug(`Player spawned: ${playerId} at (${player.x}, ${player.y})`);
  }

  /**
   * Validate a move for a player
   * @param {string} playerId - Player identifier
   * @param {number} dx - Delta X (-1, 0, or 1)
   * @param {number} dy - Delta Y (-1, 0, or 1)
   * @returns {boolean} True if move is valid
   */
  validateMove(playerId, dx, dy) {
    const player = this.getPlayer(playerId);
    if (!player) {
      logger.warn(`Cannot validate move: player ${playerId} not found`);
      return false;
    }

    if (player.x === null || player.y === null) {
      logger.warn(`Cannot validate move: player ${playerId} not spawned`);
      return false;
    }

    const newX = player.x + dx;
    const newY = player.y + dy;

    // Check bounds
    if (newX < 0 || newX >= this.game.board.width || newY < 0 || newY >= this.game.board.height) {
      return false;
    }

    // Check walls
    if (this.game.board.isWall(newX, newY)) {
      return false;
    }

    // Check player collisions
    const allPlayers = this.getAllPlayers();
    const occupied = allPlayers.some(p => 
      p.playerId !== playerId && p.x === newX && p.y === newY
    );
    if (occupied) {
      return false;
    }

    return true;
  }

  /**
   * Move a player
   * @param {string} playerId - Player identifier
   * @param {number} dx - Delta X (-1, 0, or 1)
   * @param {number} dy - Delta Y (-1, 0, or 1)
   * @returns {boolean} True if move was successful
   */
  movePlayer(playerId, dx, dy) {
    if (!this.validateMove(playerId, dx, dy)) {
      return false;
    }

    const player = this.getPlayer(playerId);
    player.x += dx;
    player.y += dy;

    logger.debug(`Player ${playerId} moved to (${player.x}, ${player.y})`);
    return true;
  }

  /**
   * Serialize game state for broadcasting
   * @returns {object} Serialized game state
   */
  serializeState() {
    return {
      board: {
        width: this.game.board.width,
        height: this.game.board.height,
        grid: this.game.board.serialize()
      },
      players: this.getAllPlayers().map(player => ({
        playerId: player.playerId,
        x: player.x,
        y: player.y,
        playerName: player.playerName
      })),
      score: this.game.score
    };
  }
}

// Default export
export default GameServer;
